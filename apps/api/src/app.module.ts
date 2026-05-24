import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './modules/config/config.module';
import { CacheModule } from './modules/cache/cache.module';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { TradeInsModule } from './modules/trade-ins/trade-ins.module';
import { RepairsModule } from './modules/repairs/repairs.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CartModule } from './modules/cart/cart.module';
import { AdminModule } from './modules/admin/admin.module';
import { PricingConfigModule } from './modules/pricing-config/pricing-config.module';
import { DeviceCatalogModule } from './modules/device-catalog/device-catalog.module';
import { StoresModule } from './modules/stores/stores.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CacheModule,
    HealthModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    AuthModule,
    UsersModule,
    ProductsModule,
    TradeInsModule,
    RepairsModule,
    OrdersModule,
    CartModule,
    AdminModule,
    PricingConfigModule,
    DeviceCatalogModule,
    StoresModule,
    UploadsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule {}
