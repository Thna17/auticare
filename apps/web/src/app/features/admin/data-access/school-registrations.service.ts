import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  RejectSchoolRegistrationRequest,
  SchoolRegistration,
  SchoolRegistrationRequest,
  SchoolRegistrationStatus,
} from '@auticare/contracts';
import { map, type Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class SchoolRegistrationsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  readonly pendingCount = signal<number>(0);

  fetchPendingCount(): Observable<number> {
    return this.http
      .get<{ data: { count: number } }>(
        `${this.apiBaseUrl}/admin/school-registrations/pending-count`,
      )
      .pipe(
        map((res) => res.data.count),
        tap((count) => this.pendingCount.set(count)),
      );
  }

  submit(input: SchoolRegistrationRequest): Observable<{ received: boolean }> {
    return this.http
      .post<{ data: { received: boolean } }>(`${this.apiBaseUrl}/school-registrations`, input)
      .pipe(map((res) => res.data));
  }

  list(status?: SchoolRegistrationStatus): Observable<SchoolRegistration[]> {
    const params: Record<string, string> = {};
    if (status) {
      params['status'] = status;
    }
    return this.http
      .get<{ data: SchoolRegistration[] }>(`${this.apiBaseUrl}/admin/school-registrations`, {
        params,
      })
      .pipe(map((res) => res.data));
  }

  approve(id: string): Observable<SchoolRegistration> {
    return this.http
      .post<{ data: SchoolRegistration }>(
        `${this.apiBaseUrl}/admin/school-registrations/${id}/approve`,
        {},
      )
      .pipe(
        map((res) => res.data),
        tap(() => this.fetchPendingCount().subscribe({ error: () => {} })),
      );
  }

  reject(id: string, reason: string): Observable<SchoolRegistration> {
    const body: RejectSchoolRegistrationRequest = { reason };
    return this.http
      .post<{ data: SchoolRegistration }>(
        `${this.apiBaseUrl}/admin/school-registrations/${id}/reject`,
        body,
      )
      .pipe(
        map((res) => res.data),
        tap(() => this.fetchPendingCount().subscribe({ error: () => {} })),
      );
  }
}
