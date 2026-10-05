import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import type { Request, Response } from 'express';
import { ok } from '../../common/http/response.js';
import { AppError } from '../../common/errors/app-error.js';

// Shared upload directory — files land under <cwd>/uploads/activity-reports/
// with UUID filenames and are served back through the static /uploads route
// registered in app.ts.
const uploadDir = path.join(process.cwd(), 'uploads', 'activity-reports');

const makeMulter = (allowedMimes: string[], errorMessage: string) =>
  multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '';
        cb(null, `${crypto.randomUUID()}${ext}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    fileFilter: (_req, file, cb) => {
      if (allowedMimes.includes(file.mimetype)) cb(null, true);
      else cb(new Error(errorMessage));
    },
  });

// Photos: JPG/PNG only (report thumbnails / gallery).
const photosUpload = makeMulter(
  ['image/jpeg', 'image/jpg', 'image/png'],
  'Only JPG and PNG images are allowed.',
);

// Activity files: images plus common document types (PDF, Word, text, CSV).
const filesUpload = makeMulter(
  [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
  ],
  'Only images, PDF, Word, text, or CSV files are allowed.',
);

/** Multipart middleware for POST /upload/activity-files (field `files`, max 10). */
export const uploadMiddleware = filesUpload.array('files', 10);

/** Multipart middleware for POST /upload/activity-photos (field `photos`, max 5). */
export const uploadPhotosMiddleware = photosUpload.array('photos', 5);

/**
 * Shared helper: multer (diskStorage) has already written each file into
 * <cwd>/uploads/activity-reports/ with a UUID filename — we just surface the
 * public URLs back to the client.
 */
const respondWithUploadedUrls = (files: Express.Multer.File[], res: Response) => {
  const urls = files.map((file) => `/uploads/activity-reports/${file.filename}`);
  ok(res, { urls });
};

/**
 * POST /api/v1/schools/upload/activity-files
 * Accepts multipart/form-data (field `files`, up to 10 images or documents:
 * PDF, Word, text, CSV; 10MB each). Returns `{ urls: string[] }`.
 */
export const uploadActivityFiles = async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'No files uploaded.', 400);
  }
  if (req.files.length > 10) {
    throw new AppError('VALIDATION_ERROR', 'Maximum 10 files allowed.', 400);
  }
  respondWithUploadedUrls(req.files, res);
};

/**
 * POST /api/v1/schools/upload/activity-photos
 * Accepts multipart/form-data (field `photos`, up to 5 JPG/PNG images).
 * Same storage location and response shape as the files endpoint.
 */
export const uploadActivityPhotos = async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'No files uploaded.', 400);
  }
  if (req.files.length > 5) {
    throw new AppError('VALIDATION_ERROR', 'Maximum 5 photos allowed.', 400);
  }
  respondWithUploadedUrls(req.files, res);
};
