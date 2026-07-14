import type { UserRole } from '@auticare/contracts';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: { parentId: string; role: UserRole };
    }
  }
}
export {};
