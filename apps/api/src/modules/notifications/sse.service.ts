import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class SseService implements OnModuleInit, OnModuleDestroy {
  private readonly clients = new Map<string, Set<Subject<any>>>();
  private heartbeatTimer?: NodeJS.Timeout;

  onModuleInit() {
    // Keep idle SSE connections alive through proxies/load balancers and let
    // the client detect a dead connection quickly instead of sitting silent.
    this.heartbeatTimer = setInterval(() => {
      const payload = { data: JSON.stringify({ type: '__ping__' }) };
      this.clients.forEach(set => set.forEach(s => s.next(payload)));
    }, 25_000);
  }

  subscribe(userId: string): Subject<any> {
    const subject = new Subject<any>();
    if (!this.clients.has(userId)) this.clients.set(userId, new Set());
    this.clients.get(userId)!.add(subject);
    return subject;
  }

  unsubscribe(userId: string, subject: Subject<any>) {
    const set = this.clients.get(userId);
    if (set) {
      set.delete(subject);
      if (set.size === 0) this.clients.delete(userId);
    }
    subject.complete();
  }

  emit(userId: string, data: any) {
    const set = this.clients.get(userId);
    if (!set) return;
    const payload = JSON.stringify(data);
    set.forEach(s => s.next({ data: payload }));
  }

  onModuleDestroy() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.clients.forEach(set => set.forEach(s => s.complete()));
    this.clients.clear();
  }
}
