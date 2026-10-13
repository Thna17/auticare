import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AppointmentResponse } from '@auticare/contracts';
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
const adminEmail = `pa-admin-${unique}@auticare.test`;
const hospitalEmail = `pa-hospital-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdHospitalIds: string[] = [];
const createdChildIds: string[] = [];

let ownerAgent: request.Agent;
let otherAgent: request.Agent;
let schoolAgent: request.Agent;
let adminAgent: request.Agent;
let hospitalAgent: request.Agent;
let requestedId = '';
let confirmedId = '';
let completedId = '';
let ownerParentId = '';
let doctorId = '';

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);

  const [owner, other, school, admin] = await Promise.all([
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
    prisma.parent.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        preference: { create: {} },
      },
    }),
  ]);
  ownerParentId = owner.id;
  createdParentIds.push(owner.id, other.id, school.id, admin.id);

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
  doctorId = doctor.id;

  const hospitalParent = await prisma.parent.create({
    data: {
      email: hospitalEmail,
      passwordHash,
      firstName: 'Hospital',
      lastName: 'Staff',
      role: 'HOSPITAL',
      preference: { create: {} },
    },
  });
  createdParentIds.push(hospitalParent.id);

  await prisma.hospitalStaff.create({
    data: {
      parentId: hospitalParent.id,
      hospitalId: hospital.id,
      title: 'Coordinator',
    },
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
  adminAgent = request.agent(app);
  hospitalAgent = request.agent(app);
  await ownerAgent.post('/api/v1/auth/login').send({ email: ownerEmail, password });
  await otherAgent.post('/api/v1/auth/login').send({ email: otherEmail, password });
  await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });
  await adminAgent.post('/api/v1/auth/login').send({ email: adminEmail, password });
  await hospitalAgent.post('/api/v1/auth/login').send({ email: hospitalEmail, password });
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { parentId: { in: createdParentIds } } });
  await prisma.appointment.deleteMany({ where: { hospitalId: { in: createdHospitalIds } } });
  await prisma.hospitalStaff.deleteMany({ where: { hospitalId: { in: createdHospitalIds } } });
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

  it('allows administrators to view system-wide appointments with filters', async () => {
    const res = await adminAgent.get('/api/v1/appointments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.appointments)).toBe(true);
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(3);

    // Verify parentName is mapped for administrators
    const sample = (res.body.data.appointments as AppointmentResponse[]).find(
      (a) => a.id === requestedId,
    );
    expect(sample).toBeDefined();
    expect(sample?.parentName).toBe('Owner Parent');

    // Admin filter by status
    const confirmedRes = await adminAgent.get('/api/v1/appointments?status=CONFIRMED');
    expect(confirmedRes.status).toBe(200);
    expect(confirmedRes.body.data.appointments.length).toBeGreaterThanOrEqual(1);
    expect(
      (confirmedRes.body.data.appointments as AppointmentResponse[]).every(
        (a) => a.status === 'CONFIRMED',
      ),
    );
  });
});

describe('parent notifications', () => {
  it('returns only the caller’s own notifications', async () => {
    const res = await ownerAgent.get('/api/v1/parents/notifications');
    expect(res.status).toBe(200);

    const titles = (res.body.data.notifications as { title: string }[]).map((n) => n.title);
    expect(titles).toEqual(
      expect.arrayContaining(['New activity report', 'Appointment confirmed']),
    );
    expect(titles).not.toContain('Not yours');
  });

  it('returns the full notification shape the web client expects', async () => {
    const res = await ownerAgent.get('/api/v1/parents/notifications');
    const first = res.body.data.notifications[0];
    for (const key of [
      'id',
      'type',
      'status',
      'title',
      'body',
      'enrollmentId',
      'reportId',
      'appointmentId',
      'createdAt',
    ]) {
      expect(first).toHaveProperty(key);
    }
  });

  it('is newest first', async () => {
    const res = await ownerAgent.get('/api/v1/parents/notifications');
    const dates = (res.body.data.notifications as { createdAt: string }[]).map((n) =>
      Date.parse(n.createdAt),
    );
    const sorted = [...dates].sort((a, b) => b - a);
    expect(dates).toEqual(sorted);
  });

  it('returns pagination meta alongside the page', async () => {
    const res = await ownerAgent.get('/api/v1/parents/notifications');
    expect(res.body.data.pagination).toEqual({
      total: expect.any(Number),
      page: 1,
      limit: 20,
      totalPages: expect.any(Number),
    });
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(
      res.body.data.notifications.length,
    );
  });

  it('filters unread on the server, not in the page', async () => {
    const all = await ownerAgent.get('/api/v1/parents/notifications');
    const unread = await ownerAgent.get('/api/v1/parents/notifications?isRead=false');
    expect(unread.status).toBe(200);
    for (const notification of unread.body.data.notifications as { status: string }[]) {
      expect(notification.status).toBe('UNREAD');
    }
    // The unread total is the whole unread set, not a count of rows on this page —
    // that distinction is the reason the filter moved to the query at all.
    expect(unread.body.data.pagination.total).toBeLessThanOrEqual(all.body.data.pagination.total);
  });

  it('bounds the page size a caller can ask for', async () => {
    const res = await ownerAgent.get('/api/v1/parents/notifications?limit=5000');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('refuses a non-parent account', async () => {
    const res = await schoolAgent.get('/api/v1/parents/notifications');
    expect(res.status).toBe(403);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/parents/notifications');
    expect(res.status).toBe(401);
  });

  it('marks a single notification as read and enforces ownership', async () => {
    const listRes = await ownerAgent.get('/api/v1/parents/notifications?isRead=false');
    expect(listRes.status).toBe(200);
    const unreadItem = listRes.body.data.notifications[0];
    expect(unreadItem).toBeDefined();

    // Other parent cannot mark owner's notification as read
    const crossRes = await otherAgent.patch(`/api/v1/parents/notifications/${unreadItem.id}/read`);
    expect(crossRes.status).toBe(403);

    // Owner marks as read
    const markRes = await ownerAgent.patch(`/api/v1/parents/notifications/${unreadItem.id}/read`);
    expect(markRes.status).toBe(200);
    expect(markRes.body.data.status).toBe('READ');
    expect(markRes.body.data.id).toBe(unreadItem.id);

    // Non-existent notification returns 404
    const notFoundRes = await ownerAgent.patch(
      '/api/v1/parents/notifications/non-existent-id/read',
    );
    expect(notFoundRes.status).toBe(404);
  });

  it('marks all unread notifications as read and updates count', async () => {
    // Create extra unread notification for owner and other parent
    await prisma.notification.createMany({
      data: [
        {
          parentId: ownerParentId,
          type: 'SYSTEM',
          title: 'System update 1',
          body: 'Maintenance scheduled',
          status: 'UNREAD',
        },
        {
          parentId: ownerParentId,
          type: 'SYSTEM',
          title: 'System update 2',
          body: 'Terms update',
          status: 'UNREAD',
        },
        {
          parentId: createdParentIds[1]!, // other parent
          type: 'SYSTEM',
          title: 'Other parent unread',
          body: 'Other parent message',
          status: 'UNREAD',
        },
      ],
    });

    const res = await ownerAgent.patch('/api/v1/parents/notifications/read-all');
    expect(res.status).toBe(200);
    expect(res.body.data.updatedCount).toBeGreaterThanOrEqual(2);

    // Verify owner now has 0 unread
    const unreadRes = await ownerAgent.get('/api/v1/parents/notifications?isRead=false');
    expect(unreadRes.status).toBe(200);
    expect(unreadRes.body.data.notifications).toHaveLength(0);

    // Other parent's unread notification was untouched
    const otherUnreadRes = await otherAgent.get('/api/v1/parents/notifications?isRead=false');
    expect(otherUnreadRes.status).toBe(200);
    expect(otherUnreadRes.body.data.notifications.length).toBeGreaterThan(0);
  });
});

describe('hospital appointment status workflow notifications', () => {
  it('creates an unread notification for the parent when hospital confirms an appointment', async () => {
    const appointment = await prisma.appointment.create({
      data: {
        parentId: ownerParentId,
        childId: createdChildIds[0]!,
        hospitalId: createdHospitalIds[0]!,
        doctorId,
        scheduledAt: new Date('2026-12-20T10:00:00.000Z'),
        status: 'REQUESTED',
      },
    });

    const confirmRes = await hospitalAgent
      .patch(`/api/v1/hospital-management/appointments/${appointment.id}/status`)
      .send({ status: 'CONFIRMED' });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('CONFIRMED');

    const notification = await prisma.notification.findFirst({
      where: {
        parentId: ownerParentId,
        appointmentId: appointment.id,
        title: { in: ['Appointment confirmed', 'Appointment Confirmed'] },
      },
    });
    expect(notification).not.toBeNull();
    expect(notification?.status).toBe('UNREAD');
    expect(notification?.type).toBe('APPOINTMENT');
    expect(notification?.body).toContain('confirmed');
  });

  it('creates an unread notification with rejection reason when hospital cancels an appointment', async () => {
    const appointment = await prisma.appointment.create({
      data: {
        parentId: ownerParentId,
        childId: createdChildIds[0]!,
        hospitalId: createdHospitalIds[0]!,
        doctorId,
        scheduledAt: new Date('2026-12-21T10:00:00.000Z'),
        status: 'REQUESTED',
      },
    });

    const reason = 'Specialist is unavailable due to an emergency.';
    const cancelRes = await hospitalAgent
      .patch(`/api/v1/hospital-management/appointments/${appointment.id}/status`)
      .send({ status: 'CANCELLED', reason });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    const notification = await prisma.notification.findFirst({
      where: {
        parentId: ownerParentId,
        appointmentId: appointment.id,
        title: { in: ['Appointment rejected', 'Appointment Cancelled'] },
      },
    });
    expect(notification).not.toBeNull();
    expect(notification?.status).toBe('UNREAD');
    expect(notification?.type).toBe('APPOINTMENT');
    expect(notification?.body).toContain(reason);
  });

  it('creates an unread notification when hospital completes an appointment', async () => {
    const appointment = await prisma.appointment.create({
      data: {
        parentId: ownerParentId,
        childId: createdChildIds[0]!,
        hospitalId: createdHospitalIds[0]!,
        doctorId,
        scheduledAt: new Date('2026-12-22T10:00:00.000Z'),
        status: 'CONFIRMED',
      },
    });

    const completeRes = await hospitalAgent
      .patch(`/api/v1/hospital-management/appointments/${appointment.id}/status`)
      .send({ status: 'COMPLETED' });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');

    const notification = await prisma.notification.findFirst({
      where: {
        parentId: ownerParentId,
        appointmentId: appointment.id,
        title: { in: ['Appointment completed', 'Appointment Completed'] },
      },
    });
    expect(notification).not.toBeNull();
    expect(notification?.status).toBe('UNREAD');
    expect(notification?.type).toBe('APPOINTMENT');
    expect(notification?.body).toContain('completed');
  });
});
