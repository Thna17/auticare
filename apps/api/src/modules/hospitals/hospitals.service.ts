import type {
  CreateHospitalAccountRequest,
  CreateHospitalRequest,
  UserRole,
} from '@auticare/contracts';
import { AppError, forbidden } from '../../common/errors/app-error.js';
import { PasswordService } from '../auth/password.service.js';
import { toHospitalResponse } from './hospitals.mapper.js';
import { HospitalsRepository } from './hospitals.repository.js';

type Actor = { role: UserRole };

export class HospitalsService {
  constructor(
    private readonly repository = new HospitalsRepository(),
    private readonly passwords = new PasswordService(),
  ) {}

  async list() {
    return (await this.repository.list()).map(toHospitalResponse);
  }

  async create(actor: Actor, input: CreateHospitalRequest) {
    if (actor.role !== 'ADMIN') throw forbidden();
    return toHospitalResponse(await this.repository.create(input));
  }

  async createAccount(actor: Actor, input: CreateHospitalAccountRequest) {
    if (actor.role !== 'ADMIN') throw forbidden();
    const email = input.account.email.toLowerCase();
    if (await this.repository.findParentByEmail(email))
      throw new AppError('CONFLICT', 'An account with this email already exists.', 409);
    const record = await this.repository.createHospitalAccount({
      hospital: {
        name: input.hospital.name.trim(),
        city: input.hospital.city.trim(),
        address: input.hospital.address.trim(),
        services: input.hospital.services.trim(),
      },
      account: {
        email,
        passwordHash: await this.passwords.hash(input.account.password),
        firstName: input.account.firstName.trim(),
        lastName: input.account.lastName.trim(),
        title: input.account.title?.trim() || null,
      },
    });
    return {
      hospital: toHospitalResponse(record.hospital),
      staff: record.staff,
      account: {
        id: record.account.id,
        email: record.account.email,
        firstName: record.account.firstName,
        lastName: record.account.lastName,
        role: record.account.role,
      },
    };
  }

  async listAccounts(actor: Actor) {
    if (actor.role !== 'ADMIN') throw forbidden();
    return (await this.repository.listHospitalAccounts()).map((record) => ({
      hospital: toHospitalResponse(record.hospital),
      staff: record.staff,
      account: {
        id: record.account.id,
        email: record.account.email,
        firstName: record.account.firstName,
        lastName: record.account.lastName,
        role: record.account.role,
      },
    }));
  }
}
