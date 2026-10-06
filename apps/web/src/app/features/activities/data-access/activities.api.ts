import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  ActivityProgressResponse,
  ActivityResponse,
  UpdateActivityProgressRequest,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class ActivitiesApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /**
   * The catalogue. Passing a childId narrows it to entries whose age range covers
   * that child, which is the whole point — a parent should not have to work out
   * which entries suit their child from a month range.
   */
  listActivities(filters: { childId?: string; category?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.childId) params.set('childId', filters.childId);
    if (filters.category) params.set('category', filters.category);
    const query = params.toString();
    return this.http
      .get<{ data: ActivityResponse[] }>(
        `${this.apiBaseUrl}/activities${query === '' ? '' : `?${query}`}`,
      )
      .pipe(map((response) => response.data));
  }

  listProgress(childId: string) {
    return this.http
      .get<{ data: ActivityProgressResponse[] }>(
        `${this.apiBaseUrl}/activities/progress?childId=${encodeURIComponent(childId)}`,
      )
      .pipe(map((response) => response.data));
  }

  /** Idempotent server-side: starting an already-started activity returns the same row. */
  startActivity(activityId: string, childId: string) {
    return this.http
      .post<{ data: ActivityProgressResponse }>(
        `${this.apiBaseUrl}/activities/${encodeURIComponent(activityId)}/start`,
        { childId },
      )
      .pipe(map((response) => response.data));
  }

  updateProgress(progressId: string, input: UpdateActivityProgressRequest) {
    return this.http
      .patch<{ data: ActivityProgressResponse }>(
        `${this.apiBaseUrl}/activities/progress/${encodeURIComponent(progressId)}`,
        input,
      )
      .pipe(map((response) => response.data));
  }
}
