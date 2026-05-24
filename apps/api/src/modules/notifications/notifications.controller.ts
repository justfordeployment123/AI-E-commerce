import {
  Controller, Get, Patch, Param, Req,
  Query, UseGuards, MessageEvent, Sse,
} from '@nestjs/common';
import { Observable, EMPTY } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { SseService } from './sse.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly sseService: SseService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: any) {
    return this.notificationsService.findByUser(req.user.id);
  }

  // EventSource cannot set headers, so auth token comes as a query param.
  // Do NOT inject @Res() here — it bypasses NestJS SSE header injection
  // and breaks the text/event-stream content-type.
  @Sse('stream')
  stream(@Query('token') token: string, @Req() req: any): Observable<MessageEvent> {
    let userId: string;
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      });
      userId = payload.sub;
    } catch {
      return EMPTY;
    }

    const subject = this.sseService.subscribe(userId);
    req.on('close', () => this.sseService.unsubscribe(userId, subject));
    return subject.asObservable();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markRead(id, req.user.id);
  }
}
