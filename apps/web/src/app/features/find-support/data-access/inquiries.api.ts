import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  CreateOrganizationInquiryRequest,
  OrganizationInquiryResponse,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class InquiriesApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  createInquiry(input: CreateOrganizationInquiryRequest) {
    return this.http
      .post<{ data: OrganizationInquiryResponse }>(`${this.apiBaseUrl}/inquiries`, input)
      .pipe(map((res) => res.data));
  }

  listMyInquiries() {
    return this.http
      .get<{ data: OrganizationInquiryResponse[] }>(`${this.apiBaseUrl}/inquiries/mine`)
      .pipe(map((res) => res.data));
  }

  listSchoolInquiries() {
    return this.http
      .get<{ data: OrganizationInquiryResponse[] }>(`${this.apiBaseUrl}/inquiries/school`)
      .pipe(map((res) => res.data));
  }

  markSchoolInquiryRead(id: string) {
    return this.http
      .post<{ data: OrganizationInquiryResponse }>(
        `${this.apiBaseUrl}/inquiries/school/${id}/read`,
        {},
      )
      .pipe(map((res) => res.data));
  }
}
