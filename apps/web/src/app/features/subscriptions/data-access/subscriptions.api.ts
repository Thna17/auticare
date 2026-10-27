import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AdminSubscription,
  CreateAdminSubscriptionRequest,
  ParentPlanResponse,
  SchoolSubscriptionResponse,
  SubscriptionPlan,
  UpdateAdminSubscriptionRequest,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

/** Plans for parents, schools and the platform admin. The server decides every limit. */
@Injectable({ providedIn: 'root' })
export class SubscriptionsApi {
  private readonly http = inject(HttpClient);
  private readonly root = inject(API_BASE_URL);
  private readonly base = `${this.root}/subscriptions`;

  myPlan() {
    return this.http
      .get<{ data: ParentPlanResponse }>(`${this.base}/me`)
      .pipe(map((response) => response.data));
  }

  acceptOffer(id: string) {
    return this.http
      .post<{ data: ParentPlanResponse }>(`${this.base}/offers/${id}/accept`, {})
      .pipe(map((response) => response.data));
  }

  declineOffer(id: string) {
    return this.http
      .post<{ data: ParentPlanResponse }>(`${this.base}/offers/${id}/decline`, {})
      .pipe(map((response) => response.data));
  }

  leaveSponsorship() {
    return this.http
      .post<{ data: ParentPlanResponse }>(`${this.base}/sponsorship/leave`, {})
      .pipe(map((response) => response.data));
  }

  schoolSubscription() {
    return this.http
      .get<{ data: SchoolSubscriptionResponse }>(`${this.base}/school`)
      .pipe(map((response) => response.data));
  }

  inviteSponsorship(email: string) {
    return this.http
      .post<{ data: SchoolSubscriptionResponse }>(`${this.base}/school/sponsorships`, { email })
      .pipe(map((response) => response.data));
  }

  withdrawSponsorship(id: string) {
    return this.http
      .post<{ data: SchoolSubscriptionResponse }>(
        `${this.base}/school/sponsorships/${id}/withdraw`,
        {},
      )
      .pipe(map((response) => response.data));
  }

  adminList(plan?: SubscriptionPlan) {
    return this.http
      .get<{ data: AdminSubscription[] }>(`${this.root}/admin/subscriptions`, {
        params: plan ? { plan } : {},
      })
      .pipe(map((response) => response.data));
  }

  adminCreate(input: CreateAdminSubscriptionRequest) {
    return this.http
      .post<{ data: AdminSubscription }>(`${this.root}/admin/subscriptions`, input)
      .pipe(map((response) => response.data));
  }

  adminUpdate(id: string, input: UpdateAdminSubscriptionRequest) {
    return this.http
      .patch<{ data: AdminSubscription }>(`${this.root}/admin/subscriptions/${id}`, input)
      .pipe(map((response) => response.data));
  }
}
