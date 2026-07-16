import type { CreateHospitalRequest, UserRole } from '@auticare/contracts';
import { forbidden } from '../../common/errors/app-error.js';
import { toHospitalResponse } from './hospitals.mapper.js';
import { HospitalsRepository } from './hospitals.repository.js';

type Actor = { role: UserRole };

export class HospitalsService {
  constructor(private readonly repository = new HospitalsRepository()) {}

  async list() {
    return (await this.repository.list()).map(toHospitalResponse);
  }

  async create(actor: Actor, input: CreateHospitalRequest) {
    if (actor.role !== 'ADMIN') throw forbidden();
    return toHospitalResponse(await this.repository.create(input));
  }
}
