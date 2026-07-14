import type { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export type TransactionClient = Prisma.TransactionClient;
export const inTransaction = <T>(operation: (tx: TransactionClient) => Promise<T>) =>
  prisma.$transaction(operation);
