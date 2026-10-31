import { beforeEach, describe, expect, it, vi } from 'vitest';

const { activityFindMany } = vi.hoisted(() => ({
  activityFindMany: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../database/prisma.js', () => ({
  prisma: { activity: { findMany: activityFindMany } },
}));

// The spend estimate is stubbed so the budget guard can be tested without a
// provider price table or a database.
const { estimateSpendUsd } = vi.hoisted(() => ({ estimateSpendUsd: vi.fn(() => 0) }));
vi.mock('./ai.pricing.js', () => ({ estimateSpendUsd, warnOnceForUnpricedModel: vi.fn() }));

import type { AiClient } from './ai.client.js';
import type { GroundingProvider } from './ai.grounding.js';
import { AiService } from './ai.service.js';
import type { AiRepository } from './ai.repository.js';

const parent = { parentId: 'parent-1', role: 'PARENT' as const };
const initialConversation = () => ({
  id: 'conversation-1',
  parentId: parent.parentId,
  childId: 'child-1',
  title: 'A question',
  language: 'en',
  createdAt: new Date(),
  updatedAt: new Date(),
  messages: [
    { role: 'USER', content: 'What are some calming ideas?' },
    { role: 'ASSISTANT', content: 'Try a quiet, familiar activity.' },
  ],
});

describe('AiService parent assistant', () => {
  let repository: Record<string, ReturnType<typeof vi.fn>>;
  let client: AiClient & { complete: ReturnType<typeof vi.fn> };
  let grounding: GroundingProvider & { retrieve: ReturnType<typeof vi.fn> };
  let service: AiService;
  let providerMessages: unknown[];

  beforeEach(() => {
    activityFindMany.mockClear();
    estimateSpendUsd.mockReturnValue(0);
    providerMessages = [];
    let messageIndex = 0;
    repository = {
      findConversation: vi.fn().mockResolvedValue(initialConversation()),
      countUserMessagesSince: vi.fn().mockResolvedValue(0),
      createMessage: vi.fn().mockImplementation(async (input) => ({
        id: `message-${++messageIndex}`,
        conversationId: input.conversationId,
        role: input.role,
        kind: input.kind ?? 'ANSWER',
        content: input.content,
        model: input.model ?? null,
        sources: input.sources ?? null,
        savedAt: null,
        feedback: null,
        feedbackNote: null,
        createdAt: new Date(),
      })),
      setLanguage: vi.fn().mockResolvedValue({}),
      setTitle: vi.fn().mockResolvedValue({}),
      touchConversation: vi.fn().mockResolvedValue({}),
      findChild: vi.fn().mockResolvedValue({
        id: 'child-1',
        parentId: parent.parentId,
        dateOfBirth: new Date('2022-01-01T00:00:00Z'),
      }),
      countObservationsSince: vi.fn().mockResolvedValue(4),
      providerUsageSince: vi.fn().mockResolvedValue([]),
    };
    client = {
      configured: true,
      model: 'test-model',
      complete: vi.fn().mockImplementation(async (request) => {
        providerMessages = request.messages;
        return {
          content: 'Try one calm activity together, such as looking at a favorite book.',
          model: 'test-model',
          tokensIn: 10,
          tokensOut: 12,
          latencyMs: 8,
        };
      }),
    };
    grounding = { retrieve: vi.fn().mockResolvedValue([]) };
    service = new AiService(repository as unknown as AiRepository, client, grounding);
  });

  it('answers in the language the parent wrote in, with recent conversation turns', async () => {
    await service.sendMessage(parent, 'conversation-1', {
      content: 'តើមានគំនិតផ្សេងទៀតទេ?',
      language: 'en',
    });
    expect(repository.setLanguage).not.toHaveBeenCalled();
    expect(grounding.retrieve).toHaveBeenCalledWith({
      query: 'តើមានគំនិតផ្សេងទៀតទេ?',
      language: 'km',
    });
    expect(providerMessages[0]).toMatchObject({
      role: 'system',
      content: expect.stringContaining('Khmer (ភាសាខ្មែរ)'),
    });
    expect(providerMessages).toContainEqual({
      role: 'user',
      content: 'What are some calming ideas?',
    });
    expect(providerMessages.at(-1)).toEqual({
      role: 'user',
      content: 'តើមានគំនិតផ្សេងទៀតទេ?',
    });
  });

  it('answers an English message in English even when the site is set to Khmer', async () => {
    await service.sendMessage(parent, 'conversation-1', {
      content: 'Can you give another idea?',
      language: 'km',
    });
    expect(repository.setLanguage).toHaveBeenCalledWith('conversation-1', 'km');
    expect(grounding.retrieve).toHaveBeenCalledWith({
      query: 'Can you give another idea?',
      language: 'en',
    });
    expect(providerMessages[0]).toMatchObject({
      role: 'system',
      content: expect.stringContaining('Write your entire answer in English'),
    });
    expect(providerMessages).toContainEqual({
      role: 'user',
      content: 'What are some calming ideas?',
    });
    expect(providerMessages).toContainEqual({
      role: 'assistant',
      content: 'Try a quiet, familiar activity.',
    });
    expect(providerMessages.at(-1)).toEqual({
      role: 'user',
      content: 'Can you give another idea?',
    });
  });

  it('does not send child context merely because a conversation is linked to a child', async () => {
    await service.sendMessage(parent, 'conversation-1', {
      content: 'What can I try?',
      language: 'en',
    });
    expect(repository.findChild).not.toHaveBeenCalled();
    expect(repository.countObservationsSince).not.toHaveBeenCalled();
    expect((providerMessages[0] as { content: string }).content).not.toContain('months old');
  });

  it('sends only age and recent observation count when the parent opts in', async () => {
    await service.sendMessage(parent, 'conversation-1', {
      content: 'What can I try?',
      language: 'en',
      includeChildContext: true,
      childId: 'child-1',
    });
    const prompt = (providerMessages[0] as { content: string }).content;
    const childBackground = prompt.split('Background you may use')[1] ?? '';
    expect(prompt).toContain('months old');
    expect(prompt).toContain('4 observation(s)');
    expect(childBackground).not.toContain('concern');
    expect(childBackground).not.toContain('questionnaire');
    expect(childBackground).not.toContain('Sophea');
    expect(repository.findChild).toHaveBeenCalledWith('child-1');
  });

  it('stops new model calls once the day’s estimated spend reaches the budget', async () => {
    estimateSpendUsd.mockReturnValue(999);

    await expect(
      service.sendMessage(parent, 'conversation-1', { content: 'What can I try?', language: 'en' }),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED', statusCode: 429 });

    // Nothing reached the provider, and the parent's words were not stored for
    // an answer that will never come.
    expect(client.complete).not.toHaveBeenCalled();
    expect(repository.createMessage).not.toHaveBeenCalled();
  });

  it('still answers a crisis message on a day the budget is spent', async () => {
    estimateSpendUsd.mockReturnValue(999);

    const result = await service.sendMessage(parent, 'conversation-1', {
      content: 'I want to die',
      language: 'en',
    });

    expect(result.assistantMessage.kind).toBe('CRISIS');
    expect(client.complete).not.toHaveBeenCalled();
  });
});
