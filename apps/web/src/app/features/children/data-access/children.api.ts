import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { ChildResponse, UpdateChildRequest } from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
@Injectable({ providedIn: 'root' })
export class ChildrenApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  listChildren() {
    return this.http
      .get<{ data: ChildResponse[] }>(`${this.apiBaseUrl}/children`)
      .pipe(map((response) => response.data));
  }
  getChild(childId: string) {
    return this.http
      .get<{ data: ChildResponse }>(`${this.apiBaseUrl}/children/${childId}`)
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
}
