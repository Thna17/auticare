import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { ParentActivityReportResponse } from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class ParentActivityApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /** All SUBMITTED activity reports for one of the logged-in parent's children. */
  listActivityReports(childId: string) {
    return this.http
      .get<{ data: ParentActivityReportResponse[] }>(
        `${this.apiBaseUrl}/parents/activity-reports/${childId}`,
      )
      .pipe(map((response) => response.data));
  }
}
