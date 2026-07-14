import type { SchoolActivityReport, SchoolChildEnrollment, SchoolStaff } from '@prisma/client';
import type {
  SchoolActivityReportResponse,
  SchoolChildEnrollmentResponse,
  SchoolStaffResponse,
} from '@auticare/contracts';

export const toSchoolStaffResponse = (staff: SchoolStaff): SchoolStaffResponse => ({
  id: staff.id,
  schoolId: staff.schoolId,
  parentId: staff.parentId,
  title: staff.title,
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
