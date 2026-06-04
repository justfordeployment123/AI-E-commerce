import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOtherBrandDto {
    @IsString()
    @IsNotEmpty()
    name!: string;
}
