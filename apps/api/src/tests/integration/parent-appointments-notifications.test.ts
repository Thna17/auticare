import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareParentActionsPassword123';
const ownerEmail = `pa-owner-${unique}@auticare.test`;
const otherEmail = `pa-other-${unique}@auticare.test`;
const schoolEmail = `pa-school-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdHospitalIds: string[] = [];
const createdChildIds: string[] = [];

let ownerAgent: request.Agent;
let otherAgent: request.Agent;
let schoolAgent: request.Agent;
let requestedId = '';
let confirmedId = '';
let completedId = '';
let ownerParentId = '';

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);

  const [owner, other, school] = await Promise.all([
    prisma.parent.create({
      data: {
        email: ownerEmail,
        passwordHash,
        firstName: 'Owner',
        lastName: 'Parent',
        role: 'PARENT',
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: otherEmail,
        passwordHash,
        firstName: 'Other',
        lastName: 'Parent',
        role: 'PARENT',
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: schoolEmail,
        passwordHash,
        firstName: 'School',
        lastName: 'Staff',
        role: 'SCHOOL',
        preference: { create: {} },
      },
    }),
  ]);
  ownerParentId = owner.id;
  createdParentIds.push(owner.id, other.id, school.id);

  const child = await prisma.child.create({
    data: { parentId: owner.id, firstName: 'Patient', dateOfBirth: new Date('2020-04-04') },
  });
  createdChildIds.push(child.id);

  const hospital = await prisma.hospital.create({
    data: {
      name: `PA Hospital ${unique}`,
      city: 'Phnom Penh',
      address: '3 PA Road',
      services: 'Pediatrics',
    },
  });
  createdHospitalIds.push(hospital.id);
  const doctor = await prisma.doctor.create({
    data: { hospitalId: hospital.id, fullName: 'Dr PA', specialty: 'Paediatrics' },
  });

  const base = {
    parentId: owner.id,
    childId: child.id,
    hospitalId: hospital.id,
    doctorId: doctor.id,
  };
  const [requested, confirmed, completed] = await Promise.all([
    prisma.appointment.create({
      data: { ...base, scheduledAt: new Date('2026-12-10T09:00:00.000Z'), status: 'REQUESTED' },
    }),
    prisma.appointment.create({
      data: { ...base, scheduledAt: new Date('2026-12-11T09:00:00.000Z'), status: 'CONFIRMED' },
    }),
    prisma.appointment.create({
      data: { ...base, scheduledAt: new Date('2026-01-11T09:00:00.000Z'), status: 'COMPLETED' },
    }),
  ]);
  requestedId = requested.id;
  confirmedId = confirmed.id;
  completedId = completed.id;

  // Notifications: two for the owner, one for the other parent.
  await prisma.notification.createMany({
    data: [
      {
        parentId: owner.id,
        type: 'SCHOOL_REPORT',
        title: 'New activity report',
        body: 'A report was shared about your child.',
      },
      {
        parentId: owner.id,
        type: 'APPOINTMENT',
        title: 'Appointment confirmed',
        body: 'Your appointment was confirmed.',
        status: 'READ',
      },
      {
        parentId: other.id,
        type: 'SYSTEM',
        title: 'Not yours',
        body: 'This belongs to another family.',
      },
    ],
  });

  ownerAgent = request.agent(app);
  otherAgent = request.agent(app);
  schoolAgent = request.agent(app);
  await ownerAgent.post('/api/v1/auth/login').send({ email: ownerEmail, password });
  await otherAgent.post('/api/v1/auth/login').send({ email: otherEmail, password });
  await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { parentId: { in: createdParentIds } } });
  await prisma.appointment.deleteMany({ where: { hospitalId: { in: createdHospitalIds } } });
  await prisma.doctor.deleteMany({ where: { hospitalId: { in: createdHospitalIds } } });
  await prisma.hospital.deleteMany({ where: { id: { in: createdHospitalIds } } });
  await prisma.child.deleteMany({ where: { id: { in: createdChildIds } } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
});

describe('parent appointment cancellation', () => {
  it('cancels a REQUESTED appointment', async () => {
    const res = await ownerAgent.patch(`/api/v1/appointments/${requestedId}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('cancels a CONFIRMED appointment', async () => {
    const res = await ownerAgent.patch(`/api/v1/appointments/${confirmedId}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('refuses to cancel a COMPLETED appointment', async () => {
    const res = await ownerAgent.patch(`/api/v1/appointments/${completedId}/cancel`);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/no longer be cancelled/i);
  });

  it('refuses to cancel an already cancelled appointment', async () => {
    const res = await ownerAgent.patch(`/api/v1/appointments/${requestedId}/cancel`);
    expect(res.status).toBe(400);
  });

  it('does not let another parent cancel someone else’s appointment', async () => {
    const fresh = await prisma.appointment.create({
      data: {
        parentId: ownerParentId,
        childId: createdChildIds[0]!,
        hospitalId: createdHospitalIds[0]!,
        scheduledAt: new Date('2026-12-20T09:00:00.000Z'),
        status: 'REQUESTED',
      },
    });

    const res = await otherAgent.patch(`/api/v1/appointments/${fresh.id}/cancel`);
    expect(res.status).toBe(404);

    const row = await prisma.appointment.findUnique({ where: { id: fresh.id } });
    expect(row?.status).toBe('REQUESTED');
  });

  it('does not let a school account cancel a parent’s appointment', async () => {
    const res = await schoolAgent.patch(`/api/v1/appointments/${completedId}/cancel`);
    expect(res.status).toBe(403);
  });

  it('requires authentication', async () => {
    const res = await request(app).patch(`/api/v1/appointments/${completedId}/cancel`);
    expect(res.status).toBe(401);
  });
});

describe('appointment list pagination', () => {
  // The list was unbounded: every appointment a family had ever made came back on
  // every request. These assert the page is actually applied, the cap cannot be
  // argued past, and the boundary between pages neither repeats nor skips a row.

  it('applies the default page size and reports the totals', async () => {
    const res = await ownerAgent.get('/api/v1/appointments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.appointments)).toBe(true);
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 20 });
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(
      res.body.data.appointments.length,
    );
  });

  it('enforces the requested limit', async () => {
    const res = await ownerAgent.get('/api/v1/appointments?limit=1');
    expect(res.status).toBe(200);
    expect(res.body.data.appointments).toHaveLength(1);
    expect(res.body.data.pagination.limit).toBe(1);
  });

  it('refuses a limit above the maximum rather than honouring it', async () => {
    const res = await ownerAgent.get('/api/v1/appointments?limit=1000');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a page below 1', async () => {
    const res = await ownerAgent.get('/api/v1/appointments?page=0');
    expect(res.status).toBe(400);
  });

  it('returns different rows either side of a page boundary', async () => {
    const first = await ownerAgent.get('/api/v1/appointments?limit=1&page=1');
    const second = await ownerAgent.get('/api/v1/appointments?limit=1&page=2');
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const firstId = first.body.data.appointments[0]?.id;
    const secondId = second.body.data.appointments[0]?.id;
    expect(firstId).toBeTruthy();
    expect(secondId).toBeTruthy();
    // A skip computed with an off-by-one would repeat this row rather than move on.
    expect(secondId).not.toBe(firstId);
  });

  it('reports totalPages consistently with total and limit', async () => {
    const res = await ownerAgent.get('/api/v1/appointments?limit=1');
    const { total, limit, totalPages } = res.body.data.pagination;
    expect(totalPages).toBe(Math.max(1, Math.ceil(total / limit)));
    // Never 0, so a client never renders "page 1 of 0".
    expect(totalPages).toBeGreaterThanOrEqual(1);
  });

  it('returns an empty page past the end without failing', async () => {
    const res = await ownerAgent.get('/api/v1/appointments?limit=1&page=999');
    expect(res.status).toBe(200);
    expect(res.body.data.appointments).toHaveLength(0);
    expect(res.body.data.pagination.total).toBeGreaterThan(0);
  });
});

describe('parent notifications', () => {
  it('returns only the caller’s own notifications', async () => {
    const res = await ownerAgent.get('/api/v1/parents/notifications');
    expect(res.status).toBe(200);

    const titles = (res.body.data as { title: string }[]).map((n) => n.title);
    expect(titles).toEqual(
      expect.arrayContaining(['New activity report', 'Appointment confirmed']),
    );
    expect(titles).not.toContain('Not yours');
  });

  it('returns the full notification shape the web client expects', async () => {
    const res = await ownerAgent.get('/api/v1/parents/notifications');
    const first = res.body.data[0];
    // enrollmentId and reportId were missing before, so the response did not
    // match the NotificationResponse contract the web side reuses.
    for (const key of [
      'id',
      'type',
      'status',
      'title',
      'body',
      'enrollmentId',
      'reportId',
      'createdAt',
    ]) {
      expect(first).toHaveProperty(key);
    }
  });

  it('is newest first', async () => {
    const res = await ownerAgent.get('/api/v1/parents/notifications');
    const dates = (res.body.data as { createdAt: string }[]).map((n) => Date.parse(n.createdAt));
    const sorted = [...dates].sort((a, b) => b - a);
    expect(dates).toEqual(sorted);
  });

  it('refuses a non-parent account', async () => {
    const res = await schoolAgent.get('/api/v1/parents/notifications');
    expect(res.status).toBe(403);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/parents/notifications');
    expect(res.status).toBe(401);
  });
});
