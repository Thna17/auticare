import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AdminSchoolAccountResponse,
  CreateSchoolAccountRequest,
  CreateSchoolActivityReportRequest,
  SchoolActivityReportResponse,
  SchoolChildEnrollmentResponse,
  SchoolResponse,
  SchoolStaffResponse,
  UpdateSchoolRequest,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class SchoolsApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listSchools() {
    return this.http
      .get<{ data: SchoolResponse[] }>(`${this.apiBaseUrl}/schools`)
      .pipe(map((response) => response.data));
  }

  createSchoolAccount(input: CreateSchoolAccountRequest) {
    return this.http
      .post<{ data: AdminSchoolAccountResponse }>(
        `${this.apiBaseUrl}/schools/admin/accounts`,
        input,
      )
      .pipe(map((response) => response.data));
  }

  listAdminSchoolAccounts() {
    return this.http
      .get<{ data: AdminSchoolAccountResponse[] }>(`${this.apiBaseUrl}/schools/admin/accounts`)
      .pipe(map((response) => response.data));
  }

  updateSchool(schoolId: string, input: UpdateSchoolRequest) {
    return this.http
      .patch<{ data: SchoolResponse }>(`${this.apiBaseUrl}/schools/${schoolId}`, input)
      .pipe(map((response) => response.data));
  }

  listEnrollments() {
    return this.http
      .get<{ data: SchoolChildEnrollmentResponse[] }>(`${this.apiBaseUrl}/schools/enrollments`)
      .pipe(map((response) => response.data));
  }

  listReports() {
    return this.http
      .get<{ data: SchoolActivityReportResponse[] }>(`${this.apiBaseUrl}/schools/activity-reports`)
      .pipe(map((response) => response.data));
  }

  createReport(input: CreateSchoolActivityReportRequest) {
    return this.http
      .post<{ data: SchoolActivityReportResponse }>(
        `${this.apiBaseUrl}/schools/activity-reports`,
        input,
      )
      .pipe(map((response) => response.data));
  }

  getMySchoolStaffProfile() {
    return this.http
      .get<{ data: SchoolStaffResponse }>(`${this.apiBaseUrl}/schools/staff/me`)
      .pipe(map((response) => response.data));
  }
}
