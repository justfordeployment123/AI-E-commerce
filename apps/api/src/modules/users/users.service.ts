import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const SAFE_SELECT = {
    id: true,
    email: true,
    name: true,
    phone: true,
    address: true,
    city: true,
    postcode: true,
    role: true,
    createdAt: true,
    updatedAt: true,
};

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async update(id: string, dto: UpdateProfileDto) {
        await this.findById(id);
        const data: Record<string, unknown> = {};
        if (dto.name     !== undefined) data.name     = dto.name;
        if (dto.phone    !== undefined) data.phone    = dto.phone;
        if (dto.address  !== undefined) data.address  = dto.address;
        if (dto.city     !== undefined) data.city     = dto.city;
        if (dto.postcode !== undefined) data.postcode = dto.postcode;
        return this.prisma.user.update({ where: { id }, data, select: SAFE_SELECT });
    }

    async changePassword(id: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        // Google-only accounts have no passwordHash yet — let them set one directly
        // instead of asking for a "current password" that was never set.
        if (user.passwordHash) {
            const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
            if (!valid) throw new BadRequestException('Current password is incorrect');
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({ where: { id }, data: { passwordHash } });
        return { ok: true };
    }

    async findAll(query: { page?: number; limit?: number } = {}) {
        const { page = 1, limit = 20 } = query;
        const safeLimit = Math.min(limit, 100);
        const skip = (page - 1) * safeLimit;
        const [items, total] = await Promise.all([
            this.prisma.user.findMany({ select: SAFE_SELECT, orderBy: { createdAt: 'desc' }, skip, take: safeLimit }),
            this.prisma.user.count(),
        ]);
        return { items, total, page, limit: safeLimit, pages: Math.ceil(total / safeLimit) };
    }
}
