import type { AiLanguage, PublicAiChatRequest } from '@auticare/contracts';
import { AppError } from '../../common/errors/app-error.js';
import { logger } from '../../config/logger.js';
import { aiClient, AiProviderError } from './ai.client.js';
import type { AiClient } from './ai.client.js';
import type { GroundingProvider } from './ai.grounding.js';
import { GuidanceService } from '../guidance/guidance.service.js';
import {
  answerTokenLimit,
  buildConversationMessages,
  buildSystemPrompt,
  replyLanguage,
} from './ai.prompt.js';
import {
  classifyParentMessage,
  crisisReply,
  ensureReferral,
  medicationReply,
  softenDiagnosisClaims,
} from './ai.safety.js';

export class PublicChatService {
  constructor(
    private readonly client: AiClient = aiClient,
    private readonly grounding: GroundingProvider = new GuidanceService(),
  ) {}

  async answer(input: PublicAiChatRequest): Promise<{
    message: string;
    sources: { title: string; publisher: string; url: string }[];
  }> {
    // Answer in the language the parent wrote in; the switch is only a fallback.
    const language: AiLanguage = replyLanguage(input.content, input.language);
    const classification = classifyParentMessage(input.content);
    if (classification === 'CRISIS') return { message: crisisReply(language), sources: [] };
    if (classification === 'MEDICATION') return { message: medicationReply(language), sources: [] };
    if (!this.client.configured) {
      throw new AppError(
        'AI_UNAVAILABLE',
        language === 'km'
          ? 'មិនទាន់បានកំណត់រចនាសម្ព័ន្ធ AI ទេ។ សូមកំណត់ AI_BASE_URL និង AI_MODEL នៅលើម៉ាស៊ីនមេ ហើយកំណត់ AI_API_KEY ប្រសិនបើអ្នកផ្តល់សេវាតម្រូវ។'
          : 'AI is not configured. Set AI_BASE_URL and AI_MODEL on the server, and AI_API_KEY if the provider requires it.',
        503,
      );
    }

    const passages = await this.grounding.retrieve({ query: input.content, language });
    const history = buildConversationMessages(input.history);
    try {
      const completion = await this.client.complete({
        messages: [
          { role: 'system', content: buildSystemPrompt({ language, context: null, passages }) },
          ...history,
          { role: 'user', content: input.content },
        ],
        maxTokens: answerTokenLimit(language),
      });
      const message = ensureReferral(softenDiagnosisClaims(completion.content), language);
      const cited = new Set<number>();
      for (const match of message.matchAll(/\(([\d,\s]+)\)/g)) {
        for (const part of (match[1] ?? '').split(',')) {
          const index = Number.parseInt(part.trim(), 10);
          if (Number.isInteger(index)) cited.add(index);
        }
      }
      return {
        message,
        sources: [...cited]
          .map((index) => passages[index - 1])
          .filter((passage): passage is NonNullable<typeof passage> => Boolean(passage))
          .map(({ title, publisher, url }) => ({ title, publisher, url })),
      };
    } catch (error) {
      const message =
        error instanceof AiProviderError
          ? localizedProviderError(error.kind, language)
          : language === 'km'
            ? 'សេវា AI មិនអាចដំណើរការសំណួរនេះបានទេ។ សូមព្យាយាមម្តងទៀត។'
            : 'The AI service could not process this question. Please try again.';
      logger.warn({ err: error }, 'Public AI chat completion failed');
      throw new AppError('INTERNAL_ERROR', message, 502);
    }
  }
}

const localizedProviderError = (kind: AiProviderError['kind'], language: AiLanguage): string => {
  const messages = {
    en: {
      credentials: 'The AI provider rejected its credentials. Check the server-side AI_API_KEY.',
      model_or_endpoint: 'The AI model or endpoint was not found. Check AI_BASE_URL and AI_MODEL.',
      quota: 'The AI provider limit or quota was reached. Check provider usage and billing.',
      request:
        'The AI provider rejected the request. Check that AI_MODEL supports chat completions.',
      unavailable: 'The AI provider is temporarily unavailable. Check its status and try again.',
      network: 'The AI provider could not be reached. Check AI_BASE_URL and server network access.',
    },
    km: {
      credentials: 'សេវា AI បដិសេធព័ត៌មានសម្គាល់ខ្លួន។ សូមពិនិត្យ AI_API_KEY នៅលើម៉ាស៊ីនមេ។',
      model_or_endpoint:
        'រកមិនឃើញម៉ូដែល ឬអាសយដ្ឋានសេវា AI ទេ។ សូមពិនិត្យ AI_BASE_URL និង AI_MODEL។',
      quota: 'ដល់កំណត់ការប្រើប្រាស់សេវា AI ហើយ។ សូមពិនិត្យកូតា និងការទូទាត់។',
      request: 'សេវា AI បដិសេធសំណើ។ សូមពិនិត្យថា AI_MODEL គាំទ្រការជជែក។',
      unavailable: 'សេវា AI មិនអាចប្រើបានបណ្តោះអាសន្នទេ។ សូមពិនិត្យស្ថានភាពសេវា ហើយព្យាយាមម្តងទៀត។',
      network: 'មិនអាចភ្ជាប់ទៅសេវា AI បានទេ។ សូមពិនិត្យ AI_BASE_URL និងបណ្តាញម៉ាស៊ីនមេ។',
    },
  } as const;
  return messages[language][kind];
};
