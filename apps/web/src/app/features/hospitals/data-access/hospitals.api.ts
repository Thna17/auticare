import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { CreateHospitalRequest, HospitalResponse } from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class HospitalsApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

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
}
