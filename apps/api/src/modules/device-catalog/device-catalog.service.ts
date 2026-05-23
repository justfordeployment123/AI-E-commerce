import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpsertDeviceDto } from './dto/upsert-device.dto';

@Injectable()
export class DeviceCatalogService {
    constructor(private readonly prisma: PrismaService) {}

    findAll(params?: { category?: string; search?: string; isActive?: boolean }) {
        const where: Record<string, unknown> = {};
        if (params?.category) where.category = params.category;
        if (params?.isActive !== undefined) where.isActive = params.isActive;
        if (params?.search) {
            where.OR = [
                { brand: { contains: params.search, mode: 'insensitive' } },
                { model: { contains: params.search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.deviceCatalog.findMany({ where, orderBy: [{ brand: 'asc' }, { model: 'asc' }] });
    }

    create(dto: UpsertDeviceDto) {
        return this.prisma.deviceCatalog.create({ data: dto });
    }

    async update(id: string, dto: Partial<UpsertDeviceDto>) {
        const existing = await this.prisma.deviceCatalog.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Device not found');
        return this.prisma.deviceCatalog.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        const existing = await this.prisma.deviceCatalog.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Device not found');
        await this.prisma.deviceCatalog.delete({ where: { id } });
        return { message: 'Device removed' };
    }
}
