import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class ShippingSettingsDto {
    @IsOptional()
    @IsIn(['test', 'live'])
    mode?: string;

    @IsOptional()
    @IsString()
    @Matches(/^shippo_test_/, { message: 'Must be a Shippo test API key (shippo_test_...)' })
    shippoApiKeyTest?: string;

    @IsOptional()
    @IsString()
    @Matches(/^shippo_live_/, { message: 'Must be a Shippo live API key (shippo_live_...)' })
    shippoApiKeyLive?: string;

    @IsOptional()
    @IsString()
    shippoServiceLevel?: string;
}
