import { IsNotEmpty, IsString } from 'class-validator';

export class SuggestSpecsDto {
    @IsString() @IsNotEmpty() brand!: string;
    @IsString() @IsNotEmpty() model!: string;
    @IsString() @IsNotEmpty() category!: string;
}
