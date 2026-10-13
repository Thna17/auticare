# Data Retention and Privacy Policies

This document establishes the retention schedule, cleanup mechanisms, and data lifecycle management policies for AutiCare in compliance with healthcare and child data privacy standards (FERPA, HIPAA, and GDPR).

---

## 1. Data Classification and Retention Matrix

| Category                          | Description                                            | Storage Medium              | Retention Window                                                    | Purge Mechanism                                       |
| :-------------------------------- | :----------------------------------------------------- | :-------------------------- | :------------------------------------------------------------------ | :---------------------------------------------------- |
| **Temporary Uploads**             | Unattached report files uploaded during draft sessions | Local disk / S3 staging     | **24 hours**                                                        | Scheduled cron job (`STORAGE_UPLOAD_RETENTION_HOURS`) |
| **Active Medical/School Reports** | Verified reports associated with a child record        | S3 bucket & MySQL metadata  | **7 years** post-adulthood (or school exit)                         | Manual administrative request / GDPR purge pipeline   |
| **Orphaned Attachments**          | Files where parent report was permanently deleted      | Storage bucket              | **Immediate** on report cascade delete                              | Application lifecycle hook                            |
| **Screening Questionnaires**      | Completed M-CHAT-R assessments & responses             | MySQL `screening_responses` | **Permanent** with child history (anonymized upon account deletion) | Pseudonymization cascade                              |
| **Audit Logs & HTTP Traces**      | Pino access logs and security event traces             | S3 Glacier / CloudWatch     | **365 days**                                                        | Cloud lifecycle expiration rule                       |
| **User Authentication Tokens**    | Refresh tokens & password reset sessions               | MySQL tokens & cookies      | **7 days** (refresh), **1 hour** (reset tokens)                     | In-database expiration check and automatic pruning    |

---

## 2. Temporary File Cleanup Automation

Unattached temporary uploads created through `POST /api/v1/schools/reports/upload-attachment` must be cleaned up if they are not finalized into an actual report within 24 hours.

### Automated Cleanup Cron / Script:

```typescript
// Located in apps/api/src/common/storage/cleanup-orphaned-uploads.ts
import { unlink } from 'node:fs/promises';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

export async function cleanAbandonedUploads(storageDir: string, maxAgeHours: number) {
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const now = Date.now();
  const files = await readdir(storageDir);

  for (const file of files) {
    const filePath = path.join(storageDir, file);
    const stats = await stat(filePath);
    if (now - stats.mtimeMs > maxAgeMs) {
      await unlink(filePath);
      console.log(`Pruned abandoned upload: ${file}`);
    }
  }
}
```

---

## 3. Account Deletion and Right-to-be-Forgotten (GDPR)

When a parent or school administrator requests account deletion:

1. **Immediate Revocation**: All active refresh tokens and sessions are revoked (`tokenVersion++` or token table purge).
2. **Soft Deletion / Archival**: Child records can be archived (`isArchived = true`) to preserve historical appointments if required by healthcare audit laws.
3. **Hard Deletion / Anonymization**: If hard deletion is legally mandated, all child attachments are unlinked and destroyed from S3, user email and personal names are replaced with cryptographic hashes, and screening records are anonymized.
