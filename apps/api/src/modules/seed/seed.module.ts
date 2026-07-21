import { Module } from '@nestjs/common';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [DatabaseModule, SettingsModule],
    controllers: [SeedController],
    providers: [SeedService],
})
export class SeedModule {}
