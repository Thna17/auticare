import type { Hospital } from '@prisma/client';

export const toHospitalResponse = (hospital: Hospital) => ({
  id: hospital.id,
  name: hospital.name,
  city: hospital.city,
  address: hospital.address,
  services: hospital.services,
  createdAt: hospital.createdAt.toISOString(),
  updatedAt: hospital.updatedAt.toISOString(),
});
