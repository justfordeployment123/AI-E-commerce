import { IsOptional, IsString } from 'class-validator';

export class ShipOrderDto {
    @IsString()
    @IsOptional()
    trackingNumber?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
