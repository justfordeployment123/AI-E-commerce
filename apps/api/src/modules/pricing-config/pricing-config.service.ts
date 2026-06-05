import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpsertPricingConfigDto } from './dto/upsert-pricing-config.dto';

// Default condition multipliers seeded on first read
const DEFAULTS: { key: string; value: number; label: string }[] = [
    { key: 'multiplier_mint',    value: 1.0,  label: 'Mint condition multiplier' },
    { key: 'multiplier_good',    value: 0.82, label: 'Good condition multiplier' },
    { key: 'multiplier_used',    value: 0.62, label: 'Used condition multiplier' },
    { key: 'multiplier_damaged', value: 0.3,  label: 'Damaged condition multiplier' },
    { key: 'margin_pct',         value: 30,   label: 'Resale margin percentage' },
    { key: 'tradein_ratio',      value: 0.50, label: 'Trade-in offer ratio (% of resale price)' },
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
