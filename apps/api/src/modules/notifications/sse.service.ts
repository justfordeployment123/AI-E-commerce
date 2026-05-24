import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class SseService implements OnModuleDestroy {
  private readonly clients = new Map<string, Set<Subject<any>>>();

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
    this.clients.forEach(set => set.forEach(s => s.complete()));
    this.clients.clear();
  }
}
