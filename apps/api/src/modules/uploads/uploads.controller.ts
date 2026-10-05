import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import type { Request, Response } from 'express';
import { ok } from '../../common/http/response.js';
import { AppError } from '../../common/errors/app-error.js';

// Shared upload directory — files land under <cwd>/uploads/activity-reports/
// with UUID filenames. They are NOT served statically: downloads go through the
// authorised route GET /api/v1/schools/reports/:id/attachments/:filename.
export const uploadDir = path.join(process.cwd(), 'uploads', 'activity-reports');

/**
 * The only extensions we will ever write, keyed by the MIME type we accepted.
 *
 * The stored extension is derived from this map, never from
 * `file.originalname`. `originalname` is client-controlled, so taking the
 * extension from it allowed a file to be stored as e.g. `<uuid>.html` while
 * claiming `image/jpeg`; the old static route then served it as text/html from
 * the API origin — stored XSS. The download route resolves its Content-Type
 * through this map too, rather than trusting anything client-supplied.
 */
const EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  'text/csv': '.csv',
};

/** Content-Type to serve for a stored extension. Inverse of EXTENSION_BY_MIME. */
export const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
};

/**
 * A stored filename: a UUID plus one allowlisted extension, and nothing else.
 * Anchored, so no path separator or traversal sequence can pass.
 */
export const STORED_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif|pdf|doc|docx|txt|csv)$/;

const makeMulter = (allowedMimes: string[], errorMessage: string) =>
  multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (_req, file, cb) => {
        // Extension comes from the accepted MIME type, never from
        // file.originalname. fileFilter has already rejected anything whose
        // declared type is outside the allowlist.
        const ext = EXTENSION_BY_MIME[file.mimetype];
        if (ext === undefined) {
          cb(new Error('Unsupported file type.'), '');
          return;
        }
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
