import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  CreateObservationRequest,
  ListObservationsQuery,
  ObservationResponse,
  UpdateObservationRequest,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

const toParams = (query: Partial<ListObservationsQuery>): HttpParams => {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
};

@Injectable({ providedIn: 'root' })
export class ObservationsApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(query: Partial<ListObservationsQuery> & { childId: string }) {
    return this.http
      .get<{ data: ObservationResponse[] }>(`${this.apiBaseUrl}/observations`, {
        params: toParams(query),
      })
      .pipe(map((response) => response.data));
  }

  create(input: CreateObservationRequest) {
    return this.http
      .post<{ data: ObservationResponse }>(`${this.apiBaseUrl}/observations`, input)
      .pipe(map((response) => response.data));
  }

  update(id: string, input: UpdateObservationRequest) {
    return this.http
      .patch<{ data: ObservationResponse }>(`${this.apiBaseUrl}/observations/${id}`, input)
      .pipe(map((response) => response.data));
  }

  remove(id: string) {
    return this.http
      .delete<{ data: { id: string } }>(`${this.apiBaseUrl}/observations/${id}`)
      .pipe(map((response) => response.data));
  }
}
