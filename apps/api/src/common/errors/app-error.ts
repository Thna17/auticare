import type { ErrorCode } from '@auticare/contracts';
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number,
    public readonly details: readonly unknown[] = [],
  ) {
    super(message);
  }
}
export const unauthorized = () =>
  new AppError('AUTHENTICATION_REQUIRED', 'Authentication is required.', 401);
export const forbidden = () =>
  new AppError('AUTHORIZATION_FAILED', 'You are not allowed to access this resource.', 403);
export const notFound = (message = 'The requested resource was not found.') =>
  new AppError('NOT_FOUND', message, 404);
