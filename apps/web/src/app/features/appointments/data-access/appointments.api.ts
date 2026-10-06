import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { AppointmentListResponse } from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import type {
  AppointmentResponse,
  CreateAppointmentRequest,
  DoctorResponse,
} from '../appointments.types';

@Injectable({ providedIn: 'root' })
export class AppointmentsApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /**
   * One page of the parent's appointments. The endpoint is paginated because an
   * appointment history only grows; `page` defaults to 1 and `limit` is capped
   * server-side, so an omitted argument still returns a bounded page.
   */
  listAppointments(page = 1, limit = 20) {
    return this.http
      .get<{ data: AppointmentListResponse }>(
        `${this.apiBaseUrl}/appointments?page=${page}&limit=${limit}`,
      )
      .pipe(map((response) => response.data));
  }

  listDoctors(hospitalId: string) {
    return this.http
      .get<{ data: DoctorResponse[] }>(`${this.apiBaseUrl}/hospitals/${hospitalId}/doctors`)
      .pipe(map((response) => response.data));
  }

  /**
   * Parent-initiated cancellation. The API only allows it while the appointment
   * is REQUESTED or CONFIRMED, and scopes it to the caller's own appointments.
   */
  cancelAppointment(appointmentId: string) {
    return this.http
      .patch<{ data: AppointmentResponse }>(
        `${this.apiBaseUrl}/appointments/${appointmentId}/cancel`,
        {},
      )
      .pipe(map((response) => response.data));
  }

  createAppointment(input: CreateAppointmentRequest) {
    return this.http
      .post<{ data: AppointmentResponse }>(`${this.apiBaseUrl}/appointments`, input)
      .pipe(map((response) => response.data));
  }
}
