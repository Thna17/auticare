import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type AiCompletion = {
  content: string;
  model: string;
  tokensIn: number | null;
  tokensOut: number | null;
  latencyMs: number;
};

export type AiCompletionRequest = {
  messages: readonly ChatMessage[];
  maxTokens?: number;
};

/** Raised when the provider is unreachable, slow, or answers with something unusable. */
export class AiProviderError extends Error {}

export interface AiClient {
  /** False when no provider is configured. Callers must check before calling. */
  readonly configured: boolean;
  /** The model identifier, or null when unconfigured. */
  readonly model: string | null;
  complete(request: AiCompletionRequest): Promise<AiCompletion>;
}

type ProviderConfig = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs: number;
  temperature: number;
};

/**
 * Any OpenAI-compatible chat-completions endpoint.
 *
 * Kept as one small adapter behind `AiClient` so a different vendor is a config
 * change plus, at most, one new class — not a rewrite of the assistant. The key
 * is read from configuration only: it is never logged, returned to a client, or
 * written into a conversation row.
 */
export class OpenAiCompatibleClient implements AiClient {
  constructor(private readonly config: ProviderConfig) {}

  get configured(): boolean {
    return Boolean(this.config.baseUrl && this.config.model);
  }

  get model(): string | null {
    return this.config.model ?? null;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletion> {
    const baseUrl = this.config.baseUrl;
    const model = this.config.model;
    if (!baseUrl || !model) {
      throw new AiProviderError('No model provider is configured.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(this.config.apiKey ? { authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: this.config.temperature,
          ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Status only. A provider error body can echo request content, which here
        // is a description of a child.
        logger.warn({ status: response.status }, 'AI provider returned an error');
        throw new AiProviderError('The assistant could not answer just now.');
      }

      const body = (await response.json()) as {
        choices?: { message?: { content?: unknown } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const content = body.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || content.trim() === '') {
        throw new AiProviderError('The assistant returned an empty answer.');
      }

      return {
        content: content.trim(),
        model,
        tokensIn: body.usage?.prompt_tokens ?? null,
        tokensOut: body.usage?.completion_tokens ?? null,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      // Aborts and network failures are reported as one neutral message so the
      // parent is not shown a stack trace or an internal hostname.
      throw new AiProviderError('The assistant could not be reached just now.', {
        cause: error,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * The client the app uses. `configured` is evaluated from env at import time so a
 * deployment without a key is a reported state rather than a runtime surprise.
 */
export const aiClient: AiClient = new OpenAiCompatibleClient({
  ...(env.AI_BASE_URL ? { baseUrl: env.AI_BASE_URL } : {}),
  ...(env.AI_API_KEY ? { apiKey: env.AI_API_KEY } : {}),
  ...(env.AI_MODEL ? { model: env.AI_MODEL } : {}),
  timeoutMs: env.AI_TIMEOUT_MS,
  temperature: env.AI_TEMPERATURE,
});
