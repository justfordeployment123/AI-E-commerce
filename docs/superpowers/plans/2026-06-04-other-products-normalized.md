# Other Products Normalized Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple "other/sub" products (accessories, cables, RAM, games, etc.) from DeviceCatalog by introducing two new lightweight normalized tables (`OtherBrand`, `OtherSubcategory`) and updating the product creation flow end-to-end.

**Architecture:** `Product.catalogId` becomes nullable. A product is either a *main* product (`catalogId` set) or an *other* product (`otherBrandId` + `otherSubcategoryId` set). A new NestJS module `other-catalog` exposes CRUD for both new tables. The admin UI's "Other Products" add modal gets brand + subcategory pickers with inline "Add new" creation instead of the Device Catalog picker.

**Tech Stack:** NestJS + Prisma (PostgreSQL), Next.js 14 admin, class-validator DTOs, Framer Motion UI.

---

## File Map

### Create
- `apps/api/src/modules/other-catalog/other-catalog.module.ts`
- `apps/api/src/modules/other-catalog/other-catalog.controller.ts`
- `apps/api/src/modules/other-catalog/other-catalog.service.ts`
- `apps/api/src/modules/other-catalog/dto/create-other-brand.dto.ts`
- `apps/api/src/modules/other-catalog/dto/create-other-subcategory.dto.ts`

### Modify
- `apps/api/prisma/schema.prisma` — add 2 new models, make `catalogId` nullable on Product, add 2 FK columns
- `apps/api/src/app.module.ts` — register OtherCatalogModule
- `apps/api/src/modules/products/dto/create-product.dto.ts` — make catalogId optional, add otherBrandId/otherSubcategoryId
- `apps/api/src/modules/products/dto/update-product.dto.ts` — same
- `apps/api/src/modules/products/products.service.ts` — handle both product tracks in create/findAll/presignAndFlatten
- `apps/admin/lib/api.ts` — add OtherBrand/OtherSubcategory types + API objects, update Product/CreateProductPayload types
- `apps/admin/app/products/others/page.tsx` — replace Device Catalog picker with brand+subcategory pickers
- `apps/admin/app/catalog/others/page.tsx` — replace with redirect to /products/others

---

## Task 1: Update Prisma Schema

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Add OtherBrand and OtherSubcategory models, update Product**

Replace the Product model and add two new models. Open `apps/api/prisma/schema.prisma`.

Add after the existing `model DeviceCatalog { ... }` block (around line 302):

```prisma
model OtherBrand {
  id        String    @id @default(uuid())
  name      String    @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  products  Product[]

  @@map("other_brands")
}

model OtherSubcategory {
  id        String    @id @default(uuid())
  name      String    @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  products  Product[]

  @@map("other_subcategories")
}
```

Replace the existing Product model (lines 77–104) with:

```prisma
model Product {
  id                 String            @id @default(uuid())

  catalogId          String?
  catalog            DeviceCatalog?    @relation(fields: [catalogId], references: [id])

  otherBrandId       String?
  otherBrand         OtherBrand?       @relation(fields: [otherBrandId], references: [id])

  otherSubcategoryId String?
  otherSubcategory   OtherSubcategory? @relation(fields: [otherSubcategoryId], references: [id])

  name         String
  slug         String    @unique
  condition    String
  storage      String    @default("")
  price        Float
  comparePrice Float?
  stock        Int       @default(0)
  images       String[]
  specs        Json      @default("{}")
  description  String?
  rating       Float     @default(0)
  reviewCount  Int       @default(0)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  orderItems OrderItem[]
  reviews    Review[]

  @@index([catalogId])
  @@index([otherBrandId])
  @@index([otherSubcategoryId])
  @@index([condition])
  @@index([isActive, createdAt])
  @@map("products")
}
```

- [ ] **Step 2: Generate and run migration**

```bash
cd apps/api
npx prisma migrate dev --name add_other_brand_subcategory
```

Expected output: Migration created and applied. Prisma Client regenerated.

- [ ] **Step 3: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(schema): add OtherBrand/OtherSubcategory tables, make catalogId nullable on Product"
```

---

## Task 2: Create the `other-catalog` NestJS Module

**Files:**
- Create: `apps/api/src/modules/other-catalog/dto/create-other-brand.dto.ts`
- Create: `apps/api/src/modules/other-catalog/dto/create-other-subcategory.dto.ts`
- Create: `apps/api/src/modules/other-catalog/other-catalog.service.ts`
- Create: `apps/api/src/modules/other-catalog/other-catalog.controller.ts`
- Create: `apps/api/src/modules/other-catalog/other-catalog.module.ts`

- [ ] **Step 1: Create DTOs**

`apps/api/src/modules/other-catalog/dto/create-other-brand.dto.ts`:
```typescript
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOtherBrandDto {
    @IsString()
    @IsNotEmpty()
    name!: string;
}
```

`apps/api/src/modules/other-catalog/dto/create-other-subcategory.dto.ts`:
```typescript
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOtherSubcategoryDto {
    @IsString()
    @IsNotEmpty()
    name!: string;
}
```

- [ ] **Step 2: Create the service**

`apps/api/src/modules/other-catalog/other-catalog.service.ts`:
```typescript
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOtherBrandDto } from './dto/create-other-brand.dto';
import { CreateOtherSubcategoryDto } from './dto/create-other-subcategory.dto';

@Injectable()
export class OtherCatalogService {
    constructor(private readonly prisma: PrismaService) {}

    // ─── OtherBrand ─────────────────────────────────────────────────────────────

    listBrands() {
        return this.prisma.otherBrand.findMany({ orderBy: { name: 'asc' } });
    }

    createBrand(dto: CreateOtherBrandDto) {
        return this.prisma.otherBrand.create({ data: { name: dto.name.trim() } });
    }

    updateBrand(id: string, dto: Partial<CreateOtherBrandDto>) {
        return this.prisma.otherBrand.update({ where: { id }, data: { name: dto.name?.trim() } });
    }

    async deleteBrand(id: string) {
        const count = await this.prisma.product.count({ where: { otherBrandId: id } });
        if (count > 0) throw new BadRequestException(`Cannot delete: ${count} product(s) use this brand`);
        await this.prisma.otherBrand.delete({ where: { id } });
        return { message: 'Deleted' };
    }

    // ─── OtherSubcategory ────────────────────────────────────────────────────────

    listSubcategories() {
        return this.prisma.otherSubcategory.findMany({ orderBy: { name: 'asc' } });
    }

    createSubcategory(dto: CreateOtherSubcategoryDto) {
        return this.prisma.otherSubcategory.create({ data: { name: dto.name.trim() } });
    }

    updateSubcategory(id: string, dto: Partial<CreateOtherSubcategoryDto>) {
        return this.prisma.otherSubcategory.update({ where: { id }, data: { name: dto.name?.trim() } });
    }

    async deleteSubcategory(id: string) {
        const count = await this.prisma.product.count({ where: { otherSubcategoryId: id } });
        if (count > 0) throw new BadRequestException(`Cannot delete: ${count} product(s) use this subcategory`);
        await this.prisma.otherSubcategory.delete({ where: { id } });
        return { message: 'Deleted' };
    }
}
```

- [ ] **Step 3: Create the controller**

`apps/api/src/modules/other-catalog/other-catalog.controller.ts`:
```typescript
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { OtherCatalogService } from './other-catalog.service';
import { CreateOtherBrandDto } from './dto/create-other-brand.dto';
import { CreateOtherSubcategoryDto } from './dto/create-other-subcategory.dto';

@Controller('other-brands')
export class OtherBrandsController {
    constructor(private readonly svc: OtherCatalogService) {}

    @Get()
    list() { return this.svc.listBrands(); }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    create(@Body() dto: CreateOtherBrandDto) { return this.svc.createBrand(dto); }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: Partial<CreateOtherBrandDto>) { return this.svc.updateBrand(id, dto); }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) { return this.svc.deleteBrand(id); }
}

@Controller('other-subcategories')
export class OtherSubcategoriesController {
    constructor(private readonly svc: OtherCatalogService) {}

    @Get()
    list() { return this.svc.listSubcategories(); }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    create(@Body() dto: CreateOtherSubcategoryDto) { return this.svc.createSubcategory(dto); }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: Partial<CreateOtherSubcategoryDto>) { return this.svc.updateSubcategory(id, dto); }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) { return this.svc.deleteSubcategory(id); }
}
```

- [ ] **Step 4: Create the module**

`apps/api/src/modules/other-catalog/other-catalog.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { OtherBrandsController, OtherSubcategoriesController } from './other-catalog.controller';
import { OtherCatalogService } from './other-catalog.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [OtherBrandsController, OtherSubcategoriesController],
    providers: [OtherCatalogService],
    exports: [OtherCatalogService],
})
export class OtherCatalogModule {}
```

- [ ] **Step 5: Register in AppModule**

In `apps/api/src/app.module.ts`, add the import at the top:
```typescript
import { OtherCatalogModule } from './modules/other-catalog/other-catalog.module';
```

Add `OtherCatalogModule` to the `imports` array (e.g. after `CatalogModule`):
```typescript
CatalogModule,
OtherCatalogModule,
BannersModule,
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/other-catalog/ apps/api/src/app.module.ts
git commit -m "feat(api): add other-catalog module with OtherBrand and OtherSubcategory CRUD"
```

---

## Task 3: Update ProductsService and DTOs

**Files:**
- Modify: `apps/api/src/modules/products/dto/create-product.dto.ts`
- Modify: `apps/api/src/modules/products/dto/update-product.dto.ts`
- Modify: `apps/api/src/modules/products/products.service.ts`

- [ ] **Step 1: Update CreateProductDto**

Replace `apps/api/src/modules/products/dto/create-product.dto.ts` with:

```typescript
import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsPositive,
    IsString,
    Min,
    ValidateIf,
} from 'class-validator';

export class CreateProductDto {
    // ── Main product track ──────────────────────────────────────────────────────
    @IsString()
    @IsOptional()
    catalogId?: string;

    // ── Other product track ─────────────────────────────────────────────────────
    @IsString()
    @IsOptional()
    otherBrandId?: string;

    @IsString()
    @IsOptional()
    otherSubcategoryId?: string;

    // ── Shared fields ───────────────────────────────────────────────────────────
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    condition!: string;

    @IsString()
    @IsOptional()
    storage?: string;

    @IsNumber()
    @IsPositive()
    price!: number;

    @IsNumber()
    @IsOptional()
    comparePrice?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    stock?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsObject()
    @IsOptional()
    specs?: Record<string, unknown>;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
```

- [ ] **Step 2: Update UpdateProductDto**

Replace `apps/api/src/modules/products/dto/update-product.dto.ts` with:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

(If the file already uses PartialType, just verify it — no change needed. If it has manual fields, replace with the above.)

- [ ] **Step 3: Update ProductsService**

Replace `apps/api/src/modules/products/products.service.ts` with the full updated file:

```typescript
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

const CATALOG_INCLUDE = {
    catalog: {
        include: {
            brandCategory: {
                include: { brand: true, category: true },
            },
        },
    },
    otherBrand: true,
    otherSubcategory: true,
} as const;

@Injectable()
export class ProductsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    private async presignAndFlatten(product: any) {
        const images = await Promise.all(
            (product.images as string[]).map((img: string) => this.storage.resolveImageUrl(img)),
        );
        const { catalog, otherBrand, otherSubcategory, ...rest } = product;

        const brand    = catalog?.brandCategory?.brand?.name    ?? otherBrand?.name        ?? '';
        const model    = catalog?.model                          ?? '';
        const category = catalog?.brandCategory?.category?.name ?? otherSubcategory?.name  ?? '';

        return {
            ...rest,
            images: images.filter(Boolean) as string[],
            brand,
            model,
            category,
        };
    }

    async create(dto: CreateProductDto) {
        // Validate: must be exactly one track
        const isMain  = !!dto.catalogId;
        const isOther = !!dto.otherBrandId && !!dto.otherSubcategoryId;
        if (!isMain && !isOther) {
            throw new BadRequestException('Provide either catalogId (main product) or otherBrandId + otherSubcategoryId (other product)');
        }
        if (isMain && isOther) {
            throw new BadRequestException('Cannot set both catalogId and otherBrandId/otherSubcategoryId');
        }

        let slug: string;

        if (isMain) {
            const catalog = await this.prisma.deviceCatalog.findUnique({
                where: { id: dto.catalogId },
                include: { brandCategory: { include: { brand: true } } },
            });
            if (!catalog) throw new NotFoundException('Device catalog entry not found');

            const brandName = catalog.brandCategory.brand.name;
            const storage   = dto.storage ?? '';
            const baseSlug  = slugify(`${brandName}-${catalog.model}-${dto.condition}${storage ? `-${storage}` : ''}`);
            slug = baseSlug;
            let counter = 1;
            while (await this.prisma.product.findUnique({ where: { slug } })) {
                slug = `${baseSlug}-${counter++}`;
            }

            if (storage && !(catalog.storageOptions as string[]).includes(storage)) {
                await this.prisma.deviceCatalog.update({
                    where: { id: dto.catalogId },
                    data: { storageOptions: { push: storage } },
                });
            }
        } else {
            const [brand, subcat] = await Promise.all([
                this.prisma.otherBrand.findUnique({ where: { id: dto.otherBrandId } }),
                this.prisma.otherSubcategory.findUnique({ where: { id: dto.otherSubcategoryId } }),
            ]);
            if (!brand)  throw new NotFoundException('OtherBrand not found');
            if (!subcat) throw new NotFoundException('OtherSubcategory not found');

            const baseSlug = slugify(`${brand.name}-${dto.name}-${dto.condition}`);
            slug = baseSlug;
            let counter = 1;
            while (await this.prisma.product.findUnique({ where: { slug } })) {
                slug = `${baseSlug}-${counter++}`;
            }
        }

        const { catalogId, otherBrandId, otherSubcategoryId, storage: _s, ...rest } = dto;
        const product = await this.prisma.product.create({
            data: {
                ...rest,
                catalogId:          isMain  ? catalogId          : null,
                otherBrandId:       isOther ? otherBrandId       : null,
                otherSubcategoryId: isOther ? otherSubcategoryId : null,
                storage: dto.storage ?? '',
                slug,
                images: dto.images ?? [],
                specs:  (dto.specs ?? {}) as never,
            },
            include: CATALOG_INCLUDE,
        });
        return this.presignAndFlatten(product);
    }

    async findAll(query: {
        category?: string;
        brand?: string;
        condition?: string;
        minPrice?: number;
        maxPrice?: number;
        search?: string;
        page?: number;
        limit?: number;
        includeInactive?: boolean;
    }) {
        const { category, brand, condition, minPrice, maxPrice, search, page = 1, limit = 20, includeInactive } = query;
        const safeLimit = Math.min(limit, 200);
        const skip = (page - 1) * safeLimit;

        const where: Record<string, unknown> = {};
        if (!includeInactive) where.isActive = true;
        if (condition) where.condition = condition;
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = { gte: minPrice, lte: maxPrice };
        }

        const filterClauses: Record<string, unknown>[] = [];

        // Main product track filters
        const catalogWhere: Record<string, unknown> = {};
        const brandCategoryWhere: Record<string, unknown> = {};
        if (category) brandCategoryWhere.category = { name: { equals: category, mode: 'insensitive' } };
        if (brand)    brandCategoryWhere.brand     = { name: { equals: brand,    mode: 'insensitive' } };
        if (Object.keys(brandCategoryWhere).length > 0) catalogWhere.brandCategory = brandCategoryWhere;
        if (Object.keys(catalogWhere).length > 0) {
            filterClauses.push({ catalog: { is: catalogWhere } });
        }

        // Other product track filters
        if (category || brand) {
            const otherClause: Record<string, unknown> = { catalogId: null };
            if (category) otherClause.otherSubcategory = { name: { equals: category, mode: 'insensitive' } };
            if (brand)    otherClause.otherBrand        = { name: { equals: brand,    mode: 'insensitive' } };
            filterClauses.push(otherClause);
        }

        if (filterClauses.length > 0) {
            where.OR = filterClauses;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { catalog: { is: { model: { contains: search, mode: 'insensitive' } } } },
                { catalog: { is: { brandCategory: { is: { brand: { is: { name: { contains: search, mode: 'insensitive' } } } } } } } },
                { otherBrand: { name: { contains: search, mode: 'insensitive' } } },
                { otherSubcategory: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [rawItems, total] = await Promise.all([
            this.prisma.product.findMany({ where, skip, take: safeLimit, orderBy: { createdAt: 'desc' }, include: CATALOG_INCLUDE }),
            this.prisma.product.count({ where }),
        ]);

        const items = await Promise.all(rawItems.map(p => this.presignAndFlatten(p)));
        return { items, total, page, limit: safeLimit, pages: Math.ceil(total / safeLimit) };
    }

    async getBrands(category?: string) {
        const bcWhere: Record<string, unknown> = { isActive: true };
        if (category) bcWhere.category = { name: { equals: category, mode: 'insensitive' } };

        const brandCategories = await this.prisma.brandCategory.findMany({
            where: bcWhere,
            include: { brand: true },
            distinct: ['brandId'],
            orderBy: { brand: { name: 'asc' } },
        });

        const result: { brand: string; slug: string; logo: string | null; image: string | null }[] = [];
        for (const bc of brandCategories) {
            const logo = bc.brand.logo
                ? await this.storage.resolveImageUrl(bc.brand.logo)
                : null;
            const bcImages = bc.images as string[];
            let image: string | null = null;
            if (bcImages.length > 0) {
                image = await this.storage.resolveImageUrl(bcImages[0]);
            } else {
                const product = await this.prisma.product.findFirst({
                    where: { catalog: { is: { brandCategory: { is: { id: bc.id } } } }, isActive: true },
                    select: { images: true },
                });
                const imgs = product?.images as string[] | null;
                image = imgs?.[0] ? await this.storage.resolveImageUrl(imgs[0]) : null;
            }
            result.push({ brand: bc.brand.name, slug: bc.brand.slug, logo, image });
        }
        return result;
    }

    async findBySlug(slug: string) {
        const product = await this.prisma.product.findUnique({ where: { slug }, include: CATALOG_INCLUDE });
        if (!product) throw new NotFoundException('Product not found');
        return this.presignAndFlatten(product);
    }

    async findById(id: string) {
        const product = await this.prisma.product.findUnique({ where: { id }, include: CATALOG_INCLUDE });
        if (!product) throw new NotFoundException('Product not found');
        const presigned = await this.presignAndFlatten(product);
        return { ...presigned, rawImages: product.images as string[] };
    }

    async update(id: string, dto: UpdateProductDto) {
        await this.prisma.product.findUniqueOrThrow({ where: { id } });
        return this.prisma.product.update({ where: { id }, data: dto as never });
    }

    async remove(id: string) {
        if (id === 'all') {
            const products = await this.prisma.product.findMany({ select: { images: true } });
            const imageKeys = products.flatMap(p => p.images as string[]).filter(Boolean);
            await this.prisma.orderItem.deleteMany({});
            await this.prisma.product.deleteMany({});
            await this.storage.deleteFiles(imageKeys);
            return { message: 'All products deleted' };
        }
        const product = await this.prisma.product.findUniqueOrThrow({ where: { id } });
        const imageKeys = (product.images as string[]).filter(Boolean);
        await this.prisma.product.delete({ where: { id } });
        await this.storage.deleteFiles(imageKeys);
        return { message: 'Product deleted' };
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/products/
git commit -m "feat(products): support other-product track (otherBrandId + otherSubcategoryId)"
```

---

## Task 4: Update Admin API Types and API Object

**Files:**
- Modify: `apps/admin/lib/api.ts`

- [ ] **Step 1: Add OtherBrand and OtherSubcategory interfaces and API objects**

After the `catalogBrandCategoryApi` block (around line 135), add:

```typescript
// ── Other Catalog (OtherBrand + OtherSubcategory) ─────────────────────────────
export interface OtherBrand {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface OtherSubcategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const otherBrandsApi = {
  list: () => apiFetch<OtherBrand[]>('/other-brands'),
  create: (name: string) =>
    apiFetch<OtherBrand>('/other-brands', { method: 'POST', body: JSON.stringify({ name }) }),
  update: (id: string, name: string) =>
    apiFetch<OtherBrand>(`/other-brands/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  remove: (id: string) => apiFetch<void>(`/other-brands/${id}`, { method: 'DELETE' }),
};

export const otherSubcategoriesApi = {
  list: () => apiFetch<OtherSubcategory[]>('/other-subcategories'),
  create: (name: string) =>
    apiFetch<OtherSubcategory>('/other-subcategories', { method: 'POST', body: JSON.stringify({ name }) }),
  update: (id: string, name: string) =>
    apiFetch<OtherSubcategory>(`/other-subcategories/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  remove: (id: string) => apiFetch<void>(`/other-subcategories/${id}`, { method: 'DELETE' }),
};
```

- [ ] **Step 2: Update Product and CreateProductPayload interfaces**

Find the `Product` interface (around line 370) and make `catalogId` optional, add other-track fields:

```typescript
export interface Product {
  id: string;
  catalogId?: string;           // optional — null for other products
  otherBrandId?: string;
  otherSubcategoryId?: string;
  name: string;
  slug: string;
  brand: string;                // flattened from either track
  model: string;                // empty string for other products
  category: string;             // flattened from either track
  condition: string;
  storage: string;
  price: number;
  comparePrice?: number;
  stock: number;
  images: string[];
  rawImages?: string[];
  specs: Record<string, unknown>;
  description?: string;
  isActive: boolean;
  createdAt: string;
}
```

Find the `CreateProductPayload` interface (around line 392) and replace with:

```typescript
export interface CreateProductPayload {
  // Main product track
  catalogId?: string;
  // Other product track
  otherBrandId?: string;
  otherSubcategoryId?: string;
  // Shared
  name: string;
  condition: string;
  storage?: string;
  price: number;
  comparePrice?: number;
  stock?: number;
  images?: string[];
  specs?: Record<string, unknown>;
  description?: string;
  isActive?: boolean;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/lib/api.ts
git commit -m "feat(admin-api): add OtherBrand/OtherSubcategory types and API objects, update Product types"
```

---

## Task 5: Rewrite the `/products/others` Add Modal

**Files:**
- Modify: `apps/admin/app/products/others/page.tsx`

- [ ] **Step 1: Replace the page with the updated version**

Replace the entire file `apps/admin/app/products/others/page.tsx` with:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Edit2, Trash2, X, Check, Package,
  Image as ImageIcon, ChevronDown, AlertTriangle,
} from "lucide-react";
import {
  productsApi, otherBrandsApi, otherSubcategoriesApi,
  type Product, type CreateProductPayload, type OtherBrand, type OtherSubcategory,
} from "../../../lib/api";

const CONDITIONS = ["Pristine", "Excellent", "Very Good", "Good", "Fair"];

const EMPTY_FORM: CreateProductPayload = {
  otherBrandId: "",
  otherSubcategoryId: "",
  name: "",
  condition: "Pristine",
  storage: "",
  price: 0,
  comparePrice: undefined,
  stock: 10,
  description: "",
  isActive: true,
};

export default function OtherProductsPage() {
  const router = useRouter();
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [formData, setFormData]   = useState<CreateProductPayload>(EMPTY_FORM);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  // Pickers state
  const [brands, setBrands]           = useState<OtherBrand[]>([]);
  const [subcats, setSubcats]         = useState<OtherSubcategory[]>([]);

  // Brand picker
  const [brandOpen, setBrandOpen]     = useState(false);
  const [newBrandInput, setNewBrandInput] = useState("");
  const [addingBrand, setAddingBrand] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const brandRef = useRef<HTMLDivElement>(null);

  // Subcategory picker
  const [subcatOpen, setSubcatOpen]   = useState(false);
  const [newSubcatInput, setNewSubcatInput] = useState("");
  const [addingSubcat, setAddingSubcat] = useState(false);
  const [savingSubcat, setSavingSubcat] = useState(false);
  const subcatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) setBrandOpen(false);
      if (subcatRef.current && !subcatRef.current.contains(e.target as Node)) setSubcatOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await productsApi.list({ limit: 500 });
      setProducts(res.items.filter(p => !p.catalogId));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function loadPickerData() {
    const [b, s] = await Promise.all([
      otherBrandsApi.list().catch(() => [] as OtherBrand[]),
      otherSubcategoriesApi.list().catch(() => [] as OtherSubcategory[]),
    ]);
    setBrands(b);
    setSubcats(s);
  }

  const tabs = ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort()];
  const countFor = (cat: string) => products.filter(p => cat === "All" || p.category.toLowerCase() === cat.toLowerCase()).length;

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "All" || p.category.toLowerCase() === filterCat.toLowerCase();
    return matchSearch && matchCat;
  });

  function openAdd() {
    setEditProduct(null);
    setFormData(EMPTY_FORM);
    setError("");
    setAddingBrand(false);
    setAddingSubcat(false);
    setNewBrandInput("");
    setNewSubcatInput("");
    setShowModal(true);
    loadPickerData();
  }

  function openEdit(p: Product, e: React.MouseEvent) {
    e.stopPropagation();
    setEditProduct(p);
    setFormData({
      otherBrandId: p.otherBrandId ?? "",
      otherSubcategoryId: p.otherSubcategoryId ?? "",
      name: p.name,
      condition: p.condition,
      storage: p.storage,
      price: p.price,
      comparePrice: p.comparePrice,
      stock: p.stock,
      description: p.description ?? "",
      isActive: p.isActive,
      specs: p.specs,
    });
    setError("");
    setShowModal(true);
    loadPickerData();
  }

  async function handleAddBrand() {
    if (!newBrandInput.trim()) return;
    setSavingBrand(true);
    try {
      const created = await otherBrandsApi.create(newBrandInput.trim());
      setBrands(bs => [...bs, created].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(f => ({ ...f, otherBrandId: created.id }));
      setNewBrandInput("");
      setAddingBrand(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create brand");
    } finally {
      setSavingBrand(false);
    }
  }

  async function handleAddSubcat() {
    if (!newSubcatInput.trim()) return;
    setSavingSubcat(true);
    try {
      const created = await otherSubcategoriesApi.create(newSubcatInput.trim());
      setSubcats(ss => [...ss, created].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(f => ({ ...f, otherSubcategoryId: created.id }));
      setNewSubcatInput("");
      setAddingSubcat(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create subcategory");
    } finally {
      setSavingSubcat(false);
    }
  }

  async function saveProduct() {
    setSaving(true);
    setError("");
    try {
      if (editProduct) {
        const updated = await productsApi.update(editProduct.id, formData);
        setProducts(ps => ps.map(p => p.id === editProduct.id ? updated : p));
      } else {
        const created = await productsApi.create(formData);
        if (!created.catalogId) setProducts(ps => [created, ...ps]);
      }
      setShowModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    try {
      await productsApi.remove(id);
      setProducts(ps => ps.filter(p => p.id !== id));
    } catch { /* ignore */ }
    setDeleteId(null);
  }

  const selectedBrand  = brands.find(b => b.id === formData.otherBrandId);
  const selectedSubcat = subcats.find(s => s.id === formData.otherSubcategoryId);
  const canSave = editProduct
    ? true
    : !!formData.otherBrandId && !!formData.otherSubcategoryId && !!formData.name && formData.price > 0;

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/products" className="text-xs text-zinc-400 hover:text-black flex items-center gap-1 font-bold">Products</Link>
            <span className="text-zinc-300">/</span>
            <span className="text-xs text-zinc-600 font-bold">Others</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Other Products</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Accessories, games, films, cables &amp; more · {products.length} total · {products.filter(p => p.isActive).length} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/products"
            className="flex items-center gap-2 h-11 px-4 border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-600 hover:border-zinc-400 hover:text-black transition-colors bg-white">
            Back to Products
          </Link>
          <button onClick={openAdd}
            className="flex items-center gap-2 h-11 px-5 bg-black text-white rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-colors">
            <Plus className="h-4 w-4" /> Add product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute inset-y-0 left-4 my-auto h-4 w-4 text-zinc-400 pointer-events-none" />
          <input type="text" placeholder="Search by name or brand..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 rounded-2xl bg-white border border-zinc-200 pl-11 pr-5 text-sm font-medium outline-none focus:border-black transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`h-11 px-4 rounded-2xl text-sm font-bold transition-all capitalize ${filterCat === cat ? "bg-black text-white" : "bg-white border border-zinc-200 hover:border-zinc-400"}`}>
              {cat} ({countFor(cat)})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Product</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Category</th>
                <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Price</th>
                <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Stock</th>
                <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map(p => (
                <tr key={p.id} onClick={() => router.push(`/products/${p.id}`)}
                  className="hover:bg-zinc-50/50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-xl object-cover border border-zinc-100 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                          <ImageIcon className="h-4 w-4 text-zinc-300" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-zinc-500 font-medium capitalize">{p.category}</td>
                  <td className="px-4 py-4 text-right font-bold font-mono">
                    £{p.price}
                    {p.comparePrice && <span className="text-zinc-300 line-through ml-2 text-xs">£{p.comparePrice}</span>}
                  </td>
                  <td className={`px-4 py-4 text-right font-bold font-mono ${p.stock === 0 ? "text-red-500" : p.stock <= 2 ? "text-amber-500" : ""}`}>
                    {p.stock}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {p.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={e => openEdit(p, e)} className="h-8 w-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition-colors">
                        <Edit2 className="h-3.5 w-3.5 text-zinc-400" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeleteId(p.id); }} className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors">
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-zinc-400">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">No other products yet</p>
            <p className="text-xs mt-1">Click "Add product" to add your first one.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-4xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editProduct ? "Edit product" : "Add other product"}</h2>
                <button onClick={() => setShowModal(false)} className="h-9 w-9 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Subcategory picker */}
                <div className="flex flex-col gap-1.5" ref={subcatRef}>
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Subcategory</label>
                  <div className="relative">
                    <button type="button" onClick={() => { setSubcatOpen(o => !o); setBrandOpen(false); }}
                      className={`h-12 w-full rounded-[0.875rem] border-2 px-4 text-sm font-medium text-left flex items-center justify-between transition-colors ${subcatOpen ? "border-black" : "border-zinc-200"}`}>
                      <span className={selectedSubcat ? "text-zinc-900" : "text-zinc-400"}>
                        {selectedSubcat ? selectedSubcat.name : "Select subcategory…"}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${subcatOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {subcatOpen && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute z-20 left-0 right-0 top-[calc(100%+4px)] bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden">
                          <div className="max-h-48 overflow-y-auto">
                            {subcats.map(s => (
                              <button key={s.id} type="button"
                                onMouseDown={e => { e.preventDefault(); setFormData(f => ({ ...f, otherSubcategoryId: s.id })); setSubcatOpen(false); }}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 flex items-center justify-between border-b border-zinc-50 last:border-0 ${formData.otherSubcategoryId === s.id ? "font-bold" : ""}`}>
                                {s.name}
                                {formData.otherSubcategoryId === s.id && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                              </button>
                            ))}
                            {subcats.length === 0 && (
                              <p className="px-4 py-3 text-xs text-zinc-400">No subcategories yet.</p>
                            )}
                          </div>
                          {/* Add new inline */}
                          <div className="border-t border-zinc-100 p-3">
                            {addingSubcat ? (
                              <div className="flex gap-2">
                                <input autoFocus type="text" value={newSubcatInput}
                                  onChange={e => setNewSubcatInput(e.target.value)}
                                  onKeyDown={e => { if (e.key === "Enter") handleAddSubcat(); if (e.key === "Escape") { setAddingSubcat(false); setNewSubcatInput(""); } }}
                                  placeholder="Subcategory name…"
                                  className="flex-1 h-9 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-black transition-colors" />
                                <button onMouseDown={e => { e.preventDefault(); handleAddSubcat(); }} disabled={savingSubcat || !newSubcatInput.trim()}
                                  className="h-9 px-3 rounded-xl bg-black text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1">
                                  {savingSubcat ? <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="h-3 w-3" />}
                                  Add
                                </button>
                                <button onMouseDown={e => { e.preventDefault(); setAddingSubcat(false); setNewSubcatInput(""); }}
                                  className="h-9 w-9 rounded-xl border border-zinc-200 flex items-center justify-center">
                                  <X className="h-3.5 w-3.5 text-zinc-400" />
                                </button>
                              </div>
                            ) : (
                              <button type="button" onMouseDown={e => { e.preventDefault(); setAddingSubcat(true); }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-bold text-zinc-500 hover:text-black transition-colors">
                                <Plus className="h-3.5 w-3.5" /> Add new subcategory
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Brand picker */}
                <div className="flex flex-col gap-1.5" ref={brandRef}>
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Brand</label>
                  <div className="relative">
                    <button type="button" onClick={() => { setBrandOpen(o => !o); setSubcatOpen(false); }}
                      className={`h-12 w-full rounded-[0.875rem] border-2 px-4 text-sm font-medium text-left flex items-center justify-between transition-colors ${brandOpen ? "border-black" : "border-zinc-200"}`}>
                      <span className={selectedBrand ? "text-zinc-900" : "text-zinc-400"}>
                        {selectedBrand ? selectedBrand.name : "Select brand…"}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${brandOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {brandOpen && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute z-20 left-0 right-0 top-[calc(100%+4px)] bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden">
                          <div className="max-h-48 overflow-y-auto">
                            {brands.map(b => (
                              <button key={b.id} type="button"
                                onMouseDown={e => { e.preventDefault(); setFormData(f => ({ ...f, otherBrandId: b.id })); setBrandOpen(false); }}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 flex items-center justify-between border-b border-zinc-50 last:border-0 ${formData.otherBrandId === b.id ? "font-bold" : ""}`}>
                                {b.name}
                                {formData.otherBrandId === b.id && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                              </button>
                            ))}
                            {brands.length === 0 && (
                              <p className="px-4 py-3 text-xs text-zinc-400">No brands yet.</p>
                            )}
                          </div>
                          {/* Add new inline */}
                          <div className="border-t border-zinc-100 p-3">
                            {addingBrand ? (
                              <div className="flex gap-2">
                                <input autoFocus type="text" value={newBrandInput}
                                  onChange={e => setNewBrandInput(e.target.value)}
                                  onKeyDown={e => { if (e.key === "Enter") handleAddBrand(); if (e.key === "Escape") { setAddingBrand(false); setNewBrandInput(""); } }}
                                  placeholder="Brand name…"
                                  className="flex-1 h-9 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-black transition-colors" />
                                <button onMouseDown={e => { e.preventDefault(); handleAddBrand(); }} disabled={savingBrand || !newBrandInput.trim()}
                                  className="h-9 px-3 rounded-xl bg-black text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1">
                                  {savingBrand ? <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="h-3 w-3" />}
                                  Add
                                </button>
                                <button onMouseDown={e => { e.preventDefault(); setAddingBrand(false); setNewBrandInput(""); }}
                                  className="h-9 w-9 rounded-xl border border-zinc-200 flex items-center justify-center">
                                  <X className="h-3.5 w-3.5 text-zinc-400" />
                                </button>
                              </div>
                            ) : (
                              <button type="button" onMouseDown={e => { e.preventDefault(); setAddingBrand(true); }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-bold text-zinc-500 hover:text-black transition-colors">
                                <Plus className="h-3.5 w-3.5" /> Add new brand
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Product name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Product name</label>
                  <input type="text" placeholder="e.g. Logitech MX Master 3" value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors" />
                </div>

                {/* Price + RRP */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "price", label: "Price (£)", placeholder: "29.99" },
                    { key: "comparePrice", label: "RRP (£)", placeholder: "Optional" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</label>
                      <input type="number" placeholder={placeholder}
                        value={(formData[key as keyof CreateProductPayload] as number | undefined) ?? ""}
                        onChange={e => setFormData(f => ({ ...f, [key]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                        className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors" />
                    </div>
                  ))}
                </div>

                {/* Stock */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Stock quantity</label>
                  <input type="number" placeholder="10" value={formData.stock ?? ""}
                    onChange={e => setFormData(f => ({ ...f, stock: e.target.value === "" ? 0 : Number(e.target.value) }))}
                    className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors" />
                </div>

                {/* Condition */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Condition</label>
                  <div className="relative">
                    <select value={formData.condition} onChange={e => setFormData(f => ({ ...f, condition: e.target.value }))}
                      className="h-12 w-full rounded-[0.875rem] border-2 border-zinc-200 pl-4 pr-10 text-sm font-medium outline-none focus:border-black transition-colors bg-white appearance-none">
                      {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Description (optional)</label>
                  <input type="text" placeholder="Brief description…" value={formData.description ?? ""}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                    className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors" />
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <button onClick={() => setFormData(f => ({ ...f, isActive: !f.isActive }))}
                    className={`h-6 w-10 rounded-full transition-colors relative shrink-0 ${formData.isActive ? "bg-black" : "bg-zinc-200"}`}>
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${formData.isActive ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                  <label className="text-sm font-medium">{formData.isActive ? "Active (visible on site)" : "Hidden"}</label>
                </div>

                {error && <p className="text-sm font-bold text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowModal(false)} className="flex-1 h-12 rounded-2xl border-2 border-zinc-200 font-bold text-sm hover:bg-zinc-50 transition-colors">
                  Cancel
                </button>
                <button onClick={saveProduct} disabled={saving || !canSave}
                  className="flex-1 h-12 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
                  {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
                  {editProduct ? "Save changes" : "Add product"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-sm shadow-2xl text-center">
              <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Delete this product?</h3>
              <p className="text-sm text-zinc-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 h-12 rounded-2xl border-2 border-zinc-200 font-bold text-sm">Cancel</button>
                <button onClick={() => deleteProduct(deleteId)} className="flex-1 h-12 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/app/products/others/page.tsx
git commit -m "feat(admin): replace Device Catalog picker with OtherBrand/OtherSubcategory pickers in other products page"
```

---

## Task 6: Replace catalog/others with a Redirect

**Files:**
- Modify: `apps/admin/app/catalog/others/page.tsx`

- [ ] **Step 1: Replace the page with a redirect**

Replace the entire contents of `apps/admin/app/catalog/others/page.tsx` with:

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CatalogOthersRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/products/others"); }, [router]);
  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/app/catalog/others/page.tsx
git commit -m "feat(admin): redirect catalog/others to products/others"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Start the API and verify new endpoints respond**

```bash
npm run api:dev
```

Test:
```
GET  http://localhost:3002/other-brands         → []
GET  http://localhost:3002/other-subcategories  → []
```

- [ ] **Step 2: Verify admin builds without TypeScript errors**

```bash
npm run --workspace @ai-ecommerce/admin build
```

Expected: Build succeeds, no TypeScript errors.

- [ ] **Step 3: Verify existing main products still load**

```
GET http://localhost:3002/products?limit=5
```

Expected: Items still contain `brand`, `model`, `category` flattened from DeviceCatalog.

- [ ] **Step 4: Final commit if any lint fixes needed**

```bash
git add -A
git commit -m "chore: fix any remaining type/lint issues after other-products normalization"
```
