import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStoreDto {
    @IsString() @IsNotEmpty() name!: string;
    @IsString() @IsNotEmpty() address!: string;
    @IsString() @IsNotEmpty() city!: string;
    @IsString() @IsNotEmpty() postcode!: string;
    @IsString() @IsOptional() phone?: string;
    @IsString() @IsOptional() openingHours?: string;
    @IsBoolean() @IsOptional() isActive?: boolean;
}
