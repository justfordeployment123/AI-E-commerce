import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [
        DatabaseModule,
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
            signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as never },
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        ...(process.env.GOOGLE_CLIENT_ID ? [GoogleStrategy] : []),
    ],
    exports: [AuthService, JwtModule],
})
export class AuthModule {}
