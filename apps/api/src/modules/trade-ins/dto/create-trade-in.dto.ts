import { IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsPositive, IsString } from 'class-validator';

export class ContactDto {
    @IsString() @IsNotEmpty() name!: string;
    @IsString() @IsNotEmpty() email!: string;
    @IsString() @IsNotEmpty() phone!: string;
    @IsString() @IsOptional() address?: string;
    @IsString() @IsOptional() postcode?: string;
}

export class CreateTradeInDto {
    @IsString()
    @IsNotEmpty()
    category!: string;

    @IsString()
    @IsNotEmpty()
    brand!: string;

    @IsString()
    @IsNotEmpty()
    model!: string;

    @IsObject()
    specs!: Record<string, string>;

    @IsString()
    @IsNotEmpty()
    condition!: string;

    @IsObject()
    answers!: Record<string, string>;

    @IsString()
    @IsIn(['ship', 'dropoff'])
    fulfillment!: string;

    @IsNumber()
    @IsPositive()
    offerPrice!: number;

    @IsObject()
    contact!: ContactDto;
}
