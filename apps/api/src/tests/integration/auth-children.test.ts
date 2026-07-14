import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../database/prisma.js';
import { createApp } from '../../app.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = Date.now();
const parentEmail = `parent-${unique}@auticare.test`;
const otherParentEmail = `other-${unique}@auticare.test`;
const adminEmail = `admin-${unique}@auticare.test`;
const schoolEmail = `school-${unique}@auticare.test`;
const password = 'AutiCareTestPassword123';
const createdParentIds: string[] = [];

const extractCookie = (headers: string | string[] | undefined, name: string) => {
  const values = Array.isArray(headers) ? headers : headers ? [headers] : [];
  const cookie = values.find((value) => value.startsWith(`${name}=`));
  return cookie?.split(';')[0];
};

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);
  const [admin, school] = await Promise.all([
    prisma.parent.create({
      data: {
        email: adminEmail,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'ADMIN',
        passwordHash,
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: schoolEmail,
        firstName: 'Test',
        lastName: 'School',
        role: 'SCHOOL',
        passwordHash,
        preference: { create: {} },
      },
    }),
  ]);
  createdParentIds.push(admin.id, school.id);
});

afterAll(async () => {
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  await prisma.$disconnect();
});

describe('auth refresh rotation and child ownership', () => {
  it('rotates refresh tokens and revokes the token family on old-token reuse', async () => {
    const agent = request.agent(app);
    const registerResponse = await agent.post('/api/v1/auth/register').send({
      email: parentEmail,
      password,
      firstName: 'Parent',
      lastName: 'One',
    });
    expect(registerResponse.status).toBe(201);
    createdParentIds.push(registerResponse.body.data.parent.id);
    const oldRefreshCookie = extractCookie(
      registerResponse.headers['set-cookie'],
      'auticare_refresh',
    );
    expect(oldRefreshCookie).toBeTruthy();

    const refreshResponse = await agent.post('/api/v1/auth/refresh').send({});
    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.parent.email).toBe(parentEmail);

    const reuseResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', oldRefreshCookie!)
      .send({});
    expect(reuseResponse.status).toBe(401);
    expect(reuseResponse.body.error.code).toBe('AUTHENTICATION_REQUIRED');

    const revokedFamilyResponse = await agent.post('/api/v1/auth/refresh').send({});
    expect(revokedFamilyResponse.status).toBe(401);
    expect(revokedFamilyResponse.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('allows parents to manage their own children and blocks other parents and schools', async () => {
    const parentAgent = request.agent(app);
    const otherParentAgent = request.agent(app);
    const schoolAgent = request.agent(app);
    const adminAgent = request.agent(app);

    const parentRegister = await parentAgent.post('/api/v1/auth/register').send({
      email: otherParentEmail.replace('other-', 'owner-'),
      password,
      firstName: 'Owner',
      lastName: 'Parent',
    });
    const otherRegister = await otherParentAgent.post('/api/v1/auth/register').send({
      email: otherParentEmail,
      password,
      firstName: 'Other',
      lastName: 'Parent',
    });
    createdParentIds.push(parentRegister.body.data.parent.id, otherRegister.body.data.parent.id);

    await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });
    await adminAgent.post('/api/v1/auth/login').send({ email: adminEmail, password });

    const createResponse = await parentAgent.post('/api/v1/children').send({
      firstName: 'Child',
      dateOfBirth: '2020-01-02',
      notes: 'Uses headphones in busy spaces.',
    });
    expect(createResponse.status).toBe(201);
    const childId = createResponse.body.data.id;

    const blockedGet = await otherParentAgent.get(`/api/v1/children/${childId}`);
    expect(blockedGet.status).toBe(403);
    expect(blockedGet.body.error.code).toBe('AUTHORIZATION_FAILED');

    const schoolList = await schoolAgent.get('/api/v1/children');
    expect(schoolList.status).toBe(403);
    expect(schoolList.body.error.code).toBe('AUTHORIZATION_FAILED');

    const updateResponse = await parentAgent.patch(`/api/v1/children/${childId}`).send({
      firstName: 'Updated Child',
    });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.firstName).toBe('Updated Child');

    const adminGet = await adminAgent.get(`/api/v1/children/${childId}`);
    expect(adminGet.status).toBe(200);

    const archiveResponse = await parentAgent.delete(`/api/v1/children/${childId}`);
    expect(archiveResponse.status).toBe(200);
    expect(archiveResponse.body.data.archivedAt).toBeTruthy();
  });
});
