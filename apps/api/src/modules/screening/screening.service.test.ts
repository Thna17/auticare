import { describe, expect, it, vi } from 'vitest';
import type { ScreeningFormKind } from '@auticare/contracts';
import { ScreeningService } from './screening.service.js';
import type { ScreeningRepository, ScreeningSessionRecord } from './screening.repository.js';

const actor = { parentId: 'parent-1', role: 'PARENT' as const };

const question = (overrides: Record<string, unknown> = {}) => ({
  id: 'q1',
  questionText: 'Does your child point at things?',
  category: 'Social Interaction',
  displayOrder: 1,
  polarity: 'REVERSE' as const,
  ageBand: 'TODDLER' as const,
  formKind: 'SHORT' as ScreeningFormKind,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const draftSession = (overrides: Record<string, unknown> = {}): ScreeningSessionRecord =>
  ({
    id: 'session-1',
    childId: 'child-1',
    status: 'DRAFT',
    ageBand: 'TODDLER',
    formKind: 'SHORT',
    startedAt: new Date('2026-01-01T00:00:00.000Z'),
    submittedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    answers: [],
    result: null,
    ...overrides,
  }) as ScreeningSessionRecord;

/** Only the methods the service under test reaches are stubbed. */
const stubRepository = (overrides: Partial<Record<keyof ScreeningRepository, unknown>> = {}) =>
  ({
    findChild: vi.fn().mockResolvedValue({
      id: 'child-1',
      parentId: 'parent-1',
      dateOfBirth: new Date('2023-06-01T00:00:00.000Z'),
    }),
    createSession: vi
      .fn()
      .mockImplementation((childId: string, ageBand: string, formKind: string) =>
        Promise.resolve({ ...draftSession(), childId, ageBand, formKind }),
      ),
    listActiveQuestionsForBand: vi.fn().mockResolvedValue([question()]),
    findQuestionById: vi.fn().mockResolvedValue(question()),
    findSessionById: vi.fn().mockResolvedValue(draftSession()),
    listSessionsForChild: vi.fn().mockResolvedValue([]),
    findLatestCompletedSession: vi.fn().mockResolvedValue(null),
    findPreviousCompletedSession: vi.fn().mockResolvedValue(null),
    submitSession: vi.fn(),
    upsertAnswer: vi.fn(),
    listActiveQuestions: vi.fn().mockResolvedValue([question()]),
    ...overrides,
  }) as unknown as ScreeningRepository;

describe('ScreeningService — short assessment', () => {
  it('defaults a session to the full instrument when no form kind is given', async () => {
    const repository = stubRepository();
    const service = new ScreeningService(repository);

    await service.createSession(actor, { childId: 'child-1' });

    expect(repository.createSession).toHaveBeenCalledWith('child-1', 'TODDLER', 'FULL');
    expect(repository.listActiveQuestionsForBand).toHaveBeenCalledWith('TODDLER', 'FULL');
  });

  it('serves the short question set, and freezes it on the session', async () => {
    const repository = stubRepository();
    const service = new ScreeningService(repository);

    const result = await service.createSession(actor, { childId: 'child-1', formKind: 'SHORT' });

    expect(repository.createSession).toHaveBeenCalledWith('child-1', 'TODDLER', 'SHORT');
    expect(result.session.formKind).toBe('SHORT');
    expect(result.questions).toHaveLength(1);
  });

  it('refuses to create a session for a form kind with no active questions', async () => {
    const repository = stubRepository({
      listActiveQuestionsForBand: vi.fn().mockResolvedValue([]),
    });
    const service = new ScreeningService(repository);

    await expect(
      service.createSession(actor, { childId: 'child-1', formKind: 'SHORT' }),
    ).rejects.toThrow(/No screening questions are configured/);
  });

  it('rejects an answer to a question from a different question set', async () => {
    const repository = stubRepository({
      findQuestionById: vi.fn().mockResolvedValue(question({ formKind: 'FULL' })),
    });
    const service = new ScreeningService(repository);

    await expect(
      service.upsertAnswer(actor, 'session-1', { questionId: 'q1', answerValue: 2 }),
    ).rejects.toThrow(/does not belong to this screening session/);
  });

  it('accepts an answer to a question in the session’s own set', async () => {
    const repository = stubRepository({
      upsertAnswer: vi.fn().mockResolvedValue({
        id: 'answer-1',
        screeningId: 'session-1',
        questionId: 'q1',
        answerValue: 2,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    });
    const service = new ScreeningService(repository);

    const answer = await service.upsertAnswer(actor, 'session-1', {
      questionId: 'q1',
      answerValue: 2,
    });

    expect(answer.answerValue).toBe(2);
    expect(repository.upsertAnswer).toHaveBeenCalledOnce();
  });
});
