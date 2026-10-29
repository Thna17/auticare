import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AiLanguage,
  ChildResponse,
  ChildSummaryResponse,
  CreateChildRequest,
  UpdateChildRequest,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
@Injectable({ providedIn: 'root' })
export class ChildrenApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  listChildren(params?: { includeArchived?: boolean }) {
    const qs = params?.includeArchived ? '?includeArchived=true' : '';
    return this.http
      .get<{ data: ChildResponse[] }>(`${this.apiBaseUrl}/children${qs}`)
      .pipe(map((response) => response.data));
  }
  getChild(childId: string) {
    return this.http
      .get<{ data: ChildResponse }>(`${this.apiBaseUrl}/children/${childId}`)
      .pipe(map((response) => response.data));
  }
  createChild(input: CreateChildRequest) {
    return this.http
      .post<{ data: ChildResponse }>(`${this.apiBaseUrl}/children`, input)
      .pipe(map((response) => response.data));
  }
  updateChild(childId: string, input: UpdateChildRequest) {
    return this.http
      .patch<{ data: ChildResponse }>(`${this.apiBaseUrl}/children/${childId}`, input)
      .pipe(map((response) => response.data));
  }
  archiveChild(childId: string) {
    return this.http
      .delete<{ data: ChildResponse }>(`${this.apiBaseUrl}/children/${childId}`)
      .pipe(map((response) => response.data));
  }
  restoreChild(childId: string) {
    return this.http
      .post<{ data: ChildResponse }>(`${this.apiBaseUrl}/children/${childId}/restore`, {})
      .pipe(map((response) => response.data));
  }

  /** The stored educational summary, or null. Never calls the model. */
  getSummary(childId: string, language: AiLanguage) {
    return this.http
      .get<{ data: { summary: ChildSummaryResponse | null } }>(
        `${this.apiBaseUrl}/children/${childId}/summary?language=${language}`,
      )
      .pipe(map((response) => response.data.summary));
  }

  /**
   * Ask for a summary. Comes back with `cached: true` when the records have not
   * changed since the stored text was written, so nothing was generated.
   */
  generateSummary(
    childId: string,
    input: { language: AiLanguage; days?: number; tzOffset?: number },
  ) {
    return this.http
      .post<{ data: ChildSummaryResponse }>(`${this.apiBaseUrl}/children/${childId}/summary`, input)
      .pipe(map((response) => response.data));
  }
}
