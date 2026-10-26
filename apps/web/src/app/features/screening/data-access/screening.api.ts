import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AgeBand,
  CreateScreeningSessionResponse,
  ScreeningAnswerResponse,
  ScreeningFormKind,
  ScreeningQuestionResponse,
  ScreeningSessionDetailResponse,
  ScreeningSessionResultResponse,
  UpsertScreeningAnswerRequest,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class ScreeningApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listQuestions(ageBand?: AgeBand, formKind?: ScreeningFormKind) {
    const params = {
      ...(ageBand ? { ageBand } : {}),
      ...(formKind ? { formKind } : {}),
    };
    return this.http
      .get<{ data: ScreeningQuestionResponse[] }>(`${this.apiBaseUrl}/screening/questions`, {
        params,
      })
      .pipe(map((response) => response.data));
  }

  createSession(childId: string, formKind?: ScreeningFormKind) {
    return this.http
      .post<{ data: CreateScreeningSessionResponse }>(`${this.apiBaseUrl}/screening/sessions`, {
        childId,
        ...(formKind ? { formKind } : {}),
      })
      .pipe(map((response) => response.data));
  }

  /**
   * The child's newest completed session of one form kind, or null when they have
   * not been assessed with it yet. Null is a state, not an error, so the caller
   * can treat "not answered" and "answered badly" as different things.
   */
  getLatest(childId: string, formKind: ScreeningFormKind = 'SHORT') {
    return this.http
      .get<{ data: ScreeningSessionResultResponse | null }>(
        `${this.apiBaseUrl}/screening/children/${childId}/latest`,
        { params: { formKind } },
      )
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
      .get<{ data: ScreeningSessionResultResponse }>(
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
