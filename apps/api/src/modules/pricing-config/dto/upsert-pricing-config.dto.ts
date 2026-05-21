import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertPricingConfigDto {
    @IsNumber()
    value!: number;

    @IsString()
    @IsOptional()
    label?: string;
}
