import type {
  AiLanguage,
  ChildSummaryResponse,
  GenerateChildSummaryRequest,
  UserRole,
} from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { logger } from '../../config/logger.js';
import { InsightsService } from '../insights/insights.service.js';
import { assertWithinDailyBudget, combineUsage } from './ai.budget.js';
import { AiRepository } from './ai.repository.js';
import type { AiClient } from './ai.client.js';
import { aiClient, AiProviderError } from './ai.client.js';
import { ageInMonths, buildSummaryFacts, factsHash } from './ai.summary.facts.js';
import { buildSummaryPrompt, SUMMARY_PROMPT_VERSION } from './ai.summary.prompt.js';
import { AiSummaryRepository } from './ai.summary.repository.js';
import { ensureReferral, softenDiagnosisClaims } from './ai.safety.js';

type Actor = { parentId: string; role: UserRole };

const DEFAULT_DAYS = 28;

/**
 * Khmer needs noticeably more tokens than English for the same text, and a
 * summary that stops mid-sentence is worse than one that took a second try. The
 * first cap is generous, the second very generous; anything still truncated is
 * refused rather than stored.
 */
const OUTPUT_TOKEN_CAPS = [1200, 2400] as const;

export class AiSummaryService {
  constructor(
    private readonly repository = new AiSummaryRepository(),
    private readonly insights = new InsightsService(),
    private readonly client: AiClient = aiClient,
    /** Chat usage, so the daily ceiling covers summaries *and* chat. */
    private readonly chatUsage = new AiRepository(),
  ) {}

  /**
   * The summary a parent already has, without spending anything.
   *
   * `cached` is true here by definition: the text was written at some earlier
   * moment, and the UI says so instead of implying it was just generated.
   */
  async latest(
    actor: Actor,
    childId: string,
    language: AiLanguage,
  ): Promise<{ summary: ChildSummaryResponse | null }> {
    const child = await this.requireOwnedChild(actor, childId);
    const row = await this.repository.findLatest(child.id, language);
    return { summary: row ? this.toResponse(row, true) : null };
  }

  /**
   * Write a summary, or hand back the stored one when the records have not moved.
   *
   * Order matters: ownership, then facts, then the free cache check, then the
   * provider. A parent who opens the same unchanged week twice is never charged
   * twice, and a summary is never rewritten from a different set of facts without
   * the hash changing first.
   */
  async generate(
    actor: Actor,
    childId: string,
    input: GenerateChildSummaryRequest,
  ): Promise<ChildSummaryResponse> {
    const child = await this.requireOwnedChild(actor, childId);
    const language: AiLanguage = input.language ?? 'en';
    const days = input.days ?? DEFAULT_DAYS;

    // Facts come from the same deterministic engine the insights screen uses, so
    // the summary and the charts can never disagree.
    const insight = await this.insights.forChild(actor, child.id, {
      days,
      ...(input.tzOffset !== undefined ? { tzOffset: input.tzOffset } : {}),
    });

    if (insight.observationCount === 0) {
      throw new AppError(
        'VALIDATION_ERROR',
        'There is nothing recorded for this child yet. A few observations will give the summary something to describe.',
        400,
      );
    }

    const facts = buildSummaryFacts({
      ageMonths: ageInMonths(child.dateOfBirth),
      windowDays: days,
      insight,
    });
    const hash = factsHash(facts);

    const existing = await this.repository.findMatching(child.id, language, hash);
    if (existing) {
      return this.toResponse(existing, true);
    }

    if (!this.client.configured) {
      throw new AppError(
        'AI_UNAVAILABLE',
        'The assistant has not been set up on this installation yet.',
        503,
      );
    }
    await assertWithinDailyBudget(combineUsage(this.chatUsage, this.repository), this.client.model);

    const messages = buildSummaryPrompt({ facts, language });
    let completion;
    try {
      for (const maxTokens of OUTPUT_TOKEN_CAPS) {
        completion = await this.client.complete({ messages, maxTokens });
        if (completion.finishReason !== 'length') break;
        logger.warn({ maxTokens, language }, 'AI summary was cut off; retrying with more room');
      }
    } catch (error) {
      const message =
        error instanceof AiProviderError ? error.message : 'The summary could not be written.';
      logger.warn({ err: error }, 'AI summary failed');
      throw new AppError('INTERNAL_ERROR', message, 502);
    }

    // A half sentence is never stored: the parent would read it as the end.
    if (!completion || completion.finishReason === 'length') {
      throw new AppError(
        'INTERNAL_ERROR',
        'The summary came back incomplete. Please try again in a moment.',
        502,
      );
    }

    // Same post-processing as chat: a verdict is softened and a clinician referral
    // is guaranteed, whatever the model decided to write.
    const content = ensureReferral(softenDiagnosisClaims(completion.content), language);

    const stored = await this.repository.create({
      childId: child.id,
      language,
      windowDays: days,
      windowStart: new Date(insight.windowStart),
      windowEnd: new Date(insight.windowEnd),
      factsHash: hash,
      content,
      model: completion.model,
      promptVersion: SUMMARY_PROMPT_VERSION,
      tokensIn: completion.tokensIn,
      tokensOut: completion.tokensOut,
    });

    return this.toResponse(stored, false);
  }

  /**
   * Ownership check that fails closed: a child belonging to someone else is a
   * 404, because a 403 would confirm the id exists.
   */
  private async requireOwnedChild(
    actor: Actor,
    childId: string,
  ): Promise<{ id: string; parentId: string; dateOfBirth: Date }> {
    if (actor.role !== 'PARENT') throw forbidden();
    const child = await this.repository.findChild(childId);
    if (!child || child.parentId !== actor.parentId) {
      throw notFound('Child profile was not found.');
    }
    return child;
  }

  private toResponse(
    row: {
      childId: string;
      content: string;
      language: string;
      model: string;
      promptVersion: string;
      windowDays: number;
      createdAt: Date;
    },
    cached: boolean,
  ): ChildSummaryResponse {
    return {
      childId: row.childId,
      content: row.content,
      language: row.language === 'km' ? 'km' : 'en',
      model: row.model,
      promptVersion: row.promptVersion,
      windowDays: row.windowDays,
      generatedAt: row.createdAt.toISOString(),
      cached,
    };
  }
}
