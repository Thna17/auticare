import type { SchoolAvailabilityStatus, UpdateSchoolProfileRequest } from '@auticare/contracts';
import { forbidden, notFound } from '../../common/errors/app-error.js';
import { SchoolsRepository } from './schools.repository.js';
import { toSchoolDetailResponse } from './schools.mapper.js';

type Actor = { parentId: string; role: string };

export class SchoolProfileService {
  constructor(private readonly repository = new SchoolsRepository()) {}

  /**
   * Fetch the school profile for the currently authenticated school staff member.
   * The school ID is derived from the SchoolStaff record linked to the user's
   * session — it is never accepted from the request body.
   */
  async getMyProfile(actor: Actor) {
    const staff = await this.requireSchoolStaff(actor);
    const school = await this.repository.findSchoolById(staff.schoolId);
    if (!school) throw notFound('School was not found.');
    const rating = await this.repository.getSchoolRating(staff.schoolId);
    return toSchoolDetailResponse(school, rating);
  }

  /**
   * Update the school profile. Only fields the school account is allowed to
   * modify are accepted (isVerified, rating, and studentCapacity are excluded).
   */
  async updateMyProfile(actor: Actor, input: UpdateSchoolProfileRequest) {
    const staff = await this.requireSchoolStaff(actor);

    const update: {
      name?: string;
      city?: string;
      address?: string;
      description?: string | null;
      email?: string | null;
      website?: string | null;
      logoUrl?: string | null;
      coverImageUrl?: string | null;
      studentTeacherRatio?: string | null;
      availabilityStatus?: SchoolAvailabilityStatus;
      waitlistEstimate?: string | null;
      admissionRequirements?: string | null;
      operatingHours?: string | null;
      facilities?: string[];
      specializations?: string[];
    } = {};

    if (input.name !== undefined) update.name = input.name.trim();
    if (input.city !== undefined) update.city = input.city.trim();
    if (input.address !== undefined) update.address = input.address.trim();
    if (input.description !== undefined) update.description = input.description?.trim() || null;
    if (input.email !== undefined) update.email = input.email?.trim().toLowerCase() || null;
    if (input.website !== undefined) update.website = input.website?.trim() || null;
    if (input.logoUrl !== undefined) update.logoUrl = input.logoUrl?.trim() || null;
    if (input.coverImageUrl !== undefined)
      update.coverImageUrl = input.coverImageUrl?.trim() || null;
    if (input.studentTeacherRatio !== undefined)
      update.studentTeacherRatio = input.studentTeacherRatio?.trim() || null;
    if (input.availabilityStatus !== undefined)
      update.availabilityStatus = input.availabilityStatus;
    if (input.waitlistEstimate !== undefined)
      update.waitlistEstimate = input.waitlistEstimate?.trim() || null;
    if (input.admissionRequirements !== undefined)
      update.admissionRequirements = input.admissionRequirements?.trim() || null;
    if (input.operatingHours !== undefined)
      update.operatingHours = input.operatingHours?.trim() || null;
    if (input.facilities !== undefined)
      update.facilities = input.facilities.map((item) => item.trim()).filter(Boolean);
    if (input.specializations !== undefined)
      update.specializations = input.specializations.map((item) => item.trim()).filter(Boolean);

    const school = await this.repository.updateSchoolProfile(staff.schoolId, update);
    const rating = await this.repository.getSchoolRating(staff.schoolId);
    return toSchoolDetailResponse(school, rating);
  }

  /**
   * Ensures the caller is a school staff member. Returns the staff record
   * whose `schoolId` scopes all subsequent operations to the correct school.
   */
  private async requireSchoolStaff(actor: Actor) {
    const staff = await this.repository.findStaffForParent(actor.parentId);
    if (!staff) throw forbidden();
    return staff;
  }
}
