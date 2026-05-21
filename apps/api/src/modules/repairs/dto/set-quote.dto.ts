import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SetQuoteDto {
    @IsNumber()
    @Min(0)
    quote!: number;

    @IsString()
    @IsOptional()
    adminNotes?: string;
}
