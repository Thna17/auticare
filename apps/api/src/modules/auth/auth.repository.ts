import type { Parent, PasswordResetToken, Prisma, RefreshToken } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

type RefreshTokenWithParent = RefreshToken & { parent: Parent };
type PasswordResetTokenWithParent = PasswordResetToken & { parent: Parent };

export class AuthRepository {
  findParentByEmail(email: string): Promise<Parent | null> {
    return prisma.parent.findUnique({ where: { email } });
  }

  findParentById(id: string): Promise<Parent | null> {
    return prisma.parent.findUnique({ where: { id } });
  }

  createParent(input: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }): Promise<Parent> {
    return prisma.parent.create({ data: { ...input, preference: { create: {} } } });
  }

  createRefreshToken(input: {
    parentId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data: input });
  }

  findRefreshTokenWithParent(tokenHash: string): Promise<RefreshTokenWithParent | null> {
    return prisma.refreshToken.findUnique({ where: { tokenHash }, include: { parent: true } });
  }

  async rotateRefreshToken(input: {
    currentTokenId: string;
    parentId: string;
    nextTokenHash: string;
    nextExpiresAt: Date;
  }): Promise<RefreshToken> {
    return prisma.$transaction(
      async (tx) => {
        const next = await tx.refreshToken.create({
          data: {
            parentId: input.parentId,
            tokenHash: input.nextTokenHash,
            expiresAt: input.nextExpiresAt,
          },
        });
        await tx.refreshToken.update({
          where: { id: input.currentTokenId },
          data: { revokedAt: new Date(), replacedByTokenId: next.id },
        });
        return next;
      },
      { isolationLevel: 'ReadCommitted' as Prisma.TransactionIsolationLevel },
    );
  }

  revokeRefreshToken(tokenHash: string): Promise<{ count: number }> {
    return prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllParentRefreshTokens(parentId: string): Promise<{ count: number }> {
    return prisma.refreshToken.updateMany({
      where: { parentId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async createPasswordResetToken(input: {
    parentId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    return prisma.$transaction(
      async (tx) => {
        await tx.passwordResetToken.updateMany({
          where: { parentId: input.parentId, usedAt: null },
          data: { usedAt: new Date() },
        });
        return tx.passwordResetToken.create({ data: input });
      },
      { isolationLevel: 'ReadCommitted' as Prisma.TransactionIsolationLevel },
    );
  }

  findPasswordResetTokenWithParent(
    tokenHash: string,
  ): Promise<PasswordResetTokenWithParent | null> {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { parent: true },
    });
  }

  async completePasswordReset(input: {
    tokenId: string;
    parentId: string;
    passwordHash: string;
  }): Promise<void> {
    await prisma.$transaction(
      async (tx) => {
        await tx.parent.update({
          where: { id: input.parentId },
          data: { passwordHash: input.passwordHash },
        });
        await tx.passwordResetToken.update({
          where: { id: input.tokenId },
          data: { usedAt: new Date() },
        });
        await tx.refreshToken.updateMany({
          where: { parentId: input.parentId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      },
      { isolationLevel: 'ReadCommitted' as Prisma.TransactionIsolationLevel },
    );
  }
}
