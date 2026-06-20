import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [SettingsService],
    exports: [SettingsService],
})
export class SettingsModule {}
