import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../database/prisma.service';
import { CreateTradeInDto } from './dto/create-trade-in.dto';
import { UpdateTradeInDto } from './dto/update-trade-in.dto';
import { ApproveTradeInDto } from './dto/approve-trade-in.dto';
import { RejectTradeInDto } from './dto/reject-trade-in.dto';
import { CounterOfferTradeInDto } from './dto/counter-offer-trade-in.dto';
import { AiPriceDto } from './dto/ai-price.dto';
import { computeOffer } from './pricing';

@Injectable()
export class TradeInsService {
    constructor(private readonly prisma: PrismaService) {}

    private applyMargin(marketPrice: number): number {
        const pct = Math.min(100, Math.max(0, parseFloat(process.env.PROFIT_MARGIN_PCT ?? '30')));
        return Math.max(Math.round(marketPrice * (1 - pct / 100) / 5) * 5, 10);
    }

    async submit(dto: CreateTradeInDto, userId?: string) {
        // Recompute offer server-side and apply profit margin
        const serverOffer = this.applyMargin(computeOffer(dto.model, dto.condition, dto.answers));

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

    async aiPrice(dto: AiPriceDto): Promise<{ price: number }> {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return { price: this.applyMargin(computeOffer(dto.model, dto.condition, dto.answers)) };
        }

        const openai = new OpenAI({ apiKey });

        const specsText = Object.entries(dto.specs).map(([k, v]) => `${k}: ${v}`).join(', ');
        const answersText = Object.entries(dto.answers).map(([k, v]) => `${k}: ${v}`).join(', ');

        const prompt = `You are a UK refurbished electronics pricing expert.

Device details:
- Model: ${dto.model}
- Category: ${dto.category}
- Brand: ${dto.brand}
- Condition grade: ${dto.condition}
- Specifications: ${specsText || 'Not provided'}
- Diagnostic answers: ${answersText || 'Not provided'}

${dto.images?.length ? `The user has uploaded ${dto.images.length} photo(s). Assess actual physical condition carefully — look for screen damage, scratches, dents, and wear. Adjust price down if condition is worse than reported.` : 'No photos provided — rely solely on the diagnostic answers.'}

Return the current UK resale market price in GBP for this device in its described condition, based on mid-2025 prices from BackMarket, CEX, and Music Magpie.

Rules:
- Return the fair current market resale value (NOT a trade-in offer — that margin is applied separately)
- Adjust downward if photos show worse condition than reported
- Round to the nearest £5
- Minimum value is £10

Respond with ONLY valid JSON, no extra text: {"price": <number>}`;

        const content: OpenAI.Chat.ChatCompletionContentPart[] = [{ type: 'text', text: prompt }];

        if (dto.images?.length) {
            for (const img of dto.images.slice(0, 4)) {
                content.push({ type: 'image_url', image_url: { url: img, detail: 'high' } });
            }
        }

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content }],
                temperature: 0,
                max_tokens: 50,
                response_format: { type: 'json_object' },
            });

            const raw = response.choices[0]?.message?.content ?? '{}';
            const parsed = JSON.parse(raw) as { price?: number };
            return { price: this.applyMargin(parsed.price ?? 0) };
        } catch {
            return { price: this.applyMargin(computeOffer(dto.model, dto.condition, dto.answers)) };
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
