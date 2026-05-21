import { IsOptional, IsString } from 'class-validator';

export class CompleteRepairDto {
    @IsString()
    @IsOptional()
    adminNotes?: string;
}
