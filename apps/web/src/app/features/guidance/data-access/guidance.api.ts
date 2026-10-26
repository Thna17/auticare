import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { AiLanguage, GuidanceSearchResponse } from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class GuidanceApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  search(query: string, language: AiLanguage) {
    const params = new HttpParams().set('q', query).set('language', language);
    return this.http
      .get<{ data: GuidanceSearchResponse }>(`${this.apiBaseUrl}/guidance`, { params })
      .pipe(map((response) => response.data));
  }
}
