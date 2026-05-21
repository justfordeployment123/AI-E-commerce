import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CounterOfferTradeInDto {
    @IsNumber()
    @Min(1)
    counterOffer!: number;

    @IsString()
    @IsOptional()
    adminNotes?: string;
}
