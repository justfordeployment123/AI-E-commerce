import { IsString, IsNotEmpty } from 'class-validator';

export class PriceEstimateDto {
    @IsString() @IsNotEmpty() brand!: string;
    @IsString() @IsNotEmpty() model!: string;
    @IsString() storage!: string;
    @IsString() @IsNotEmpty() condition!: string;
}

export interface PricingDetail {
    productId: string;
    status: 'applied' | 'flagged' | 'no_data';
    candidatePrice?: number;
    aiRange?: { low: number; high: number };
    reason?: string;
}

export interface PricingRunResult {
    applied: number;
    flagged: number;
    skipped: number;
    details: PricingDetail[];
}

export interface ScrapedPricesSnapshot {
    cexSellPrice:      number | null;
    cexCashPrice:      number | null;
    cexExchangePrice:  number | null;
    envirofonePrice:   number | null;
    marketPrice:       number | null;
    scrapedAt:         string;
}

export interface EstimateResult {
    low:            number;
    high:           number;
    suggested:      number;
    marketPrice:    number | null;
    scrapedPrices:  ScrapedPricesSnapshot | null;
}
