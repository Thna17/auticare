import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AppointmentResponse,
  CreateHospitalStaffRequest,
  DoctorRequest,
  DoctorResponse,
  HospitalResponse,
  HospitalStaffCredentialsResponse,
  HospitalStaffMember,
  HospitalStaffRole,
  UpdateHospitalProfileRequest,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';

export type { HospitalStaffMember };

export type HospitalMeData = {
  hospital: HospitalResponse;
  staff?: {
    id: string;
    parentId: string;
    hospitalId: string;
    title: string | null;
    phone: string | null;
  };
  staffRole?: HospitalStaffRole;
};

@Injectable({ providedIn: 'root' })
export class HospitalManagementApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  me() {
    return this.http
      .get<{ data: HospitalMeData }>(`${this.base}/hospital-management/me`)
      .pipe(map((r) => r.data));
  }

  updateProfile(input: UpdateHospitalProfileRequest) {
    return this.http
      .patch<{ data: HospitalMeData }>(`${this.base}/hospital-management/me`, input)
      .pipe(map((r) => r.data));
  }

  listStaff() {
    return this.http
      .get<{ data: HospitalStaffMember[] }>(`${this.base}/hospital/staff`)
      .pipe(map((r) => r.data));
  }

  createStaff(input: CreateHospitalStaffRequest) {
    return this.http
      .post<{ data: HospitalStaffCredentialsResponse }>(`${this.base}/hospital/staff`, input)
      .pipe(map((r) => r.data));
  }

  issueSetupCode(staffId: string) {
    return this.http
      .post<{ data: HospitalStaffCredentialsResponse }>(
        `${this.base}/hospital/staff/${staffId}/setup-code`,
        {},
      )
      .pipe(map((r) => r.data));
  }

  deactivateStaff(staffId: string) {
    return this.http
      .post<{ data: HospitalStaffMember }>(`${this.base}/hospital/staff/${staffId}/deactivate`, {})
      .pipe(map((r) => r.data));
  }

  reactivateStaff(staffId: string) {
    return this.http
      .post<{ data: HospitalStaffMember }>(`${this.base}/hospital/staff/${staffId}/reactivate`, {})
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
