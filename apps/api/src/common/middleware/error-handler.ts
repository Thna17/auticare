import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../config/logger.js';
import { isProduction } from '../../config/env.js';
import { AppError } from '../errors/app-error.js';
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The submitted information is invalid.',
        details: error.issues,
        requestId: req.requestId,
      },
    });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: req.requestId,
      },
    });
    return;
  }
  logger.error({ err: error, requestId: req.requestId }, 'Unhandled API error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'Something went wrong.'
        : String(error instanceof Error ? error.message : error),
      requestId: req.requestId,
    },
  });
};
