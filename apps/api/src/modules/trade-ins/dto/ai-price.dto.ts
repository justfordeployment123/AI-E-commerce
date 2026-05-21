import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class AiPriceDto {
    @IsString()
    model!: string;

    @IsString()
    brand!: string;

    @IsString()
    category!: string;

    @IsString()
    condition!: string;

    @IsObject()
    specs!: Record<string, string>;

    @IsObject()
    answers!: Record<string, string>;

    @IsArray()
    @IsOptional()
    images?: string[]; // base64 JPEG data URLs
}
