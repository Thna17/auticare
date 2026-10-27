import type {
  CreateOrganizationInquiryRequest,
  OrganizationInquiryResponse,
  UserRole,
} from '@auticare/contracts';
import { forbidden, notFound } from '../../common/errors/app-error.js';
import { toInquiryResponse } from './inquiries.mapper.js';
import { InquiriesRepository } from './inquiries.repository.js';

type Actor = { parentId: string; role: UserRole };

export class InquiriesService {
  constructor(private readonly repository = new InquiriesRepository()) {}

  async create(
    actor: Actor,
    input: CreateOrganizationInquiryRequest,
  ): Promise<OrganizationInquiryResponse> {
    if (actor.role !== 'PARENT') throw forbidden();

    if (input.schoolId) {
      const school = await this.repository.findSchool(input.schoolId);
      if (!school) throw notFound('School was not found.');
    } else if (input.hospitalId) {
      const hospital = await this.repository.findHospital(input.hospitalId);
      if (!hospital) throw notFound('Hospital was not found.');
    }

    const row = await this.repository.create({
      parentId: actor.parentId,
      schoolId: input.schoolId,
      hospitalId: input.hospitalId,
      childFirstName: input.childFirstName?.trim() ? input.childFirstName.trim() : null,
      subject: input.subject.trim(),
      message: input.message.trim(),
    });

    // The school's notification list is open to every staff member, but
    // inquiries are for the school admin only. So the notification says only
    // that one arrived, and is addressed to an admin rather than to the parent
    // who sent it (who would otherwise see it in their own list).
    if (input.schoolId) {
      const admin = await this.repository.findSchoolAdminAccount(input.schoolId);
      if (admin) {
        await this.repository.createNotification({
          schoolId: input.schoolId,
          parentId: admin.parentId,
          type: 'SYSTEM',
          title: 'New parent inquiry',
          body: 'A parent sent your school an inquiry. Open Parent inquiries to read it.',
        });
      }
    }

    return toInquiryResponse(row);
  }

  async listMine(actor: Actor): Promise<OrganizationInquiryResponse[]> {
    if (actor.role !== 'PARENT') throw forbidden();
    const rows = await this.repository.listForParent(actor.parentId);
    return rows.map(toInquiryResponse);
  }

  async listForSchool(actor: Actor): Promise<OrganizationInquiryResponse[]> {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.repository.findActiveSchoolStaff(actor.parentId);
    if (!staff) throw forbidden('Not an active staff member.');
    if (staff.role !== 'ADMIN') throw forbidden('Only school administrators can access inquiries.');

    const rows = await this.repository.listForSchool(staff.schoolId);
    return rows.map(toInquiryResponse);
  }

  async markSchoolInquiryRead(
    actor: Actor,
    inquiryId: string,
  ): Promise<OrganizationInquiryResponse> {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.repository.findActiveSchoolStaff(actor.parentId);
    if (!staff) throw forbidden('Not an active staff member.');
    if (staff.role !== 'ADMIN') throw forbidden('Only school administrators can access inquiries.');

    const existing = await this.repository.findById(inquiryId);
    if (!existing || existing.schoolId !== staff.schoolId) {
      throw notFound('Inquiry was not found.');
    }

    const updated = await this.repository.updateStatus(inquiryId, 'READ');
    return toInquiryResponse(updated);
  }
}
