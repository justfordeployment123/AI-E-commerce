import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('reviews')
export class PublicReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('recent')
  getRecent(@Query('limit') limit?: string) {
    return this.reviewsService.getRecentReviews(limit ? Number(limit) : 8);
  }
}

@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  getReviews(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  createReview(
    @Param('productId') productId: string,
    @Body() body: { guestName?: string; rating: number; body: string; images?: string[] },
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.reviewsService.createReview(productId, {
      ...body,
      userId: req.user?.id,
    });
  }
}

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  getAllReviews(@Query('filter') filter?: 'pending' | 'approved') {
    return this.reviewsService.getAllReviews(filter);
  }

  @Patch(':id/approve')
  approveReview(@Param('id') id: string) {
    return this.reviewsService.approveReview(id);
  }

  @Patch(':id/hide')
  hideReview(@Param('id') id: string) {
    return this.reviewsService.hideReview(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteReview(@Param('id') id: string) {
    return this.reviewsService.deleteReview(id);
  }
}
