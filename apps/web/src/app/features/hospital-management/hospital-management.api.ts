import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AppointmentResponse,
  DoctorRequest,
  DoctorResponse,
  HospitalResponse,
  UpdateHospitalProfileRequest,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
export type HospitalStaffMember = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string | null;
  phoneNumber?: string | null;
};

@Injectable({ providedIn: 'root' })
export class HospitalManagementApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  me() {
    return this.http
      .get<{ data: { hospital: HospitalResponse; staff?: HospitalStaffMember } }>(
        `${this.base}/hospital-management/me`,
      )
      .pipe(map((r) => r.data));
  }
  updateProfile(input: UpdateHospitalProfileRequest) {
    return this.http
      .patch<{ data: { hospital: HospitalResponse; staff?: HospitalStaffMember } }>(
        `${this.base}/hospital-management/me`,
        input,
      )
      .pipe(map((r) => r.data));
  }
  appointments() {
    return this.http
      .get<{ data: AppointmentResponse[] }>(`${this.base}/hospital-management/appointments`)
      .pipe(map((r) => r.data));
  }
  changeStatus(id: string, status: string, reason?: string) {
    // `reason` is stored server-side as Appointment.rejectionReason, but only
    // when status is CANCELLED — the API ignores it for any other status.
    // Parents see it on their appointment dashboard.
    return this.http
      .patch<{ data: AppointmentResponse }>(
        `${this.base}/hospital-management/appointments/${id}/status`,
        reason ? { status, reason } : { status },
      )
      .pipe(map((r) => r.data));
  }
  doctors() {
    return this.http
      .get<{ data: DoctorResponse[] }>(`${this.base}/hospital-management/doctors`)
      .pipe(map((r) => r.data));
  }
  createDoctor(input: DoctorRequest) {
    return this.http
      .post<{ data: DoctorResponse }>(`${this.base}/hospital-management/doctors`, input)
      .pipe(map((r) => r.data));
  }
  updateDoctor(id: string, payload: Partial<DoctorRequest>) {
    return this.http
      .patch<{ data: DoctorResponse }>(`${this.base}/hospital-management/doctors/${id}`, payload)
      .pipe(map((r) => r.data));
  }
  deleteDoctor(id: string) {
    return this.http.delete(`${this.base}/hospital-management/doctors/${id}`);
  }
}
