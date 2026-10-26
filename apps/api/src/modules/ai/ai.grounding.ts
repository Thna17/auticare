import type { AiLanguage } from '@auticare/contracts';
import type { GroundingPassage } from './ai.prompt.js';

export type GroundingRequest = {
  query: string;
  language: AiLanguage;
  limit?: number;
};

/**
 * Where reference material comes from.
 *
 * The assistant is built against this seam rather than a concrete store so that
 * the safety rule "guidance is sourced, or it is not given" is expressible: a
 * provider that has nothing reviewed returns nothing, and the model is told so
 * explicitly instead of being left to free-associate.
 */
export interface GroundingProvider {
  retrieve(request: GroundingRequest): Promise<GroundingPassage[]>;
}

/** Used until a reviewed corpus is imported: the assistant answers, but cites nothing. */
export const noGrounding: GroundingProvider = {
  retrieve: () => Promise.resolve([]),
};
