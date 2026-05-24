import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SseService } from './sse.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sse: SseService,
  ) {}

  async create(userId: string, type: string, title: string, body: string, data: object = {}) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, data },
    });
    this.sse.emit(userId, {
      id: notification.id,
      type,
      title,
      body,
      data,
      read: false,
      createdAt: notification.createdAt,
    });
    return notification;
  }

  async findByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
