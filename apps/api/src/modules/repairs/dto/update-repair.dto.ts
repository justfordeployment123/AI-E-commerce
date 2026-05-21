import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateRepairDto {
    @IsString()
    @IsIn(['SUBMITTED', 'QUOTE_SENT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    @IsOptional()
    status?: string;

    @IsNumber()
    @IsOptional()
    quote?: number;

    @IsString()
    @IsOptional()
    adminNotes?: string;
}
