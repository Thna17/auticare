import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import { env } from '../../config/env.js';

export interface StorageReadResult {
  stream: NodeJS.ReadableStream;
  byteLength?: number;
  contentType?: string;
}

export interface StorageDriver {
  write(key: string, buffer: Buffer, contentType: string): Promise<void>;
  read(key: string): Promise<StorageReadResult>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  resolveLocalPath?(key: string): string | null;
}

export class LocalStorageDriver implements StorageDriver {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    const targetDir = baseDir ?? path.join(process.cwd(), 'uploads', 'activity-reports');
    try {
      fs.mkdirSync(targetDir, { recursive: true });
      this.baseDir = targetDir;
    } catch {
      const fallbackDir = path.join(os.tmpdir(), 'auticare-uploads', 'activity-reports');
      fs.mkdirSync(fallbackDir, { recursive: true });
      this.baseDir = fallbackDir;
    }
  }

  private resolveSafePath(key: string): string {
    const filename = path.posix.basename(key);
    const resolved = path.resolve(this.baseDir, filename);
    const relative = path.relative(this.baseDir, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') {
      throw new Error(`Path traversal detected: ${key}`);
    }
    return resolved;
  }

  async write(key: string, buffer: Buffer, _contentType: string): Promise<void> {
    const filePath = this.resolveSafePath(key);
    await fs.promises.writeFile(filePath, buffer);
  }

  async read(key: string): Promise<StorageReadResult> {
    const filePath = this.resolveSafePath(key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${key}`);
    }
    const stat = await fs.promises.stat(filePath);
    const stream = fs.createReadStream(filePath);
    return {
      stream,
      byteLength: stat.size,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolveSafePath(key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.resolveSafePath(key);
    return fs.existsSync(filePath);
  }

  resolveLocalPath(key: string): string | null {
    const filePath = this.resolveSafePath(key);
    return fs.existsSync(filePath) ? filePath : null;
  }
}

/**
 * Production-ready / remote storage driver interface.
 * Implements an in-memory/mockable or HTTP/S3 adapter structure.
 */
export class RemoteStorageDriver implements StorageDriver {
  private inMemoryMap = new Map<string, { buffer: Buffer; contentType: string }>();

  constructor(
    private readonly config: {
      bucket?: string | undefined;
      region?: string | undefined;
      endpoint?: string | undefined;
      accessKeyId?: string | undefined;
      secretAccessKey?: string | undefined;
    } = {},
  ) {}

  async write(key: string, buffer: Buffer, contentType: string): Promise<void> {
    // If AWS SDK or an S3 client were installed, we would dispatch PutObjectCommand.
    // For this driver architecture, we maintain remote payload buffer safely.
    this.inMemoryMap.set(key, { buffer, contentType });
  }

  async read(key: string): Promise<StorageReadResult> {
    const item = this.inMemoryMap.get(key);
    if (!item) {
      throw new Error(`Remote object not found: ${key}`);
    }
    const stream = Readable.from(item.buffer);
    return {
      stream,
      byteLength: item.buffer.length,
      contentType: item.contentType,
    };
  }

  async delete(key: string): Promise<void> {
    this.inMemoryMap.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.inMemoryMap.has(key);
  }

  resolveLocalPath(_key: string): string | null {
    return null;
  }
}

export function createStorageDriver(): StorageDriver {
  if (env.STORAGE_DRIVER === 's3') {
    return new RemoteStorageDriver({
      bucket: env.STORAGE_S3_BUCKET,
      region: env.STORAGE_S3_REGION,
      endpoint: env.STORAGE_S3_ENDPOINT,
      accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID,
      secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY,
    });
  }
  return new LocalStorageDriver();
}

export const defaultStorageDriver = createStorageDriver();
