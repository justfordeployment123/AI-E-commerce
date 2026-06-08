import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpsertPricingConfigDto } from './dto/upsert-pricing-config.dto';

// Default condition multipliers seeded on first read.
// Formula: price = marketPrice × conditionMultiplier × (1 + sellMargin/100) × (1 - sellDiscount/100)
// Grades: NEW (brand new) → A (like new) → B (minor wear) → C (heavy wear) → F (non-working)
const DEFAULTS: { key: string; value: number; label: string }[] = [
    { key: 'multiplier_new', value: 1.20, label: 'New condition multiplier (% of market price)' },
    { key: 'multiplier_a',   value: 1.05, label: 'A Grade multiplier — used but like new (% of market price)' },
    { key: 'multiplier_b',   value: 0.85, label: 'B Grade multiplier — minor signs of use (% of market price)' },
    { key: 'multiplier_c',   value: 0.65, label: 'C Grade multiplier — heavy scratches/marks (% of market price)' },
    { key: 'multiplier_f',   value: 0.25, label: 'F Grade multiplier — non-working, parts only (% of market price)' },
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
