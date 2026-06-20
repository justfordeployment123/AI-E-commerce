import { IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class RefundOrderDto {
    @IsUUID()
    @IsString()
    orderId!: string;

    @IsOptional()
    @IsPositive()
    amountPounds?: number;
}
