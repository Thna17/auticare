/**
 * Imports reviewed guidance sources into the knowledge base.
 *
 *   pnpm --filter @auticare/api db:knowledge
 *   pnpm --filter @auticare/api db:knowledge -- --dir ./prisma/knowledge
 *
 * Why a script and not a seed: the corpus is content, not fixtures. It has an
 * owner, a licence and a review date per document, and it changes on its own
 * schedule. Seeding it would tie medical material to database resets.
 *
 * Safety rule enforced here: a document without `reviewedAt` is imported but is
 * NOT visible to retrieval, so an unreviewed file cannot be cited to a parent.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { keywordsFor } from '../src/modules/guidance/retrieval.js';

type SourceChunk = { heading?: string; content: string };

type SourceDocument = {
  title: string;
  publisher: string;
  sourceUrl: string;
  licence: string;
  language?: string;
  version: string;
  reviewedAt?: string;
  chunks: SourceChunk[];
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultDir = path.resolve(scriptDir, '../prisma/knowledge');

const argDir = (): string => {
  const flagIndex = process.argv.indexOf('--dir');
  if (flagIndex !== -1 && process.argv[flagIndex + 1]) {
    return path.resolve(process.argv[flagIndex + 1]!);
  }
  return defaultDir;
};

const requireString = (value: unknown, field: string, file: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${file}: "${field}" is required and must be a non-empty string.`);
  }
  return value.trim();
};

const parseDocument = (raw: unknown, file: string): SourceDocument => {
  if (typeof raw !== 'object' || raw === null) throw new Error(`${file}: expected an object.`);
  const record = raw as Record<string, unknown>;

  if (!Array.isArray(record.chunks) || record.chunks.length === 0) {
    throw new Error(`${file}: "chunks" must be a non-empty array.`);
  }

  const chunks = record.chunks.map((chunk, index): SourceChunk => {
    if (typeof chunk !== 'object' || chunk === null) {
      throw new Error(`${file}: chunk ${index + 1} must be an object.`);
    }
    const entry = chunk as Record<string, unknown>;
    return {
      ...(typeof entry.heading === 'string' ? { heading: entry.heading } : {}),
      content: requireString(entry.content, `chunks[${index}].content`, file),
    };
  });

  return {
    title: requireString(record.title, 'title', file),
    publisher: requireString(record.publisher, 'publisher', file),
    sourceUrl: requireString(record.sourceUrl, 'sourceUrl', file),
    licence: requireString(record.licence, 'licence', file),
    version: requireString(record.version, 'version', file),
    ...(typeof record.language === 'string' ? { language: record.language } : {}),
    ...(typeof record.reviewedAt === 'string' ? { reviewedAt: record.reviewedAt } : {}),
    chunks,
  };
};

const main = async (): Promise<void> => {
  const prisma = new PrismaClient();
  const dir = argDir();

  try {
    let files: string[];
    try {
      files = (await readdir(dir)).filter((file) => file.endsWith('.json'));
    } catch {
      console.log(`No knowledge directory at ${dir}. Nothing to import.`);
      return;
    }

    if (files.length === 0) {
      console.log(`No .json sources in ${dir}. Nothing to import.`);
      return;
    }

    for (const file of files.sort()) {
      const raw = JSON.parse(await readFile(path.join(dir, file), 'utf8')) as unknown;
      const document = parseDocument(raw, file);
      const reviewedAt = document.reviewedAt ? new Date(document.reviewedAt) : null;

      if (reviewedAt && Number.isNaN(reviewedAt.getTime())) {
        throw new Error(`${file}: "reviewedAt" is not a valid date.`);
      }

      const saved = await prisma.knowledgeDocument.upsert({
        where: { sourceUrl: document.sourceUrl },
        create: {
          title: document.title,
          publisher: document.publisher,
          sourceUrl: document.sourceUrl,
          licence: document.licence,
          language: document.language ?? 'en',
          version: document.version,
          reviewedAt,
        },
        update: {
          title: document.title,
          publisher: document.publisher,
          licence: document.licence,
          language: document.language ?? 'en',
          version: document.version,
          reviewedAt,
        },
      });

      // Replace, so a re-import never leaves stale chunks behind that no reviewer
      // has seen.
      await prisma.knowledgeChunk.deleteMany({ where: { documentId: saved.id } });
      await prisma.knowledgeChunk.createMany({
        data: document.chunks.map((chunk, index) => ({
          documentId: saved.id,
          displayOrder: index,
          heading: chunk.heading ?? null,
          content: chunk.content,
          keywords: keywordsFor(`${chunk.heading ?? ''} ${chunk.content}`),
        })),
      });

      console.log(
        `${reviewedAt ? 'imported' : 'imported (UNREVIEWED — not citable)'}: ${document.title} [${document.chunks.length} chunks]`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
