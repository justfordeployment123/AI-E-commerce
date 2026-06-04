import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOtherSubcategoryDto {
    @IsString()
    @IsNotEmpty()
    name!: string;
}
