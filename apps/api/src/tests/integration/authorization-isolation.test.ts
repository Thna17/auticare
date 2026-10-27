import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareAuthTest123!';

const adminEmail = `auth-admin-${unique}@auticare.test`;
const parentAEmail = `auth-parent-a-${unique}@auticare.test`;
const parentBEmail = `auth-parent-b-${unique}@auticare.test`;
const schoolEmail = `auth-school-${unique}@auticare.test`;
const hospitalEmail = `auth-hospital-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdChildIds: string[] = [];
const createdSchoolIds: string[] = [];
const createdHospitalIds: string[] = [];

let childAId: string;

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);

  // 1. Create Parents A and B
  const [parentA, parentB, admin, schoolUser, hospitalUser] = await Promise.all([
    prisma.parent.create({
      data: {
        email: parentAEmail,
        firstName: 'Parent',
        lastName: 'Alpha',
        role: 'PARENT',
        passwordHash,
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: parentBEmail,
        firstName: 'Parent',
        lastName: 'Beta',
        role: 'PARENT',
        passwordHash,
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'Root',
        role: 'ADMIN',
        passwordHash,
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: schoolEmail,
        firstName: 'School',
        lastName: 'Staff',
        role: 'SCHOOL',
        passwordHash,
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: hospitalEmail,
        firstName: 'Hospital',
        lastName: 'Staff',
        role: 'HOSPITAL',
        passwordHash,
        preference: { create: {} },
      },
    }),
  ]);

  createdParentIds.push(parentA.id, parentB.id, admin.id, schoolUser.id, hospitalUser.id);

  // Create Child for Parent A
  const childA = await prisma.child.create({
    data: {
      parentId: parentA.id,
      firstName: 'Child Alpha',
      lastName: 'Test',
      dateOfBirth: new Date('2020-05-15'),
    },
  });
  childAId = childA.id;
  createdChildIds.push(childA.id);

  // Create School and associate Staff
  const school = await prisma.school.create({
    data: {
      name: `Isolation Test School ${unique}`,
      city: 'Phnom Penh',
      address: 'Test Street 1',
      description: 'School isolation testing',
    },
  });
  createdSchoolIds.push(school.id);

  await prisma.schoolStaff.create({
    data: {
      role: 'ADMIN',
      schoolId: school.id,
      parentId: schoolUser.id,
      title: 'Head of Special Ed',
    },
  });

  // Create Hospital and associate Staff
  const hospital = await prisma.hospital.create({
    data: {
      name: `Isolation Test Hospital ${unique}`,
      city: 'Phnom Penh',
      address: 'Test Hospital Road 1',
      services: 'Diagnostic, Therapy',
    },
  });
  createdHospitalIds.push(hospital.id);

  await prisma.hospitalStaff.create({
    data: {
      hospitalId: hospital.id,
      parentId: hospitalUser.id,
      title: 'Administrator',
    },
  });
});

afterAll(async () => {
  await prisma.child.deleteMany({ where: { id: { in: createdChildIds } } });
  await prisma.schoolStaff.deleteMany({ where: { parentId: { in: createdParentIds } } });
  await prisma.hospitalStaff.deleteMany({ where: { parentId: { in: createdParentIds } } });
  await prisma.school.deleteMany({ where: { id: { in: createdSchoolIds } } });
  await prisma.hospital.deleteMany({ where: { id: { in: createdHospitalIds } } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  await prisma.$disconnect();
});

describe('Cross-Role Authorization Isolation', () => {
  describe('Unauthenticated Public Access Boundaries', () => {
    it('rejects unauthenticated access to protected parent endpoints', async () => {
      const res1 = await request(app).get('/api/v1/children');
      expect(res1.status).toBe(401);

      const res2 = await request(app).get('/api/v1/dashboard');
      expect(res2.status).toBe(401);

      const res3 = await request(app).get('/api/v1/parents/notifications');
      expect(res3.status).toBe(401);
    });

    it('rejects unauthenticated access to protected school and hospital endpoints', async () => {
      const res1 = await request(app).get('/api/v1/schools/profile');
      expect(res1.status).toBe(401);

      const res2 = await request(app).get('/api/v1/hospital-management/profile');
      expect(res2.status).toBe(401);

      const res3 = await request(app).post('/api/v1/schools/admin/accounts').send({});
      expect(res3.status).toBe(401);
    });
  });

  describe('Parent Role Authorization Restrictions', () => {
    it('blocks parents from school management endpoints', async () => {
      const parentAgent = request.agent(app);
      await parentAgent.post('/api/v1/auth/login').send({ email: parentAEmail, password });

      const resProfile = await parentAgent.get('/api/v1/schools/me');
      expect(resProfile.status).toBe(403);

      const resEnrollments = await parentAgent.get('/api/v1/schools/enrollments/stats');
      expect(resEnrollments.status).toBe(403);

      const resAdmin = await parentAgent.post('/api/v1/schools/admin/accounts').send({});
      expect(resAdmin.status).toBe(403);
    });

    it('blocks parents from hospital management endpoints', async () => {
      const parentAgent = request.agent(app);
      await parentAgent.post('/api/v1/auth/login').send({ email: parentAEmail, password });

      const res = await parentAgent.get('/api/v1/hospital-management/me');
      expect(res.status).toBe(403);

      const resDoctors = await parentAgent.get('/api/v1/hospital-management/doctors');
      expect(resDoctors.status).toBe(403);
    });

    it('enforces tenant boundary: Parent B cannot access or modify Child of Parent A', async () => {
      const parentBAgent = request.agent(app);
      await parentBAgent.post('/api/v1/auth/login').send({ email: parentBEmail, password });

      const getRes = await parentBAgent.get(`/api/v1/children/${childAId}`);
      expect(getRes.status).toBe(403);

      const patchRes = await parentBAgent.patch(`/api/v1/children/${childAId}`).send({
        firstName: 'Hacked Name',
      });
      expect(patchRes.status).toBe(403);

      const deleteRes = await parentBAgent.delete(`/api/v1/children/${childAId}`);
      expect(deleteRes.status).toBe(403);
    });
  });

  describe('School Role Authorization Restrictions', () => {
    it('blocks school staff from hospital management and admin endpoints', async () => {
      const schoolAgent = request.agent(app);
      await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });

      const resHosp = await schoolAgent.get('/api/v1/hospital-management/me');
      expect(resHosp.status).toBe(403);

      const resAdmin = await schoolAgent.post('/api/v1/schools/admin/accounts').send({});
      expect(resAdmin.status).toBe(403);
    });

    it('blocks school staff from booking parent appointments', async () => {
      const schoolAgent = request.agent(app);
      await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });

      const res = await schoolAgent.post('/api/v1/appointments').send({
        childId: childAId,
        doctorId: 'doc-123',
        slotId: 'slot-123',
      });
      expect(res.status).toBe(403);
    });
  });

  describe('Hospital Role Authorization Restrictions', () => {
    it('blocks hospital staff from school endpoints', async () => {
      const hospitalAgent = request.agent(app);
      await hospitalAgent.post('/api/v1/auth/login').send({ email: hospitalEmail, password });

      const resProfile = await hospitalAgent.get('/api/v1/schools/me');
      expect(resProfile.status).toBe(403);

      const resReports = await hospitalAgent.get('/api/v1/schools/reports');
      expect(resReports.status).toBe(403);
    });

    it('allows hospital staff to access hospital management endpoints', async () => {
      const hospitalAgent = request.agent(app);
      await hospitalAgent.post('/api/v1/auth/login').send({ email: hospitalEmail, password });

      const res = await hospitalAgent.get('/api/v1/hospital-management/me');
      expect(res.status).toBe(200);
      expect(res.body.data.hospital.name).toBe(`Isolation Test Hospital ${unique}`);
    });
  });

  describe('Admin Role Authorization Permissions', () => {
    it('allows admins to access admin provisioning endpoints', async () => {
      const adminAgent = request.agent(app);
      await adminAgent.post('/api/v1/auth/login').send({ email: adminEmail, password });

      // Check access allowed (validation error 400 is expected for empty body, not 403)
      const res = await adminAgent.post('/api/v1/schools/admin/accounts').send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
