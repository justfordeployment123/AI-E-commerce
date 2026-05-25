import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
