import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = Date.now();
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
    data: { schoolId, parentId: schoolUser.id, title: 'Teacher' },
  });
});

afterAll(async () => {
  if (childId) {
    await prisma.schoolActivityReport.deleteMany({ where: { childId } });
    await prisma.schoolChildEnrollment.deleteMany({ where: { childId } });
  }
  if (parentId || schoolUserId) {
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

    const blockedReport = await schoolAgent.post('/api/v1/schools/activity-reports').send({
      childId,
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

    const report = await schoolAgent.post('/api/v1/schools/activity-reports').send({
      childId,
      title: 'Shared play activity',
      summary: 'Participated calmly in a small-group activity.',
      activityDate: '2026-07-11',
    });
    expect(report.status).toBe(201);
    expect(report.body.data.schoolId).toBe(schoolId);
    expect(report.body.data.childId).toBe(childId);

    const parentReports = await parentAgent.get('/api/v1/schools/activity-reports');
    expect(parentReports.status).toBe(200);
    expect(
      parentReports.body.data.some((item: { id: string }) => item.id === report.body.data.id),
    ).toBe(true);
  });
});
