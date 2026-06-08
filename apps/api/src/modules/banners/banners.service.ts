import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';

@Injectable()
export class BannersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    // ── Banner Images ────────────────────────────────────────────────────────

    async getRandom(count = 4) {
        const active = await this.prisma.banner.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        if (!active.length) return [];
        const shuffled = [...active].sort(() => Math.random() - 0.5).slice(0, count);
        return Promise.all(
            shuffled.map(async (b) => ({
                id: b.id,
                label: b.label,
                url: await this.storage.resolveImageUrl(b.key),
            })),
        );
    }

    async listAllBanners() {
        const banners = await this.prisma.banner.findMany({ orderBy: { order: 'asc' } });
        return Promise.all(
            banners.map(async (b) => ({
                ...b,
                url: await this.storage.resolveImageUrl(b.key),
            })),
        );
    }

    async toggleBanner(id: string) {
        const b = await this.prisma.banner.findUniqueOrThrow({ where: { id } });
        return this.prisma.banner.update({ where: { id }, data: { isActive: !b.isActive } });
    }

    async uploadBanner(file: any, label?: string) {
        const { filePath, presignedUrl } = await this.storage.uploadFile(file, 'banners');
        const banner = await this.prisma.banner.create({
            data: { key: filePath, label: label ?? null, isActive: true, order: 0 },
        });
        return { ...banner, url: presignedUrl };
    }

    async deleteBanner(id: string) {
        const banner = await this.prisma.banner.findUniqueOrThrow({ where: { id } });
        await this.storage.deleteFiles([banner.key]).catch(() => {});
        await this.prisma.banner.delete({ where: { id } });
    }

    // ── Promo Slides ─────────────────────────────────────────────────────────

    private async serializeSlide(s: any) {
        return {
            id:          s.id,
            order:       s.order,
            isActive:    s.isActive,
            imgUrl:      await this.storage.resolveImageUrl(s.imgKey),
            tabTitle:    s.tabTitle,
            tag:         s.tag,
            titleLine1:  s.titleLine1,
            titleLine2:  s.titleLine2,
            titleItalic: s.titleItalic,
            title:       s.title,
            subtitle:    s.subtitle,
            badgeA:      s.badgeA,
            badgeB:      s.badgeB,
            specs:       s.specs ? s.specs.split(',').map((x: string) => x.trim()).filter(Boolean) : [],
            themeColor:  s.themeColor,
            bgGlow:      s.bgGlow,
            btnText:     s.btnText,
            btnLink:     s.btnLink,
            layoutTheme: s.layoutTheme,
        };
    }

    async getPromoSlides() {
        const slides = await this.prisma.promoSlide.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        return Promise.all(slides.map((s) => this.serializeSlide(s)));
    }

    async listAllPromoSlides() {
        const slides = await this.prisma.promoSlide.findMany({ orderBy: { order: 'asc' } });
        return Promise.all(slides.map((s) => this.serializeSlide(s)));
    }

    async createPromoSlide(data: {
        tabTitle: string; tag: string; titleLine1: string; titleLine2: string;
        titleItalic: string; title: string; subtitle: string; badgeA?: string;
        badgeB?: string; specs?: string[]; themeColor: string; bgGlow: string;
        btnText: string; btnLink: string; order?: number; isActive?: boolean;
        imageUrl?: string; layoutTheme?: string;
    }) {
        const slide = await this.prisma.promoSlide.create({
            data: {
                tabTitle:    data.tabTitle,
                tag:         data.tag,
                titleLine1:  data.titleLine1,
                titleLine2:  data.titleLine2,
                titleItalic: data.titleItalic,
                title:       data.title,
                subtitle:    data.subtitle,
                badgeA:      data.badgeA ?? '',
                badgeB:      data.badgeB ?? '',
                specs:       (data.specs ?? []).join(','),
                themeColor:  data.themeColor,
                bgGlow:      data.bgGlow,
                btnText:     data.btnText,
                btnLink:     data.btnLink,
                order:       data.order ?? 0,
                isActive:    data.isActive ?? true,
                layoutTheme: data.layoutTheme ?? 'system',
                imgKey:      data.imageUrl ?? null,
            },
        });
        return this.serializeSlide(slide);
    }

    async updatePromoSlide(id: string, data: {
        tabTitle?: string; tag?: string; titleLine1?: string; titleLine2?: string;
        titleItalic?: string; title?: string; subtitle?: string; badgeA?: string;
        badgeB?: string; specs?: string[]; themeColor?: string; bgGlow?: string;
        btnText?: string; btnLink?: string; order?: number; isActive?: boolean;
        imageUrl?: string; layoutTheme?: string;
    }) {
        const update: any = { ...data };
        if (data.specs !== undefined) update.specs = data.specs.join(',');
        if (data.imageUrl !== undefined) { update.imgKey = data.imageUrl; delete update.imageUrl; }
        const slide = await this.prisma.promoSlide.update({ where: { id }, data: update });
        return this.serializeSlide(slide);
    }

    async deletePromoSlide(id: string) {
        const slide = await this.prisma.promoSlide.findUniqueOrThrow({ where: { id } });
        if (slide.imgKey && !slide.imgKey.startsWith('http')) {
            await this.storage.deleteFiles([slide.imgKey]).catch(() => {});
        }
        await this.prisma.promoSlide.delete({ where: { id } });
    }

    async togglePromoSlide(id: string) {
        const s = await this.prisma.promoSlide.findUniqueOrThrow({ where: { id } });
        const slide = await this.prisma.promoSlide.update({ where: { id }, data: { isActive: !s.isActive } });
        return this.serializeSlide(slide);
    }

    async reorderPromoSlides(items: { id: string; order: number }[]) {
        await Promise.all(
            items.map(({ id, order }) =>
                this.prisma.promoSlide.update({ where: { id }, data: { order } })
            )
        );
    }

    async uploadPromoSlideImage(id: string, file: any) {
        const { filePath } = await this.storage.uploadFile(file, 'banners/promo');
        const slide = await this.prisma.promoSlide.update({ where: { id }, data: { imgKey: filePath } });
        return this.serializeSlide(slide);
    }

    async deletePromoSlideImage(id: string) {
        const slide = await this.prisma.promoSlide.findUniqueOrThrow({ where: { id } });
        if (slide.imgKey && !slide.imgKey.startsWith('http')) {
            await this.storage.deleteFiles([slide.imgKey]).catch(() => {});
        }
        const updated = await this.prisma.promoSlide.update({ where: { id }, data: { imgKey: null } });
        return this.serializeSlide(updated);
    }
}
