import type { Hospital } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export class HospitalsRepository {
  list(): Promise<Hospital[]> {
    return prisma.hospital.findMany({ orderBy: [{ city: 'asc' }, { name: 'asc' }] });
  }

  create(input: {
    name: string;
    city: string;
    address: string;
    services: string;
  }): Promise<Hospital> {
    return prisma.hospital.create({ data: input });
  }
}
