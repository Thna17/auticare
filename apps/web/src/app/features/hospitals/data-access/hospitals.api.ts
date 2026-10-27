import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AdminHospitalAccountResponse,
  CreateHospitalAccountRequest,
  CreateHospitalRequest,
  HospitalResponse,
  ResendInvitationRequest,
  ResendInvitationResponse,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class HospitalsApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getHospital(id: string) {
    return this.listHospitals().pipe(
      map((hospitals) => {
        const found = hospitals.find((h) => h.id === id);
        if (!found) throw new Error('Hospital not found');
        return found;
      }),
    );
  }

  toggleFavorite(id: string) {
    return this.http
      .post<{ data: { hospitalId: string; isFavorite: boolean } }>(
        `${this.apiBaseUrl}/hospitals/${id}/favorite`,
        {},
      )
      .pipe(map((response) => response.data));
  }

  listHospitals() {
    return this.http
      .get<{ data: HospitalResponse[] }>(`${this.apiBaseUrl}/hospitals`)
      .pipe(map((response) => response.data));
  }

  createHospital(input: CreateHospitalRequest) {
    return this.http
      .post<{ data: HospitalResponse }>(`${this.apiBaseUrl}/hospitals`, input)
      .pipe(map((response) => response.data));
  }

  createHospitalAccount(input: CreateHospitalAccountRequest) {
    return this.http
      .post<{ data: AdminHospitalAccountResponse }>(
        `${this.apiBaseUrl}/hospitals/admin/accounts`,
        input,
      )
      .pipe(map((response) => response.data));
  }

  listAdminHospitalAccounts() {
    return this.http
      .get<{ data: AdminHospitalAccountResponse[] }>(`${this.apiBaseUrl}/hospitals/admin/accounts`)
      .pipe(map((response) => response.data));
  }

  resendInvitation(input: ResendInvitationRequest) {
    return this.http
      .post<{ data: ResendInvitationResponse }>(`${this.apiBaseUrl}/auth/invitations/resend`, input)
      .pipe(map((response) => response.data));
  }
}
