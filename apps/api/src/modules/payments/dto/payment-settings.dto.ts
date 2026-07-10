import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class PaymentSettingsDto {
    @IsOptional()
    @IsIn(['test', 'live'])
    mode?: string;

    @IsOptional()
    @IsString()
    @Matches(/^sk_test_/, { message: 'Must be a Stripe test secret key (sk_test_...)' })
    stripeSecretKeyTest?: string;

    @IsOptional()
    @IsString()
    @Matches(/^sk_live_/, { message: 'Must be a Stripe live secret key (sk_live_...)' })
    stripeSecretKeyLive?: string;

    @IsOptional()
    @IsString()
    @Matches(/^pk_test_/, { message: 'Must be a Stripe test publishable key (pk_test_...)' })
    stripePublishableKeyTest?: string;

    @IsOptional()
    @IsString()
    @Matches(/^pk_live_/, { message: 'Must be a Stripe live publishable key (pk_live_...)' })
    stripePublishableKeyLive?: string;

    @IsOptional()
    @IsString()
    @Matches(/^whsec_/, { message: 'Must be a Stripe webhook secret (whsec_...)' })
    stripeWebhookSecretTest?: string;

    @IsOptional()
    @IsString()
    @Matches(/^whsec_/, { message: 'Must be a Stripe webhook secret (whsec_...)' })
    stripeWebhookSecretLive?: string;
}
