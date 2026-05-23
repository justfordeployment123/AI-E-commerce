import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../database/prisma.service';
import { CreateTradeInDto } from './dto/create-trade-in.dto';
import { UpdateTradeInDto } from './dto/update-trade-in.dto';
import { ApproveTradeInDto } from './dto/approve-trade-in.dto';
import { RejectTradeInDto } from './dto/reject-trade-in.dto';
import { CounterOfferTradeInDto } from './dto/counter-offer-trade-in.dto';
import { AiPriceDto } from './dto/ai-price.dto';
import { computeOffer, applyMargin, DEFAULT_PRICING_CONFIG, type ServerPricingConfig } from './pricing';

@Injectable()
export class TradeInsService {
    private readonly logger = new Logger(TradeInsService.name);

    constructor(private readonly prisma: PrismaService) {}

    private async loadPricingConfig(): Promise<ServerPricingConfig> {
        try {
            const rows = await this.prisma.pricingConfig.findMany();
            const byKey: Record<string, number | undefined> = Object.fromEntries(rows.map((r) => [r.key, r.value]));
            return {
                conditionMultipliers: {
                    Mint:    (byKey['multiplier_mint']    ?? DEFAULT_PRICING_CONFIG.conditionMultipliers.Mint)!,
                    Good:    (byKey['multiplier_good']    ?? DEFAULT_PRICING_CONFIG.conditionMultipliers.Good)!,
                    Used:    (byKey['multiplier_used']    ?? DEFAULT_PRICING_CONFIG.conditionMultipliers.Used)!,
                    Damaged: (byKey['multiplier_damaged'] ?? DEFAULT_PRICING_CONFIG.conditionMultipliers.Damaged)!,
                },
                marginPct:            (byKey['margin_pct']             ?? DEFAULT_PRICING_CONFIG.marginPct)!,
                penaltyCrackedScreen: (byKey['penalty_cracked_screen'] ?? DEFAULT_PRICING_CONFIG.penaltyCrackedScreen)!,
                penaltyBattery:       (byKey['penalty_battery']        ?? DEFAULT_PRICING_CONFIG.penaltyBattery)!,
                penaltyCharging:      (byKey['penalty_charging']       ?? DEFAULT_PRICING_CONFIG.penaltyCharging)!,
            };
        } catch {
            return DEFAULT_PRICING_CONFIG;
        }
    }

    async submit(dto: CreateTradeInDto, userId?: string) {
        const pricingConfig = await this.loadPricingConfig();
        const marketPrice = computeOffer(dto.model, dto.condition, dto.answers, pricingConfig);
        const serverOffer = applyMargin(marketPrice, pricingConfig.marginPct);

        return this.prisma.tradeIn.create({
            data: {
                userId,
                category: dto.category,
                brand: dto.brand,
                model: dto.model,
                specs: dto.specs,
                condition: dto.condition,
                answers: dto.answers,
                fulfillment: dto.fulfillment,
                offerPrice: serverOffer,
                contact: dto.contact as object,
            },
        });
    }

    async findAll(query: { status?: string; page?: number; limit?: number }) {
        const { status, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        const where = status ? { status: status as never } : {};

        const [items, total] = await Promise.all([
            this.prisma.tradeIn.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, name: true, email: true } } },
            }),
            this.prisma.tradeIn.count({ where }),
        ]);

        return { items, total, page, limit, pages: Math.ceil(total / limit) };
    }

    async findById(id: string) {
        const tradeIn = await this.prisma.tradeIn.findUnique({
            where: { id },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
        if (!tradeIn) throw new NotFoundException('Trade-in not found');
        return tradeIn;
    }

    async findByReference(reference: string) {
        const tradeIn = await this.prisma.tradeIn.findUnique({ where: { reference } });
        if (!tradeIn) throw new NotFoundException('Trade-in not found');
        return tradeIn;
    }

    async findByUser(userId: string) {
        return this.prisma.tradeIn.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async update(id: string, dto: UpdateTradeInDto) {
        await this.findById(id);
        return this.prisma.tradeIn.update({ where: { id }, data: dto as never });
    }

    async markUnderReview(id: string) {
        const tradeIn = await this.findById(id);
        if (tradeIn.status !== 'SUBMITTED') {
            throw new BadRequestException(`Cannot review a trade-in with status ${tradeIn.status}`);
        }
        return this.prisma.tradeIn.update({ where: { id }, data: { status: 'UNDER_REVIEW' } });
    }

    async approve(id: string, dto: ApproveTradeInDto) {
        const tradeIn = await this.findById(id);
        if (!['SUBMITTED', 'UNDER_REVIEW', 'COUNTER_OFFERED'].includes(tradeIn.status)) {
            throw new BadRequestException(`Cannot approve a trade-in with status ${tradeIn.status}`);
        }
        return this.prisma.tradeIn.update({
            where: { id },
            data: { status: 'APPROVED', adminNotes: dto.adminNotes },
        });
    }

    async reject(id: string, dto: RejectTradeInDto) {
        const tradeIn = await this.findById(id);
        if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(tradeIn.status)) {
            throw new BadRequestException(`Cannot reject a trade-in with status ${tradeIn.status}`);
        }
        return this.prisma.tradeIn.update({
            where: { id },
            data: { status: 'REJECTED', adminNotes: dto.adminNotes },
        });
    }

    async counterOffer(id: string, dto: CounterOfferTradeInDto) {
        const tradeIn = await this.findById(id);
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(tradeIn.status)) {
            throw new BadRequestException(`Cannot counter-offer a trade-in with status ${tradeIn.status}`);
        }
        return this.prisma.tradeIn.update({
            where: { id },
            data: {
                status: 'COUNTER_OFFERED',
                counterOffer: dto.counterOffer,
                adminNotes: dto.adminNotes,
            },
        });
    }

    async aiPrice(dto: AiPriceDto): Promise<{ price: number; aiUsed: boolean }> {
        const pricingConfig = await this.loadPricingConfig();
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            this.logger.warn('OPENAI_API_KEY not set — using fallback rule-based pricing');
            return { price: applyMargin(computeOffer(dto.model, dto.condition, dto.answers, pricingConfig), pricingConfig.marginPct), aiUsed: false };
        }

        const openai = new OpenAI({ apiKey });

        const specsText = Object.entries(dto.specs).map(([k, v]) => `${k}: ${v}`).join(', ');
        const answersText = Object.entries(dto.answers).map(([k, v]) => `${k}: ${v}`).join(', ');

        const systemMessage = `You are a UK second-hand electronics pricing expert for a refurbished device buyback service. You must always respond with a JSON object containing a "price" field. Never return an empty object. If uncertain, give your best estimate based on similar devices.`;

        const prompt = `Estimate the current UK resale market value in GBP for this device.

Device:
- Brand: ${dto.brand}
- Model: ${dto.model}
- Category: ${dto.category}
- Condition: ${dto.condition}
- Specs: ${specsText || 'standard'}
- Diagnostic answers: ${answersText || 'none'}

${dto.images?.length ? `${dto.images.length} photo(s) attached — assess physical condition from the images and adjust price accordingly.` : 'No photos — use condition grade and diagnostic answers only.'}

Base your estimate on mid-2025 UK prices from BackMarket, CEX, Music Magpie, and eBay completed listings. This is the raw market resale value before any trade-in margin is applied.

Respond with ONLY: {"price": <number rounded to nearest 5, minimum 10>}`;

        const content: OpenAI.Chat.ChatCompletionContentPart[] = [{ type: 'text', text: prompt }];

        if (dto.images?.length) {
            for (const img of dto.images.slice(0, 4)) {
                content.push({ type: 'image_url', image_url: { url: img, detail: 'high' } });
            }
        }

        if (dto.images?.length) {
            const imgSample = dto.images[0]?.substring(0, 80) ?? '';
            this.logger.log(`Images attached: ${dto.images.length}, first URL prefix: ${imgSample}`);
        }

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content },
                ],
                temperature: 0,
                max_tokens: 100,
                response_format: { type: 'json_object' },
            });

            const choice = response.choices[0];
            const finishReason = choice?.finish_reason;
            const raw = choice?.message?.content ?? '{}';
            this.logger.log(`OpenAI finish_reason: ${finishReason} | raw: ${raw}`);

            if (finishReason === 'content_filter') {
                this.logger.warn('OpenAI refused the request (content_filter) — falling back to rule-based pricing');
                return { price: applyMargin(computeOffer(dto.model, dto.condition, dto.answers, pricingConfig), pricingConfig.marginPct), aiUsed: false };
            }

            const parsed = JSON.parse(raw) as { price?: number };
            const marketPrice = parsed.price && parsed.price > 0 ? parsed.price : null;
            if (!marketPrice) {
                this.logger.warn(`OpenAI returned invalid price (${parsed.price}) — falling back to rule-based pricing`);
                return { price: applyMargin(computeOffer(dto.model, dto.condition, dto.answers, pricingConfig), pricingConfig.marginPct), aiUsed: false };
            }
            return { price: applyMargin(marketPrice, pricingConfig.marginPct), aiUsed: true };
        } catch (err) {
            this.logger.warn(`OpenAI pricing failed — using fallback rule-based pricing. Reason: ${err instanceof Error ? err.message : String(err)}`);
            return { price: applyMargin(computeOffer(dto.model, dto.condition, dto.answers, pricingConfig), pricingConfig.marginPct), aiUsed: false };
        }
    }

    async complete(id: string) {
        const tradeIn = await this.findById(id);
        if (tradeIn.status !== 'APPROVED') {
            throw new BadRequestException(`Cannot complete a trade-in with status ${tradeIn.status}`);
        }
        return this.prisma.tradeIn.update({ where: { id }, data: { status: 'COMPLETED' } });
    }
}
