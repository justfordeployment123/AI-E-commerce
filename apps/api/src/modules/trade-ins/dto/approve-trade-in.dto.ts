import { IsOptional, IsString } from 'class-validator';

export class ApproveTradeInDto {
    @IsString()
    @IsOptional()
    adminNotes?: string;
}
