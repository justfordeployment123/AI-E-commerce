import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
    constructor(private readonly prisma: PrismaService) {}

    findAllActive() {
        return this.prisma.store.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    findAll() {
        return this.prisma.store.findMany({ orderBy: { name: 'asc' } });
    }

    async findById(id: string) {
        const store = await this.prisma.store.findUnique({ where: { id } });
        if (!store) throw new NotFoundException('Store not found');
        return store;
    }

    create(dto: CreateStoreDto) {
        return this.prisma.store.create({ data: dto });
    }

    async update(id: string, dto: UpdateStoreDto) {
        await this.findById(id);
        return this.prisma.store.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        await this.findById(id);
        await this.prisma.store.delete({ where: { id } });
        return { message: 'Store deleted' };
    }
}
