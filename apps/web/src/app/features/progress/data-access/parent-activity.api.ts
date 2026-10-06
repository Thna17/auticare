import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { ParentActivityReportListResponse } from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class ParentActivityApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /** One page of SUBMITTED activity reports for an owned child. */
  listActivityReports(childId: string, page = 1) {
    return this.http
      .get<{ data: ParentActivityReportListResponse }>(
        `${this.apiBaseUrl}/parents/activity-reports/${childId}`,
        { params: { page } },
      )
      .pipe(map((response) => response.data));
  }
}
