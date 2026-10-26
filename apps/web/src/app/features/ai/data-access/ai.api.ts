import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AiConversationDetailResponse,
  AiConversationSummary,
  AiLanguage,
  AiStatusResponse,
  CreateAiConversationRequest,
  SendAiMessageResponse,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class AiApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  status() {
    return this.http
      .get<{ data: AiStatusResponse }>(`${this.apiBaseUrl}/ai/status`)
      .pipe(map((response) => response.data));
  }

  listConversations() {
    return this.http
      .get<{ data: AiConversationSummary[] }>(`${this.apiBaseUrl}/ai/conversations`)
      .pipe(map((response) => response.data));
  }

  createConversation(input: { childId?: string; language: AiLanguage }) {
    const body: CreateAiConversationRequest = {
      language: input.language,
      ...(input.childId ? { childId: input.childId } : {}),
    };
    return this.http
      .post<{ data: AiConversationSummary }>(`${this.apiBaseUrl}/ai/conversations`, body)
      .pipe(map((response) => response.data));
  }

  getConversation(id: string) {
    return this.http
      .get<{ data: AiConversationDetailResponse }>(`${this.apiBaseUrl}/ai/conversations/${id}`)
      .pipe(map((response) => response.data));
  }

  deleteConversation(id: string) {
    return this.http
      .delete<{ data: { id: string } }>(`${this.apiBaseUrl}/ai/conversations/${id}`)
      .pipe(map((response) => response.data));
  }

  sendMessage(id: string, content: string) {
    return this.http
      .post<{ data: SendAiMessageResponse }>(`${this.apiBaseUrl}/ai/conversations/${id}/messages`, {
        content,
      })
      .pipe(map((response) => response.data));
  }
}
