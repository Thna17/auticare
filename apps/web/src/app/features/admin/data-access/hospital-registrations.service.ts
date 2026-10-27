import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  HospitalRegistration,
  HospitalRegistrationRequest,
  HospitalRegistrationStatus,
  RejectHospitalRegistrationRequest,
} from '@auticare/contracts';
import { map, type Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class HospitalRegistrationsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  readonly pendingCount = signal<number>(0);

  fetchPendingCount(): Observable<number> {
    return this.http
      .get<{ data: { count: number } }>(
        `${this.apiBaseUrl}/admin/hospital-registrations/pending-count`,
      )
      .pipe(
        map((res) => res.data.count),
        tap((count) => this.pendingCount.set(count)),
      );
  }

  submit(input: HospitalRegistrationRequest): Observable<{ received: boolean }> {
    return this.http
      .post<{ data: { received: boolean } }>(`${this.apiBaseUrl}/hospital-registrations`, input)
      .pipe(map((res) => res.data));
  }

  list(status?: HospitalRegistrationStatus): Observable<HospitalRegistration[]> {
    const params: Record<string, string> = {};
    if (status) {
      params['status'] = status;
    }
    return this.http
      .get<{ data: HospitalRegistration[] }>(`${this.apiBaseUrl}/admin/hospital-registrations`, {
        params,
      })
      .pipe(map((res) => res.data));
  }

  approve(id: string): Observable<HospitalRegistration> {
    return this.http
      .post<{ data: HospitalRegistration }>(
        `${this.apiBaseUrl}/admin/hospital-registrations/${id}/approve`,
        {},
      )
      .pipe(
        map((res) => res.data),
        tap(() => this.fetchPendingCount().subscribe({ error: () => {} })),
      );
  }

  reject(id: string, reason: string): Observable<HospitalRegistration> {
    const body: RejectHospitalRegistrationRequest = { reason };
    return this.http
      .post<{ data: HospitalRegistration }>(
        `${this.apiBaseUrl}/admin/hospital-registrations/${id}/reject`,
        body,
      )
      .pipe(
        map((res) => res.data),
        tap(() => this.fetchPendingCount().subscribe({ error: () => {} })),
      );
  }
}
