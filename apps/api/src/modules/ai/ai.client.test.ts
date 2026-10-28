import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiProviderError, OpenAiCompatibleClient } from './ai.client.js';

describe('OpenAiCompatibleClient provider errors', () => {
  afterEach(() => vi.unstubAllGlobals());

  const client = () =>
    new OpenAiCompatibleClient({
      baseUrl: 'https://provider.example/v1',
      apiKey: 'test-only-key',
      model: 'test-model',
      timeoutMs: 1000,
      temperature: 0,
    });

  it.each([
    [401, 'credentials'],
    [403, 'credentials'],
    [404, 'model_or_endpoint'],
    [429, 'quota'],
    [400, 'request'],
    [503, 'unavailable'],
  ] as const)('classifies upstream HTTP %s without returning its body', async (status, kind) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('private provider detail', { status })),
    );
    let caught: unknown;
    try {
      await client().complete({ messages: [{ role: 'user', content: 'test prompt' }] });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(AiProviderError);
    expect(caught).toMatchObject({ kind });
    expect((caught as Error).message).not.toContain('private provider detail');
  });
});
