import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpsertDeviceDto {
    @IsString()
    brandCategoryId!: string;

    @IsString()
    model!: string;

    @IsArray()
    @IsString({ each: true })
    storageOptions!: string[];

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
