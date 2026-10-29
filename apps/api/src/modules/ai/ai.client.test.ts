import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiProviderError, OpenAiCompatibleClient } from './ai.client.js';

describe('OpenAiCompatibleClient provider errors', () => {
  afterEach(() => vi.unstubAllGlobals());

  const client = (thinking: 'disabled' | 'low' | 'high' = 'disabled') =>
    new OpenAiCompatibleClient({
      baseUrl: 'https://provider.example/v1',
      apiKey: 'test-only-key',
      model: 'test-model',
      timeoutMs: 1000,
      temperature: 0,
      thinking,
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

  /**
   * Cost depends on these two shapes, not on a vendor's default: several vendors
   * reason before answering unless told not to, and bill the reasoning as output.
   */
  const sendAndReadBody = async (thinking: 'disabled' | 'low' | 'high') => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await client(thinking).complete({ messages: [{ role: 'user', content: 'hello' }] });
    return JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
  };

  it('disables reasoning and sends temperature when reasoning is off', async () => {
    const body = await sendAndReadBody('disabled');
    expect(body.thinking).toEqual({ type: 'disabled' });
    expect(body.temperature).toBe(0);
  });

  it('sends an effort level and omits temperature when reasoning is on', async () => {
    const body = await sendAndReadBody('low');
    expect(body.thinking).toEqual({ type: 'enabled' });
    expect(body.reasoning_effort).toBe('low');
    // Temperature is ignored, and silently so, while reasoning is on.
    expect(body).not.toHaveProperty('temperature');
  });
});
