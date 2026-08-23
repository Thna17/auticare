import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
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

  listAppointments() {
    return this.http
      .get<{ data: AppointmentResponse[] }>(`${this.apiBaseUrl}/appointments`)
      .pipe(map((response) => response.data));
  }

  listDoctors(hospitalId: string) {
    return this.http
      .get<{ data: DoctorResponse[] }>(`${this.apiBaseUrl}/hospitals/${hospitalId}/doctors`)
      .pipe(map((response) => response.data));
  }

  createAppointment(input: CreateAppointmentRequest) {
    return this.http
      .post<{ data: AppointmentResponse }>(`${this.apiBaseUrl}/appointments`, input)
      .pipe(map((response) => response.data));
  }
}
