import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

/**
 * Validate request query parameters against a Zod schema.
 *
 * The previous version did `req.query = schema.parse(req.query)`. Express 5 made
 * `req.query` a getter, so that threw — which is why nothing used it, and why six
 * endpoints had each hand-rolled their own variant instead: a route closure that
 * parsed purely for the throw, a controller helper that parsed and returned, a
 * per-field narrowing helper, and a raw cast. Two endpoints parsed the same
 * schema twice per request, once in the closure and once in the controller.
 *
 * The parsed value is attached to `req.validatedQuery` instead, leaving
 * `req.query` untouched. Controllers read it through `validatedQuery<T>(req)`,
 * which restores the type the schema inferred.
 *
 * Zod failures propagate to the error handler's existing ZodError branch, so the
 * 400 response envelope is unchanged.
 */
export const validateQuery =
  <T>(schema: ZodType<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.validatedQuery = schema.parse(req.query);
    next();
  };

/**
 * Read what `validateQuery` stored, typed.
 *
 * The cast is unavoidable: the augmentation on Request cannot be generic, so the
 * property is `unknown` and the caller names the type. It is sound as long as the
 * type matches the schema the route was wired with — keep the two together.
 */
export const validatedQuery = <T>(req: Request): T => req.validatedQuery as T;
