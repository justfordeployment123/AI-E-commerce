import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getRecentReviews(limit = 8) {
    const reviews = await this.prisma.review.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { name: true } },
        product: { select: { name: true, slug: true, condition: true, images: true, catalog: { include: { brandCategory: { include: { category: true } } } } } },
      },
    });
    return Promise.all(reviews.map(r => this.resolveImages(r)));
  }

  async getProductReviews(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, isApproved: true },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });
    return Promise.all(reviews.map(r => this.resolveImages(r)));
  }

  async createReview(
    productId: string,
    data: { userId?: string; guestName?: string; rating: number; body: string; images?: string[] },
  ) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.review.create({
      data: {
        productId,
        userId: data.userId ?? null,
        guestName: data.guestName ?? null,
        rating: Math.min(5, Math.max(1, data.rating)),
        body: data.body,
        images: data.images ?? [],
      },
    });
  }

  async getAllReviews(filter?: 'pending' | 'approved') {
    const where =
      filter === 'pending' ? { isApproved: false }
      : filter === 'approved' ? { isApproved: true }
      : {};
    const reviews = await this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, slug: true, catalog: { include: { brandCategory: { include: { category: true } } } } } },
        user: { select: { name: true } },
      },
    });
    return Promise.all(reviews.map(r => this.resolveImages(r)));
  }

  async approveReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    const updated = await this.prisma.review.update({ where: { id }, data: { isApproved: true } });
    await this.recalculateRating(review.productId);
    return updated;
  }

  async hideReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    const updated = await this.prisma.review.update({ where: { id }, data: { isApproved: false } });
    await this.recalculateRating(review.productId);
    return updated;
  }

  async deleteReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.prisma.review.delete({ where: { id } });
    if (review.isApproved) await this.recalculateRating(review.productId);
  }

  private async recalculateRating(productId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { id: true },
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count.id,
      },
    });
  }

  private async resolveImages(review: any) {
    const images = await Promise.all(
      (review.images as string[]).map(img => this.storage.resolveImageUrl(img)),
    );
    const productImages = review.product?.images as string[] | undefined;
    const productImage = productImages?.length
      ? await this.storage.resolveImageUrl(productImages[0])
      : null;
    return {
      ...review,
      images: images.filter(Boolean),
      product: review.product ? { ...review.product, coverImage: productImage } : review.product,
    };
  }
}
