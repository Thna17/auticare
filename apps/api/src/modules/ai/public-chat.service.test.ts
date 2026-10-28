import { describe, expect, it, vi } from 'vitest';
vi.mock('../guidance/guidance.service.js', () => ({ GuidanceService: class {} }));
import { PublicChatService } from './public-chat.service.js';
import type { AiClient } from './ai.client.js';
import { AiProviderError } from './ai.client.js';
import type { GroundingProvider } from './ai.grounding.js';

describe('PublicChatService', () => {
  const grounding: GroundingProvider = { retrieve: vi.fn().mockResolvedValue([]) };

  it('passes selected language and recent conversation history to the model', async () => {
    const complete = vi.fn().mockResolvedValue({
      content: 'Try a quiet, short activity together.',
      model: 'test-model',
      tokensIn: 20,
      tokensOut: 10,
      latencyMs: 5,
    });
    const client: AiClient = { configured: true, model: 'test-model', complete };
    const service = new PublicChatService(client, grounding);
    const result = await service.answer({
      content: 'What activities can I try?',
      language: 'en',
      history: [
        { role: 'USER', content: 'My child is four.' },
        { role: 'ASSISTANT', content: 'What do they enjoy?' },
      ],
    });
    expect(result.message).toContain('quiet');
    expect(complete.mock.calls[0]?.[0].messages).toEqual([
      expect.objectContaining({ role: 'system', content: expect.stringContaining('English') }),
      { role: 'user', content: 'My child is four.' },
      { role: 'assistant', content: 'What do they enjoy?' },
      { role: 'user', content: 'What activities can I try?' },
    ]);
  });

  it('answers urgent safety and medication requests without a provider call', async () => {
    const complete = vi.fn();
    const client: AiClient = { configured: true, model: 'test-model', complete };
    const service = new PublicChatService(client, grounding);
    const response = await service.answer({
      content: 'What dose of medication should I give?',
      language: 'en',
      history: [],
    });
    expect(response.message).toBeTruthy();
    expect(complete).not.toHaveBeenCalled();
  });

  it('reports an unconfigured provider instead of fabricating an answer', async () => {
    const service = new PublicChatService(
      { configured: false, model: null, complete: vi.fn() },
      grounding,
    );
    await expect(
      service.answer({
        content: 'How can I help my child communicate?',
        language: 'km',
        history: [],
      }),
    ).rejects.toMatchObject({ statusCode: 503 });
  });

  it('turns an upstream quota response into a safe, useful localized error', async () => {
    const client: AiClient = {
      configured: true,
      model: 'test-model',
      complete: vi
        .fn()
        .mockRejectedValue(new AiProviderError('raw provider response omitted', 'quota')),
    };
    const service = new PublicChatService(client, grounding);
    await expect(
      service.answer({ content: 'សូមផ្តល់យោបល់អំពីការលេង', language: 'km', history: [] }),
    ).rejects.toMatchObject({
      statusCode: 502,
      message: 'ដល់កំណត់ការប្រើប្រាស់សេវា AI ហើយ។ សូមពិនិត្យកូតា និងការទូទាត់។',
    });
  });
});
