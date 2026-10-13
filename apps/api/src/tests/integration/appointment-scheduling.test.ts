import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareSchedulingPassword123';

const parentAEmail = `sched-a-${unique}@auticare.test`;
const parentBEmail = `sched-b-${unique}@auticare.test`;
const hospitalEmail = `sched-hosp-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdHospitalIds: string[] = [];
const createdChildIds: string[] = [];
const createdDoctorIds: string[] = [];

let parentAAgent: request.Agent;
let parentBAgent: request.Agent;
let hospitalAgent: request.Agent;

let hospitalId = '';
let doctorId = '';
let childAId = '';
let childBId = '';
let parentAId = '';
let parentBId = '';

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);

  const [parentA, parentB, hospitalUser] = await Promise.all([
    prisma.parent.create({
      data: {
        email: parentAEmail,
        passwordHash,
        firstName: 'Alice',
        lastName: 'Parent',
        role: 'PARENT',
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: parentBEmail,
        passwordHash,
        firstName: 'Bob',
        lastName: 'Parent',
        role: 'PARENT',
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: hospitalEmail,
        passwordHash,
        firstName: 'Hospital',
        lastName: 'Staff',
        role: 'HOSPITAL',
        preference: { create: {} },
      },
    }),
  ]);

  parentAId = parentA.id;
  parentBId = parentB.id;
  createdParentIds.push(parentA.id, parentB.id, hospitalUser.id);

  const hospital = await prisma.hospital.create({
    data: {
      name: `Scheduling Clinic ${unique}`,
      city: 'Phnom Penh',
      address: '77 Healthcare Boulevard',
      services: 'Pediatrics, Behavioral Assessment',
    },
  });
  hospitalId = hospital.id;
  createdHospitalIds.push(hospital.id);

  await prisma.hospitalStaff.create({
    data: {
      parentId: hospitalUser.id,
      hospitalId: hospital.id,
      title: 'Head Receptionist',
    },
  });

  // Doctor with standard hours: Mon-Fri (1,2,3,4,5), 09:00 - 17:00, 30 min slots, Asia/Phnom_Penh (UTC+7)
  const doctor = await prisma.doctor.create({
    data: {
      hospitalId: hospital.id,
      fullName: 'Dr. Channarith Meng',
      specialty: 'Pediatrician',
      availableDays: '1,2,3,4,5',
      startHour: 9,
      endHour: 17,
      slotDurationMinutes: 30,
      timezone: 'Asia/Phnom_Penh',
    },
  });
  doctorId = doctor.id;
  createdDoctorIds.push(doctor.id);

  const [childA, childB] = await Promise.all([
    prisma.child.create({
      data: {
        parentId: parentA.id,
        firstName: 'Dara',
        dateOfBirth: new Date('2021-02-01'),
      },
    }),
    prisma.child.create({
      data: {
        parentId: parentB.id,
        firstName: 'Bopha',
        dateOfBirth: new Date('2020-08-15'),
      },
    }),
  ]);
  childAId = childA.id;
  childBId = childB.id;
  createdChildIds.push(childA.id, childB.id);

  parentAAgent = request.agent(app);
  parentBAgent = request.agent(app);
  hospitalAgent = request.agent(app);

  await parentAAgent.post('/api/v1/auth/login').send({ email: parentAEmail, password });
  await parentBAgent.post('/api/v1/auth/login').send({ email: parentBEmail, password });
  await hospitalAgent.post('/api/v1/auth/login').send({ email: hospitalEmail, password });
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { parentId: { in: createdParentIds } } });
  await prisma.appointment.deleteMany({ where: { hospitalId: { in: createdHospitalIds } } });
  await prisma.doctor.deleteMany({ where: { id: { in: createdDoctorIds } } });
  await prisma.hospitalStaff.deleteMany({ where: { hospitalId: { in: createdHospitalIds } } });
  await prisma.hospital.deleteMany({ where: { id: { in: createdHospitalIds } } });
  await prisma.child.deleteMany({ where: { id: { in: createdChildIds } } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
});

describe('Doctor availability and slot generation', () => {
  it('generates slots based on doctor working hours and marks non-working days empty', async () => {
    // 2026-11-18 is a Wednesday (day 3) -> doctor is available
    const resWed = await parentAAgent
      .get(`/api/v1/appointments/doctors/${doctorId}/slots?date=2026-11-18`)
      .expect(200);

    expect(resWed.body.data.slots.length).toBeGreaterThan(0);
    expect(resWed.body.data.slots[0]).toHaveProperty('time');
    expect(resWed.body.data.slots[0]).toHaveProperty('iso');
    expect(resWed.body.data.slots[0]).toHaveProperty('available', true);

    // 2026-11-15 is a Sunday (day 0) -> doctor is not available
    const resSun = await parentAAgent
      .get(`/api/v1/appointments/doctors/${doctorId}/slots?date=2026-11-15`)
      .expect(200);

    expect(resSun.body.data.slots).toHaveLength(0);
  });

  it('rejects an invalid date format query', async () => {
    await parentAAgent
      .get(`/api/v1/appointments/doctors/${doctorId}/slots?date=not-a-date`)
      .expect(400);
  });
});

describe('Transaction-safe booking and collision prevention', () => {
  it('prevents double-booking: concurrent requests for the exact same slot result in 1 success and 1 conflict', async () => {
    // Pick Wednesday 2026-11-18 10:00 AM Phnom Penh time (UTC+7 -> 03:00 UTC)
    const slotIso = '2026-11-18T03:00:00.000Z';

    const [resA, resB] = await Promise.all([
      parentAAgent.post('/api/v1/appointments').send({
        childId: childAId,
        hospitalId,
        doctorId,
        scheduledAt: slotIso,
        reason: 'Parent A consultation',
      }),
      parentBAgent.post('/api/v1/appointments').send({
        childId: childBId,
        hospitalId,
        doctorId,
        scheduledAt: slotIso,
        reason: 'Parent B consultation',
      }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const successfulRes = resA.status === 201 ? resA : resB;
    const failedRes = resA.status === 409 ? resA : resB;

    expect(successfulRes.body.data.status).toBe('REQUESTED');
    expect(failedRes.body.error.code).toBe('CONFLICT');

    // Slot is now marked as unavailable in slot list
    const slotsRes = await parentAAgent
      .get(`/api/v1/appointments/doctors/${doctorId}/slots?date=2026-11-18`)
      .expect(200);

    const bookedSlot = slotsRes.body.data.slots.find((s: { iso: string }) => s.iso === slotIso);
    expect(bookedSlot?.available).toBe(false);
  });

  it('rejects booking outside doctor working hours with 400', async () => {
    // 2026-11-18 20:00 Phnom Penh time (13:00 UTC) -> after 17:00
    const outOfHoursIso = '2026-11-18T13:00:00.000Z';
    const res = await parentAAgent
      .post('/api/v1/appointments')
      .send({
        childId: childAId,
        hospitalId,
        doctorId,
        scheduledAt: outOfHoursIso,
        reason: 'Night visit',
      })
      .expect(400);

    expect(res.body.error.message).toContain('doctor hours');
  });

  it('creates an APPOINTMENT notification when parent requests an appointment', async () => {
    // Check notification for whichever parent succeeded (parentA or parentB)
    const notifsA = await prisma.notification.findMany({
      where: { parentId: parentAId, type: 'APPOINTMENT' },
    });
    const notifsB = await prisma.notification.findMany({
      where: { parentId: parentBId, type: 'APPOINTMENT' },
    });
    const totalNotifs = notifsA.length + notifsB.length;
    expect(totalNotifs).toBeGreaterThan(0);
    const notif = notifsA[0] ?? notifsB[0];
    expect(notif?.title).toContain('Appointment');
  });
});

describe('Rescheduling workflow', () => {
  it('allows parent to reschedule their appointment and releases the old slot', async () => {
    // Book a slot for Dara on 2026-11-18 at 11:00 AM Phnom Penh (04:00 UTC)
    const slot1Iso = '2026-11-18T04:00:00.000Z';
    const bookRes = await parentAAgent
      .post('/api/v1/appointments')
      .send({
        childId: childAId,
        hospitalId,
        doctorId,
        scheduledAt: slot1Iso,
        reason: 'Initial consultation',
      })
      .expect(201);

    const appointmentId = bookRes.body.data.id;

    // Reschedule to 2026-11-18 14:00 Phnom Penh (07:00 UTC)
    const slot2Iso = '2026-11-18T07:00:00.000Z';
    const reschedRes = await parentAAgent
      .patch(`/api/v1/appointments/${appointmentId}/reschedule`)
      .send({
        scheduledAt: slot2Iso,
        reason: 'Rescheduling due to conflict',
      })
      .expect(200);

    expect(reschedRes.body.data.scheduledAt).toBe(slot2Iso);

    // Old slot slot1Iso should now be available again for another parent
    const slotsRes = await parentBAgent
      .get(`/api/v1/appointments/doctors/${doctorId}/slots?date=2026-11-18`)
      .expect(200);

    const oldSlot = slotsRes.body.data.slots.find((s: { iso: string }) => s.iso === slot1Iso);
    expect(oldSlot?.available).toBe(true);

    // Parent B can book the released slot
    await parentBAgent
      .post('/api/v1/appointments')
      .send({
        childId: childBId,
        hospitalId,
        doctorId,
        scheduledAt: slot1Iso,
        reason: 'Book released slot',
      })
      .expect(201);
  });
});

describe('Hospital lifecycle transitions and completion notifications', () => {
  it('hospital confirms, parent receives confirmation notification, hospital completes appointment', async () => {
    // Book a slot on 2026-11-19 at 09:30 AM Phnom Penh (02:30 UTC)
    const slotIso = '2026-11-19T02:30:00.000Z';
    const bookRes = await parentAAgent
      .post('/api/v1/appointments')
      .send({
        childId: childAId,
        hospitalId,
        doctorId,
        scheduledAt: slotIso,
      })
      .expect(201);

    const apptId = bookRes.body.data.id;

    // Hospital staff confirms
    const confirmRes = await hospitalAgent
      .patch(`/api/v1/hospital-management/appointments/${apptId}/status`)
      .send({ status: 'CONFIRMED' })
      .expect(200);

    expect(confirmRes.body.data.status).toBe('CONFIRMED');

    // Parent should receive confirmation notification
    const confirmNotif = await prisma.notification.findFirst({
      where: {
        parentId: parentAId,
        title: { in: ['Appointment confirmed', 'Appointment Confirmed'] },
      },
    });
    expect(confirmNotif).not.toBeNull();

    // Hospital marks as COMPLETED
    const completeRes = await hospitalAgent
      .patch(`/api/v1/hospital-management/appointments/${apptId}/status`)
      .send({ status: 'COMPLETED' })
      .expect(200);

    expect(completeRes.body.data.status).toBe('COMPLETED');

    // Parent receives completion notification
    const completeNotif = await prisma.notification.findFirst({
      where: {
        parentId: parentAId,
        title: { in: ['Appointment completed', 'Appointment Completed'] },
      },
    });
    expect(completeNotif).not.toBeNull();
  });
});
