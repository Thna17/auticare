import { describe, expect, it } from 'vitest';
import type { RetrievalChunk } from './retrieval.js';
import { coverage, keywordsFor, retrieve, scoreChunk, tokenize } from './retrieval.js';

const chunk = (overrides: Partial<RetrievalChunk> = {}): RetrievalChunk => ({
  id: 'chunk-1',
  documentId: 'doc-1',
  title: 'Everyday routines',
  publisher: 'Example Publisher',
  sourceUrl: 'https://example.org/routines',
  heading: 'Bedtime',
  content: 'A predictable bedtime sequence helps a child settle: bath, teeth, book, lights out.',
  keywords: ['bedtime', 'routine', 'sleep'],
  ...overrides,
});

describe('tokenize', () => {
  it('drops stopwords and very short tokens', () => {
    expect(tokenize('What can I do about bedtime?')).toEqual(['bedtime']);
  });

  it('keeps Khmer text intact, since it is written without spaces', () => {
    expect(tokenize('ការគេងពេលយប់')).toEqual(['ការគេងពេលយប់']);
  });
});

describe('scoreChunk', () => {
  it('scores a keyword hit above a passing body mention', () => {
    const keywordHit = scoreChunk('bedtime', chunk());
    const bodyOnly = scoreChunk('teeth', chunk());
    expect(keywordHit).toBeGreaterThan(bodyOnly);
  });

  it('gives no score to an unrelated question', () => {
    expect(scoreChunk('car seat installation', chunk())).toBe(0);
  });

  it('scores Khmer questions by character overlap', () => {
    const kmChunk = chunk({
      heading: 'ពេលគេង',
      content: 'ការរៀបចំពេលគេងឱ្យទៀងទាត់ជួយឱ្យកុមារងាយស្រួលគេង។',
      keywords: [],
    });
    const relevant = scoreChunk('ការគេងពេលយប់', kmChunk);
    const irrelevant = scoreChunk('ការទិញឡានថ្មី', kmChunk);
    expect(relevant).toBeGreaterThan(irrelevant);
  });
});

describe('coverage', () => {
  it('is 1 for identical text and 0 for nothing in common', () => {
    expect(coverage('bedtime routine', 'bedtime routine')).toBe(1);
    expect(coverage('abc', 'xyz')).toBe(0);
  });
});

describe('retrieve', () => {
  it('returns the relevant passage and orders by relevance', () => {
    const results = retrieve('bedtime routine', [
      chunk(),
      chunk({
        id: 'chunk-2',
        heading: 'Mealtimes',
        content: 'Offer new foods calmly.',
        keywords: [],
      }),
    ]);
    expect(results[0]?.id).toBe('chunk-1');
  });

  it('returns nothing when the corpus has no answer', () => {
    // The whole premise of the feature: no match is a supported answer.
    expect(retrieve('how do I install a car seat', [chunk()])).toEqual([]);
  });

  it('respects the limit', () => {
    const chunks = Array.from({ length: 5 }, (_, index) =>
      chunk({ id: `chunk-${index}`, content: 'bedtime routine sleep', keywords: ['bedtime'] }),
    );
    expect(retrieve('bedtime', chunks, { limit: 2 })).toHaveLength(2);
  });
});

describe('keywordsFor', () => {
  it('keeps the most frequent meaningful words', () => {
    expect(keywordsFor('bedtime routine bedtime sleep')).toEqual(['bedtime', 'routine', 'sleep']);
  });
});
