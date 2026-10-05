import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { AdmissionRequestResponse, CreateAdmissionRequestRequest } from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

/** Parent-side enrollment requests (admission requests). */
@Injectable({ providedIn: 'root' })
export class EnrollmentRequestsApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /** Request enrollment of one of the parent's children at a school. */
  createRequest(input: CreateAdmissionRequestRequest) {
    return this.http
      .post<{ data: AdmissionRequestResponse }>(
        `${this.apiBaseUrl}/parents/enrollment-requests`,
        input,
      )
      .pipe(map((response) => response.data));
  }

  /** The parent's own requests, newest first. */
  listRequests() {
    return this.http
      .get<{ data: AdmissionRequestResponse[] }>(`${this.apiBaseUrl}/parents/enrollment-requests`)
      .pipe(map((response) => response.data));
  }
}
