import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

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

    @IsBoolean()
    @IsOptional()
    tradeInEnabled?: boolean;

    @IsNumber()
    @IsOptional()
    manualMarketPrice?: number | null;
}
