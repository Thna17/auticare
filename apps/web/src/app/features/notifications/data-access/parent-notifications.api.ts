import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { NotificationResponse } from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

/**
 * The signed-in parent's own notifications.
 *
 * `GET /parents/notifications` existed and was scoped correctly, but nothing on
 * the web ever called it — so the enrollment-request and report notifications the
 * backend emits for parents were never shown to them.
 */
@Injectable({ providedIn: 'root' })
export class ParentNotificationsApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list() {
    return this.http
      .get<{ data: NotificationResponse[] }>(`${this.apiBaseUrl}/parents/notifications`)
      .pipe(map((response) => response.data));
  }
}
