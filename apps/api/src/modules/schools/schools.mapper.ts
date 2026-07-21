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

export const toSchoolResponse = (school: School): SchoolResponse => ({
  id: school.id,
  name: school.name,
  city: school.city,
  address: school.address,
  description: school.description,
  createdAt: school.createdAt.toISOString(),
  updatedAt: school.updatedAt.toISOString(),
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
