import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  CreateScreeningSessionResponse,
  ScreeningAnswerResponse,
  ScreeningQuestionResponse,
  ScreeningSessionDetailResponse,
  UpsertScreeningAnswerRequest,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class ScreeningApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listQuestions() {
    return this.http
      .get<{ data: ScreeningQuestionResponse[] }>(`${this.apiBaseUrl}/screening/questions`)
      .pipe(map((response) => response.data));
  }

  createSession(childId: string) {
    return this.http
      .post<{ data: CreateScreeningSessionResponse }>(`${this.apiBaseUrl}/screening/sessions`, {
        childId,
      })
      .pipe(map((response) => response.data));
  }

  listSessions(childId: string) {
    return this.http
      .get<{ data: ScreeningSessionDetailResponse[] }>(
        `${this.apiBaseUrl}/screening/children/${childId}/sessions`,
      )
      .pipe(map((response) => response.data));
  }

  getSession(sessionId: string) {
    return this.http
      .get<{ data: ScreeningSessionDetailResponse }>(
        `${this.apiBaseUrl}/screening/sessions/${sessionId}`,
      )
      .pipe(map((response) => response.data));
  }

  upsertAnswer(sessionId: string, input: UpsertScreeningAnswerRequest) {
    return this.http
      .patch<{ data: ScreeningAnswerResponse }>(
        `${this.apiBaseUrl}/screening/sessions/${sessionId}/answers`,
        input,
      )
      .pipe(map((response) => response.data));
  }

  submitSession(sessionId: string) {
    return this.http
      .post<{ data: ScreeningSessionDetailResponse }>(
        `${this.apiBaseUrl}/screening/sessions/${sessionId}/submit`,
        {},
      )
      .pipe(map((response) => response.data));
  }
}
