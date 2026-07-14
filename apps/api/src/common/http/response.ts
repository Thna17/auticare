import type { Response } from 'express';
export const ok = <T>(res: Response, data: T, meta: Record<string, unknown> = {}) =>
  res.json({ data, meta });
export const created = <T>(res: Response, data: T, meta: Record<string, unknown> = {}) =>
  res.status(201).json({ data, meta });
