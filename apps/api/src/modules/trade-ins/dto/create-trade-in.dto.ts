import { ArrayMinSize, IsArray, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

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

    @IsIn(['NEW', 'A', 'B', 'C', 'F'])
    condition!: string;

    @IsObject()
    answers!: Record<string, string>;

    @IsString()
    @IsIn(['ship', 'dropoff'])
    fulfillment!: string;

    @IsNumber()
    @Min(0)
    offerPrice!: number;

    @IsString()
    @IsOptional()
    storeId?: string;

    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(0)
    images!: string[];

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    customerNotes?: string;

    @IsObject()
    contact!: ContactDto;
}
