import {
    IsArray,
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsPositive,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @IsInt()
    @IsPositive()
    quantity!: number;
}

export class ShippingAddressDto {
    @IsString() @IsNotEmpty() name!: string;
    @IsString() @IsNotEmpty() address!: string;
    @IsString() @IsNotEmpty() city!: string;
    @IsString() @IsNotEmpty() postcode!: string;
    @IsString() @IsNotEmpty() country!: string;
}

export class CreateOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items!: OrderItemDto[];

    @IsObject()
    @ValidateNested()
    @Type(() => ShippingAddressDto)
    shippingAddress!: ShippingAddressDto;

    @IsString()
    @IsOptional()
    paymentMethod?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
