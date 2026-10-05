import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareRejectionPassword123';
const parentEmail = `reject-parent-${unique}@auticare.test`;
const managerEmail = `reject-manager-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdHospitalIds: string[] = [];
const createdChildIds: string[] = [];

let parentAgent: request.Agent;
let hospitalAgent: request.Agent;
let appointmentId = '';
let secondAppointmentId = '';

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);

  const parent = await prisma.parent.create({
    data: {
      email: parentEmail,
      passwordHash,
      firstName: 'Reject',
      lastName: 'Parent',
      role: 'PARENT',
      preference: { create: {} },
    },
  });
  createdParentIds.push(parent.id);

  const child = await prisma.child.create({
    data: { parentId: parent.id, firstName: 'Patient', dateOfBirth: new Date('2020-02-02') },
  });
  createdChildIds.push(child.id);

  const hospital = await prisma.hospital.create({
    data: {
      name: `Reject Hospital ${unique}`,
      city: 'Phnom Penh',
      address: '9 Reject Road',
      services: 'Pediatrics',
    },
  });
  createdHospitalIds.push(hospital.id);

  const manager = await prisma.parent.create({
    data: {
      email: managerEmail,
      passwordHash,
      firstName: 'Mina',
      lastName: 'Manager',
      role: 'HOSPITAL',
      preference: { create: {} },
    },
  });
  createdParentIds.push(manager.id);
  await prisma.hospitalStaff.create({
    data: { parentId: manager.id, hospitalId: hospital.id, title: 'Manager' },
  });

  const doctor = await prisma.doctor.create({
    data: { hospitalId: hospital.id, fullName: 'Dr Who', specialty: 'Paediatrics' },
  });

  // Two requests: one to reject, one to confirm.
  const [first, second] = await Promise.all([
    prisma.appointment.create({
      data: {
        parentId: parent.id,
        childId: child.id,
        hospitalId: hospital.id,
        doctorId: doctor.id,
        scheduledAt: new Date('2026-12-01T09:00:00.000Z'),
        reason: 'Parent-supplied request text',
      },
    }),
    prisma.appointment.create({
      data: {
        parentId: parent.id,
        childId: child.id,
        hospitalId: hospital.id,
        doctorId: doctor.id,
        scheduledAt: new Date('2026-12-02T09:00:00.000Z'),
      },
    }),
  ]);
  appointmentId = first.id;
  secondAppointmentId = second.id;

  parentAgent = request.agent(app);
  hospitalAgent = request.agent(app);
  await parentAgent.post('/api/v1/auth/login').send({ email: parentEmail, password });
  await hospitalAgent.post('/api/v1/auth/login').send({ email: managerEmail, password });
});

afterAll(async () => {
  await prisma.appointment.deleteMany({ where: { hospitalId: { in: createdHospitalIds } } });
  await prisma.doctor.deleteMany({ where: { hospitalId: { in: createdHospitalIds } } });
  await prisma.hospitalStaff.deleteMany({ where: { hospitalId: { in: createdHospitalIds } } });
  await prisma.hospital.deleteMany({ where: { id: { in: createdHospitalIds } } });
  await prisma.child.deleteMany({ where: { id: { in: createdChildIds } } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
});

describe('appointment rejection reason', () => {
  it('stores the reason a hospital gives when rejecting, and returns it', async () => {
    const res = await hospitalAgent
      .patch(`/api/v1/hospital-management/appointments/${appointmentId}/status`)
      .send({ status: 'CANCELLED', reason: 'No paediatric slots that week.' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
    expect(res.body.data.rejectionReason).toBe('No paediatric slots that week.');
    // The parent's own request text is a separate field and must be untouched.
    expect(res.body.data.reason).toBe('Parent-supplied request text');
  });

  it('shows the reason to the parent whose appointment was rejected', async () => {
    const res = await parentAgent.get('/api/v1/appointments');
    expect(res.status).toBe(200);
    const rejected = res.body.data.find((a: { id: string }) => a.id === appointmentId) as
      { rejectionReason: string | null; reason: string | null } | undefined;
    expect(rejected?.rejectionReason).toBe('No paediatric slots that week.');
    expect(rejected?.reason).toBe('Parent-supplied request text');
  });

  it('ignores a reason sent with a status that is not a rejection', async () => {
    const res = await hospitalAgent
      .patch(`/api/v1/hospital-management/appointments/${secondAppointmentId}/status`)
      .send({ status: 'CONFIRMED', reason: 'should not be recorded' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.rejectionReason).toBeNull();
  });

  it('rejects a reason longer than the 2000-character limit with 400', async () => {
    const res = await hospitalAgent
      .patch(`/api/v1/hospital-management/appointments/${secondAppointmentId}/status`)
      .send({ status: 'CANCELLED', reason: 'x'.repeat(2001) });

    expect(res.status).toBe(400);
  });

  it('leaves an existing reason in place on a later status change', async () => {
    // appointmentId already carries a rejection reason from the first test.
    const before = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    expect(before?.rejectionReason).toBe('No paediatric slots that week.');

    const res = await hospitalAgent
      .patch(`/api/v1/hospital-management/appointments/${appointmentId}/status`)
      .send({ status: 'CANCELLED' });

    // Transition CANCELLED -> CANCELLED is not allowed, so the row is untouched;
    // the point is that no code path blanks a stored reason.
    expect([200, 400]).toContain(res.status);
    const after = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    expect(after?.rejectionReason).toBe('No paediatric slots that week.');
  });
});
