import type {
  AdminActivity,
  AdminAiMonitoring,
  AdminQuestion,
  AdminQuestionnaire,
  CreateQuestionRequest,
  SaveActivityRequest,
  UpdateQuestionRequest,
  UserRole,
} from '@auticare/contracts';
import type { Activity, ScreeningQuestion } from '@prisma/client';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { prisma } from '../../database/prisma.js';
import { aiClient } from '../ai/ai.client.js';
import { RULES } from '../ai/ai.prompt.js';
import { auditService } from '../audit/audit.service.js';

type Actor = { parentId: string; role: UserRole };

const DAY_MS = 24 * 60 * 60 * 1000;

const toAdminActivity = (row: Activity, completions: number): AdminActivity => ({
  id: row.id,
  title: row.title,
  category: row.category,
  minAgeMonths: row.minAgeMonths,
  maxAgeMonths: row.maxAgeMonths,
  summary: row.summary,
  steps: row.steps,
  imageUrl: row.imageUrl,
  videoUrl: row.videoUrl,
  resourceUrl: row.resourceUrl,
  status: row.status,
  professionallyReviewed: row.professionallyReviewed,
  reviewedBy: row.reviewedBy,
  completions,
  updatedAt: row.updatedAt.toISOString(),
});

const toAdminQuestion = (row: ScreeningQuestion, answerCount: number): AdminQuestion => ({
  id: row.id,
  questionText: row.questionText,
  category: row.category,
  displayOrder: row.displayOrder,
  polarity: row.polarity,
  ageBand: row.ageBand,
  formKind: row.formKind,
  isActive: row.isActive,
  version: row.version,
  replacesId: row.replacesId,
  answerCount,
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * The admin's content tools: the activity library, the questionnaire, and a
 * read-only view of how the AI assistant is being used. None of it exposes a
 * family's answers, notes or conversations; only counts.
 */
export class AdminContentService {
  private requireAdmin(actor: Actor) {
    if (actor.role !== 'ADMIN') throw forbidden();
  }

  // --- Resources & activities ---------------------------------------------

  async listActivities(actor: Actor): Promise<AdminActivity[]> {
    this.requireAdmin(actor);
    const [rows, counts] = await Promise.all([
      prisma.activity.findMany({
        orderBy: [{ status: 'asc' }, { category: 'asc' }, { title: 'asc' }],
      }),
      prisma.activityProgress.groupBy({
        by: ['activityId'],
        where: { completedAt: { not: null } },
        _count: { _all: true },
      }),
    ]);
    const done = new Map(counts.map((c) => [c.activityId, c._count._all]));
    return rows.map((row) => toAdminActivity(row, done.get(row.id) ?? 0));
  }

  async saveActivity(
    actor: Actor,
    input: SaveActivityRequest,
    id?: string,
  ): Promise<AdminActivity> {
    this.requireAdmin(actor);
    if (id && !(await prisma.activity.findUnique({ where: { id }, select: { id: true } }))) {
      throw notFound('Activity was not found.');
    }
    const data = {
      title: input.title,
      category: input.category,
      minAgeMonths: Number(input.minAgeMonths),
      maxAgeMonths: Number(input.maxAgeMonths),
      summary: input.summary,
      steps: input.steps ?? null,
      imageUrl: input.imageUrl ?? null,
      videoUrl: input.videoUrl ?? null,
      resourceUrl: input.resourceUrl ?? null,
      status: input.status,
      professionallyReviewed: input.professionallyReviewed,
      reviewedBy: input.professionallyReviewed ? (input.reviewedBy ?? null) : null,
    };
    const row = id
      ? await prisma.activity.update({ where: { id }, data })
      : await prisma.activity.create({ data });
    await auditService.record({
      action: id ? 'ACTIVITY_UPDATED' : 'ACTIVITY_CREATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: row.id,
      metadata: { title: row.title, status: row.status },
    });
    const completions = await prisma.activityProgress.count({
      where: { activityId: row.id, completedAt: { not: null } },
    });
    return toAdminActivity(row, completions);
  }

  // --- Questionnaire --------------------------------------------------------

  async questionnaire(actor: Actor): Promise<AdminQuestionnaire> {
    this.requireAdmin(actor);
    const [rows, answers, sessions] = await Promise.all([
      prisma.screeningQuestion.findMany({
        orderBy: [
          { formKind: 'asc' },
          { ageBand: 'asc' },
          { displayOrder: 'asc' },
          { version: 'desc' },
        ],
      }),
      prisma.screeningAnswer.groupBy({ by: ['questionId'], _count: { _all: true } }),
      prisma.screening.groupBy({
        by: ['ageBand', 'formKind', 'status'],
        _count: { _all: true },
      }),
    ]);
    const answerCount = new Map(answers.map((a) => [a.questionId, a._count._all]));
    const stats = (['FULL', 'SHORT'] as const).flatMap((formKind) =>
      (['TODDLER', 'PRESCHOOL'] as const).map((ageBand) => {
        const forBand = sessions.filter((s) => s.formKind === formKind && s.ageBand === ageBand);
        return {
          ageBand,
          formKind,
          started: forBand.reduce((sum, s) => sum + s._count._all, 0),
          completed: forBand
            .filter((s) => s.status !== 'DRAFT')
            .reduce((sum, s) => sum + s._count._all, 0),
        };
      }),
    );
    return {
      questions: rows.map((row) => toAdminQuestion(row, answerCount.get(row.id) ?? 0)),
      stats,
    };
  }

  async createQuestion(actor: Actor, input: CreateQuestionRequest): Promise<AdminQuestion> {
    this.requireAdmin(actor);
    const row = await prisma.screeningQuestion.create({ data: { ...input, version: 1 } });
    await auditService.record({
      action: 'QUESTION_CREATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: row.id,
      metadata: { formKind: row.formKind, ageBand: row.ageBand },
    });
    return toAdminQuestion(row, 0);
  }

  /**
   * Publishes an edit as a new version. The old row is retired, not changed, so
   * every answer already given keeps the exact wording the parent saw.
   */
  async updateQuestion(
    actor: Actor,
    id: string,
    input: UpdateQuestionRequest,
  ): Promise<AdminQuestion> {
    this.requireAdmin(actor);
    const current = await prisma.screeningQuestion.findUnique({ where: { id } });
    if (!current) throw notFound('Question was not found.');
    if (!current.isActive) {
      throw new AppError('VALIDATION_ERROR', 'Only the current version can be edited.', 400);
    }
    const next = await prisma.$transaction(async (tx) => {
      await tx.screeningQuestion.update({ where: { id }, data: { isActive: false } });
      return tx.screeningQuestion.create({
        data: {
          questionText: input.questionText,
          category: input.category,
          polarity: input.polarity,
          displayOrder: input.displayOrder,
          ageBand: current.ageBand,
          formKind: current.formKind,
          version: current.version + 1,
          replacesId: current.id,
        },
      });
    });
    await auditService.record({
      action: 'QUESTION_VERSION_PUBLISHED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: next.id,
      metadata: { replacesId: current.id, version: next.version },
    });
    return toAdminQuestion(next, 0);
  }

  /** Retires a question from new questionnaires, or brings a retired one back. */
  async setQuestionActive(actor: Actor, id: string, isActive: boolean): Promise<AdminQuestion> {
    this.requireAdmin(actor);
    const current = await prisma.screeningQuestion.findUnique({ where: { id } });
    if (!current) throw notFound('Question was not found.');
    if (isActive) {
      // Only one version of a question may be live at a time.
      const newer = await prisma.screeningQuestion.findFirst({
        where: { replacesId: current.id },
        select: { id: true },
      });
      if (newer) {
        throw new AppError(
          'VALIDATION_ERROR',
          'A newer version of this question exists. Edit that one instead.',
          400,
        );
      }
    }
    const row = await prisma.screeningQuestion.update({ where: { id }, data: { isActive } });
    await auditService.record({
      action: isActive ? 'QUESTION_RESTORED' : 'QUESTION_ARCHIVED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: id,
    });
    const answerCount = await prisma.screeningAnswer.count({ where: { questionId: id } });
    return toAdminQuestion(row, answerCount);
  }

  // --- AI monitoring ------------------------------------------------------

  /** Usage and response times only. Never conversation text or child context. */
  async aiMonitoring(actor: Actor, days: number): Promise<AdminAiMonitoring> {
    this.requireAdmin(actor);
    const since = new Date(Date.now() - days * DAY_MS);
    const [messages, conversations, reviewedSources] = await Promise.all([
      prisma.aiMessage.findMany({
        where: { createdAt: { gte: since } },
        select: {
          role: true,
          kind: true,
          latencyMs: true,
          tokensIn: true,
          tokensOut: true,
          createdAt: true,
        },
      }),
      prisma.aiConversation.count({ where: { createdAt: { gte: since } } }),
      prisma.knowledgeDocument.count(),
    ]);
    const answers = messages.filter((m) => m.role === 'ASSISTANT');
    const latencies = answers.map((m) => m.latencyMs).filter((n): n is number => n !== null);
    const average = (values: number[]) =>
      values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;

    const byDay = new Map<string, { questions: number; latencies: number[] }>();
    for (let i = days - 1; i >= 0; i--) {
      byDay.set(new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10), {
        questions: 0,
        latencies: [],
      });
    }
    for (const m of messages) {
      const day = byDay.get(m.createdAt.toISOString().slice(0, 10));
      if (!day) continue;
      if (m.role === 'USER') day.questions += 1;
      else if (m.latencyMs !== null) day.latencies.push(m.latencyMs);
    }

    return {
      configured: aiClient.configured,
      model: aiClient.model,
      days,
      totals: {
        conversations,
        questions: messages.filter((m) => m.role === 'USER').length,
        answers: answers.length,
        crisisReplies: answers.filter((m) => m.kind === 'CRISIS').length,
        medicationReplies: answers.filter((m) => m.kind === 'MEDICATION').length,
        avgLatencyMs: average(latencies),
        tokensIn: answers.reduce((sum, m) => sum + (m.tokensIn ?? 0), 0),
        tokensOut: answers.reduce((sum, m) => sum + (m.tokensOut ?? 0), 0),
        reviewedSources,
      },
      daily: [...byDay.entries()].map(([date, value]) => ({
        date,
        questions: value.questions,
        avgLatencyMs: average(value.latencies),
      })),
      rules: RULES,
    };
  }
}
