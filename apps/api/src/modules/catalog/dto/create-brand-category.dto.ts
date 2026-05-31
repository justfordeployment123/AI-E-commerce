import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateBrandCategoryDto {
    @IsString()
    brandId!: string;

    @IsString()
    categoryId!: string;

    @IsString()
    @IsOptional()
    alias?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
