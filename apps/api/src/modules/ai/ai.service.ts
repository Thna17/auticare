import type {
  AiConversationDetailResponse,
  AiLanguage,
  AiStatusResponse,
  CreateAiConversationRequest,
  SendAiMessageRequest,
  SendAiMessageResponse,
  UserRole,
} from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import type { AiClient } from './ai.client.js';
import { aiClient, AiProviderError } from './ai.client.js';
import type { GroundingProvider } from './ai.grounding.js';
import { GuidanceService } from '../guidance/guidance.service.js';
import type { ConversationSummaryResponse } from './ai.mapper.js';
import { toAiMessageResponse, toConversationSummary } from './ai.mapper.js';
import type { ChildContext, GroundingPassage } from './ai.prompt.js';
import { buildConversationMessages, buildSystemPrompt, titleFromMessage } from './ai.prompt.js';
import { prisma } from '../../database/prisma.js';
import type { FeedbackAiMessageRequest, AiMessageResponse } from '@auticare/contracts';
import { AiRepository } from './ai.repository.js';
import {
  classifyParentMessage,
  crisisReply,
  ensureReferral,
  medicationReply,
  softenDiagnosisClaims,
} from './ai.safety.js';

type Actor = { parentId: string; role: UserRole };

const DAY_MS = 86_400_000;

const startOfUtcDay = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/** Whole months lived, so the model is told an age rather than a birth date. */
const ageInMonths = (dateOfBirth: Date, at: Date = new Date()): number => {
  let months =
    (at.getUTCFullYear() - dateOfBirth.getUTCFullYear()) * 12 +
    (at.getUTCMonth() - dateOfBirth.getUTCMonth());
  if (at.getUTCDate() < dateOfBirth.getUTCDate()) months -= 1;
  return Math.max(months, 0);
};

/** Passage numbers the answer actually cited, e.g. "(1)" or "(2, 3)". */
const citedIndexes = (answer: string): number[] => {
  const found = new Set<number>();
  for (const match of answer.matchAll(/\(([\d,\s]+)\)/g)) {
    for (const part of (match[1] ?? '').split(',')) {
      const value = Number.parseInt(part.trim(), 10);
      if (Number.isInteger(value)) found.add(value);
    }
  }
  return [...found];
};

/**
 * Topic keywords → a word that appears in activity category names
 * ("Sensory Response", "Social Interaction", "Flexibility & Routine", …).
 * Deterministic on purpose: the links under an answer should be predictable.
 */
const TOPIC_TO_CATEGORY: readonly [RegExp, string][] = [
  [/\b(talk|speak|words?|say|language|communicat\w*|point|sign|respond)\b/i, 'Communication'],
  [/\b(sounds?|noise|hear|loud|touch|lights?|texture|taste|smell|sensory)\b/i, 'Sensory'],
  [/\b(friends?|share|social|turns?|peers?|together|eye contact)\b/i, 'Social'],
  [/\b(routines?|schedule|habit|transitions?|change)\b/i, 'Routine'],
  [/\b(play|pretend|toys?|imagin\w*)\b/i, 'Play'],
  [/\b(motor|hands?|grip|draw|climb|balance)\b/i, 'Motor'],
];

/** Up to three activities related to the topic of a message; none when nothing fits. */
export const matchActivitiesForContent = async (
  content: string,
): Promise<{ id: string; title: string; category: string; description?: string | null }[]> => {
  const match = TOPIC_TO_CATEGORY.find(([pattern]) => pattern.test(content));
  if (!match) return [];
  const activities = await prisma.activity.findMany({
    // Only published activities: drafts and archived ones are never shown to families.
    where: { status: 'PUBLISHED', category: { contains: match[1] } },
    orderBy: { title: 'asc' },
    take: 3,
    select: { id: true, title: true, category: true, summary: true },
  });
  return activities.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    description: a.summary,
  }));
};

const defaultTitle = (language: AiLanguage): string =>
  language === 'km' ? 'ការសន្ទនាថ្មី' : 'New conversation';

export class AiService {
  constructor(
    private readonly repository = new AiRepository(),
    private readonly client: AiClient = aiClient,
    private readonly grounding: GroundingProvider = new GuidanceService(),
  ) {}

  async status(actor: Actor): Promise<AiStatusResponse> {
    const usedToday = await this.repository.countUserMessagesSince(actor.parentId, startOfUtcDay());
    return {
      configured: this.client.configured,
      model: this.client.model,
      dailyLimit: env.AI_MAX_DAILY_MESSAGES,
      usedToday,
    };
  }

  async listConversations(actor: Actor): Promise<ConversationSummaryResponse[]> {
    if (actor.role !== 'PARENT') throw forbidden();
    const rows = await this.repository.listConversations(actor.parentId, 30);
    return rows.map((row) => toConversationSummary(row, row._count.messages));
  }

  async createConversation(
    actor: Actor,
    input: CreateAiConversationRequest,
  ): Promise<ConversationSummaryResponse> {
    if (actor.role !== 'PARENT') throw forbidden();

    const attachChild = input.includeChildContext === true && !!input.childId;
    if (attachChild && input.childId) {
      const child = await this.repository.findChild(input.childId);
      // notFound rather than forbidden: a 403 would confirm the child exists.
      if (!child || child.parentId !== actor.parentId) {
        throw notFound('Child profile was not found.');
      }
    }

    const conversation = await this.repository.createConversation({
      parentId: actor.parentId,
      childId: attachChild ? input.childId! : null,
      title: defaultTitle(input.language),
      language: input.language,
    });
    return toConversationSummary(conversation, 0);
  }

  async getConversation(
    actor: Actor,
    conversationId: string,
  ): Promise<AiConversationDetailResponse> {
    const conversation = await this.requireOwned(actor, conversationId);
    return {
      ...toConversationSummary(conversation, conversation.messages.length),
      messages: conversation.messages.map((m) => toAiMessageResponse(m)),
    };
  }

  async deleteConversation(actor: Actor, conversationId: string): Promise<{ id: string }> {
    await this.requireOwned(actor, conversationId);
    await this.repository.deleteConversation(conversationId);
    return { id: conversationId };
  }

  /**
   * One parent turn, and the answer to it.
   *
   * Order of operations is deliberate:
   * 1. quota, then configuration — both fail before anything is written;
   * 2. the safety classification, which can answer without a model at all;
   * 3. persist the question before calling out, so a provider failure never eats
   *    what the parent typed;
   * 4. post-process the answer (soften a verdict, guarantee the referral).
   */
  async sendMessage(
    actor: Actor,
    conversationId: string,
    input: SendAiMessageRequest,
  ): Promise<SendAiMessageResponse> {
    const conversation = await this.requireOwned(actor, conversationId);
    const content = input.content.trim();
    if (!content) {
      throw new AppError('VALIDATION_ERROR', 'A message cannot be empty.', 400);
    }

    const usedToday = await this.repository.countUserMessagesSince(actor.parentId, startOfUtcDay());
    if (usedToday >= env.AI_MAX_DAILY_MESSAGES) {
      throw new AppError(
        'RATE_LIMITED',
        'You have reached today’s limit for assistant messages. It resets tomorrow.',
        429,
      );
    }

    const language: AiLanguage = conversation.language === 'km' ? 'km' : 'en';
    const classification = classifyParentMessage(content);

    // Calls that the safety layer answers itself need no provider, so they work
    // even before a model is configured. A parent in distress must never be told
    // the assistant is unavailable.
    if (classification === 'CRISIS' || classification === 'MEDICATION') {
      const userMessage = await this.repository.createMessage({
        conversationId,
        role: 'USER',
        content,
      });
      const assistantMessage = await this.repository.createMessage({
        conversationId,
        role: 'ASSISTANT',
        kind: classification,
        content: classification === 'CRISIS' ? crisisReply(language) : medicationReply(language),
      });
      await this.renameFromFirstMessage(conversation.title, conversationId, language, content);
      await this.repository.touchConversation(conversationId);
      const related = await matchActivitiesForContent(content);
      return {
        userMessage: toAiMessageResponse(userMessage),
        assistantMessage: toAiMessageResponse(assistantMessage, related),
      };
    }

    if (!this.client.configured) {
      throw new AppError(
        'AI_UNAVAILABLE',
        'The assistant has not been set up on this installation yet.',
        503,
      );
    }

    const userMessage = await this.repository.createMessage({
      conversationId,
      role: 'USER',
      content,
    });
    await this.renameFromFirstMessage(conversation.title, conversationId, language, content);

    const [context, passages] = await Promise.all([
      this.buildChildContext(conversation.childId),
      this.grounding.retrieve({ query: content, language }),
    ]);

    const messages = [
      { role: 'system' as const, content: buildSystemPrompt({ language, context, passages }) },
      ...buildConversationMessages(
        conversation.messages.map((message) => ({ role: message.role, content: message.content })),
      ),
      { role: 'user' as const, content },
    ];

    let completion;
    try {
      completion = await this.client.complete({ messages, maxTokens: 700 });
    } catch (error) {
      const message =
        error instanceof AiProviderError ? error.message : 'The assistant could not answer.';
      logger.warn({ err: error }, 'AI completion failed');
      // The parent's question is already stored; it is not lost.
      throw new AppError('INTERNAL_ERROR', message, 502);
    }

    const answer = ensureReferral(softenDiagnosisClaims(completion.content), language);
    const sources = citedIndexes(answer)
      .map((index) => passages[index - 1])
      .filter((passage): passage is GroundingPassage => passage !== undefined)
      .map((passage) => ({ title: passage.title, publisher: passage.publisher, url: passage.url }));

    const assistantMessage = await this.repository.createMessage({
      conversationId,
      role: 'ASSISTANT',
      content: answer,
      model: completion.model,
      latencyMs: completion.latencyMs,
      tokensIn: completion.tokensIn,
      tokensOut: completion.tokensOut,
      ...(sources.length > 0 ? { sources } : {}),
    });
    await this.repository.touchConversation(conversationId);

    const related = await matchActivitiesForContent(answer);
    return {
      userMessage: toAiMessageResponse(userMessage),
      assistantMessage: toAiMessageResponse(assistantMessage, related),
    };
  }

  private async renameFromFirstMessage(
    currentTitle: string,
    conversationId: string,
    language: AiLanguage,
    content: string,
  ): Promise<void> {
    if (currentTitle !== defaultTitle(language)) return;
    await this.repository.setTitle(conversationId, titleFromMessage(content));
  }

  /**
   * Background for the model, built from what the parent already recorded.
   * Note what is missing: no name, no date of birth, no address, no notes.
   */
  private async buildChildContext(childId: string | null): Promise<ChildContext | null> {
    if (!childId) return null;
    const child = await this.repository.findChild(childId);
    if (!child) return null;

    const [band, observationCount] = await Promise.all([
      this.repository.findLatestConcernBand(childId),
      this.repository.countObservationsSince(childId, new Date(Date.now() - 14 * DAY_MS)),
    ]);

    return {
      ageMonths: ageInMonths(child.dateOfBirth),
      concernBand: band,
      observationsLast14Days: observationCount,
    };
  }

  async toggleSaveMessage(actor: Actor, messageId: string): Promise<AiMessageResponse> {
    if (actor.role !== 'PARENT') throw forbidden();
    const message = await this.repository.findMessageWithConversation(messageId);
    if (!message || message.conversation.parentId !== actor.parentId) {
      throw notFound('Message was not found.');
    }
    const newSavedAt = message.savedAt ? null : new Date();
    const updated = await this.repository.updateMessageSave(messageId, newSavedAt);
    return toAiMessageResponse(updated);
  }

  async listSaved(actor: Actor): Promise<AiMessageResponse[]> {
    if (actor.role !== 'PARENT') throw forbidden();
    const rows = await this.repository.listSavedMessages(actor.parentId);
    return rows.map((r) => toAiMessageResponse(r));
  }

  async saveFeedback(
    actor: Actor,
    messageId: string,
    input: FeedbackAiMessageRequest,
  ): Promise<AiMessageResponse> {
    if (actor.role !== 'PARENT') throw forbidden();
    const message = await this.repository.findMessageWithConversation(messageId);
    if (!message || message.conversation.parentId !== actor.parentId) {
      throw notFound('Message was not found.');
    }
    const updated = await this.repository.updateFeedback(
      messageId,
      input.feedback,
      input.feedbackNote?.trim() ? input.feedbackNote.trim() : null,
    );
    return toAiMessageResponse(updated);
  }

  private async requireOwned(actor: Actor, conversationId: string) {
    if (actor.role !== 'PARENT') throw forbidden();
    const conversation = await this.repository.findConversation(conversationId);
    if (!conversation || conversation.parentId !== actor.parentId) {
      throw notFound('Conversation was not found.');
    }
    return conversation;
  }
}
