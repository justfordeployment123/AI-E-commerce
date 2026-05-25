import { Module } from '@nestjs/common';
import { ReviewsController, AdminReviewsController, PublicReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../../common/services/storage.module';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [PublicReviewsController, ReviewsController, AdminReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
