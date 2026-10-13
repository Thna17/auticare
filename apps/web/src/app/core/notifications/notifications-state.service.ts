import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ParentNotificationsApi } from '../../features/notifications/data-access/parent-notifications.api';
import { SchoolsApi } from '../../features/schools/data-access/schools.api';

@Injectable({ providedIn: 'root' })
export class NotificationsStateService {
  private readonly auth = inject(AuthService);
  private readonly parentApi = inject(ParentNotificationsApi);
  private readonly schoolsApi = inject(SchoolsApi);

  readonly unreadCount = signal<number>(0);

  constructor() {
    effect(() => {
      const parent = this.auth.parent();
      if (!parent) {
        untracked(() => this.unreadCount.set(0));
        return;
      }
      untracked(() => this.refresh());
    });
  }

  refresh(): void {
    const role = this.auth.parent()?.role;
    if (role === 'PARENT') {
      this.parentApi.list(1, false).subscribe({
        next: (res) => this.unreadCount.set(res.pagination.total),
        error: () => {},
      });
    } else if (role === 'SCHOOL') {
      this.schoolsApi.listNotifications({ isRead: false, page: 1 }).subscribe({
        next: (res) => this.unreadCount.set(res.pagination.total),
        error: () => {},
      });
    } else {
      this.unreadCount.set(0);
    }
  }

  setUnreadCount(count: number): void {
    this.unreadCount.set(Math.max(0, count));
  }

  decrementUnread(amount = 1): void {
    this.unreadCount.update((c) => Math.max(0, c - amount));
  }

  clearUnread(): void {
    this.unreadCount.set(0);
  }
}
