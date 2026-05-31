import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';

@Injectable()
export class BannersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    async getRandom(count = 4) {
        const active = await this.prisma.banner.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        if (!active.length) return [];

        // Shuffle and slice
        const shuffled = [...active].sort(() => Math.random() - 0.5).slice(0, count);

        return Promise.all(
            shuffled.map(async (b) => ({
                id: b.id,
                label: b.label,
                url: await this.storage.resolveImageUrl(b.key),
            })),
        );
    }

    async listAll() {
        const banners = await this.prisma.banner.findMany({ orderBy: { order: 'asc' } });
        return Promise.all(
            banners.map(async (b) => ({
                ...b,
                url: await this.storage.resolveImageUrl(b.key),
            })),
        );
    }

    async toggleActive(id: string) {
        const b = await this.prisma.banner.findUniqueOrThrow({ where: { id } });
        return this.prisma.banner.update({ where: { id }, data: { isActive: !b.isActive } });
    }
}
