import { prisma } from '../../database/prisma.js';
import type { RetrievalChunk } from './retrieval.js';

type ChunkRow = {
  id: string;
  heading: string | null;
  content: string;
  keywords: unknown;
  document: { id: string; title: string; publisher: string; sourceUrl: string };
};

const asKeywords = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

export class KnowledgeRepository {
  /**
   * Chunks the assistant and the guidance screen may draw on.
   *
   * Only documents with a `reviewedAt` are returned: an imported-but-unreviewed
   * source is not yet something the product is prepared to stand behind, so it is
   * invisible to retrieval rather than silently citable.
   */
  async listReviewedChunks(language: string, take = 600): Promise<RetrievalChunk[]> {
    const rows = (await prisma.knowledgeChunk.findMany({
      where: {
        document: { language, reviewedAt: { not: null } },
      },
      select: {
        id: true,
        heading: true,
        content: true,
        keywords: true,
        document: { select: { id: true, title: true, publisher: true, sourceUrl: true } },
      },
      take,
    })) as ChunkRow[];

    return rows.map((row) => ({
      id: row.id,
      documentId: row.document.id,
      title: row.document.title,
      publisher: row.document.publisher,
      sourceUrl: row.document.sourceUrl,
      heading: row.heading,
      content: row.content,
      keywords: asKeywords(row.keywords),
    }));
  }

  countReviewedDocuments(language: string): Promise<number> {
    return prisma.knowledgeDocument.count({
      where: { language, reviewedAt: { not: null } },
    });
  }
}
