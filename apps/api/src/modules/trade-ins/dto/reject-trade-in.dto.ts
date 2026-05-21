import { IsOptional, IsString } from 'class-validator';

export class RejectTradeInDto {
    @IsString()
    @IsOptional()
    adminNotes?: string;
}
