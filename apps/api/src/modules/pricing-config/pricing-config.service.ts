import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpsertPricingConfigDto } from './dto/upsert-pricing-config.dto';

// Default condition multipliers seeded on first read.
// Formula: price = marketPrice × conditionMultiplier × (1 - margin_pct/100)
// Set multipliers to reflect how our condition compares to market (e.g. CEX).
// Keep margin_pct small (5-15%) — it's a competitive edge, NOT a profit margin.
const DEFAULTS: { key: string; value: number; label: string }[] = [
    { key: 'multiplier_mint',    value: 1.10, label: 'Mint condition multiplier (% of market price)' },
    { key: 'multiplier_good',    value: 0.90, label: 'Good condition multiplier (% of market price)' },
    { key: 'multiplier_used',    value: 0.78, label: 'Used/Refurbished condition multiplier (% of market price)' },
    { key: 'multiplier_damaged', value: 0.45, label: 'Damaged condition multiplier (% of market price)' },
    { key: 'sell_margin_pct',    value: 0,    label: 'Sell margin % added on top of multiplier price (+/-)' },
    { key: 'sell_discount_pct', value: 0,    label: 'Sell discount % deducted from final price (0-50)' },
    { key: 'tradein_ratio',      value: 0.50, label: 'Trade-in offer ratio (% of resale price)' },
    { key: 'tradein_margin_pct', value: 0,    label: 'Trade-in margin % deducted from offer (+/-)' },
];

@Injectable()
export class PricingConfigService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        const stored = await this.prisma.pricingConfig.findMany({ orderBy: { key: 'asc' } });

        // Seed missing defaults on first access
        const storedKeys = new Set(stored.map((c) => c.key));
        const missing = DEFAULTS.filter((d) => !storedKeys.has(d.key));
        if (missing.length > 0) {
            await this.prisma.pricingConfig.createMany({ data: missing });
            return this.prisma.pricingConfig.findMany({ orderBy: { key: 'asc' } });
        }

        return stored;
    }

    async upsert(key: string, dto: UpsertPricingConfigDto) {
        return this.prisma.pricingConfig.upsert({
            where: { key },
            update: { value: dto.value, label: dto.label },
            create: { key, value: dto.value, label: dto.label },
        });
    }

    async remove(key: string) {
        await this.prisma.pricingConfig.delete({ where: { key } });
        return { message: 'Config removed' };
    }
}
