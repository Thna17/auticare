import type { PaginationMeta, PaginationQuery } from '@auticare/contracts';

/**
 * Turn a validated page/limit query into Prisma's skip/take.
 *
 * Kept in one place so every list endpoint computes the offset the same way —
 * an off-by-one here silently skips or repeats a row at every page boundary,
 * which is the kind of bug that only shows up once there is enough data to
 * paginate at all.
 */
export const toSkipTake = (query: PaginationQuery): { skip: number; take: number } => ({
  skip: (query.page - 1) * query.limit,
  take: query.limit,
});

/**
 * Build the counts that accompany a page.
 *
 * totalPages is at least 1 even when there are no rows, so a client rendering
 * "page 1 of N" never shows "page 1 of 0".
 */
export const toPaginationMeta = (query: PaginationQuery, total: number): PaginationMeta => ({
  total,
  page: query.page,
  limit: query.limit,
  totalPages: Math.max(1, Math.ceil(total / query.limit)),
});
