import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

/**
 * Middleware that validates and parses request query parameters using a Zod schema.
 * Parsed values are attached to `req.query` as the validated type.
 */
export const validateQuery =
  <T>(schema: ZodType<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.query = schema.parse(req.query) as any;
    next();
  };
