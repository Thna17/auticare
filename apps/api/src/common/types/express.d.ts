import type { UserRole } from '@auticare/contracts';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: { parentId: string; role: UserRole };
      /**
       * Query parameters parsed by the validateQuery middleware. Untyped here
       * because the augmentation cannot be generic — read it through
       * validatedQuery<T>(req), which names the schema's inferred type.
       */
      validatedQuery?: unknown;
    }
  }
}
export {};
