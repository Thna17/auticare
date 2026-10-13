import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { AdminDashboardResponse, ParentDashboardResponse } from '@auticare/contracts';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getParentDashboard(childId?: string): Observable<ParentDashboardResponse> {
    const params = childId ? { childId } : undefined;
    return this.http
      .get<{ data: ParentDashboardResponse }>(`${this.apiBaseUrl}/dashboard/parent`, { params })
      .pipe(map((res) => res.data));
  }

  getAdminDashboard(): Observable<AdminDashboardResponse> {
    return this.http
      .get<{ data: AdminDashboardResponse }>(`${this.apiBaseUrl}/dashboard/admin`)
      .pipe(map((res) => res.data));
  }
}
