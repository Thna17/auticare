import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { ChildInsightResponse } from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class InsightsApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /**
   * @param days         Window length in days.
   * @param tzOffsetMinutes Minutes east of UTC (`-getTimezoneOffset()`), so the
   *   server files records on the family's local day rather than the server's.
   */
  get(childId: string, days = 28, tzOffsetMinutes = 0) {
    const params = new HttpParams().set('days', days).set('tzOffset', tzOffsetMinutes);
    return this.http
      .get<{ data: ChildInsightResponse }>(`${this.apiBaseUrl}/insights/children/${childId}`, {
        params,
      })
      .pipe(map((response) => response.data));
  }
}
