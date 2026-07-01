import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateTradeInDeviceDto {
    name:     string;
    brand:    string;
    category: string;
    isActive?: boolean;
}

@Injectable()
export class TradeInDevicesService {
    constructor(private readonly prisma: PrismaService) {}

    findAll(activeOnly = false) {
        return this.prisma.tradeInDevice.findMany({
            where: activeOnly ? { isActive: true } : undefined,
            orderBy: [{ category: 'asc' }, { brand: 'asc' }, { name: 'asc' }],
        });
    }

    async create(dto: CreateTradeInDeviceDto) {
        return this.prisma.tradeInDevice.upsert({
            where:  { brand_name: { brand: dto.brand, name: dto.name } },
            update: { category: dto.category, isActive: dto.isActive ?? true },
            create: { name: dto.name, brand: dto.brand, category: dto.category, isActive: dto.isActive ?? true },
        });
    }

    async update(id: string, dto: Partial<CreateTradeInDeviceDto>) {
        const existing = await this.prisma.tradeInDevice.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Device not found');
        return this.prisma.tradeInDevice.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        const existing = await this.prisma.tradeInDevice.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Device not found');
        return this.prisma.tradeInDevice.delete({ where: { id } });
    }

    bulkCreate(devices: CreateTradeInDeviceDto[]) {
        return Promise.all(devices.map(d => this.create(d)));
    }
}
