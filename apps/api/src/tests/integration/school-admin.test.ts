import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = Date.now();
const password = 'AutiCareTestPassword123';
const adminEmail = `school-admin-${unique}@auticare.test`;
const parentEmail = `school-parent-${unique}@auticare.test`;
const existingSchoolEmail = `school-existing-${unique}@auticare.test`;
const newSchoolEmail = `school-created-${unique}@auticare.test`;
const blockedSchoolEmail = `school-blocked-${unique}@auticare.test`;
const createdParentIds: string[] = [];
const createdSchoolIds: string[] = [];

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);
  const [admin, parent, existingSchool] = await Promise.all([
    prisma.parent.create({
      data: {
        email: adminEmail,
        firstName: 'School',
        lastName: 'Admin',
        role: 'ADMIN',
        passwordHash,
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: parentEmail,
        firstName: 'Regular',
        lastName: 'Parent',
        role: 'PARENT',
        passwordHash,
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: existingSchoolEmail,
        firstName: 'Existing',
        lastName: 'School',
        role: 'SCHOOL',
        passwordHash,
        preference: { create: {} },
      },
    }),
  ]);
  createdParentIds.push(admin.id, parent.id, existingSchool.id);
});

afterAll(async () => {
  await prisma.school.deleteMany({ where: { id: { in: createdSchoolIds } } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  await prisma.$disconnect();
});

const schoolAccountInput = (email: string) => ({
  school: {
    name: `Created School ${unique}`,
    city: 'Phnom Penh',
    address: 'School Road 12',
    description: 'Inclusive classroom support.',
  },
  account: {
    email,
    password,
    firstName: 'School',
    lastName: 'Coordinator',
    title: 'Coordinator',
  },
});

describe('admin school account management', () => {
  it('allows admins to create school login accounts and blocks other roles', async () => {
    const adminAgent = request.agent(app);
    const parentAgent = request.agent(app);
    const schoolAgent = request.agent(app);

    await adminAgent.post('/api/v1/auth/login').send({ email: adminEmail, password });
    await parentAgent.post('/api/v1/auth/login').send({ email: parentEmail, password });
    await schoolAgent.post('/api/v1/auth/login').send({ email: existingSchoolEmail, password });

    const parentBlocked = await parentAgent
      .post('/api/v1/schools/admin/accounts')
      .send(schoolAccountInput(`parent-blocked-${newSchoolEmail}`));
    expect(parentBlocked.status).toBe(403);

    const schoolBlocked = await schoolAgent
      .post('/api/v1/schools/admin/accounts')
      .send(schoolAccountInput(blockedSchoolEmail));
    expect(schoolBlocked.status).toBe(403);

    const createResponse = await adminAgent
      .post('/api/v1/schools/admin/accounts')
      .send(schoolAccountInput(newSchoolEmail.toUpperCase()));
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.account.email).toBe(newSchoolEmail);
    expect(createResponse.body.data.account.role).toBe('SCHOOL');
    expect(createResponse.body.data.staff.schoolId).toBe(createResponse.body.data.school.id);
    expect(createResponse.body.data.account.passwordHash).toBeUndefined();

    createdParentIds.push(createResponse.body.data.account.id);
    createdSchoolIds.push(createResponse.body.data.school.id);

    const duplicateResponse = await adminAgent
      .post('/api/v1/schools/admin/accounts')
      .send(schoolAccountInput(newSchoolEmail));
    expect(duplicateResponse.status).toBe(409);

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: newSchoolEmail, password });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.parent.role).toBe('SCHOOL');

    const staff = await prisma.schoolStaff.findUnique({
      where: {
        parentId_schoolId: {
          parentId: createResponse.body.data.account.id,
          schoolId: createResponse.body.data.school.id,
        },
      },
    });
    expect(staff).toBeTruthy();

    const listResponse = await adminAgent.get('/api/v1/schools/admin/accounts');
    expect(listResponse.status).toBe(200);
    expect(
      listResponse.body.data.some(
        (item: { account: { email: string } }) => item.account.email === newSchoolEmail,
      ),
    ).toBe(true);
  });
});
