import type { ErrorRequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { logger } from '../../config/logger.js';
import { isProduction } from '../../config/env.js';
import { AppError } from '../errors/app-error.js';
import { MAX_FILE_BYTES, MAX_FILES } from '../../modules/uploads/uploads.controller.js';
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
  // multer raises its own limit errors, which are not AppErrors — without this
  // an over-size or over-count upload reached the unhandled-error branch and was
  // reported to the user as a 500 and logged as an unhandled API error.
  if (error instanceof MulterError) {
    const megabytes = Math.round(MAX_FILE_BYTES / (1024 * 1024));
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: `Each file must be ${megabytes}MB or smaller.`,
      LIMIT_FILE_COUNT: `Too many files uploaded. The maximum is ${MAX_FILES}.`,
      LIMIT_UNEXPECTED_FILE: 'The upload used an unexpected file field.',
      LIMIT_PART_COUNT: 'The upload had too many parts.',
      LIMIT_FIELD_KEY: 'An upload field name was too long.',
      LIMIT_FIELD_VALUE: 'An upload field value was too long.',
      LIMIT_FIELD_COUNT: 'The upload had too many fields.',
    };
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: messages[error.code] ?? 'The uploaded file could not be accepted.',
        details: error.field === undefined ? [] : [{ field: error.field }],
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
