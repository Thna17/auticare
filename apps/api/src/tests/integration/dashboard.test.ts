import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareDashboardTest123!';

const parentZeroEmail = `dash-pzero-${unique}@auticare.test`;
const parentPartialEmail = `dash-ppartial-${unique}@auticare.test`;
const parentPopulatedEmail = `dash-ppopulated-${unique}@auticare.test`;
const adminEmail = `dash-admin-${unique}@auticare.test`;
const schoolEmail = `dash-school-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdChildIds: string[] = [];
const createdHospitalIds: string[] = [];
const createdDoctorIds: string[] = [];
const createdAppointmentIds: string[] = [];
const createdActivityIds: string[] = [];
const createdScreeningIds: string[] = [];

let parentZeroAgent: request.Agent;
let parentPartialAgent: request.Agent;
let parentPopulatedAgent: request.Agent;
let adminAgent: request.Agent;
let schoolAgent: request.Agent;

let populatedChildId = '';
let partialChildId = '';

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);

  const [pZero, pPartial, pPopulated, adminUser, schoolUser] = await Promise.all([
    prisma.parent.create({
      data: {
        email: parentZeroEmail,
        passwordHash,
        firstName: 'Zero',
        lastName: 'Parent',
        role: 'PARENT',
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: parentPartialEmail,
        passwordHash,
        firstName: 'Partial',
        lastName: 'Parent',
        role: 'PARENT',
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: parentPopulatedEmail,
        passwordHash,
        firstName: 'Populated',
        lastName: 'Parent',
        role: 'PARENT',
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'Dashboard',
        lastName: 'Admin',
        role: 'ADMIN',
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: schoolEmail,
        passwordHash,
        firstName: 'Dashboard',
        lastName: 'School',
        role: 'SCHOOL',
        preference: { create: {} },
      },
    }),
  ]);

  createdParentIds.push(pZero.id, pPartial.id, pPopulated.id, adminUser.id, schoolUser.id);

  // Setup agents
  parentZeroAgent = request.agent(app);
  parentPartialAgent = request.agent(app);
  parentPopulatedAgent = request.agent(app);
  adminAgent = request.agent(app);
  schoolAgent = request.agent(app);

  await Promise.all([
    parentZeroAgent
      .post('/api/v1/auth/login')
      .send({ email: parentZeroEmail, password })
      .expect(200),
    parentPartialAgent
      .post('/api/v1/auth/login')
      .send({ email: parentPartialEmail, password })
      .expect(200),
    parentPopulatedAgent
      .post('/api/v1/auth/login')
      .send({ email: parentPopulatedEmail, password })
      .expect(200),
    adminAgent.post('/api/v1/auth/login').send({ email: adminEmail, password }).expect(200),
    schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password }).expect(200),
  ]);

  // Partial data: child created, but no screening, no appointments, no activities
  const partialChild = await prisma.child.create({
    data: {
      parentId: pPartial.id,
      firstName: 'PartialChild',
      lastName: 'Smith',
      dateOfBirth: new Date('2020-05-10'),
    },
  });
  partialChildId = partialChild.id;
  createdChildIds.push(partialChild.id);

  // Populated data: child created + screening completed + activity completed this week + appointment
  const populatedChild = await prisma.child.create({
    data: {
      parentId: pPopulated.id,
      firstName: 'PopChild',
      lastName: 'Smith',
      dateOfBirth: new Date('2019-03-15'),
    },
  });
  populatedChildId = populatedChild.id;
  createdChildIds.push(populatedChild.id);

  // Completed screening with stored result
  const screening = await prisma.screening.create({
    data: {
      childId: populatedChild.id,
      ageBand: 'PRESCHOOL',
      status: 'SUBMITTED',
      submittedAt: new Date(),
      result: {
        create: {
          riskLevel: 'MODERATE',
          riskPercentage: 62,
          score: 14,
          recommendation: 'Targeted visual and speech therapy recommended.',
          disclaimer: 'This screening is an educational tool and not a medical diagnosis.',
          analysisVersion: '1.0.0',
          categoryScores: {
            create: [
              {
                category: 'COMMUNICATION',
                riskLevel: 'MODERATE',
                riskPercentage: 66,
                displayOrder: 1,
              },
              { category: 'SOCIAL', riskLevel: 'MODERATE', riskPercentage: 83, displayOrder: 2 },
            ],
          },
        },
      },
    },
  });
  createdScreeningIds.push(screening.id);

  // Activity & progress this week
  const activity = await prisma.activity.create({
    data: {
      title: `Dashboard Test Activity ${unique}`,
      category: 'COMMUNICATION',
      minAgeMonths: 24,
      maxAgeMonths: 72,
      summary: 'Dashboard test activity summary',
    },
  });
  createdActivityIds.push(activity.id);

  const activityProgress = await prisma.activityProgress.create({
    data: {
      childId: populatedChild.id,
      activityId: activity.id,
      completedAt: new Date(),
    },
  });
  createdActivityIds.push(activityProgress.id);

  // Hospital & Doctor for appointment
  const hospital = await prisma.hospital.create({
    data: {
      name: `Hospital-${unique}`,
      address: '123 Care Ave',
      city: 'Metropolis',
      services: 'Speech Therapy, Occupational Therapy',
    },
  });
  createdHospitalIds.push(hospital.id);

  const doctor = await prisma.doctor.create({
    data: {
      hospitalId: hospital.id,
      fullName: 'Dr. Evelyn Reed',
      specialty: 'Pediatric Neurology',
    },
  });
  createdDoctorIds.push(doctor.id);

  // Scheduled appointment for populated parent
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const appointment = await prisma.appointment.create({
    data: {
      parentId: pPopulated.id,
      childId: populatedChild.id,
      hospitalId: hospital.id,
      doctorId: doctor.id,
      scheduledAt: tomorrow,
      status: 'CONFIRMED',
      reason: 'Routine developmental check',
    },
  });
  createdAppointmentIds.push(appointment.id);
});

afterAll(async () => {
  if (createdChildIds.length > 0) {
    await prisma.activityProgress.deleteMany({ where: { childId: { in: createdChildIds } } });
  }
  if (createdActivityIds.length > 0) {
    await prisma.activity.deleteMany({ where: { id: { in: createdActivityIds } } });
  }
  if (createdScreeningIds.length > 0) {
    await prisma.screeningResult.deleteMany({
      where: { screeningId: { in: createdScreeningIds } },
    });
    await prisma.screening.deleteMany({ where: { id: { in: createdScreeningIds } } });
  }
  if (createdAppointmentIds.length > 0) {
    await prisma.appointment.deleteMany({ where: { id: { in: createdAppointmentIds } } });
  }
  if (createdDoctorIds.length > 0) {
    await prisma.doctor.deleteMany({ where: { id: { in: createdDoctorIds } } });
  }
  if (createdHospitalIds.length > 0) {
    await prisma.hospital.deleteMany({ where: { id: { in: createdHospitalIds } } });
  }
  if (createdChildIds.length > 0) {
    await prisma.child.deleteMany({ where: { id: { in: createdChildIds } } });
  }
  if (createdParentIds.length > 0) {
    await prisma.parentPreference.deleteMany({ where: { parentId: { in: createdParentIds } } });
    await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  }
});

describe('Dashboard Integration Tests', () => {
  describe('GET /api/v1/dashboard/parent', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/dashboard/parent');
      expect(res.status).toBe(401);
    });

    it('returns 403 when called by ADMIN or SCHOOL roles', async () => {
      const adminRes = await adminAgent.get('/api/v1/dashboard/parent');
      expect(adminRes.status).toBe(403);

      const schoolRes = await schoolAgent.get('/api/v1/dashboard/parent');
      expect(schoolRes.status).toBe(403);
    });

    it('handles zero-data state honestly (no child added)', async () => {
      const res = await parentZeroAgent.get('/api/v1/dashboard/parent');
      expect(res.status).toBe(200);

      const data = res.body.data;
      expect(data.selectedChild).toBeNull();
      expect(data.totalChildren).toBe(0);
      expect(data.screeningSummary.hasScreening).toBe(false);
      expect(data.screeningSummary.sessionId).toBeNull();
      expect(data.weeklyProgress.totalCompletedThisWeek).toBe(0);
      expect(data.weeklyProgress.days).toHaveLength(7);
      expect(data.upcomingAppointment).toBeNull();
      expect(data.recommendedAction.source).toBe('NO_CHILD');
      expect(data.recommendedAction.actionPath).toBe('/children/new');
    });

    it('handles partial-data state honestly (child exists, no screening or appointment)', async () => {
      const res = await parentPartialAgent.get('/api/v1/dashboard/parent');
      expect(res.status).toBe(200);

      const data = res.body.data;
      expect(data.selectedChild).not.toBeNull();
      expect(data.selectedChild.id).toBe(partialChildId);
      expect(data.selectedChild.firstName).toBe('PartialChild');
      expect(data.totalChildren).toBe(1);
      expect(data.screeningSummary.hasScreening).toBe(false);
      expect(data.weeklyProgress.totalCompletedThisWeek).toBe(0);
      expect(data.upcomingAppointment).toBeNull();
      expect(data.recommendedAction.source).toBe('NO_SCREENING');
      expect(data.recommendedAction.actionPath).toBe('/screening');
      expect(data.recommendedAction.title).toContain('PartialChild');
    });

    it('returns populated backend-derived metrics correctly', async () => {
      const res = await parentPopulatedAgent.get('/api/v1/dashboard/parent');
      expect(res.status).toBe(200);

      const data = res.body.data;
      expect(data.selectedChild).not.toBeNull();
      expect(data.selectedChild.id).toBe(populatedChildId);
      expect(data.selectedChild.firstName).toBe('PopChild');
      expect(data.totalChildren).toBe(1);

      // Screening
      expect(data.screeningSummary.hasScreening).toBe(true);
      expect(data.screeningSummary.riskLevel).toBe('MODERATE');
      expect(data.screeningSummary.riskPercentage).toBe(62);
      expect(data.screeningSummary.score).toBe(14);
      expect(data.screeningSummary.recommendation).toBe(
        'Targeted visual and speech therapy recommended.',
      );

      // Weekly activity progress
      expect(data.weeklyProgress.totalCompletedThisWeek).toBe(1);

      // Upcoming appointment
      expect(data.upcomingAppointment).not.toBeNull();
      expect(data.upcomingAppointment.doctorName).toBe('Dr. Evelyn Reed');
      expect(data.upcomingAppointment.specialty).toBe('Pediatric Neurology');
      expect(data.upcomingAppointment.status).toBe('CONFIRMED');
      expect(data.upcomingAppointment.childFirstName).toBe('PopChild');

      // Recommended action derived from stored screening
      expect(data.recommendedAction.source).toBe('SCREENING_RESULT');
      expect(data.recommendedAction.description).toBe(
        'Targeted visual and speech therapy recommended.',
      );

      // Children list metadata
      expect(Array.isArray(data.children)).toBe(true);
      expect(data.children).toHaveLength(1);
      expect(data.children[0].id).toBe(populatedChildId);
    });

    it('personalizes metrics for requested child via ?childId= query parameter', async () => {
      // Create a second child for parentPopulated
      const secondChild = await prisma.child.create({
        data: {
          parentId: createdParentIds[2]!, // pPopulated.id
          firstName: 'SecondPopChild',
          lastName: 'Parent',
          dateOfBirth: new Date('2022-05-15'),
        },
      });
      createdChildIds.push(secondChild.id);

      // Query with childId pointing to the second child (who has no screening yet)
      const res = await parentPopulatedAgent.get(
        `/api/v1/dashboard/parent?childId=${secondChild.id}`,
      );
      expect(res.status).toBe(200);

      const data = res.body.data;
      expect(data.selectedChild).not.toBeNull();
      expect(data.selectedChild.id).toBe(secondChild.id);
      expect(data.selectedChild.firstName).toBe('SecondPopChild');
      expect(data.totalChildren).toBe(2);
      expect(data.children).toHaveLength(2);
      expect(data.screeningSummary.hasScreening).toBe(false);
      expect(data.recommendedAction.source).toBe('NO_SCREENING');

      // Query with invalid childId falls back to first child
      const fallbackRes = await parentPopulatedAgent.get(
        '/api/v1/dashboard/parent?childId=non_existent_id',
      );
      expect(fallbackRes.status).toBe(200);
      expect(fallbackRes.body.data.selectedChild.id).toBe(populatedChildId);
    });
  });

  describe('GET /api/v1/dashboard/admin', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/dashboard/admin');
      expect(res.status).toBe(401);
    });

    it('returns 403 when called by PARENT or SCHOOL roles', async () => {
      const parentRes = await parentPopulatedAgent.get('/api/v1/dashboard/admin');
      expect(parentRes.status).toBe(403);

      const schoolRes = await schoolAgent.get('/api/v1/dashboard/admin');
      expect(schoolRes.status).toBe(403);
    });

    it('returns accurate administrative statistics and recent activities', async () => {
      const res = await adminAgent.get('/api/v1/dashboard/admin');
      expect(res.status).toBe(200);

      const data = res.body.data;
      expect(data.stats).toBeDefined();
      expect(typeof data.stats.totalFamilies).toBe('number');
      expect(data.stats.totalFamilies).toBeGreaterThanOrEqual(3);
      expect(typeof data.stats.activeChildren).toBe('number');
      expect(data.stats.activeChildren).toBeGreaterThanOrEqual(2);
      expect(typeof data.stats.totalHospitals).toBe('number');
      expect(typeof data.stats.totalAppointments).toBe('number');

      expect(Array.isArray(data.recentAppointments)).toBe(true);
      expect(Array.isArray(data.recentAuditEvents)).toBe(true);
    });
  });
});
