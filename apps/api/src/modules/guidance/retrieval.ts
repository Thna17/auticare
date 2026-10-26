/**
 * Retrieval over a curated corpus.
 *
 * Two decisions worth stating:
 *
 * 1. **Lexical, not embedded.** Nothing here calls a model or an embedding API.
 *    Retrieval therefore works before a provider is configured, gives the same
 *    answer twice for the same question, and can be reviewed by reading the
 *    scoring code. A few hundred reviewed passages do not need vector search; they
 *    need to be found when they are relevant and, more importantly, not invented
 *    when they are not.
 * 2. **A minimum relevance, not a top-k.** If nothing clears the floor, the
 *    result is an empty list. "I do not have a reliable source for that" is a
 *    supported answer and must stay reachable.
 */

export type RetrievalChunk = {
  id: string;
  documentId: string;
  title: string;
  publisher: string;
  sourceUrl: string;
  heading: string | null;
  content: string;
  keywords: readonly string[];
};

export type ScoredChunk = RetrievalChunk & { relevance: number };

const STOPWORDS = new Set(
  `a about after again all also an and any are as at be because been before being both but by can could did do does during each few for from further had has have he her here him his how i if in into is it its just me more most my no not of on only or other our out over same she should so some such than that the their them then there these they this to too under until up very was we were what when where which who why will with would you your`.split(
    ' ',
  ),
);

/** Words worth matching on. Khmer has no spaces, so this yields whole phrases there. */
export const tokenize = (text: string): string[] => {
  // \p{M} keeps combining marks attached: Khmer vowel signs are separate code
  // points, and dropping them would shred every word.
  const matches = text.toLowerCase().match(/[\p{L}\p{N}\p{M}]+/gu) ?? [];
  return matches.filter((token) => token.length >= 3 && !STOPWORDS.has(token));
};

/** True when the text is written in a space-separated script. */
export const isLatinScript = (text: string): boolean => /[a-z]/i.test(text);

const trigrams = (text: string): Set<string> => {
  const cleaned = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const grams = new Set<string>();
  for (let index = 0; index + 3 <= cleaned.length; index += 1) {
    grams.add(cleaned.slice(index, index + 3));
  }
  return grams;
};

/** How much of the query's character trigrams appear in the passage, 0–1. */
export const coverage = (query: string, text: string): number => {
  const queryGrams = trigrams(query);
  if (queryGrams.size === 0) return 0;
  const textGrams = trigrams(text);
  let hits = 0;
  for (const gram of queryGrams) {
    if (textGrams.has(gram)) hits += 1;
  }
  return hits / queryGrams.size;
};

const LATIN_MIN_SCORE = 3;
const SCRIPT_MIN_SCORE = 2.5;

/**
 * Score one passage against a question.
 *
 * For space-separated scripts, a keyword or heading hit outweighs a body mention,
 * because keywords were attached deliberately at import time. For Khmer, which is
 * written without spaces, character trigram coverage is used instead.
 */
export const scoreChunk = (query: string, chunk: RetrievalChunk): number => {
  if (isLatinScript(query)) {
    const tokens = tokenize(query);
    if (tokens.length === 0) return 0;
    const content = chunk.content.toLowerCase();
    const heading = (chunk.heading ?? '').toLowerCase();
    const keywords = new Set(chunk.keywords.map((keyword) => keyword.toLowerCase()));

    let score = 0;
    for (const token of tokens) {
      if (keywords.has(token)) score += 3;
      else if (content.includes(token)) score += 1.5;
      if (heading.includes(token)) score += 2;
    }
    return Math.round(score * 100) / 100;
  }

  const value = coverage(query, `${chunk.heading ?? ''} ${chunk.content}`);
  return Math.round(value * 10 * 100) / 100;
};

export const retrieve = (
  query: string,
  chunks: readonly RetrievalChunk[],
  options: { limit?: number } = {},
): ScoredChunk[] => {
  const limit = options.limit ?? 3;
  const floor = isLatinScript(query) ? LATIN_MIN_SCORE : SCRIPT_MIN_SCORE;

  return chunks
    .map((chunk) => ({ ...chunk, relevance: scoreChunk(query, chunk) }))
    .filter((chunk) => chunk.relevance >= floor)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
};

/** Keywords attached to a chunk at import time, derived from its own text. */
export const keywordsFor = (text: string, max = 24): string[] => {
  const counts = new Map<string, number>();
  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([token]) => token);
};

export const excerptOf = (content: string, max = 420): string =>
  content.length <= max ? content : `${content.slice(0, max - 1).trimEnd()}…`;
