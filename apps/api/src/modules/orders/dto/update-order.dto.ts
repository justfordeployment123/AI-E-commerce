import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateOrderDto {
    @IsString()
    @IsIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    trackingNumber?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
