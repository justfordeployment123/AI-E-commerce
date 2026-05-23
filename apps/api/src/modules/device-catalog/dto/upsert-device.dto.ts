import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpsertDeviceDto {
    @IsString()
    brand: string;

    @IsString()
    model: string;

    @IsString()
    category: string;

    @IsArray()
    @IsString({ each: true })
    storageOptions: string[];

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
