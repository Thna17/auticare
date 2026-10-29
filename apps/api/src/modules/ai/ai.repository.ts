import type { AiConversation, AiMessage, AiMessageKind, Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import type { UsageRow } from './ai.pricing.js';

export type ConversationWithCount = AiConversation & { _count: { messages: number } };
export type ConversationWithMessages = AiConversation & { messages: AiMessage[] };

const withCount = { _count: { select: { messages: true } } } as const;

export class AiRepository {
  listConversations(parentId: string, take: number): Promise<ConversationWithCount[]> {
    return prisma.aiConversation.findMany({
      where: { parentId },
      orderBy: { updatedAt: 'desc' },
      take,
      include: withCount,
    });
  }

  findConversation(id: string): Promise<ConversationWithMessages | null> {
    return prisma.aiConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  createConversation(input: {
    parentId: string;
    childId: string | null;
    title: string;
    language: string;
  }): Promise<AiConversation> {
    return prisma.aiConversation.create({ data: input });
  }

  deleteConversation(id: string): Promise<AiConversation> {
    return prisma.aiConversation.delete({ where: { id } });
  }

  touchConversation(id: string): Promise<AiConversation> {
    return prisma.aiConversation.update({ where: { id }, data: { updatedAt: new Date() } });
  }

  setLanguage(id: string, language: 'en' | 'km'): Promise<AiConversation> {
    return prisma.aiConversation.update({ where: { id }, data: { language } });
  }

  setTitle(id: string, title: string): Promise<AiConversation> {
    return prisma.aiConversation.update({ where: { id }, data: { title } });
  }

  findChild(childId: string): Promise<{ id: string; parentId: string; dateOfBirth: Date } | null> {
    return prisma.child.findUnique({
      where: { id: childId },
      select: { id: true, parentId: true, dateOfBirth: true },
    });
  }

  countObservationsSince(childId: string, since: Date): Promise<number> {
    return prisma.behaviorObservation.count({
      where: { childId, occurredAt: { gte: since } },
    });
  }

  createMessage(input: {
    conversationId: string;
    role: 'USER' | 'ASSISTANT';
    kind?: AiMessageKind;
    content: string;
    model?: string | null;
    latencyMs?: number | null;
    tokensIn?: number | null;
    tokensOut?: number | null;
    sources?: Prisma.InputJsonValue | undefined;
  }): Promise<AiMessage> {
    return prisma.aiMessage.create({
      data: {
        conversationId: input.conversationId,
        role: input.role,
        ...(input.kind ? { kind: input.kind } : {}),
        content: input.content,
        model: input.model ?? null,
        latencyMs: input.latencyMs ?? null,
        tokensIn: input.tokensIn ?? null,
        tokensOut: input.tokensOut ?? null,
        ...(input.sources !== undefined ? { sources: input.sources } : {}),
      },
    });
  }

  /**
   * Parent turns sent since a point in time. Counting messages rather than keeping
   * a quota table means there is one less thing to migrate, and a parent can see
   * plainly why the limit was reached.
   */
  countUserMessagesSince(parentId: string, since: Date): Promise<number> {
    return prisma.aiMessage.count({
      where: { role: 'USER', createdAt: { gte: since }, conversation: { parentId } },
    });
  }

  /**
   * Answers that actually reached a provider, for the installation's spend.
   * Safety replies carry no tokens and are excluded: they never cost anything.
   */
  providerUsageSince(since: Date): Promise<UsageRow[]> {
    return prisma.aiMessage.findMany({
      where: { role: 'ASSISTANT', createdAt: { gte: since }, tokensIn: { not: null } },
      select: { model: true, tokensIn: true, tokensOut: true },
    });
  }

  findMessageWithConversation(
    id: string,
  ): Promise<(AiMessage & { conversation: { parentId: string } }) | null> {
    return prisma.aiMessage.findUnique({
      where: { id },
      include: { conversation: { select: { parentId: true } } },
    });
  }

  updateMessageSave(id: string, savedAt: Date | null): Promise<AiMessage> {
    return prisma.aiMessage.update({
      where: { id },
      data: { savedAt },
    });
  }

  listSavedMessages(parentId: string): Promise<AiMessage[]> {
    return prisma.aiMessage.findMany({
      where: {
        conversation: { parentId },
        savedAt: { not: null },
        role: 'ASSISTANT',
      },
      orderBy: { savedAt: 'desc' },
    });
  }

  updateFeedback(id: string, feedback: string, feedbackNote: string | null): Promise<AiMessage> {
    return prisma.aiMessage.update({
      where: { id },
      data: { feedback, feedbackNote },
    });
  }
}
