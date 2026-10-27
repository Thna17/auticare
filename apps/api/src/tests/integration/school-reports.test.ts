import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
// Date.now() alone is not unique: vitest runs these files in parallel
// workers, so two of them can start in the same millisecond and build
// identical emails — and Parent.email is UNIQUE. school-profile and
// school-admin both derive `school-parent-${unique}`, which is exactly
// how that collided. The random suffix makes the value per-worker unique.
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareTestPassword123';
const parentEmail = `report-parent-${unique}@auticare.test`;
const schoolEmail = `report-school-${unique}@auticare.test`;
let schoolId = '';
let schoolUserId = '';
let parentId = '';
let childId = '';

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);
  const school = await prisma.school.create({
    data: {
      name: `Report School ${unique}`,
      city: 'Phnom Penh',
      address: 'Report Road 1',
      description: 'Test school',
    },
  });
  schoolId = school.id;
  const schoolUser = await prisma.parent.create({
    data: {
      email: schoolEmail,
      firstName: 'School',
      lastName: 'Reporter',
      role: 'SCHOOL',
      passwordHash,
      preference: { create: {} },
    },
  });
  schoolUserId = schoolUser.id;
  await prisma.schoolStaff.create({
    data: { role: 'ADMIN', schoolId, parentId: schoolUser.id, title: 'Teacher' },
  });
});

afterAll(async () => {
  if (childId) {
    await prisma.activityReport.deleteMany({ where: { childId } });
    await prisma.schoolChildEnrollment.deleteMany({ where: { childId } });
  }
  if (parentId || schoolUserId) {
    await prisma.notification.deleteMany({
      where: { parentId: { in: [parentId, schoolUserId].filter(Boolean) } },
    });
    await prisma.parent.deleteMany({
      where: { id: { in: [parentId, schoolUserId].filter(Boolean) } },
    });
  }
  if (schoolId) await prisma.school.deleteMany({ where: { id: schoolId } });
  await prisma.$disconnect();
});

describe('school activity reports', () => {
  it('allows school reports only for actively enrolled children', async () => {
    const parentAgent = request.agent(app);
    const schoolAgent = request.agent(app);

    const parentRegister = await parentAgent.post('/api/v1/auth/register').send({
      email: parentEmail,
      password,
      firstName: 'Report',
      lastName: 'Parent',
    });
    expect(parentRegister.status).toBe(201);
    parentId = parentRegister.body.data.parent.id;

    const childResponse = await parentAgent.post('/api/v1/children').send({
      firstName: 'Report Child',
      dateOfBirth: '2020-02-03',
    });
    expect(childResponse.status).toBe(201);
    childId = childResponse.body.data.id;

    await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });

    const blockedReport = await schoolAgent.post('/api/v1/schools/reports').send({
      childId,
      activityCategory: 'Social/Emotional',
      title: 'Shared play activity',
      summary: 'Participated calmly in a small-group activity.',
      activityDate: '2026-07-11',
    });
    expect(blockedReport.status).toBe(403);
    expect(blockedReport.body.error.code).toBe('AUTHORIZATION_FAILED');

    const enrollment = await parentAgent.post(`/api/v1/schools/${schoolId}/enrollments`).send({
      childId,
    });
    expect(enrollment.status).toBe(201);
    expect(enrollment.body.data.status).toBe('ACTIVE');

    const enrolledStudents = await schoolAgent.get('/api/v1/schools/enrolled-students');
    expect(enrolledStudents.status).toBe(200);
    expect(Array.isArray(enrolledStudents.body.data)).toBe(true);
    expect(
      enrolledStudents.body.data.some(
        (student: { id: string; firstName: string }) =>
          student.id === childId && student.firstName === 'Report Child',
      ),
    ).toBe(true);

    // Submitted, because parents only ever see submitted reports.
    const report = await schoolAgent.post('/api/v1/schools/reports').send({
      childId,
      activityCategory: 'Social/Emotional',
      title: 'Shared play activity',
      summary: 'Participated calmly in a small-group activity.',
      activityDate: '2026-07-11',
      status: 'SUBMITTED',
    });
    expect(report.status).toBe(201);
    expect(report.body.data.schoolId).toBe(schoolId);
    expect(report.body.data.childId).toBe(childId);

    const parentReports = await parentAgent.get('/api/v1/schools/reports');
    expect(parentReports.status).toBe(200);
    expect(
      parentReports.body.data.reports.some(
        (item: { id: string }) => item.id === report.body.data.id,
      ),
    ).toBe(true);
    expect(parentReports.body.data.pagination.page).toBe(1);
  });

  // There used to be a second create endpoint, POST /schools/activity-reports,
  // which is what the report form posted to. It was a near-copy of this one
  // missing the line that carries `status` through: the request looked fine, the
  // response said DRAFT, the school was navigated away as though it had
  // submitted, and the parent's progress page — which lists SUBMITTED only —
  // never showed the report. The copy is gone; this is the guard that the
  // surviving one keeps the status it is given.
  it('stores the submitted status it is asked for and notifies the parent', async () => {
    const schoolAgent = request.agent(app);
    await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });

    const created = await schoolAgent.post('/api/v1/schools/reports').send({
      childId,
      activityCategory: 'Social/Emotional',
      activityName: 'Status check',
      summary: 'Checks that status survives the request.',
      teacherObservation: 'Engaged throughout.',
      status: 'SUBMITTED',
    });

    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('SUBMITTED');

    // Read back from storage, since the response body echoing the right value is
    // not the same as the row holding it.
    const readBack = await schoolAgent.get(`/api/v1/schools/reports/${created.body.data.id}`);
    expect(readBack.body.data.status).toBe('SUBMITTED');

    // Verify parent notification creation
    const notification = await prisma.notification.findFirst({
      where: {
        parentId,
        reportId: created.body.data.id,
        type: 'SCHOOL_REPORT',
      },
    });
    expect(notification).not.toBeNull();
    expect(notification?.status).toBe('UNREAD');
    expect(notification?.schoolId).toBe(schoolId);
    expect(notification?.title).toBe('New School Report for Report Child');
    expect(notification?.body).toContain('posted a developmental observation report: Status check');
  });

  it('still defaults to DRAFT when no status is asked for and sends no notification', async () => {
    const schoolAgent = request.agent(app);
    await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });

    const created = await schoolAgent.post('/api/v1/schools/reports').send({
      childId,
      activityCategory: 'Social/Emotional',
      activityName: 'Draft by omission',
      teacherObservation: 'Saved part way through.',
    });

    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('DRAFT');

    const draftNotification = await prisma.notification.findFirst({
      where: { reportId: created.body.data.id },
    });
    expect(draftNotification).toBeNull();
  });

  it('creates an unread parent notification when a draft report is updated to SUBMITTED', async () => {
    const schoolAgent = request.agent(app);
    await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });

    const draft = await schoolAgent.post('/api/v1/schools/reports').send({
      childId,
      activityCategory: 'Speech & Language',
      activityName: 'Vocabulary Practice',
      summary: 'Practiced two-word phrases.',
      teacherObservation: 'Good vocalization.',
      status: 'DRAFT',
    });
    expect(draft.status).toBe(201);
    expect(draft.body.data.status).toBe('DRAFT');

    const beforeNotif = await prisma.notification.findFirst({
      where: { reportId: draft.body.data.id },
    });
    expect(beforeNotif).toBeNull();

    const updated = await schoolAgent.patch(`/api/v1/schools/reports/${draft.body.data.id}`).send({
      status: 'SUBMITTED',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe('SUBMITTED');

    const notification = await prisma.notification.findFirst({
      where: {
        parentId,
        reportId: draft.body.data.id,
        type: 'SCHOOL_REPORT',
      },
    });
    expect(notification).not.toBeNull();
    expect(notification?.status).toBe('UNREAD');
    expect(notification?.schoolId).toBe(schoolId);
    expect(notification?.title).toBe('New School Report for Report Child');
    expect(notification?.body).toContain(
      'posted a developmental observation report: Vocabulary Practice',
    );
  });

  // Delete was the one thing the removed /activity-reports routes still offered
  // that this module did not, so it moved here rather than disappearing.
  it('deletes a report belonging to the caller’s school', async () => {
    const schoolAgent = request.agent(app);
    await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });

    const created = await schoolAgent.post('/api/v1/schools/reports').send({
      childId,
      activityCategory: 'Social/Emotional',
      activityName: 'To be deleted',
      teacherObservation: 'Temporary.',
    });
    expect(created.status).toBe(201);

    const removed = await schoolAgent.delete(`/api/v1/schools/reports/${created.body.data.id}`);
    expect(removed.status).toBe(200);
    expect(removed.body.data.success).toBe(true);

    const gone = await schoolAgent.get(`/api/v1/schools/reports/${created.body.data.id}`);
    expect(gone.status).toBe(404);
  });

  it('answers 404, not 403, when deleting another school’s report', async () => {
    const otherSchool = await prisma.school.create({
      data: {
        name: `Other School ${unique}`,
        city: 'Phnom Penh',
        address: 'Other Road 1',
        description: 'Test school',
      },
    });
    const foreign = await prisma.activityReport.create({
      data: {
        schoolId: otherSchool.id,
        childId,
        reporterId: schoolUserId,
        activityCategory: 'Social/Emotional',
        title: 'Not yours',
        summary: 'Belongs to another school.',
        activityDate: new Date('2026-07-11'),
      },
    });

    const schoolAgent = request.agent(app);
    await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });

    // 404 rather than 403: a 403 would confirm the id exists to a caller probing
    // for other schools' reports, which is the same reason getReportById does it.
    const refused = await schoolAgent.delete(`/api/v1/schools/reports/${foreign.id}`);
    expect(refused.status).toBe(404);

    await prisma.activityReport.delete({ where: { id: foreign.id } });
    await prisma.school.delete({ where: { id: otherSchool.id } });
  });

  it('filters reports using the search query parameter across title, category, or child name', async () => {
    const schoolAgent = request.agent(app);
    await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });

    const createdReport = await schoolAgent.post('/api/v1/schools/reports').send({
      childId,
      activityCategory: 'Art & Expression',
      activityName: 'Finger Painting Mastery',
      teacherObservation: 'Explored textures and primary colors.',
    });
    expect(createdReport.status).toBe(201);

    // Search by title match
    const titleMatch = await schoolAgent.get('/api/v1/schools/reports?search=Finger');
    expect(titleMatch.status).toBe(200);
    expect(
      titleMatch.body.data.reports.some((r: { id: string }) => r.id === createdReport.body.data.id),
    ).toBe(true);

    // Search by category match
    const catMatch = await schoolAgent.get('/api/v1/schools/reports?search=Expression');
    expect(catMatch.status).toBe(200);
    expect(
      catMatch.body.data.reports.some((r: { id: string }) => r.id === createdReport.body.data.id),
    ).toBe(true);

    // Search with non-matching query
    const noMatch = await schoolAgent.get('/api/v1/schools/reports?search=NonExistentQueryXYZ');
    expect(noMatch.status).toBe(200);
    expect(
      noMatch.body.data.reports.some((r: { id: string }) => r.id === createdReport.body.data.id),
    ).toBe(false);
  });
});
