import { IsOptional, IsString, Matches } from 'class-validator';

export class ShippingSettingsDto {
    @IsOptional()
    @IsString()
    @Matches(/^shippo_(test|live)_/, { message: 'Must be a Shippo API key (shippo_test_... or shippo_live_...)' })
    shippoApiKey?: string;

    @IsOptional()
    @IsString()
    shippoServiceLevel?: string;
}
