import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AdminActivity,
  AdminAiMonitoring,
  AdminQuestion,
  AdminQuestionnaire,
  CreateQuestionRequest,
  SaveActivityRequest,
  UpdateQuestionRequest,
  AdminAnalytics,
  Announcement,
  Partnership,
  PartnershipStatus,
  SaveAnnouncementRequest,
  SavePartnershipRequest,
  VisibleAnnouncement,
  AdminAuditList,
  AdminOverview,
  AdminParentList,
  AdminSchool,
  AdminSchoolList,
  AdminSponsorshipSchool,
  AdminStaffList,
  UpdateAdminSchoolRequest,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

/** Query values for the admin lists; empty ones are left out of the URL. */
export type AdminListParams = Record<string, string | number | undefined>;

const clean = (params: AdminListParams) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, string | number>;

/** The platform admin's management endpoints under /api/v1/admin. */
@Injectable({ providedIn: 'root' })
export class AdminPortalApi {
  private readonly http = inject(HttpClient);
  private readonly root = inject(API_BASE_URL);
  private readonly base = `${this.root}/admin`;

  overview() {
    return this.http
      .get<{ data: AdminOverview }>(`${this.base}/overview`)
      .pipe(map((response) => response.data));
  }

  parents(params: AdminListParams) {
    return this.http
      .get<{ data: AdminParentList }>(`${this.base}/parents`, { params: clean(params) })
      .pipe(map((response) => response.data));
  }

  suspendAccount(id: string, reason: string) {
    return this.http
      .post<{ data: { suspended: boolean } }>(`${this.base}/accounts/${id}/suspend`, { reason })
      .pipe(map((response) => response.data));
  }

  reactivateAccount(id: string) {
    return this.http
      .post<{ data: { suspended: boolean } }>(`${this.base}/accounts/${id}/reactivate`, {})
      .pipe(map((response) => response.data));
  }

  schools(params: AdminListParams) {
    return this.http
      .get<{ data: AdminSchoolList }>(`${this.base}/schools`, { params: clean(params) })
      .pipe(map((response) => response.data));
  }

  updateSchool(id: string, input: UpdateAdminSchoolRequest) {
    return this.http
      .patch<{ data: AdminSchool }>(`${this.base}/schools/${id}`, input)
      .pipe(map((response) => response.data));
  }

  staff(params: AdminListParams) {
    return this.http
      .get<{ data: AdminStaffList }>(`${this.base}/staff`, { params: clean(params) })
      .pipe(map((response) => response.data));
  }

  sponsorships() {
    return this.http
      .get<{ data: AdminSponsorshipSchool[] }>(`${this.base}/sponsorships`)
      .pipe(map((response) => response.data));
  }

  audit(params: AdminListParams) {
    return this.http
      .get<{ data: AdminAuditList }>(`${this.base}/audit`, { params: clean(params) })
      .pipe(map((response) => response.data));
  }

  announcements() {
    return this.http
      .get<{ data: Announcement[] }>(`${this.base}/announcements`)
      .pipe(map((response) => response.data));
  }

  saveAnnouncement(input: SaveAnnouncementRequest, id?: string) {
    const request = id
      ? this.http.patch<{ data: Announcement }>(`${this.base}/announcements/${id}`, input)
      : this.http.post<{ data: Announcement }>(`${this.base}/announcements`, input);
    return request.pipe(map((response) => response.data));
  }

  /** The live announcements for the signed-in user; any role may call it. */
  visibleAnnouncements() {
    return this.http
      .get<{ data: VisibleAnnouncement[] }>(`${this.root}/announcements`)
      .pipe(map((response) => response.data));
  }

  partnerships(status?: PartnershipStatus) {
    return this.http
      .get<{ data: Partnership[] }>(`${this.base}/partnerships`, {
        params: status ? { status } : {},
      })
      .pipe(map((response) => response.data));
  }

  savePartnership(input: SavePartnershipRequest, id?: string) {
    const request = id
      ? this.http.patch<{ data: Partnership }>(`${this.base}/partnerships/${id}`, input)
      : this.http.post<{ data: Partnership }>(`${this.base}/partnerships`, input);
    return request.pipe(map((response) => response.data));
  }

  analytics(months: number) {
    return this.http
      .get<{ data: AdminAnalytics }>(`${this.base}/analytics`, { params: { months } })
      .pipe(map((response) => response.data));
  }

  activities() {
    return this.http
      .get<{ data: AdminActivity[] }>(`${this.base}/activities`)
      .pipe(map((response) => response.data));
  }

  saveActivity(input: SaveActivityRequest, id?: string) {
    const request = id
      ? this.http.patch<{ data: AdminActivity }>(`${this.base}/activities/${id}`, input)
      : this.http.post<{ data: AdminActivity }>(`${this.base}/activities`, input);
    return request.pipe(map((response) => response.data));
  }

  questionnaire() {
    return this.http
      .get<{ data: AdminQuestionnaire }>(`${this.base}/questionnaire`)
      .pipe(map((response) => response.data));
  }

  createQuestion(input: CreateQuestionRequest) {
    return this.http
      .post<{ data: AdminQuestion }>(`${this.base}/questions`, input)
      .pipe(map((response) => response.data));
  }

  updateQuestion(id: string, input: UpdateQuestionRequest) {
    return this.http
      .patch<{ data: AdminQuestion }>(`${this.base}/questions/${id}`, input)
      .pipe(map((response) => response.data));
  }

  setQuestionActive(id: string, active: boolean) {
    return this.http
      .post<{ data: AdminQuestion }>(
        `${this.base}/questions/${id}/${active ? 'restore' : 'archive'}`,
        {},
      )
      .pipe(map((response) => response.data));
  }

  aiMonitoring(days: number) {
    return this.http
      .get<{ data: AdminAiMonitoring }>(`${this.base}/ai`, { params: { days } })
      .pipe(map((response) => response.data));
  }
}
