import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const googleConfigured = !!process.env.GOOGLE_CLIENT_ID;

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('google')
    googleAuth(@Res() res: Response) {
        if (!googleConfigured) return res.status(501).json({ message: 'Google OAuth is not configured on this server.' });
        return AuthGuard('google')(res.req, res, () => {});
    }

    @Get('google/callback')
    googleCallback(@Req() req: Request, @Res() res: Response) {
        if (!googleConfigured) return res.status(501).json({ message: 'Google OAuth is not configured on this server.' });
        return AuthGuard('google')(req, res, () => {
            const { token } = req.user as { token: string };
            const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
            res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
        });
    }
}
