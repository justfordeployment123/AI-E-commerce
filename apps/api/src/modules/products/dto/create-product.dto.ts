import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsPositive,
    IsString,
    Min,
} from 'class-validator';

export class CreateProductDto {
    // ── Main product track ──────────────────────────────────────────────────────
    @IsString()
    @IsOptional()
    catalogId?: string;

    // ── Other product track ─────────────────────────────────────────────────────
    @IsString()
    @IsOptional()
    otherBrandId?: string;

    @IsString()
    @IsOptional()
    otherSubcategoryId?: string;

    // ── Shared fields ───────────────────────────────────────────────────────────
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    condition!: string;

    @IsString()
    @IsOptional()
    storage?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    price?: number | null;

    @IsNumber()
    @IsOptional()
    comparePrice?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    stock?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsObject()
    @IsOptional()
    specs?: Record<string, unknown>;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
