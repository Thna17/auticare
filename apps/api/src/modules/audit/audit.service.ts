import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export type RecordAuditEventInput = {
  action: string;
  actorId?: string | null | undefined;
  actorRole?: string | null | undefined;
  targetId?: string | null | undefined;
  targetEmail?: string | null | undefined;
  metadata?: Record<string, unknown> | null | undefined;
};

export class AuditService {
  async record(input: RecordAuditEventInput) {
    return prisma.auditEvent.create({
      data: {
        action: input.action,
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        targetId: input.targetId ?? null,
        targetEmail: input.targetEmail ? input.targetEmail.toLowerCase().trim() : null,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  async listEvents(filter?: { action?: string; targetEmail?: string; actorId?: string }) {
    return prisma.auditEvent.findMany({
      where: {
        ...(filter?.action ? { action: filter.action } : {}),
        ...(filter?.targetEmail ? { targetEmail: filter.targetEmail.toLowerCase().trim() } : {}),
        ...(filter?.actorId ? { actorId: filter.actorId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const auditService = new AuditService();
