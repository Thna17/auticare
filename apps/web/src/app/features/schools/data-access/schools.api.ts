import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AdminSchoolAccountResponse,
  CreateSchoolAccountRequest,
  CreateActivityReportRequest,
  UpdateActivityReportRequest,
  CreateSchoolStudentRequest,
  CreateSchoolStudentResponse,
  ActivityReportResponse,
  ActivityReportDetailResponse,
  ActivityReportListResponse,
  UploadPhotosResponse,
  SchoolChildEnrollmentResponse,
  SchoolDashboardResponse,
  SchoolDetailResponse,
  SchoolListResponse,
  SchoolResponse,
  SchoolStaffResponse,
  UpdateSchoolProfileRequest,
  UpdateSchoolRequest,
  EnrollmentStatsResponse,
  EnrolledStudentsListResponse,
  EnrolledStudentOption,
  LeadSpecialistResponse,
  SchoolNotificationListResponse,
  SchoolNotificationView,
  NotificationDecisionResponse,
  NotificationResponse,
  UpdateSchoolEnrollmentRequest,
  SchoolEnrollmentMutationResponse,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

/**
 * Student-picker entry returned by GET /schools/enrolled-students. Defined in
 * @auticare/contracts; re-exported so the pages importing it from this module
 * keep working.
 */
export type { EnrolledStudentOption };

@Injectable({ providedIn: 'root' })
export class SchoolsApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listSchools(
    params: {
      search?: string;
      province?: string;
      availability?: string;
      specializations?: string;
      page?: number;
    } = {},
  ) {
    return this.http
      .get<{ data: SchoolListResponse }>(`${this.apiBaseUrl}/schools`, {
        params: Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
        ),
      })
      .pipe(map((response) => response.data));
  }

  /** Distinct provinces (stored in the school's city column) for the filter dropdown. */
  listSchoolCities() {
    return this.http
      .get<{ data: string[] }>(`${this.apiBaseUrl}/schools/cities`)
      .pipe(map((response) => response.data));
  }

  getSchoolById(schoolId: string) {
    return this.http
      .get<{ data: SchoolDetailResponse }>(`${this.apiBaseUrl}/schools/${schoolId}`)
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

  /**
   * Enriched reports list from GET /schools/reports — includes child name,
   * photo, and reporter name. Supports optional childId/status filters.
   */
  listReportsWithChild(params: { childId?: string; status?: string; page?: number } = {}) {
    return this.http
      .get<{ data: ActivityReportListResponse }>(`${this.apiBaseUrl}/schools/reports`, {
        params: Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
        ),
      })
      .pipe(map((response) => response.data));
  }

  /** Create a DRAFT or SUBMITTED activity report. */
  createActivityReport(input: CreateActivityReportRequest) {
    return this.http
      .post<{ data: ActivityReportResponse }>(`${this.apiBaseUrl}/schools/activity-reports`, input)
      .pipe(map((response) => response.data));
  }

  getMySchoolStaffProfile() {
    return this.http
      .get<{ data: SchoolStaffResponse }>(`${this.apiBaseUrl}/schools/staff/me`)
      .pipe(map((response) => response.data));
  }

  getMySchool() {
    return this.http
      .get<{ data: SchoolDetailResponse }>(`${this.apiBaseUrl}/schools/me`)
      .pipe(map((response) => response.data));
  }

  /** ── Notifications (school side) ───────────────────────────────────── */

  /** Enriched notification list: sender name + linked admission request. */
  listNotifications(
    params: { isRead?: boolean; view?: SchoolNotificationView; page?: number } = {},
  ) {
    return this.http
      .get<{ data: SchoolNotificationListResponse }>(`${this.apiBaseUrl}/schools/notifications`, {
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)),
      })
      .pipe(map((response) => response.data));
  }

  /** Approve / Reject / Keep-Pending an enrollment-request notification. */
  decideEnrollmentRequest(notificationId: string, decision: 'APPROVED' | 'REJECTED' | 'PENDING') {
    return this.http
      .patch<{ data: NotificationDecisionResponse }>(
        `${this.apiBaseUrl}/schools/notifications/${notificationId}/decision`,
        { decision },
      )
      .pipe(map((response) => response.data));
  }

  markNotificationRead(notificationId: string) {
    return this.http
      .patch<{ data: NotificationResponse }>(
        `${this.apiBaseUrl}/schools/notifications/${notificationId}/read`,
        {},
      )
      .pipe(map((response) => response.data));
  }

  markAllNotificationsRead() {
    return this.http
      .patch<{ data: { updatedCount: number } }>(
        `${this.apiBaseUrl}/schools/notifications/read-all`,
        {},
      )
      .pipe(map((response) => response.data));
  }

  updateMySchool(input: UpdateSchoolProfileRequest) {
    return this.http
      .patch<{ data: SchoolDetailResponse }>(`${this.apiBaseUrl}/schools/me`, input)
      .pipe(map((response) => response.data));
  }

  getDashboard() {
    return this.http
      .get<{ data: SchoolDashboardResponse }>(`${this.apiBaseUrl}/schools/me/dashboard`)
      .pipe(map((response) => response.data));
  }

  // ── Enrollment endpoints ─────────────────────────────────────────────

  getEnrollmentStats() {
    return this.http
      .get<{ data: EnrollmentStatsResponse }>(`${this.apiBaseUrl}/schools/enrollments/stats`)
      .pipe(map((response) => response.data));
  }

  getEnrolledStudentsList(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      specialistId?: string;
      search?: string;
    } = {},
  ) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.status) queryParams.set('status', params.status);
    if (params.specialistId) queryParams.set('specialistId', params.specialistId);
    if (params.search) queryParams.set('search', params.search);
    const qs = queryParams.toString();
    const url = `${this.apiBaseUrl}/schools/enrollments/students${qs ? '?' + qs : ''}`;
    return this.http
      .get<{ data: EnrolledStudentsListResponse }>(url)
      .pipe(map((response) => response.data));
  }

  getEnrollmentSpecialists() {
    return this.http
      .get<{ data: LeadSpecialistResponse[] }>(`${this.apiBaseUrl}/schools/enrollments/specialists`)
      .pipe(map((response) => response.data));
  }

  createStudent(input: CreateSchoolStudentRequest) {
    return this.http
      .post<{ data: CreateSchoolStudentResponse }>(
        `${this.apiBaseUrl}/schools/enrollments/students`,
        input,
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Edit an enrolled student: child profile fields (firstName, lastName,
   * dateOfBirth, notes...) and/or the enrollment (status, leadSpecialistId).
   * The child record itself is parent-owned — the school can only edit its
   * own enrollment row plus the profile fields shared here.
   */
  updateStudent(childId: string, data: UpdateSchoolEnrollmentRequest) {
    return this.http
      .patch<{ data: SchoolEnrollmentMutationResponse }>(
        `${this.apiBaseUrl}/schools/enrollments/${childId}`,
        data,
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Remove a student FROM this school — ends the enrollment (REJECTED +
   * endDate). Never deletes the parent-owned Child record.
   */
  deleteStudent(childId: string) {
    return this.http
      .delete<{ data: SchoolEnrollmentMutationResponse }>(
        `${this.apiBaseUrl}/schools/enrollments/${childId}`,
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Student picker for the activity report form — ACTIVE enrollments with
   * dateOfBirth and a server-computed age (GET /schools/enrolled-students).
   */
  getEnrolledStudents() {
    return this.http
      .get<{ data: EnrolledStudentOption[] }>(`${this.apiBaseUrl}/schools/enrolled-students`)
      .pipe(map((response) => response.data));
  }

  // ── Activity Report endpoints ────────────────────────────────────────

  getActivityReportById(id: string) {
    return this.http
      .get<{ data: ActivityReportDetailResponse }>(`${this.apiBaseUrl}/schools/reports/${id}`)
      .pipe(map((response) => response.data));
  }

  updateActivityReport(id: string, input: UpdateActivityReportRequest) {
    return this.http
      .patch<{ data: ActivityReportResponse }>(`${this.apiBaseUrl}/schools/reports/${id}`, input)
      .pipe(map((response) => response.data));
  }

  deleteActivityReport(id: string) {
    return this.http
      .delete<{ data: { success: boolean } }>(`${this.apiBaseUrl}/schools/activity-reports/${id}`)
      .pipe(map(() => undefined));
  }

  /** Upload images to /uploads/activity-reports/ — backend field name is `photos`. */
  uploadActivityPhotos(files: File[]) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('photos', file);
    }
    return this.uploadActivityFiles(formData);
  }

  /**
   * Upload files to /uploads/activity-reports/ — accepts any FormData the caller
   * prepared. The backend accepts field names `files` (10 files: images + docs)
   * or `photos` (5 images). Returns the stored URLs.
   */
  uploadActivityFiles(formData: FormData) {
    return this.http
      .post<{ data: UploadPhotosResponse }>(
        `${this.apiBaseUrl}/schools/upload/activity-files`,
        formData,
      )
      .pipe(map((response) => response.data));
  }
}
