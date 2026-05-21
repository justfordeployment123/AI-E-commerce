import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTradeInDto {
    @IsString()
    @IsIn(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COUNTER_OFFERED', 'COMPLETED', 'CANCELLED'])
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    adminNotes?: string;

    @IsNumber()
    @IsOptional()
    counterOffer?: number;
}
