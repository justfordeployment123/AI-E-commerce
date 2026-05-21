import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class RepairContactDto {
    @IsString() @IsNotEmpty() name!: string;
    @IsString() @IsNotEmpty() email!: string;
    @IsString() @IsNotEmpty() phone!: string;
    @IsString() @IsOptional() address?: string;
    @IsString() @IsOptional() postcode?: string;
}

export class CreateRepairDto {
    @IsString()
    @IsNotEmpty()
    deviceType!: string;

    @IsString()
    @IsNotEmpty()
    brand!: string;

    @IsString()
    @IsNotEmpty()
    model!: string;

    @IsString()
    @IsNotEmpty()
    issue!: string;

    @IsString()
    @IsOptional()
    issueNotes?: string;

    @IsString()
    @IsIn(['ship', 'dropoff'])
    fulfillment!: string;

    @IsObject()
    contact!: RepairContactDto;
}
