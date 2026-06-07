import { Controller, Get } from '@nestjs/common';
import * as os from 'os';

@Controller()
export class HealthController {
    @Get('health')
    check() {
        return {
            status: 'ok',
            service: 'scraper',
            uptime: process.uptime(),
            hostname: os.hostname(),
            timestamp: new Date().toISOString(),
        };
    }
}
