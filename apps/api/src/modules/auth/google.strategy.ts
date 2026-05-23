import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private readonly authService: AuthService) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID ?? '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
            callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3002/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    async validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName ?? email ?? 'Google User';

        if (!email) {
            done(new Error('No email returned from Google'), undefined);
            return;
        }

        const result = await this.authService.googleLogin({ googleId: profile.id, email, name });
        done(null, result);
    }
}
