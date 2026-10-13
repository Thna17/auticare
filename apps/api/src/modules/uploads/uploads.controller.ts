import multer from 'multer';
import type { Request, Response } from 'express';
import { ok } from '../../common/http/response.js';
import { AppError, forbidden } from '../../common/errors/app-error.js';
import { defaultUploadsService } from './uploads.service.js';
import { SchoolsRepository } from '../schools/schools.repository.js';
import path from 'path';

export const uploadDir = path.join(process.cwd(), 'uploads', 'activity-reports');

/**
 * The only extensions we will ever write, keyed by the MIME type we accepted.
 */
export const EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
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

/** Per-file size cap. Exported so error messages can quote it without duplicating the number. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
/** Field count limits, exported for the same reason. */
export const MAX_FILES = 10;
export const MAX_PHOTOS = 5;

const PHOTO_MIMES = ['image/jpeg', 'image/jpg', 'image/png'];
const FILE_MIMES = [
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
];

const makeMemoryMulter = (allowedMimes: string[], errorMessage: string) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_BYTES },
    fileFilter: (_req, file, cb) => {
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new AppError('VALIDATION_ERROR', errorMessage, 400));
      }
    },
  });

// Photos: JPG/PNG only (report thumbnails / gallery).
const photosUpload = makeMemoryMulter(PHOTO_MIMES, 'Only JPG and PNG images are allowed.');

// Activity files: images plus common document types (PDF, Word, text, CSV).
const filesUpload = makeMemoryMulter(
  FILE_MIMES,
  'Only images, PDF, Word, text, or CSV files are allowed.',
);

/** Multipart middleware for POST /upload/activity-files (field `files`, max 10). */
export const uploadMiddleware = filesUpload.array('files', 10);

/** Multipart middleware for POST /upload/activity-photos (field `photos`, max 5). */
export const uploadPhotosMiddleware = photosUpload.array('photos', 5);

const schoolsRepo = new SchoolsRepository();

/**
 * POST /api/v1/schools/upload/activity-files
 * Accepts multipart/form-data (field `files`, up to 10 images or documents:
 * PDF, Word, text, CSV; 10MB each). Validates magic bytes and associates with school staff.
 */
export const uploadActivityFiles = async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'No files uploaded.', 400);
  }
  if (req.files.length > MAX_FILES) {
    throw new AppError('VALIDATION_ERROR', `Maximum ${MAX_FILES} files allowed.`, 400);
  }

  const staff = await schoolsRepo.findStaffForParent(req.auth!.parentId);
  if (!staff) throw forbidden();

  const result = await defaultUploadsService.processSchoolUploads({
    files: req.files,
    schoolId: staff.schoolId,
    reporterId: req.auth!.parentId,
    allowedMimes: FILE_MIMES,
  });

  ok(res, result);
};

/**
 * POST /api/v1/schools/upload/activity-photos
 * Accepts multipart/form-data (field `photos`, up to 5 JPG/PNG images).
 * Validates magic bytes and associates with school staff.
 */
export const uploadActivityPhotos = async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'No files uploaded.', 400);
  }
  if (req.files.length > MAX_PHOTOS) {
    throw new AppError('VALIDATION_ERROR', `Maximum ${MAX_PHOTOS} photos allowed.`, 400);
  }

  const staff = await schoolsRepo.findStaffForParent(req.auth!.parentId);
  if (!staff) throw forbidden();

  const result = await defaultUploadsService.processSchoolUploads({
    files: req.files,
    schoolId: staff.schoolId,
    reporterId: req.auth!.parentId,
    allowedMimes: PHOTO_MIMES,
  });

  ok(res, result);
};
