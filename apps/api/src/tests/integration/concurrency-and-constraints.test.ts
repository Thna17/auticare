import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const defaultPassword = 'AutiCareSecurePassword123';

const parentEmail = `concur-parent-${unique}@auticare.test`;
const competitorParentEmail = `concur-comp-${unique}@auticare.test`;
const hospitalStaffEmail = `concur-hosp-${unique}@auticare.test`;
const schoolStaffEmail = `concur-school-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdChildIds: string[] = [];
const createdSchoolIds: string[] = [];
const createdHospitalIds: string[] = [];
const createdDoctorIds: string[] = [];
const createdActivityIds: string[] = [];

let parentAgent: request.Agent;
let competitorAgent: request.Agent;
let hospitalAgent: request.Agent;

let parentId = '';
let childId = '';
let competitorChildId = '';
let schoolId = '';
let hospitalId = '';
let doctorId = '';
let activityId = '';

beforeAll(async () => {
  const passwordHash = await passwordService.hash(defaultPassword);

  const [parent, competitor, hospStaff, schStaff] = await Promise.all([
    prisma.parent.create({
      data: {
        email: parentEmail,
        passwordHash,
        firstName: 'Concurrency',
        lastName: 'Parent',
        role: 'PARENT',
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: competitorParentEmail,
        passwordHash,
        firstName: 'Competitor',
        lastName: 'Parent',
        role: 'PARENT',
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: hospitalStaffEmail,
        passwordHash,
        firstName: 'Hospital',
        lastName: 'Staff',
        role: 'HOSPITAL',
      },
    }),
    prisma.parent.create({
      data: {
        email: schoolStaffEmail,
        passwordHash,
        firstName: 'School',
        lastName: 'Staff',
        role: 'SCHOOL',
      },
    }),
  ]);

  parentId = parent.id;
  createdParentIds.push(parent.id, competitor.id, hospStaff.id, schStaff.id);

  // Create school
  const school = await prisma.school.create({
    data: {
      name: `Concurrency Academy ${unique}`,
      city: 'Phnom Penh',
      address: '123 Test St',
      status: 'ACTIVE',
      staff: {
        create: {
          parentId: schStaff.id,
          role: 'ADMIN',
        },
      },
    },
  });
  schoolId = school.id;
  createdSchoolIds.push(school.id);

  // Create hospital and doctor
  const hospital = await prisma.hospital.create({
    data: {
      name: `Concurrency Hospital ${unique}`,
      city: 'Phnom Penh',
      address: '456 Medical Blvd',
      services: 'Paediatrics, Autism Diagnostic',
      staff: {
        create: {
          parentId: hospStaff.id,
          title: 'Coordinator',
        },
      },
    },
  });
  hospitalId = hospital.id;
  createdHospitalIds.push(hospital.id);

  const doctor = await prisma.doctor.create({
    data: {
      hospitalId: hospital.id,
      fullName: 'Dr. Concurrency Specialist',
      specialty: 'Developmental Paediatrician',
      availableDays: '1,2,3,4,5',
      startHour: 9,
      endHour: 17,
      slotDurationMinutes: 30,
      timezone: 'UTC',
    },
  });
  doctorId = doctor.id;
  createdDoctorIds.push(doctor.id);

  // Create children
  const [child, competitorChild] = await Promise.all([
    prisma.child.create({
      data: {
        parentId: parent.id,
        firstName: 'Tommy',
        lastName: 'Tester',
        dateOfBirth: new Date('2022-01-15T00:00:00.000Z'),
      },
    }),
    prisma.child.create({
      data: {
        parentId: competitor.id,
        firstName: 'Timmy',
        lastName: 'Competitor',
        dateOfBirth: new Date('2022-02-20T00:00:00.000Z'),
      },
    }),
  ]);
  childId = child.id;
  competitorChildId = competitorChild.id;
  createdChildIds.push(child.id, competitorChild.id);

  // Create activity catalogue item
  const activity = await prisma.activity.create({
    data: {
      title: `Sensory Play ${unique}`,
      category: 'Sensory',
      minAgeMonths: 12,
      maxAgeMonths: 60,
      summary: 'Tactile water bead exercise.',
    },
  });
  activityId = activity.id;
  createdActivityIds.push(activity.id);

  // Log in agents
  parentAgent = request.agent(app);
  await parentAgent
    .post('/api/v1/auth/login')
    .send({ email: parentEmail, password: defaultPassword });

  competitorAgent = request.agent(app);
  await competitorAgent
    .post('/api/v1/auth/login')
    .send({ email: competitorParentEmail, password: defaultPassword });

  hospitalAgent = request.agent(app);
  await hospitalAgent
    .post('/api/v1/auth/login')
    .send({ email: hospitalStaffEmail, password: defaultPassword });
});

afterAll(async () => {
  if (createdChildIds.length > 0) {
    await prisma.activityProgress.deleteMany({ where: { childId: { in: createdChildIds } } });
    await prisma.schoolChildEnrollment.deleteMany({ where: { childId: { in: createdChildIds } } });
    await prisma.appointment.deleteMany({ where: { childId: { in: createdChildIds } } });
    await prisma.admissionRequest.deleteMany({ where: { childId: { in: createdChildIds } } });
    await prisma.child.deleteMany({ where: { id: { in: createdChildIds } } });
  }
  if (createdActivityIds.length > 0) {
    await prisma.activity.deleteMany({ where: { id: { in: createdActivityIds } } });
  }
  if (createdDoctorIds.length > 0) {
    await prisma.doctor.deleteMany({ where: { id: { in: createdDoctorIds } } });
  }
  if (createdSchoolIds.length > 0) {
    await prisma.schoolStaff.deleteMany({ where: { schoolId: { in: createdSchoolIds } } });
    await prisma.school.deleteMany({ where: { id: { in: createdSchoolIds } } });
  }
  if (createdHospitalIds.length > 0) {
    await prisma.hospitalStaff.deleteMany({ where: { hospitalId: { in: createdHospitalIds } } });
    await prisma.hospital.deleteMany({ where: { id: { in: createdHospitalIds } } });
  }
  if (createdParentIds.length > 0) {
    await prisma.notification.deleteMany({ where: { parentId: { in: createdParentIds } } });
    await prisma.parentPreference.deleteMany({ where: { parentId: { in: createdParentIds } } });
    await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  }
  await prisma.$disconnect();
});

describe('Database Constraints & Concurrency Audits', () => {
  describe('ActivityProgress unique constraint & atomic start', () => {
    it('handles concurrent startActivity calls idempotently and keeps exactly one record', async () => {
      // Fire 5 concurrent start calls for the same child and activity
      const requests = Array.from({ length: 5 }, () =>
        parentAgent.post(`/api/v1/activities/${activityId}/start`).send({ childId }),
      );

      const responses = await Promise.all(requests);
      for (const res of responses) {
        expect(res.status).toBe(201);
        expect(res.body.data.activityId).toBe(activityId);
        expect(res.body.data.childId).toBe(childId);
      }

      // Check database: exactly one record exists
      const records = await prisma.activityProgress.findMany({
        where: { childId, activityId },
      });
      expect(records).toHaveLength(1);
    });

    it('rejects duplicate direct database inserts with unique constraint error (P2002)', async () => {
      // Ensure row exists
      await prisma.activityProgress.upsert({
        where: { childId_activityId: { childId, activityId } },
        create: { childId, activityId },
        update: {},
      });

      await expect(
        prisma.activityProgress.create({
          data: {
            childId,
            activityId,
          },
        }),
      ).rejects.toMatchObject({
        code: 'P2002',
      });
    });
  });

  describe('AdmissionRequest concurrency protection & relation', () => {
    it('prevents concurrent double-submission of admission requests for same school and child', async () => {
      // Run two concurrent admission requests
      const [res1, res2] = await Promise.all([
        parentAgent.post('/api/v1/parents/enrollment-requests').send({
          schoolId,
          childId,
          message: 'Concurrent admission request attempt 1',
        }),
        parentAgent.post('/api/v1/parents/enrollment-requests').send({
          schoolId,
          childId,
          message: 'Concurrent admission request attempt 2',
        }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 409]);

      // Exactly one REQUESTED admission request exists
      const openRequests = await prisma.admissionRequest.findMany({
        where: { schoolId, childId, status: 'REQUESTED' },
      });
      expect(openRequests).toHaveLength(1);
      expect(openRequests[0]?.parentId).toBe(parentId);
    });

    it('loads Child relation directly when listing parent enrollment requests', async () => {
      const res = await parentAgent.get('/api/v1/parents/enrollment-requests');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            schoolId,
            childId,
            childName: 'Tommy Tester',
            status: 'REQUESTED',
          }),
        ]),
      );
    });
  });

  describe('Appointment booking concurrency & collision prevention', () => {
    it('prevents double-booking when two parents race for the exact same slot', async () => {
      // Pick a future weekday (Monday-Friday) slot at 10:00 UTC
      const targetDate = new Date();
      targetDate.setUTCDate(targetDate.getUTCDate() + 10);
      while (targetDate.getUTCDay() === 0 || targetDate.getUTCDay() === 6) {
        targetDate.setUTCDate(targetDate.getUTCDate() + 1);
      }
      targetDate.setUTCHours(10, 0, 0, 0);
      const scheduledAtIso = targetDate.toISOString();

      const [resA, resB] = await Promise.all([
        parentAgent.post('/api/v1/appointments').send({
          childId,
          hospitalId,
          doctorId,
          scheduledAt: scheduledAtIso,
          reason: 'Speech therapy check',
        }),
        competitorAgent.post('/api/v1/appointments').send({
          childId: competitorChildId,
          hospitalId,
          doctorId,
          scheduledAt: scheduledAtIso,
          reason: 'Developmental screening',
        }),
      ]);

      const statuses = [resA.status, resB.status].sort();
      expect(statuses).toEqual([201, 409]);

      // Verify database has only one appointment for this doctor and slot
      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId,
          scheduledAt: new Date(scheduledAtIso),
          status: { in: ['REQUESTED', 'CONFIRMED'] },
        },
      });
      expect(appointments).toHaveLength(1);
    });

    it('rejects invalid appointment status transitions', async () => {
      // Create a test appointment
      const targetDate = new Date();
      targetDate.setUTCDate(targetDate.getUTCDate() + 12);
      while (targetDate.getUTCDay() === 0 || targetDate.getUTCDay() === 6) {
        targetDate.setUTCDate(targetDate.getUTCDate() + 1);
      }
      targetDate.setUTCHours(14, 0, 0, 0);

      const bookingRes = await parentAgent.post('/api/v1/appointments').send({
        childId,
        hospitalId,
        doctorId,
        scheduledAt: targetDate.toISOString(),
        reason: 'Initial consultation',
      });
      expect(bookingRes.status).toBe(201);
      const appointmentId = bookingRes.body.data.id;

      // Hospital cancels it
      const cancelRes = await hospitalAgent
        .patch(`/api/v1/hospital-management/appointments/${appointmentId}/status`)
        .send({ status: 'CANCELLED', rejectionReason: 'Doctor unavailable' });
      expect(cancelRes.status).toBe(200);

      // Attempt invalid transition: CANCELLED -> COMPLETED
      const invalidTransitionRes = await hospitalAgent
        .patch(`/api/v1/hospital-management/appointments/${appointmentId}/status`)
        .send({ status: 'COMPLETED' });
      expect(invalidTransitionRes.status).toBe(400);

      // Attempt rescheduling a cancelled appointment
      const newDate = new Date(targetDate);
      newDate.setUTCHours(15, 0, 0, 0);
      const invalidRescheduleRes = await parentAgent
        .patch(`/api/v1/appointments/${appointmentId}/reschedule`)
        .send({ scheduledAt: newDate.toISOString(), reason: 'Need to reschedule' });
      expect(invalidRescheduleRes.status).toBe(400);
    });
  });

  describe('Workflow Status Enum Constraints', () => {
    it('enforces AdmissionRequestStatus enum at database level', async () => {
      await expect(
        prisma.admissionRequest.create({
          data: {
            parentId,
            schoolId,
            childId,
            // @ts-expect-error Invalid status value test
            status: 'INVALID_STATUS',
          },
        }),
      ).rejects.toThrow();
    });

    it('enforces ActivityReportStatus enum at database level', async () => {
      await expect(
        prisma.activityReport.create({
          data: {
            schoolId,
            childId,
            reporterId: parentId,
            activityCategory: 'Fine Motor',
            title: 'Block Building',
            summary: 'Built a 5 block tower',
            activityDate: new Date(),
            // @ts-expect-error Invalid status value test
            status: 'NON_EXISTENT_STATUS',
          },
        }),
      ).rejects.toThrow();
    });
  });
});
