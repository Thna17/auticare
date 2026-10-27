import type { AiConversation, AiMessage, Prisma } from '@prisma/client';
import type { AiMessageResponse, AiSource } from '@auticare/contracts';

export type ConversationSummaryResponse = {
  id: string;
  childId: string | null;
  title: string;
  language: 'en' | 'km';
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

const asLanguage = (value: string): 'en' | 'km' => (value === 'km' ? 'km' : 'en');

/**
 * `sources` is a JSON column, so it is untrusted at read time: a row written by an
 * older version (or edited by hand) must not be able to break the response.
 */
const asSources = (value: Prisma.JsonValue | null): AiSource[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const record = entry as Record<string, unknown>;
    const { title, publisher, url } = record;
    if (typeof title !== 'string' || typeof publisher !== 'string' || typeof url !== 'string') {
      return [];
    }
    return [{ title, publisher, url }];
  });
};

export const toAiMessageResponse = (
  message: AiMessage,
  relatedActivities?: {
    id: string;
    title: string;
    category: string;
    description?: string | null;
  }[],
): AiMessageResponse => ({
  id: message.id,
  conversationId: message.conversationId,
  role: message.role,
  kind: message.kind,
  content: message.content,
  model: message.model,
  sources: asSources(message.sources),
  savedAt: message.savedAt ? message.savedAt.toISOString() : null,
  feedback: message.feedback,
  feedbackNote: message.feedbackNote,
  relatedActivities:
    relatedActivities && relatedActivities.length > 0 ? relatedActivities : undefined,
  createdAt: message.createdAt.toISOString(),
});

export const toConversationSummary = (
  conversation: AiConversation,
  messageCount: number,
): ConversationSummaryResponse => ({
  id: conversation.id,
  childId: conversation.childId,
  title: conversation.title,
  language: asLanguage(conversation.language),
  createdAt: conversation.createdAt.toISOString(),
  updatedAt: conversation.updatedAt.toISOString(),
  messageCount,
});
