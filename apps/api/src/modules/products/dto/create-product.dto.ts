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
    @IsString()
    @IsNotEmpty()
    catalogId!: string;

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
    @IsPositive()
    price!: number;

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
