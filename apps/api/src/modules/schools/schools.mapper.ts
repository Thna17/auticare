import type {
  Parent,
  School,
  SchoolActivityReport,
  SchoolChildEnrollment,
  SchoolStaff,
} from '@prisma/client';
import type {
  AdminSchoolAccountResponse,
  ParentResponse,
  SchoolDetailResponse,
  SchoolResponse,
  SchoolActivityReportResponse,
  SchoolChildEnrollmentResponse,
  SchoolStaffResponse,
} from '@auticare/contracts';
import { toParentResponse } from '../auth/auth.mapper.js';

export type SchoolAccountRecord = {
  school: School;
  staff: SchoolStaff;
  account: Parent;
};

/** Computed review rating for a school (never a stored, editable column). */
export type SchoolRating = { average: number | null; count: number };

const emptyRating: SchoolRating = { average: null, count: 0 };

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const roundRating = (average: number | null): number | null =>
  average === null ? null : Math.round(average * 10) / 10;

export const toSchoolResponse = (
  school: School,
  rating: SchoolRating = emptyRating,
): SchoolResponse => ({
  id: school.id,
  name: school.name,
  city: school.city,
  address: school.address,
  description: school.description,
  logoUrl: school.logoUrl,
  coverImageUrl: school.coverImageUrl,
  availabilityStatus: school.availabilityStatus,
  waitlistEstimate: school.waitlistEstimate,
  studentTeacherRatio: school.studentTeacherRatio,
  specializations: asStringArray(school.specializations),
  isVerified: school.isVerified,
  rating: roundRating(rating.average),
  reviewCount: rating.count,
  createdAt: school.createdAt.toISOString(),
  updatedAt: school.updatedAt.toISOString(),
});

export const toSchoolDetailResponse = (
  school: School,
  rating: SchoolRating = emptyRating,
): SchoolDetailResponse => ({
  ...toSchoolResponse(school, rating),
  email: school.email,
  website: school.website,
  admissionRequirements: school.admissionRequirements,
  operatingHours: school.operatingHours,
  facilities: asStringArray(school.facilities),
});

export const toSchoolStaffResponse = (staff: SchoolStaff): SchoolStaffResponse => ({
  id: staff.id,
  schoolId: staff.schoolId,
  parentId: staff.parentId,
  title: staff.title,
});

export const toSchoolAccountResponse = (
  record: SchoolAccountRecord,
): AdminSchoolAccountResponse => ({
  school: toSchoolResponse(record.school),
  staff: toSchoolStaffResponse(record.staff),
  account: toParentResponse(record.account) as ParentResponse,
});

export const toSchoolChildEnrollmentResponse = (
  enrollment: SchoolChildEnrollment,
): SchoolChildEnrollmentResponse => ({
  id: enrollment.id,
  schoolId: enrollment.schoolId,
  childId: enrollment.childId,
  status: enrollment.status,
  startedAt: enrollment.startedAt.toISOString(),
  endedAt: enrollment.endedAt?.toISOString() ?? null,
});

export const toSchoolActivityReportResponse = (
  report: SchoolActivityReport,
): SchoolActivityReportResponse => ({
  id: report.id,
  schoolId: report.schoolId,
  childId: report.childId,
  reporterId: report.reporterId,
  title: report.title,
  summary: report.summary,
  activityDate: report.activityDate.toISOString().slice(0, 10),
  createdAt: report.createdAt.toISOString(),
});
