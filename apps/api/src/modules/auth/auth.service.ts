import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) {}

    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) throw new ConflictException('Email already registered');

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: { email: dto.email, passwordHash, name: dto.name, phone: dto.phone },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });

        const token = this.signToken(user.id, user.email, user.role);
        return { user, token };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        const token = this.signToken(user.id, user.email, user.role);
        const { passwordHash: _, ...safeUser } = user;
        return { user: safeUser, token };
    }

    async googleLogin(dto: { googleId: string; email: string; name: string }) {
        let user = await this.prisma.user.findFirst({
            where: { OR: [{ googleId: dto.googleId }, { email: dto.email }] },
        });

        if (!user) {
            user = await this.prisma.user.create({
                data: { email: dto.email, name: dto.name, googleId: dto.googleId },
            });
        } else if (!user.googleId) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { googleId: dto.googleId },
            });
        }

        const token = this.signToken(user.id, user.email, user.role);
        return { token };
    }

    private signToken(userId: string, email: string, role: string) {
        return this.jwt.sign({ sub: userId, email, role });
    }
}
