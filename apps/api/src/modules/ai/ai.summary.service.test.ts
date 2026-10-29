import type { ChildInsightResponse } from '@auticare/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InsightsService } from '../insights/insights.service.js';
import type { AiClient } from './ai.client.js';
import type { AiRepository } from './ai.repository.js';
import type { AiSummaryRepository } from './ai.summary.repository.js';
import { AiSummaryService } from './ai.summary.service.js';

const parent = { parentId: 'parent-1', role: 'PARENT' as const };

const insight = (overrides: Partial<ChildInsightResponse> = {}): ChildInsightResponse => ({
  childId: 'child-1',
  windowStart: '2026-10-01T00:00:00.000Z',
  windowEnd: '2026-10-29T00:00:00.000Z',
  observationCount: 9,
  distinctDays: 6,
  patterns: [
    {
      category: 'SENSORY',
      count: 4,
      share: 0.44,
      averageIntensity: 3,
      trend: 'INCREASED',
      weekdayCount: 3,
      weekendCount: 1,
      timeOfDay: 'EVENING',
    },
  ],
  summary: 'audit text',
  analysisVersion: 'patterns-v1',
  generatedAt: '2026-10-28T00:00:00.000Z',
  ...overrides,
});

const stored = (overrides: Record<string, unknown> = {}) => ({
  id: 'summary-1',
  childId: 'child-1',
  language: 'en',
  windowDays: 28,
  windowStart: new Date('2026-10-01T00:00:00.000Z'),
  windowEnd: new Date('2026-10-29T00:00:00.000Z'),
  factsHash: 'hash',
  content: 'You recorded nine observations on six days.',
  model: 'deepseek-flash',
  promptVersion: 'summary-v1',
  tokensIn: 400,
  tokensOut: 120,
  createdAt: new Date('2026-10-28T09:00:00.000Z'),
  ...overrides,
});

describe('AiSummaryService', () => {
  let repository: Record<string, ReturnType<typeof vi.fn>>;
  let insights: { forChild: ReturnType<typeof vi.fn> };
  let client: AiClient & { complete: ReturnType<typeof vi.fn> };
  let chatUsage: { providerUsageSince: ReturnType<typeof vi.fn> };
  let service: AiSummaryService;
  let sent: { role: string; content: string }[];

  beforeEach(() => {
    sent = [];
    repository = {
      findChild: vi.fn().mockResolvedValue({
        id: 'child-1',
        parentId: parent.parentId,
        dateOfBirth: new Date('2022-03-15T00:00:00.000Z'),
      }),
      findLatest: vi.fn().mockResolvedValue(null),
      findMatching: vi.fn().mockResolvedValue(null),
      create: vi
        .fn()
        .mockImplementation(async (input) => stored({ ...input, createdAt: new Date() })),
      providerUsageSince: vi.fn().mockResolvedValue([]),
    };
    insights = { forChild: vi.fn().mockResolvedValue(insight()) };
    client = {
      configured: true,
      model: 'deepseek-flash',
      complete: vi.fn().mockImplementation(async (request) => {
        sent = request.messages;
        return {
          content: 'You recorded nine observations on six days. A few things to try this week.',
          model: 'deepseek-flash',
          tokensIn: 400,
          tokensOut: 120,
          latencyMs: 900,
          finishReason: 'stop',
        };
      }),
    };
    chatUsage = { providerUsageSince: vi.fn().mockResolvedValue([]) };

    service = new AiSummaryService(
      repository as unknown as AiSummaryRepository,
      insights as unknown as InsightsService,
      client,
      chatUsage as unknown as AiRepository,
    );
  });

  it('serves the stored wording when the recorded facts have not changed', async () => {
    repository['findMatching']!.mockResolvedValue(stored());

    const result = await service.generate(parent, 'child-1', { language: 'en' });

    expect(client.complete).not.toHaveBeenCalled();
    expect(repository['create']).not.toHaveBeenCalled();
    expect(result.cached).toBe(true);
    expect(result.content).toContain('nine observations');
  });

  it('writes a new summary, stores its provenance and reports it as fresh', async () => {
    const result = await service.generate(parent, 'child-1', { language: 'en', days: 28 });

    expect(client.complete).toHaveBeenCalledTimes(1);
    const created = repository['create']!.mock.calls[0]![0];
    expect(created).toMatchObject({
      childId: 'child-1',
      language: 'en',
      windowDays: 28,
      model: 'deepseek-flash',
      promptVersion: 'summary-v1',
      tokensIn: 400,
      tokensOut: 120,
    });
    expect(typeof created.factsHash).toBe('string');
    expect(result.cached).toBe(false);
    // A health answer always ends by pointing to a clinician.
    expect(result.content).toMatch(/clinician|doctor/i);
  });

  it('sends only computed facts to the model, never the child identity', async () => {
    await service.generate(parent, 'child-1', { language: 'en' });

    const factsTurn = sent.at(-1)!;
    expect(factsTurn.role).toBe('user');
    expect(factsTurn.content).toContain('sensory reactions: 4 record(s)');
    expect(factsTurn.content).toContain('more than the period before');
    expect(factsTurn.content).not.toContain('child-1');
    expect(factsTurn.content).not.toContain('Dara');
  });

  it('refuses a child that belongs to another parent without revealing it', async () => {
    repository['findChild']!.mockResolvedValue({
      id: 'child-1',
      parentId: 'someone-else',
      dateOfBirth: new Date('2022-03-15T00:00:00.000Z'),
    });

    await expect(service.generate(parent, 'child-1', { language: 'en' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
    expect(client.complete).not.toHaveBeenCalled();
  });

  it('does not spend a provider call when nothing has been recorded', async () => {
    insights.forChild.mockResolvedValue(
      insight({ observationCount: 0, distinctDays: 0, patterns: [] }),
    );

    await expect(service.generate(parent, 'child-1', { language: 'en' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
    expect(client.complete).not.toHaveBeenCalled();
  });

  it('retries once with more room, then refuses to store a cut-off summary', async () => {
    client.complete.mockResolvedValue({
      content: 'Your records show nine observations, and the sensory',
      model: 'deepseek-flash',
      tokensIn: 500,
      tokensOut: 1200,
      latencyMs: 900,
      finishReason: 'length',
    });

    await expect(service.generate(parent, 'child-1', { language: 'km' })).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      statusCode: 502,
    });
    // Both caps were tried before giving up.
    expect(client.complete).toHaveBeenCalledTimes(2);
    expect(repository['create']).not.toHaveBeenCalled();
  });

  it('returns nothing for a child with no stored summary', async () => {
    const result = await service.latest(parent, 'child-1', 'km');
    expect(result.summary).toBeNull();
    expect(repository['findLatest']).toHaveBeenCalledWith('child-1', 'km');
  });
});
