import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

/**
 * The whole school-connection story, against a real database:
 * the school admin creates a teacher with no email, the teacher signs in with
 * a setup code, the admin hands a family a connection code, the parent
 * connects their child with consent, the assigned teacher (and only they)
 * reports on that child, and the parent sees only submitted reports.
 */

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareTestPassword123';
const teacherPassword = 'TeacherPassword123!';

const adminEmail = `connect-admin-${unique}@auticare.test`;
const parentEmail = `connect-parent-${unique}@auticare.test`;
const otherParentEmail = `connect-other-${unique}@auticare.test`;

const createdParentIds: string[] = [];
let schoolId = '';
let childId = '';
let otherChildId = '';
let teacherStaffId = '';
let teacherUsername = '';
let teacherSetupCode = '';
let connectionCode = '';
let enrollmentId = '';

const adminAgent = request.agent(app);
const teacherAgent = request.agent(app);
const otherTeacherAgent = request.agent(app);
const parentAgent = request.agent(app);
const otherParentAgent = request.agent(app);

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);
  const school = await prisma.school.create({
    data: {
      // Two words, so the username handle is "sl".
      name: 'Sunrise Learning',
      city: 'Phnom Penh',
      address: 'Street 1',
    },
  });
  schoolId = school.id;

  const admin = await prisma.parent.create({
    data: {
      email: adminEmail,
      firstName: 'School',
      lastName: 'Admin',
      role: 'SCHOOL',
      passwordHash,
      preference: { create: {} },
    },
  });
  createdParentIds.push(admin.id);
  await prisma.schoolStaff.create({
    data: { parentId: admin.id, schoolId, role: 'ADMIN', title: 'Principal' },
  });

  for (const [agent, email] of [
    [parentAgent, parentEmail],
    [otherParentAgent, otherParentEmail],
  ] as const) {
    const registered = await agent
      .post('/api/v1/auth/register')
      .send({ email, password, firstName: 'Family', lastName: 'Parent' });
    expect(registered.status).toBe(201);
    createdParentIds.push(registered.body.data.parent.id);
  }

  childId = (
    await parentAgent
      .post('/api/v1/children')
      .send({ firstName: 'Dara', dateOfBirth: '2022-03-10' })
  ).body.data.id;
  otherChildId = (
    await otherParentAgent
      .post('/api/v1/children')
      .send({ firstName: 'Mealea', dateOfBirth: '2021-06-01' })
  ).body.data.id;

  const login = await adminAgent.post('/api/v1/auth/login').send({ email: adminEmail, password });
  expect(login.status).toBe(200);
});

afterAll(async () => {
  // Reports and notifications reference the school without cascading.
  await prisma.activityReport.deleteMany({ where: { schoolId } });
  await prisma.notification.deleteMany({ where: { schoolId } });
  await prisma.school.deleteMany({ where: { id: schoolId } });
  if (teacherUsername) {
    await prisma.parent.deleteMany({ where: { username: teacherUsername } });
  }
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  await prisma.$disconnect();
});

describe('school connections', () => {
  it('lets the school admin create a teacher with a username and a setup code', async () => {
    const created = await adminAgent.post('/api/v1/schools/staff').send({
      firstName: 'Serey',
      lastName: unique.replace(/[^a-z0-9]/gi, '').slice(-6),
      title: 'Lead teacher',
    });
    expect(created.status).toBe(201);
    expect(created.body.data.username).toMatch(/^serey[a-z0-9]+\.sl$/);
    expect(created.body.data.setupCode).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(created.body.data.staff.status).toBe('SETUP_PENDING');
    expect(created.body.data.staff.role).toBe('TEACHER');
    teacherStaffId = created.body.data.staff.id;
    teacherUsername = created.body.data.username;
    teacherSetupCode = created.body.data.setupCode;

    const staff = await adminAgent.get('/api/v1/schools/staff');
    expect(staff.status).toBe(200);
    expect(staff.body.data.map((m: { role: string }) => m.role).sort()).toEqual([
      'ADMIN',
      'TEACHER',
    ]);
  });

  it('signs the teacher in only with the right username and setup code, once', async () => {
    const wrong = await teacherAgent
      .post('/api/v1/auth/staff-setup')
      .send({ username: teacherUsername, setupCode: 'AAAA-BBBB', password: teacherPassword });
    expect(wrong.status).toBe(400);

    // The code is bound to its username.
    const otherName = await teacherAgent
      .post('/api/v1/auth/staff-setup')
      .send({ username: 'someone.sl', setupCode: teacherSetupCode, password: teacherPassword });
    expect(otherName.status).toBe(400);

    const setup = await teacherAgent.post('/api/v1/auth/staff-setup').send({
      username: teacherUsername.toUpperCase(),
      setupCode: teacherSetupCode.toLowerCase().replace('-', ' '),
      password: teacherPassword,
    });
    expect(setup.status).toBe(200);
    expect(setup.body.data.parent.username).toBe(teacherUsername);

    const reused = await otherTeacherAgent
      .post('/api/v1/auth/staff-setup')
      .send({ username: teacherUsername, setupCode: teacherSetupCode, password: teacherPassword });
    expect(reused.status).toBe(400);

    const login = await otherTeacherAgent
      .post('/api/v1/auth/login')
      .send({ email: teacherUsername, password: teacherPassword });
    expect(login.status).toBe(200);
  });

  it('keeps staff and codes in the admin’s hands', async () => {
    const teacherCreates = await teacherAgent
      .post('/api/v1/schools/staff')
      .send({ firstName: 'Not', lastName: 'Allowed' });
    expect(teacherCreates.status).toBe(403);

    const teacherCode = await teacherAgent.post('/api/v1/schools/connection-codes').send({});
    expect(teacherCode.status).toBe(403);

    // Nobody is assigned to this teacher yet.
    const students = await teacherAgent.get('/api/v1/schools/enrolled-students');
    expect(students.status).toBe(200);
    expect(students.body.data).toEqual([]);
  });

  it('connects a child only after the parent previews, picks the child and consents', async () => {
    const code = await adminAgent
      .post('/api/v1/schools/connection-codes')
      .send({ label: 'Dara’s family', teacherStaffIds: [teacherStaffId] });
    expect(code.status).toBe(201);
    connectionCode = code.body.data.code;

    const preview = await parentAgent
      .post('/api/v1/connections/preview')
      .send({ code: connectionCode.toLowerCase() });
    expect(preview.status).toBe(200);
    expect(preview.body.data.school.id).toBe(schoolId);
    expect(preview.body.data.teachers[0].firstName).toBe('Serey');

    const noConsent = await parentAgent
      .post('/api/v1/connections')
      .send({ code: connectionCode, childId, consent: false });
    expect(noConsent.status).toBe(400);

    // A parent cannot connect someone else's child.
    const notMine = await parentAgent
      .post('/api/v1/connections')
      .send({ code: connectionCode, childId: otherChildId, consent: true });
    expect(notMine.status).toBe(404);

    const connected = await parentAgent
      .post('/api/v1/connections')
      .send({ code: connectionCode, childId, consent: true });
    expect(connected.status).toBe(201);
    expect(connected.body.data.status).toBe('ACTIVE');
    expect(connected.body.data.teachers.map((t: { firstName: string }) => t.firstName)).toEqual([
      'Serey',
    ]);
    enrollmentId = connected.body.data.enrollmentId;

    // Single use.
    const again = await otherParentAgent
      .post('/api/v1/connections')
      .send({ code: connectionCode, childId: otherChildId, consent: true });
    expect(again.status).toBe(400);

    const codes = await adminAgent.get('/api/v1/schools/connection-codes');
    const used = codes.body.data.find((c: { id: string }) => c.id === code.body.data.id);
    expect(used.status).toBe('USED');
    expect(used.childFirstName).toBe('Dara');
  });

  it('lets only the assigned teacher report, and shows parents only submitted reports', async () => {
    const students = await teacherAgent.get('/api/v1/schools/enrolled-students');
    expect(students.body.data.map((s: { childId: string }) => s.childId)).toEqual([childId]);

    const submitted = await teacherAgent.post('/api/v1/schools/reports').send({
      childId,
      activityCategory: 'Communication',
      title: 'Picture cards',
      summary: 'Used three picture cards to ask for a snack.',
      status: 'SUBMITTED',
    });
    expect(submitted.status).toBe(201);

    const draft = await teacherAgent.post('/api/v1/schools/reports').send({
      childId,
      activityCategory: 'Communication',
      title: 'Unfinished draft',
      summary: 'Not ready for the family yet.',
      status: 'DRAFT',
    });
    expect(draft.status).toBe(201);

    const parentReports = await parentAgent.get(`/api/v1/schools/reports?childId=${childId}`);
    expect(parentReports.status).toBe(200);
    const titles = parentReports.body.data.reports.map((r: { title: string }) => r.title);
    expect(titles).toContain('Picture cards');
    expect(titles).not.toContain('Unfinished draft');

    const draftDirect = await parentAgent.get(`/api/v1/schools/reports/${draft.body.data.id}`);
    expect(draftDirect.status).toBe(404);

    const connections = await parentAgent.get('/api/v1/connections');
    const connection = connections.body.data.find(
      (c: { enrollmentId: string }) => c.enrollmentId === enrollmentId,
    );
    expect(connection.reportCount).toBe(1);
  });

  it('cuts a deactivated teacher off at once', async () => {
    const deactivated = await adminAgent.post(`/api/v1/schools/staff/${teacherStaffId}/deactivate`);
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.data.status).toBe('DEACTIVATED');

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: teacherUsername, password: teacherPassword });
    expect(login.status).toBe(403);

    // An access token issued before deactivation no longer reaches school data.
    const students = await teacherAgent.get('/api/v1/schools/enrolled-students');
    expect(students.status).toBe(403);
  });

  it('lets the parent disconnect, which ends the enrollment', async () => {
    const disconnected = await parentAgent.delete(`/api/v1/connections/${enrollmentId}`);
    expect(disconnected.status).toBe(200);

    const connections = await parentAgent.get('/api/v1/connections');
    expect(
      connections.body.data.some((c: { enrollmentId: string }) => c.enrollmentId === enrollmentId),
    ).toBe(false);

    // The other family cannot end it for them.
    const notTheirs = await otherParentAgent.delete(`/api/v1/connections/${enrollmentId}`);
    expect(notTheirs.status).toBe(404);
  });
});
