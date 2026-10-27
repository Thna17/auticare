import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareTestPassword123!';

const adminEmailX = `hosp-admin-x-${unique}@auticare.test`;
const adminEmailY = `hosp-admin-y-${unique}@auticare.test`;
const parentEmail = `hosp-parent-${unique}@auticare.test`;

let hospitalXId = '';
let hospitalYId = '';
let doctorAId = '';
let doctorBId = '';
let doctorCId = '';
let childId = '';
let appointmentAId = '';
let appointmentBId = '';

let coordinatorStaffId = '';
let coordinatorUsername = '';
let coordinatorSetupCode = '';

let doctorStaffId = '';
let doctorUsername = '';
let doctorSetupCode = '';

const createdParentIds: string[] = [];
const createdHospitalIds: string[] = [];
const createdDoctorIds: string[] = [];
const createdAppointmentIds: string[] = [];
const createdStaffIds: string[] = [];

const adminXAgent = request.agent(app);
const adminYAgent = request.agent(app);
const coordinatorAgent = request.agent(app);
const doctorAgent = request.agent(app);

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);

  // Hospital X
  const hospitalX = await prisma.hospital.create({
    data: {
      name: `Hospital X ${unique}`,
      city: 'Phnom Penh',
      address: 'Monivong Blvd',
      services: 'Pediatrics, Speech Therapy',
    },
  });
  hospitalXId = hospitalX.id;
  createdHospitalIds.push(hospitalXId);

  // Hospital Y
  const hospitalY = await prisma.hospital.create({
    data: {
      name: `Hospital Y ${unique}`,
      city: 'Siem Reap',
      address: 'Wat Bo Rd',
      services: 'Pediatrics, Autism Assessment',
    },
  });
  hospitalYId = hospitalY.id;
  createdHospitalIds.push(hospitalYId);

  // Admin X Parent & Staff
  const adminX = await prisma.parent.create({
    data: {
      email: adminEmailX,
      firstName: 'AdminX',
      lastName: 'Hospital',
      role: 'HOSPITAL',
      passwordHash,
      preference: { create: {} },
    },
  });
  createdParentIds.push(adminX.id);
  const adminXStaff = await prisma.hospitalStaff.create({
    data: {
      parentId: adminX.id,
      hospitalId: hospitalXId,
      role: 'ADMIN',
      title: 'Director',
    },
  });
  createdStaffIds.push(adminXStaff.id);

  // Admin Y Parent & Staff
  const adminY = await prisma.parent.create({
    data: {
      email: adminEmailY,
      firstName: 'AdminY',
      lastName: 'Hospital',
      role: 'HOSPITAL',
      passwordHash,
      preference: { create: {} },
    },
  });
  createdParentIds.push(adminY.id);
  const adminYStaff = await prisma.hospitalStaff.create({
    data: {
      parentId: adminY.id,
      hospitalId: hospitalYId,
      role: 'ADMIN',
      title: 'Director',
    },
  });
  createdStaffIds.push(adminYStaff.id);

  // Doctors in Hospital X: Doctor A & Doctor B
  const doctorA = await prisma.doctor.create({
    data: {
      hospitalId: hospitalXId,
      fullName: `Dr. Alice ${unique}`,
      specialty: 'Pediatric Neurology',
      availableDays: 'MON,WED,FRI',
      startHour: 9,
      endHour: 17,
      slotDurationMinutes: 30,
    },
  });
  doctorAId = doctorA.id;
  createdDoctorIds.push(doctorAId);

  const doctorB = await prisma.doctor.create({
    data: {
      hospitalId: hospitalXId,
      fullName: `Dr. Bob ${unique}`,
      specialty: 'Child Psychiatry',
      availableDays: 'TUE,THU',
      startHour: 9,
      endHour: 17,
      slotDurationMinutes: 30,
    },
  });
  doctorBId = doctorB.id;
  createdDoctorIds.push(doctorBId);

  // Doctor in Hospital Y: Doctor C
  const doctorC = await prisma.doctor.create({
    data: {
      hospitalId: hospitalYId,
      fullName: `Dr. Charlie ${unique}`,
      specialty: 'General Pediatrics',
      availableDays: 'MON,TUE',
      startHour: 9,
      endHour: 17,
      slotDurationMinutes: 30,
    },
  });
  doctorCId = doctorC.id;
  createdDoctorIds.push(doctorCId);

  // Parent & Child for Appointments
  const parent = await prisma.parent.create({
    data: {
      email: parentEmail,
      firstName: 'Family',
      lastName: 'Tester',
      role: 'PARENT',
      passwordHash,
      preference: { create: {} },
    },
  });
  createdParentIds.push(parent.id);

  const child = await prisma.child.create({
    data: {
      parentId: parent.id,
      firstName: 'Kosal',
      lastName: 'Tester',
      dateOfBirth: new Date('2021-05-10'),
    },
  });
  childId = child.id;

  // Appointment for Doctor A
  const apptA = await prisma.appointment.create({
    data: {
      hospitalId: hospitalXId,
      doctorId: doctorAId,
      childId,
      parentId: parent.id,
      status: 'REQUESTED',
      scheduledAt: new Date(Date.now() + 86400000 * 2),
      reason: 'Initial evaluation',
    },
  });
  appointmentAId = apptA.id;
  createdAppointmentIds.push(appointmentAId);

  // Appointment for Doctor B
  const apptB = await prisma.appointment.create({
    data: {
      hospitalId: hospitalXId,
      doctorId: doctorBId,
      childId,
      parentId: parent.id,
      status: 'REQUESTED',
      scheduledAt: new Date(Date.now() + 86400000 * 3),
      reason: 'Follow-up assessment',
    },
  });
  appointmentBId = apptB.id;
  createdAppointmentIds.push(appointmentBId);

  // Login admins
  const loginX = await adminXAgent.post('/api/v1/auth/login').send({
    email: adminEmailX,
    password,
  });
  expect(loginX.status).toBe(200);

  const loginY = await adminYAgent.post('/api/v1/auth/login').send({
    email: adminEmailY,
    password,
  });
  expect(loginY.status).toBe(200);
});

afterAll(async () => {
  if (createdAppointmentIds.length > 0) {
    await prisma.appointment.deleteMany({
      where: { id: { in: createdAppointmentIds } },
    });
  }
  if (childId) {
    await prisma.child.deleteMany({
      where: { id: childId },
    });
  }
  await prisma.accountInvitation.deleteMany({
    where: {
      hospitalId: { in: createdHospitalIds },
    },
  });
  if (createdStaffIds.length > 0) {
    await prisma.hospitalStaff.deleteMany({
      where: { id: { in: createdStaffIds } },
    });
  }
  if (createdDoctorIds.length > 0) {
    await prisma.doctor.deleteMany({
      where: { id: { in: createdDoctorIds } },
    });
  }
  if (createdHospitalIds.length > 0) {
    await prisma.hospital.deleteMany({
      where: { id: { in: createdHospitalIds } },
    });
  }
  if (createdParentIds.length > 0) {
    await prisma.parent.deleteMany({
      where: { id: { in: createdParentIds } },
    });
  }
});

describe('Hospital Team Management Flow', () => {
  it('admin creates a COORDINATOR -> /staff-setup works -> login works', async () => {
    const res = await adminXAgent.post('/api/v1/hospital/staff').send({
      firstName: 'Sophea',
      lastName: 'Kim',
      title: 'Care Coordinator',
      role: 'COORDINATOR',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.staff.role).toBe('COORDINATOR');
    expect(res.body.data.staff.status).toBe('SETUP_PENDING');
    expect(res.body.data.username).toBeTruthy();
    expect(res.body.data.setupCode).toBeTruthy();

    coordinatorStaffId = res.body.data.staff.id;
    coordinatorUsername = res.body.data.username;
    coordinatorSetupCode = res.body.data.setupCode;
    createdStaffIds.push(coordinatorStaffId);

    const coordinatorStaffRow = await prisma.hospitalStaff.findUnique({
      where: { id: coordinatorStaffId },
    });
    expect(coordinatorStaffRow).toBeTruthy();
    createdParentIds.push(coordinatorStaffRow!.parentId);

    // Complete /staff-setup
    const setupRes = await request(app).post('/api/v1/auth/staff-setup').send({
      username: coordinatorUsername,
      setupCode: coordinatorSetupCode,
      password: 'CoordinatorPassword123!',
    });
    expect(setupRes.status).toBe(200);
    expect(setupRes.body.data.parent.role).toBe('HOSPITAL');

    // Login works
    const loginRes = await coordinatorAgent.post('/api/v1/auth/login').send({
      email: coordinatorUsername,
      password: 'CoordinatorPassword123!',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.parent.role).toBe('HOSPITAL');
  });

  it('coordinator: 403 on team endpoints, profile update and doctor create; 200 on appointment status change', async () => {
    // 403 on team listing
    const teamListRes = await coordinatorAgent.get('/api/v1/hospital/staff');
    expect(teamListRes.status).toBe(403);

    // 403 on staff creation
    const teamCreateRes = await coordinatorAgent.post('/api/v1/hospital/staff').send({
      firstName: 'Test',
      lastName: 'User',
      role: 'COORDINATOR',
    });
    expect(teamCreateRes.status).toBe(403);

    // 403 on profile update
    const profileUpdateRes = await coordinatorAgent
      .patch('/api/v1/hospital-management/me')
      .send({ name: 'Hacked Hospital Name' });
    expect(profileUpdateRes.status).toBe(403);

    // 403 on doctor create
    const doctorCreateRes = await coordinatorAgent
      .post('/api/v1/hospital-management/doctors')
      .send({
        fullName: 'Dr. Hacker',
        specialty: 'None',
        availableDays: 'MON',
        startHour: 9,
        endHour: 17,
        slotDurationMinutes: 30,
      });
    expect(doctorCreateRes.status).toBe(403);

    // 200 on appointment status change
    const statusChangeRes = await coordinatorAgent
      .patch(`/api/v1/hospital-management/appointments/${appointmentAId}/status`)
      .send({ status: 'CONFIRMED' });
    expect(statusChangeRes.status).toBe(200);
    expect(statusChangeRes.body.data.status).toBe('CONFIRMED');
  });

  it('admin creates a DOCTOR linked to doctor A -> doctor only sees doctor A appointments and changing doctor B gives 404', async () => {
    const res = await adminXAgent.post('/api/v1/hospital/staff').send({
      firstName: 'Alice',
      lastName: 'Doctor',
      role: 'DOCTOR',
      doctorId: doctorAId,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.staff.role).toBe('DOCTOR');
    expect(res.body.data.staff.doctorId).toBe(doctorAId);

    doctorStaffId = res.body.data.staff.id;
    doctorUsername = res.body.data.username;
    doctorSetupCode = res.body.data.setupCode;
    createdStaffIds.push(doctorStaffId);

    const docStaffRow = await prisma.hospitalStaff.findUnique({
      where: { id: doctorStaffId },
    });
    createdParentIds.push(docStaffRow!.parentId);

    // Complete /staff-setup
    const setupRes = await request(app).post('/api/v1/auth/staff-setup').send({
      username: doctorUsername,
      setupCode: doctorSetupCode,
      password: 'DoctorPassword123!',
    });
    expect(setupRes.status).toBe(200);

    // Login as Doctor A
    const loginRes = await doctorAgent.post('/api/v1/auth/login').send({
      email: doctorUsername,
      password: 'DoctorPassword123!',
    });
    expect(loginRes.status).toBe(200);

    // Doctor A lists appointments -> sees ONLY appointment A, NOT appointment B
    const apptsRes = await doctorAgent.get('/api/v1/hospital-management/appointments');
    expect(apptsRes.status).toBe(200);
    const appointmentIds = apptsRes.body.data.map((a: { id: string }) => a.id);
    expect(appointmentIds).toContain(appointmentAId);
    expect(appointmentIds).not.toContain(appointmentBId);

    // Doctor A attempts to change status on Doctor B's appointment -> 404
    const changeBRes = await doctorAgent
      .patch(`/api/v1/hospital-management/appointments/${appointmentBId}/status`)
      .send({ status: 'CONFIRMED' });
    expect(changeBRes.status).toBe(404);

    // Doctor A changes status on Doctor A's appointment -> 200
    const changeARes = await doctorAgent
      .patch(`/api/v1/hospital-management/appointments/${appointmentAId}/status`)
      .send({ status: 'COMPLETED' });
    expect(changeARes.status).toBe(200);
    expect(changeARes.body.data.status).toBe('COMPLETED');
  });

  it('a DOCTOR whose doctor record was unlinked sees no appointments rather than the whole hospital', async () => {
    // Deleting a doctor sets HospitalStaff.doctorId to null (onDelete: SetNull).
    await prisma.hospitalStaff.update({ where: { id: doctorStaffId }, data: { doctorId: null } });
    try {
      const apptsRes = await doctorAgent.get('/api/v1/hospital-management/appointments');
      expect(apptsRes.status).toBe(200);
      expect(apptsRes.body.data).toEqual([]);

      const changeRes = await doctorAgent
        .patch(`/api/v1/hospital-management/appointments/${appointmentBId}/status`)
        .send({ status: 'CONFIRMED' });
      expect(changeRes.status).toBe(404);
    } finally {
      await prisma.hospitalStaff.update({
        where: { id: doctorStaffId },
        data: { doctorId: doctorAId },
      });
    }
  });

  it('linking a doctor already linked gives 409; doctor from another hospital gives 400 or 404', async () => {
    // Doctor A is already linked to Alice Doctor
    const conflictRes = await adminXAgent.post('/api/v1/hospital/staff').send({
      firstName: 'Duplicate',
      lastName: 'Doctor',
      role: 'DOCTOR',
      doctorId: doctorAId,
    });
    expect(conflictRes.status).toBe(409);

    // Doctor C belongs to Hospital Y, not Hospital X
    const foreignDoctorRes = await adminXAgent.post('/api/v1/hospital/staff').send({
      firstName: 'Foreign',
      lastName: 'Doctor',
      role: 'DOCTOR',
      doctorId: doctorCId,
    });
    expect([400, 404]).toContain(foreignDoctorRes.status);
  });

  it('deactivate -> login refused AND refresh refused; reactivate -> login works', async () => {
    // Deactivate coordinator
    const deactRes = await adminXAgent.post(
      `/api/v1/hospital/staff/${coordinatorStaffId}/deactivate`,
    );
    expect(deactRes.status).toBe(200);
    expect(deactRes.body.data.status).toBe('DEACTIVATED');

    // Login refused (403)
    const loginFail = await request(app).post('/api/v1/auth/login').send({
      email: coordinatorUsername,
      password: 'CoordinatorPassword123!',
    });
    expect(loginFail.status).toBe(403);
    expect(loginFail.body.error.message).toContain('deactivated');

    // Refresh refused (401 or 403)
    const refreshFail = await coordinatorAgent.post('/api/v1/auth/refresh');
    expect([401, 403]).toContain(refreshFail.status);

    // Reactivate coordinator
    const reactRes = await adminXAgent.post(
      `/api/v1/hospital/staff/${coordinatorStaffId}/reactivate`,
    );
    expect(reactRes.status).toBe(200);
    expect(reactRes.body.data.status).toBe('ACTIVE');

    // Login now works again
    const loginSuccess = await request(app).post('/api/v1/auth/login').send({
      email: coordinatorUsername,
      password: 'CoordinatorPassword123!',
    });
    expect(loginSuccess.status).toBe(200);
  });

  it('an admin of hospital X cannot manage the staff of hospital Y', async () => {
    // Admin Y tries to deactivate Admin X's staff
    const crossDeact = await adminYAgent.post(
      `/api/v1/hospital/staff/${coordinatorStaffId}/deactivate`,
    );
    expect([403, 404]).toContain(crossDeact.status);

    // Admin Y tries to issue setup code for Admin X's staff
    const crossSetup = await adminYAgent.post(
      `/api/v1/hospital/staff/${coordinatorStaffId}/setup-code`,
    );
    expect([403, 404]).toContain(crossSetup.status);
  });
});
