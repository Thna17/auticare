import crypto from 'crypto';
import { prisma } from '../../database/prisma.js';
import { env } from '../../config/env.js';
import { defaultStorageDriver, type StorageDriver } from '../storage/storage.driver.js';
import { validateFileSignature } from './file-signature.js';
import { AppError } from '../../common/errors/app-error.js';

export class UploadsService {
  constructor(
    private readonly storage: StorageDriver = defaultStorageDriver,
    private readonly db = prisma,
  ) {}

  /**
   * Process and persist uploaded files for an authenticated school staff member.
   * Validates file signatures, generates UUID filenames, writes to storage,
   * and creates tracked ReportAttachmentUpload records with retention expiration.
   */
  async processSchoolUploads(params: {
    files: Express.Multer.File[];
    schoolId: string;
    reporterId: string;
    allowedMimes: string[];
  }): Promise<{ urls: string[] }> {
    const { files, schoolId, reporterId, allowedMimes } = params;

    const retentionHours = env.STORAGE_UPLOAD_RETENTION_HOURS || 24;
    const expiresAt = new Date(Date.now() + retentionHours * 60 * 60 * 1000);

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const buffer = file.buffer;
      if (!buffer || buffer.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'File buffer is empty or corrupted.', 400);
      }

      // Magic byte validation against declared MIME and allowed types
      let detected;
      try {
        detected = validateFileSignature(buffer, file.mimetype, allowedMimes);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid file format.';
        throw new AppError('VALIDATION_ERROR', message, 400);
      }

      // Generate stored UUID filename with true extension
      const filename = `${crypto.randomUUID()}${detected.ext}`;
      const storageKey = filename;

      // Write file via storage driver
      await this.storage.write(storageKey, buffer, detected.mime);

      // Track in database
      await this.db.reportAttachmentUpload.create({
        data: {
          schoolId,
          reporterId,
          filename,
          storageKey,
          contentType: detected.mime,
          byteSize: buffer.length,
          expiresAt,
        },
      });

      uploadedUrls.push(`/uploads/activity-reports/${filename}`);
    }

    return { urls: uploadedUrls };
  }

  /**
   * Remove unlinked uploads that have exceeded their retention window.
   */
  async cleanupAbandonedUploads(): Promise<{ deletedCount: number }> {
    const expiredUploads = await this.db.reportAttachmentUpload.findMany({
      where: {
        reportId: null,
        expiresAt: { lt: new Date() },
      },
    });

    let deletedCount = 0;
    for (const upload of expiredUploads) {
      try {
        await this.storage.delete(upload.storageKey);
      } catch {
        // Log and continue cleanup
      }
      await this.db.reportAttachmentUpload.delete({
        where: { id: upload.id },
      });
      deletedCount++;
    }

    return { deletedCount };
  }
}

export const defaultUploadsService = new UploadsService();
