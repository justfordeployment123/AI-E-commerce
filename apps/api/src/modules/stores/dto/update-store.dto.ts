import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateStoreDto {
    @IsString() @IsOptional() name?: string;
    @IsString() @IsOptional() address?: string;
    @IsString() @IsOptional() city?: string;
    @IsString() @IsOptional() postcode?: string;
    @IsString() @IsOptional() phone?: string;
    @IsString() @IsOptional() openingHours?: string;
    @IsBoolean() @IsOptional() isActive?: boolean;
}
