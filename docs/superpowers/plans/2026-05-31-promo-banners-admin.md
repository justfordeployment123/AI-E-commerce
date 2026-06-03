# Promo Banners Admin Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage hero carousel and banner images fully manageable from the admin panel via a new `/admin/banners` hub with sub-pages for Banner Images and Promo Slides.

**Architecture:** Extend the existing `PromoSlide` Prisma model with full content fields, add CRUD endpoints to `BannersController`, build three new admin pages (hub, images, promo-banners), and rewrite `PromoCarouselBanner` on the homepage to pull all slide data from the API instead of the hardcoded `SLIDE_META` array.

**Tech Stack:** NestJS (API), Prisma (ORM), Next.js 14 App Router (admin + web), Garage/S3 (image storage), Tailwind CSS, Lucide React icons.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `apps/api/prisma/schema.prisma` | Add 10 new columns to `PromoSlide` |
| Modify | `apps/api/src/modules/banners/banners.service.ts` | Add all CRUD methods for PromoSlide + Banner |
| Modify | `apps/api/src/modules/banners/banners.controller.ts` | Wire up all new endpoints |
| Modify | `apps/admin/lib/api.ts` | Add `promoSlidesApi` + `bannerImagesApi` with types |
| Modify | `apps/admin/components/Sidebar.tsx` | Add "Banners" nav item |
| Create | `apps/admin/app/banners/page.tsx` | Hub page — navigation cards |
| Create | `apps/admin/app/banners/images/page.tsx` | Banner images CRUD |
| Create | `apps/admin/app/banners/promo-banners/page.tsx` | Promo slides full CRUD |
| Modify | `apps/web/lib/api.ts` | Update `PromoSlide` interface + `bannersApi` return type |
| Modify | `apps/web/app/page.tsx` | Rewrite `PromoCarouselBanner` to fetch all fields from API |

---

## Task 1: Extend PromoSlide Prisma Schema

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Update the PromoSlide model**

Replace the existing `model PromoSlide` block (currently lines 390–403) with:

```prisma
model PromoSlide {
  id          String   @id @default(uuid())
  imgKey      String?
  tabTitle    String   @default("")
  tag         String   @default("")
  titleLine1  String   @default("")
  titleLine2  String   @default("")
  titleItalic String   @default("")
  title       String   @default("")
  subtitle    String   @default("")
  badgeA      String   @default("")
  badgeB      String   @default("")
  specs       String   @default("")
  themeColor  String   @default("from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-400")
  bgGlow      String   @default("rgba(59,130,246,0.15)")
  btnText     String   @default("Shop Now")
  btnLink     String   @default("/")
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("promo_slides")
}
```

- [ ] **Step 2: Generate and run the migration**

```bash
cd apps/api
npx prisma migrate dev --name extend_promo_slide
```

Expected output includes: `The following migration(s) have been applied: .../extend_promo_slide/migration.sql`

- [ ] **Step 3: Regenerate the Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

---

## Task 2: Rewrite BannersService

**Files:**
- Modify: `apps/api/src/modules/banners/banners.service.ts`

- [ ] **Step 1: Replace the entire file with the extended service**

```typescript
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
        imageUrl?: string;
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
        imageUrl?: string;
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
```

---

## Task 3: Rewrite BannersController

**Files:**
- Modify: `apps/api/src/modules/banners/banners.controller.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
import {
    Body, Controller, Delete, Get, Param, Patch, Post,
    Query, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BannersService } from './banners.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('banners')
export class BannersController {
    constructor(private readonly banners: BannersService) {}

    // ── Banner Images (public + admin) ───────────────────────────────────────

    @Get('random')
    getRandom(@Query('count') count?: string) {
        return this.banners.getRandom(count ? Math.min(Number(count), 10) : 4);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    listAllBanners() {
        return this.banners.listAllBanners();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('file'))
    uploadBanner(@UploadedFile() file: any, @Body('label') label?: string) {
        return this.banners.uploadBanner(file, label);
    }

    @Patch(':id/toggle')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    toggleBanner(@Param('id') id: string) {
        return this.banners.toggleBanner(id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    deleteBanner(@Param('id') id: string) {
        return this.banners.deleteBanner(id);
    }

    // ── Promo Slides (public + admin) ────────────────────────────────────────
    // IMPORTANT: static sub-paths (promo-slides/all, promo-slides/reorder)
    // must be declared BEFORE parameterised paths (promo-slides/:id).

    @Get('promo-slides')
    getPromoSlides() {
        return this.banners.getPromoSlides();
    }

    @Get('promo-slides/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    listAllPromoSlides() {
        return this.banners.listAllPromoSlides();
    }

    @Post('promo-slides')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    createPromoSlide(@Body() body: any) {
        return this.banners.createPromoSlide(body);
    }

    @Patch('promo-slides/reorder')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    reorderPromoSlides(@Body() body: { items: { id: string; order: number }[] }) {
        return this.banners.reorderPromoSlides(body.items);
    }

    @Patch('promo-slides/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    updatePromoSlide(@Param('id') id: string, @Body() body: any) {
        return this.banners.updatePromoSlide(id, body);
    }

    @Delete('promo-slides/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    deletePromoSlide(@Param('id') id: string) {
        return this.banners.deletePromoSlide(id);
    }

    @Patch('promo-slides/:id/toggle')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    togglePromoSlide(@Param('id') id: string) {
        return this.banners.togglePromoSlide(id);
    }

    @Post('promo-slides/:id/image')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('file'))
    uploadPromoSlideImage(@Param('id') id: string, @UploadedFile() file: any) {
        return this.banners.uploadPromoSlideImage(id, file);
    }

    @Delete('promo-slides/:id/image')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    deletePromoSlideImage(@Param('id') id: string) {
        return this.banners.deletePromoSlideImage(id);
    }
}
```

---

## Task 4: Admin API Client — Add promoSlidesApi + bannerImagesApi

**Files:**
- Modify: `apps/admin/lib/api.ts`

- [ ] **Step 1: Add the interfaces and API objects at the end of `apps/admin/lib/api.ts`**

Append the following before the closing of the file (after the existing `storesApi` or last export):

```typescript
// ── Banners ───────────────────────────────────────────────────────────────────

export interface BannerItem {
  id: string;
  key: string;
  label: string | null;
  isActive: boolean;
  order: number;
  url: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromoSlideItem {
  id: string;
  order: number;
  isActive: boolean;
  imgUrl: string | null;
  tabTitle: string;
  tag: string;
  titleLine1: string;
  titleLine2: string;
  titleItalic: string;
  title: string;
  subtitle: string;
  badgeA: string;
  badgeB: string;
  specs: string[];
  themeColor: string;
  bgGlow: string;
  btnText: string;
  btnLink: string;
}

export const THEME_PRESETS = [
  { label: 'Blue',    swatch: 'from-blue-500 to-indigo-600',    themeColor: 'from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-400',     bgGlow: 'rgba(59,130,246,0.15)' },
  { label: 'Amber',   swatch: 'from-amber-500 to-orange-600',   themeColor: 'from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-400',   bgGlow: 'rgba(245,158,11,0.15)' },
  { label: 'Emerald', swatch: 'from-emerald-500 to-teal-600',   themeColor: 'from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-400',   bgGlow: 'rgba(16,185,129,0.15)' },
  { label: 'Green',   swatch: 'from-green-500 to-emerald-600',  themeColor: 'from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-400', bgGlow: 'rgba(34,197,94,0.15)' },
  { label: 'Purple',  swatch: 'from-purple-500 to-fuchsia-600', themeColor: 'from-purple-500 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400', bgGlow: 'rgba(168,85,247,0.15)' },
  { label: 'Teal',    swatch: 'from-teal-500 to-cyan-600',      themeColor: 'from-teal-500 to-cyan-600 dark:from-teal-400 dark:to-cyan-400',         bgGlow: 'rgba(20,184,166,0.15)' },
] as const;

export const bannerImagesApi = {
  list: () => apiFetch<BannerItem[]>('/banners'),
  toggle: (id: string) => apiFetch<BannerItem>(`/banners/${id}/toggle`, { method: 'PATCH' }),
  delete: (id: string) => apiFetch<void>(`/banners/${id}`, { method: 'DELETE' }),
  upload: async (file: File, label?: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ts_admin_token') : null;
    const fd = new FormData();
    fd.append('file', file);
    if (label) fd.append('label', label);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/banners`, { method: 'POST', headers, body: fd });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? res.statusText);
    return res.json() as Promise<BannerItem>;
  },
};

export const promoSlidesApi = {
  list: () => apiFetch<PromoSlideItem[]>('/banners/promo-slides/all'),
  create: (data: Omit<PromoSlideItem, 'id' | 'imgUrl'> & { imageUrl?: string }) =>
    apiFetch<PromoSlideItem>('/banners/promo-slides', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<PromoSlideItem, 'id' | 'imgUrl'> & { imageUrl?: string }>) =>
    apiFetch<PromoSlideItem>(`/banners/promo-slides/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/banners/promo-slides/${id}`, { method: 'DELETE' }),
  toggle: (id: string) => apiFetch<PromoSlideItem>(`/banners/promo-slides/${id}/toggle`, { method: 'PATCH' }),
  reorder: (items: { id: string; order: number }[]) =>
    apiFetch<void>('/banners/promo-slides/reorder', { method: 'PATCH', body: JSON.stringify({ items }) }),
  uploadImage: async (id: string, file: File) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ts_admin_token') : null;
    const fd = new FormData();
    fd.append('file', file);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/banners/promo-slides/${id}/image`, { method: 'POST', headers, body: fd });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? res.statusText);
    return res.json() as Promise<PromoSlideItem>;
  },
  deleteImage: (id: string) =>
    apiFetch<PromoSlideItem>(`/banners/promo-slides/${id}/image`, { method: 'DELETE' }),
};
```

---

## Task 5: Admin Sidebar — Add Banners Nav Item

**Files:**
- Modify: `apps/admin/components/Sidebar.tsx`

- [ ] **Step 1: Add the Image icon import**

In the existing lucide import line, add `Image` to the import list:

```typescript
import {
  LayoutDashboard, Package, RefreshCw, Wrench, ShoppingBag,
  SlidersHorizontal, BarChart3, LogOut, ChevronRight, ListPlus, MapPin,
  TrendingUp, HeadphonesIcon, Star, Phone, DatabaseZap, Layers, Image
} from "lucide-react";
```

- [ ] **Step 2: Add the Banners entry to the NAV array**

Add it after the `{ href: "/seed", ... }` entry:

```typescript
{ href: "/banners", label: "Banners", icon: Image },
```

The updated NAV array Catalog section becomes:

```typescript
const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package, section: "Catalog" },
  { href: "/catalog", label: "Device Catalog", icon: ListPlus },
  { href: "/catalog-mgmt", label: "Categories & Brands", icon: Layers },
  { href: "/banners", label: "Banners", icon: Image },
  { href: "/seed", label: "Seed Database", icon: DatabaseZap },
  // ... rest unchanged
];
```

- [ ] **Step 3: Update the active link detection for sub-pages**

The sidebar marks a link active only when `pathname === href`. For `/admin/banners`, the banner sub-pages are `/admin/banners/images` and `/admin/banners/promo-banners`. Update the active check in Sidebar to use `startsWith` for the banners entry.

Replace the `const active = pathname === href;` line inside the NAV.map with:

```typescript
const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
```

---

## Task 6: Admin Hub Page — `/admin/banners`

**Files:**
- Create: `apps/admin/app/banners/page.tsx`

- [ ] **Step 1: Create the hub page**

```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Image, SlidersHorizontal } from "lucide-react";
import { bannerImagesApi, promoSlidesApi } from "../../lib/api";

export default function BannersHubPage() {
  const [counts, setCounts] = useState({ banners: 0, promoSlides: 0 });

  useEffect(() => {
    Promise.all([
      bannerImagesApi.list(),
      promoSlidesApi.list(),
    ]).then(([banners, slides]) =>
      setCounts({ banners: banners.length, promoSlides: slides.length })
    ).catch(() => {});
  }, []);

  const cards = [
    {
      label: "Banner Images",
      desc: "Product and category promotional images shown across the site.",
      count: counts.banners,
      href: "/banners/images",
      icon: Image,
    },
    {
      label: "Promo Banners",
      desc: "Homepage hero carousel slides — title, description, image, CTA, and theme.",
      count: counts.promoSlides,
      href: "/banners/promo-banners",
      icon: SlidersHorizontal,
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Banners</h1>
      <p className="text-sm text-zinc-400 mb-8">
        Manage all site banners — product images and the homepage promo carousel.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-white border border-zinc-100 rounded-2xl p-6 hover:border-zinc-300 hover:shadow-sm transition-all flex flex-col gap-3"
          >
            <c.icon className="h-5 w-5 text-zinc-400" />
            <div>
              <div className="text-3xl font-extrabold text-zinc-900">{c.count}</div>
              <div className="font-bold text-zinc-700 text-sm mt-0.5">{c.label}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{c.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

## Task 7: Admin Banner Images Sub-page

**Files:**
- Create: `apps/admin/app/banners/images/page.tsx`

- [ ] **Step 1: Create the banner images management page**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, Upload } from "lucide-react";
import { bannerImagesApi, type BannerItem } from "../../../lib/api";

export default function BannerImagesPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    bannerImagesApi.list().then(setBanners).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function handleUpload(file: File) {
    setUploading(true); setError("");
    try {
      await bannerImagesApi.upload(file, labelInput || undefined);
      setLabelInput("");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setUploading(false); }
  }

  async function handleToggle(id: string) {
    await bannerImagesApi.toggle(id).catch(() => {});
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this banner image? This cannot be undone.")) return;
    await bannerImagesApi.delete(id).catch(() => {});
    load();
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/banners" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 mb-1">
            <ArrowLeft className="h-3 w-3" /> Banners
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Banner Images</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="h-9 border border-zinc-200 rounded-xl px-3 text-sm w-40"
            placeholder="Label (optional)"
            value={labelInput}
            onChange={e => setLabelInput(e.target.value)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Upload Banner"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-video bg-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 text-sm">No banners yet. Upload one above.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {banners.map((b) => (
            <div key={b.id} className={`relative group rounded-2xl overflow-hidden border ${b.isActive ? 'border-zinc-200' : 'border-zinc-100 opacity-50'}`}>
              <div className="aspect-video bg-zinc-50">
                {b.url && (
                  <img src={b.url} alt={b.label ?? ''} className="w-full h-full object-cover" />
                )}
              </div>
              {b.label && (
                <div className="px-3 py-2 text-xs font-semibold text-zinc-600 truncate">{b.label}</div>
              )}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleToggle(b.id)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/90 border border-zinc-200 text-zinc-600 hover:text-zinc-900"
                  title={b.isActive ? "Deactivate" : "Activate"}
                >
                  {b.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/90 border border-zinc-200 text-red-500 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Task 8: Admin Promo Banners Sub-page

**Files:**
- Create: `apps/admin/app/banners/promo-banners/page.tsx`

- [ ] **Step 1: Create the full promo slides management page**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff,
  GripVertical, Upload, X, Check
} from "lucide-react";
import {
  promoSlidesApi, THEME_PRESETS,
  type PromoSlideItem,
} from "../../../lib/api";

type Form = {
  tabTitle: string; tag: string; titleLine1: string; titleLine2: string;
  titleItalic: string; title: string; subtitle: string;
  badgeA: string; badgeB: string;
  spec1: string; spec2: string; spec3: string;
  themeColor: string; bgGlow: string;
  btnText: string; btnLink: string;
  isActive: boolean; imageUrl: string;
};

const emptyForm: Form = {
  tabTitle: "", tag: "", titleLine1: "", titleLine2: "", titleItalic: "",
  title: "", subtitle: "", badgeA: "", badgeB: "",
  spec1: "", spec2: "", spec3: "",
  themeColor: THEME_PRESETS[0].themeColor, bgGlow: THEME_PRESETS[0].bgGlow,
  btnText: "Shop Now", btnLink: "/", isActive: true, imageUrl: "",
};

function slideToForm(s: PromoSlideItem): Form {
  const [spec1 = "", spec2 = "", spec3 = ""] = s.specs;
  return {
    tabTitle: s.tabTitle, tag: s.tag, titleLine1: s.titleLine1,
    titleLine2: s.titleLine2, titleItalic: s.titleItalic,
    title: s.title, subtitle: s.subtitle,
    badgeA: s.badgeA, badgeB: s.badgeB,
    spec1, spec2, spec3,
    themeColor: s.themeColor, bgGlow: s.bgGlow,
    btnText: s.btnText, btnLink: s.btnLink,
    isActive: s.isActive, imageUrl: "",
  };
}

function formToPayload(f: Form) {
  const specs = [f.spec1, f.spec2, f.spec3].filter(Boolean);
  const base = {
    tabTitle: f.tabTitle, tag: f.tag, titleLine1: f.titleLine1,
    titleLine2: f.titleLine2, titleItalic: f.titleItalic,
    title: f.title, subtitle: f.subtitle,
    badgeA: f.badgeA, badgeB: f.badgeB, specs,
    themeColor: f.themeColor, bgGlow: f.bgGlow,
    btnText: f.btnText, btnLink: f.btnLink, isActive: f.isActive,
  };
  return f.imageUrl ? { ...base, imageUrl: f.imageUrl } : base;
}

export default function PromoSlidesPage() {
  const [slides, setSlides] = useState<PromoSlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // "new" | slide id
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [uploadingImgId, setUploadingImgId] = useState<string | null>(null);
  const imgFileRef = useRef<HTMLInputElement>(null);
  const pendingImgId = useRef<string | null>(null);

  const load = () => {
    setLoading(true);
    promoSlidesApi.list().then(setSlides).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  function startCreate() { setEditing("new"); setForm(emptyForm); setError(""); }
  function startEdit(s: PromoSlideItem) { setEditing(s.id); setForm(slideToForm(s)); setError(""); }
  function cancel() { setEditing(null); setError(""); }

  async function save() {
    setSaving(true); setError("");
    try {
      const payload = formToPayload(form);
      if (editing === "new") {
        const created = await promoSlidesApi.create({ ...payload, order: slides.length } as any);
        // upload file if one is staged in imgFileRef
        if (imgFileRef.current?.files?.[0]) {
          await promoSlidesApi.uploadImage(created.id, imgFileRef.current.files[0]);
        }
      } else if (editing) {
        await promoSlidesApi.update(editing, payload);
        if (imgFileRef.current?.files?.[0]) {
          await promoSlidesApi.uploadImage(editing, imgFileRef.current.files[0]);
        }
      }
      cancel(); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this slide? This cannot be undone.")) return;
    await promoSlidesApi.delete(id).catch(() => {});
    load();
  }

  async function toggle(id: string) {
    await promoSlidesApi.toggle(id).catch(() => {});
    load();
  }

  // Drag-to-reorder
  function onDragStart(i: number) { setDragIdx(i); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDrop(i: number) {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); return; }
    const reordered = [...slides];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(i, 0, moved);
    const items = reordered.map((s, idx) => ({ id: s.id, order: idx }));
    setSlides(reordered.map((s, idx) => ({ ...s, order: idx })));
    promoSlidesApi.reorder(items).catch(() => load());
    setDragIdx(null);
  }

  const f = form;
  const setF = (patch: Partial<Form>) => setForm(prev => ({ ...prev, ...patch }));

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/banners" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 mb-1">
            <ArrowLeft className="h-3 w-3" /> Banners
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Promo Banners</h1>
          <p className="text-sm text-zinc-400">Manage the homepage hero carousel slides. Drag to reorder.</p>
        </div>
        <button onClick={startCreate}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800">
          <Plus className="h-3.5 w-3.5" /> Add Slide
        </button>
      </div>

      {/* ── Add / Edit Form ── */}
      {editing && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-sm mb-5">{editing === "new" ? "New Slide" : "Edit Slide"}</h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {([ ["Tab Title", "tabTitle"], ["Tag / Eyebrow", "tag"],
                ["Title Line 1", "titleLine1"], ["Title Line 2", "titleLine2"],
                ["Italic Word", "titleItalic"], ["Meta Title", "title"],
            ] as [string, keyof Form][]).map(([label, key]) => (
              <div key={key}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">{label}</label>
                <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm"
                  value={f[key] as string}
                  onChange={e => setF({ [key]: e.target.value } as any)} />
              </div>
            ))}

            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Description (Subtitle)</label>
              <textarea className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm resize-none" rows={2}
                value={f.subtitle} onChange={e => setF({ subtitle: e.target.value })} />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Badge A</label>
              <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm"
                value={f.badgeA} onChange={e => setF({ badgeA: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Badge B</label>
              <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm"
                value={f.badgeB} onChange={e => setF({ badgeB: e.target.value })} />
            </div>

            {(["spec1", "spec2", "spec3"] as const).map((key, i) => (
              <div key={key}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Spec {i + 1}</label>
                <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm"
                  value={f[key]} onChange={e => setF({ [key]: e.target.value } as any)} />
              </div>
            ))}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Button Text</label>
              <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm"
                value={f.btnText} onChange={e => setF({ btnText: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Button Link</label>
              <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm font-mono"
                value={f.btnLink} onChange={e => setF({ btnLink: e.target.value })} />
            </div>
          </div>

          {/* Theme Color Swatches */}
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Theme Color</label>
            <div className="flex gap-2 flex-wrap">
              {THEME_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setF({ themeColor: p.themeColor, bgGlow: p.bgGlow })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    f.themeColor === p.themeColor
                      ? 'border-zinc-900 bg-zinc-50'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full bg-gradient-to-r ${p.swatch}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Image</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-zinc-400 mb-1">Upload file</p>
                <input ref={imgFileRef} type="file" accept="image/*"
                  className="w-full text-xs text-zinc-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:text-xs file:font-semibold" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 mb-1">Or paste URL</p>
                <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm font-mono"
                  placeholder="https://..."
                  value={f.imageUrl} onChange={e => setF({ imageUrl: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2 text-xs font-semibold mb-4 cursor-pointer">
            <input type="checkbox" checked={f.isActive} onChange={e => setF({ isActive: e.target.checked })} />
            Active (visible on site)
          </label>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50">
              <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save Slide"}
            </button>
            <button onClick={cancel}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-zinc-200 text-xs font-bold hover:bg-zinc-50">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Slides List ── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : slides.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 text-sm">No slides yet. Add one above.</div>
      ) : (
        <div className="space-y-3">
          {slides.map((s, i) => (
            <div
              key={s.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(i)}
              className={`flex items-center gap-4 bg-white border rounded-2xl px-4 py-3 transition-all ${
                dragIdx === i ? 'border-zinc-400 shadow-md opacity-50' : 'border-zinc-100 hover:border-zinc-200'
              }`}
            >
              <GripVertical className="h-4 w-4 text-zinc-300 cursor-grab shrink-0" />

              {/* Thumbnail */}
              <div className="h-12 w-16 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0 flex items-center justify-center">
                {s.imgUrl
                  ? <img src={s.imgUrl} alt={s.tabTitle} className="h-full w-full object-cover" />
                  : <span className="text-[10px] text-zinc-300">No img</span>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-zinc-400">
                    {String(s.order + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-bold text-zinc-900 truncate">{s.tabTitle || s.titleLine1}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{s.titleLine1} {s.titleLine2} {s.titleItalic}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggle(s.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition-all"
                  title={s.isActive ? "Deactivate" : "Activate"}>
                  {s.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => startEdit(s)}
                  className="h-8 w-8 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition-all"
                  title="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => remove(s.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-xl border border-zinc-200 text-red-400 hover:text-red-600 hover:border-red-200 transition-all"
                  title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Task 9: Update Web API Type + Rewrite PromoCarouselBanner

**Files:**
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Update `bannersApi.promoSlides` in `apps/web/lib/api.ts`**

Find the existing `bannersApi` block (around line 232–242) and replace it:

```typescript
// ── Banners ───────────────────────────────────────────────────────────────────
export interface PromoSlide {
  id: string;
  order: number;
  isActive: boolean;
  imgUrl: string | null;
  tabTitle: string;
  tag: string;
  titleLine1: string;
  titleLine2: string;
  titleItalic: string;
  title: string;
  subtitle: string;
  badgeA: string;
  badgeB: string;
  specs: string[];
  themeColor: string;
  bgGlow: string;
  btnText: string;
  btnLink: string;
}

export const bannersApi = {
  random: (count = 4) =>
    apiFetch<{ id: string; label: string | null; url: string | null }[]>(
      `/banners/random?count=${count}`
    ),
  promoSlides: () =>
    apiFetch<PromoSlide[]>(`/banners/promo-slides`),
};
```

- [ ] **Step 2: Rewrite `PromoCarouselBanner` in `apps/web/app/page.tsx`**

Find the `PromoCarouselBanner` function (currently starts around line 60). Replace the entire function (from `function PromoCarouselBanner()` to its closing `}`) with:

```typescript
function PromoCarouselBanner() {
  const [idx, setIdx] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [slides, setSlides] = useState<import('../lib/api').PromoSlide[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(true);

  useEffect(() => {
    bannersApi.promoSlides()
      .then(setSlides)
      .catch(() => {})
      .finally(() => setLoadingSlides(false));
  }, []);

  const safeIdx = slides.length > 0 ? idx % slides.length : 0;

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 20, y: -y * 20 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  if (loadingSlides) {
    return (
      <div className="w-full min-h-[60vh] lg:min-h-[65vh] bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/60 dark:border-zinc-900 animate-pulse" />
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[safeIdx];
  const displayIndex = String(slide.order + 1).padStart(2, '0');

  return (
    <section
      className="w-full min-h-[60vh] lg:min-h-[65vh] bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/60 dark:border-zinc-900 relative overflow-hidden flex flex-col justify-between py-8 lg:py-10"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Ambient Radial Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[180px] pointer-events-none transition-all duration-1000 ease-in-out opacity-25"
        style={{ backgroundColor: slide.bgGlow }}
      />

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Showcase Stage */}
      <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-12 flex-1 flex items-center relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">

          {/* Left Column */}
          <div className="lg:col-span-6 flex flex-col gap-4 items-start text-left relative">
            <div className="absolute -top-16 lg:-top-20 -left-10 text-[12rem] lg:text-[18rem] font-serif font-black select-none pointer-events-none leading-none tracking-tighter text-zinc-300/30 dark:text-zinc-800/15">
              {displayIndex}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={safeIdx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-4 items-start relative z-10"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {slide.tag}
                </span>

                <h1 className="font-sans text-[clamp(2.2rem,5vw,3.8rem)] font-black leading-[0.9] tracking-tighter text-zinc-950 dark:text-white uppercase">
                  {slide.titleLine1} <br />
                  {slide.titleLine2}{" "}
                  <span className={`font-serif italic font-light lowercase tracking-normal bg-clip-text text-transparent bg-gradient-to-r ${slide.themeColor}`}>
                    {slide.titleItalic}
                  </span>
                </h1>

                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <a
                    href={slide.btnLink}
                    className="group relative inline-flex h-12 pl-6 pr-10 items-center justify-center bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold text-xs overflow-hidden transition-all hover:bg-zinc-900 dark:hover:bg-zinc-50 shadow-md hover:shadow-lg active:scale-97 cursor-pointer"
                  >
                    <span className="relative z-10">{slide.btnText}</span>
                    <ArrowRight className="absolute right-4.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    <div className="absolute inset-0 bg-white/10 dark:bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform" />
                  </a>
                  <a
                    href="/how-it-works"
                    className="inline-flex h-12 px-5 items-center justify-center rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 transition-colors font-bold text-xs"
                  >
                    How it Works
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: 3D Card */}
          <div className="lg:col-span-6 flex justify-center items-center relative min-h-[300px] lg:min-h-[400px]">
            <div className={`absolute w-72 h-72 rounded-full blur-[80px] bg-gradient-to-tr ${slide.themeColor} opacity-20`} />

            <AnimatePresence mode="wait">
              <motion.div
                key={safeIdx}
                initial={{ opacity: 0, scale: 0.96, rotateY: 10 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.96, rotateY: -10 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] lg:w-[380px] lg:h-[380px] rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/85 dark:border-zinc-800/85 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] flex items-center justify-center p-6 group duration-200 ease-out cursor-grab active:cursor-grabbing"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`
                }}
              >
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-white/0 via-white/5 to-white/10 dark:from-white/0 dark:via-white/2 dark:to-white/5 pointer-events-none" />
                <div className="absolute bottom-6 w-[80%] h-4 bg-black/5 dark:bg-black/20 blur-lg rounded-full scale-y-20 transition-transform duration-700 group-hover:scale-95 [transform:translateZ(10px)]" />

                {slide.imgUrl && (
                  <motion.img
                    src={slide.imgUrl}
                    alt={slide.tabTitle}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="max-h-[85%] max-w-[85%] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)] mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-103 [transform:translateZ(40px)] pointer-events-none select-none"
                  />
                )}

                <div className="absolute -top-2.5 -right-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl px-3 py-1.5 text-[9px] font-black shadow-md [transform:translateZ(60px)] select-none pointer-events-none border border-zinc-900 dark:border-zinc-100">
                  {slide.badgeA}
                </div>
                <div className="absolute -bottom-2.5 -left-2.5 bg-emerald-500 text-white rounded-xl px-3 py-1.5 text-[9px] font-black shadow-md [transform:translateZ(60px)] select-none pointer-events-none">
                  {slide.badgeB}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Bottom Navigation Dock */}
      <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-12 mt-6 relative z-20">
        <div className="flex justify-center">
          <div className="flex items-center gap-1 p-1.5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg overflow-x-auto scrollbar-hide max-w-full">
            {slides.map((s, i) => {
              const isActive = safeIdx === i;
              return (
                <button
                  key={s.id}
                  onClick={() => setIdx(i)}
                  className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-2xl transition-all duration-350 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md font-bold"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 font-semibold"
                  }`}
                >
                  <span className={`text-[9px] font-black tracking-wider ${isActive ? "opacity-60" : "text-zinc-400"}`}>
                    {String(s.order + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs tracking-tight">{s.tabTitle}</span>

                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full overflow-hidden bg-white/20 dark:bg-black/10">
                      <motion.div
                        key={safeIdx}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        className="h-full bg-white dark:bg-zinc-950"
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Remove the now-unused `SLIDE_META` constant and `slideImgs` state from `apps/web/app/page.tsx`**

Delete the `const SLIDE_META = [...]` array (lines 77–138) and the `const slides = SLIDE_META.map(...)` line (line 141) and the `slideImgs` state/fetch useEffect — these are now fully replaced by the API fetch inside `PromoCarouselBanner`.

---

## Self-Review

**Spec coverage check:**
- ✅ Schema extended with all 10 new columns (Task 1)
- ✅ All 8 PromoSlide endpoints implemented (Tasks 2–3)
- ✅ 2 new Banner endpoints (upload + delete) (Tasks 2–3)
- ✅ Admin API client types + functions (Task 4)
- ✅ Sidebar updated (Task 5)
- ✅ Hub page at `/admin/banners` (Task 6)
- ✅ Banner images sub-page (Task 7)
- ✅ Promo banners sub-page with full CRUD + drag reorder (Task 8)
- ✅ Frontend `PromoCarouselBanner` rewritten (Task 9)
- ✅ `GET /banners/promo-slides` extended to return all new fields (Task 2)
- ✅ Image upload (file) + URL paste both supported (Tasks 2, 8)
- ✅ Theme presets with auto-populated `bgGlow` (Tasks 4, 8)
- ✅ Drag-to-reorder with immediate save (Task 8)
- ✅ Active/inactive toggle on slides and banners (Tasks 2, 7, 8)
- ✅ Loading skeleton + empty state on homepage (Task 9)

**Type consistency check:**
- `serializeSlide` in service returns `specs: string[]` — matches `PromoSlideItem.specs: string[]` in admin API client ✅
- `formToPayload` sends `specs: string[]` — service `createPromoSlide`/`updatePromoSlide` receive `specs?: string[]` ✅
- `THEME_PRESETS` exported from `apps/admin/lib/api.ts`, imported in `promo-banners/page.tsx` ✅
- `displayIndex` in homepage uses `slide.order + 1` — matches admin list which shows same ✅
- `promoSlidesApi.list()` calls `GET /banners/promo-slides/all` (admin, all slides) ✅
- `bannersApi.promoSlides()` calls `GET /banners/promo-slides` (public, active only) ✅

**No placeholder scan:** All steps contain complete code. No TBD, TODO, or "similar to" references. ✅
