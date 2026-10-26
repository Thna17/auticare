import type { AiLanguage, GuidanceSearchResponse } from '@auticare/contracts';
import type { GroundingProvider, GroundingRequest } from '../ai/ai.grounding.js';
import type { GroundingPassage } from '../ai/ai.prompt.js';
import { KnowledgeRepository } from './knowledge.repository.js';
import { excerptOf, retrieve } from './retrieval.js';

const MAX_PASSAGES = 3;

/**
 * Guidance over a reviewed corpus, and the grounding the assistant uses.
 *
 * One implementation serves both surfaces on purpose: a passage shown to a parent
 * on the guidance screen is retrieved by exactly the same rule as one offered to
 * the model, so an answer cannot be grounded in material the parent could not
 * have been shown themselves.
 */
export class GuidanceService implements GroundingProvider {
  constructor(private readonly repository = new KnowledgeRepository()) {}

  /** The seam the assistant calls: passages, or nothing at all. */
  async retrieve(request: GroundingRequest): Promise<GroundingPassage[]> {
    const chunks = await this.repository.listReviewedChunks(request.language);
    return retrieve(request.query, chunks, { limit: request.limit ?? MAX_PASSAGES }).map(
      (chunk) => ({
        title: chunk.heading ? `${chunk.title} — ${chunk.heading}` : chunk.title,
        publisher: chunk.publisher,
        url: chunk.sourceUrl,
        text: chunk.content,
      }),
    );
  }

  /** The parent-facing browse: the same matches, with the evidence to show. */
  async search(query: string, language: AiLanguage): Promise<GuidanceSearchResponse> {
    const chunks = await this.repository.listReviewedChunks(language);
    const matches = retrieve(query, chunks, { limit: MAX_PASSAGES });

    return {
      passages: matches.map((chunk) => ({
        title: chunk.title,
        publisher: chunk.publisher,
        sourceUrl: chunk.sourceUrl,
        heading: chunk.heading,
        excerpt: excerptOf(chunk.content),
        relevance: chunk.relevance,
      })),
      corpusSize: await this.repository.countReviewedDocuments(language),
    };
  }
}
