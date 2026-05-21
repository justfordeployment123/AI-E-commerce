import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class AddCartItemDto {
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @IsInt()
    @IsPositive()
    quantity!: number;

    @IsNumber()
    price!: number;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    slug!: string;

    @IsString()
    @IsOptional()
    image?: string;
}

export class UpdateCartItemDto {
    @IsInt()
    @IsPositive()
    quantity!: number;
}
