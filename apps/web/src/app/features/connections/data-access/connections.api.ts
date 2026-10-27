import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  ConnectionPreviewResponse,
  ConnectSchoolRequest,
  ParentSchoolConnection,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

/** A parent's connections between their children and schools. */
@Injectable({ providedIn: 'root' })
export class ConnectionsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/connections`;

  list() {
    return this.http
      .get<{ data: ParentSchoolConnection[] }>(this.base)
      .pipe(map((response) => response.data));
  }

  /** POST, so the code never ends up in a URL. */
  preview(code: string) {
    return this.http
      .post<{ data: ConnectionPreviewResponse }>(`${this.base}/preview`, { code })
      .pipe(map((response) => response.data));
  }

  connect(input: ConnectSchoolRequest) {
    return this.http
      .post<{ data: ParentSchoolConnection }>(this.base, input)
      .pipe(map((response) => response.data));
  }

  disconnect(enrollmentId: string) {
    return this.http
      .delete<{ data: { disconnected: true } }>(`${this.base}/${enrollmentId}`)
      .pipe(map((response) => response.data));
  }
}
