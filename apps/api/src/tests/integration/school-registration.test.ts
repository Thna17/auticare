import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';
import { TokenService } from '../../modules/auth/token.service.js';

const app = createApp();
const passwordService = new PasswordService();
const tokenService = new TokenService();

const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const adminPassword = 'AdminPassword123!';
const parentPassword = 'ParentPassword123!';
const adminEmail = `admin-${unique}@auticare.test`;
const parentEmail = `parent-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdSchoolIds: string[] = [];
const createdRequestIds: string[] = [];

let adminAgent: ReturnType<typeof request.agent>;
let parentAgent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const adminHash = await passwordService.hash(adminPassword);
  const parentHash = await passwordService.hash(parentPassword);

  const admin = await prisma.parent.create({
    data: {
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      passwordHash: adminHash,
      preference: { create: {} },
    },
  });
  createdParentIds.push(admin.id);

  const parent = await prisma.parent.create({
    data: {
      email: parentEmail,
      firstName: 'Regular',
      lastName: 'Parent',
      role: 'PARENT',
      passwordHash: parentHash,
      preference: { create: {} },
    },
  });
  createdParentIds.push(parent.id);

  adminAgent = request.agent(app);
  await adminAgent.post('/api/v1/auth/login').send({ email: adminEmail, password: adminPassword });

  parentAgent = request.agent(app);
  await parentAgent
    .post('/api/v1/auth/login')
    .send({ email: parentEmail, password: parentPassword });
});

afterAll(async () => {
  if (createdRequestIds.length > 0) {
    await prisma.schoolRegistrationRequest.deleteMany({
      where: { id: { in: createdRequestIds } },
    });
  }
  await prisma.accountInvitation.deleteMany({
    where: {
      email: {
        contains: unique,
      },
    },
  });
  await prisma.notification.deleteMany({
    where: {
      parentId: { in: createdParentIds },
    },
  });
  await prisma.auditEvent.deleteMany({
    where: {
      targetEmail: {
        contains: unique,
      },
    },
  });
  if (createdSchoolIds.length > 0) {
    await prisma.schoolStaff.deleteMany({
      where: { schoolId: { in: createdSchoolIds } },
    });
    await prisma.school.deleteMany({
      where: { id: { in: createdSchoolIds } },
    });
  }
  if (createdParentIds.length > 0) {
    await prisma.parent.deleteMany({
      where: { id: { in: createdParentIds } },
    });
  }
});

describe('School Registration Flow', () => {
  const regEmail1 = `school1-${unique}@auticare.test`;
  const regEmail2 = `school2-${unique}@auticare.test`;
  let requestId1: string;
  let requestId2: string;

  it('submits a registration request publicly and deduplicates repeated submissions', async () => {
    const payload = {
      schoolName: `Wat Phnom Special School ${unique}`,
      city: 'Phnom Penh',
      address: 'Street 94, Daun Penh',
      contactFirstName: 'Chantrea',
      contactLastName: 'Sok',
      contactTitle: 'Principal',
      email: regEmail1,
      phone: '+85523888999',
      studentCount: 85,
      message: 'Looking forward to using AutiCare for student tracking.',
    };

    // First submission
    const res1 = await request(app).post('/api/v1/school-registrations').send(payload);

    expect(res1.status).toBe(202);
    expect(res1.body.data.received).toBe(true);

    const rows1 = await prisma.schoolRegistrationRequest.findMany({
      where: { email: regEmail1 },
    });
    expect(rows1).toHaveLength(1);
    expect(rows1[0]!.status).toBe('PENDING');
    expect(rows1[0]!.schoolName).toBe(payload.schoolName);
    requestId1 = rows1[0]!.id;
    createdRequestIds.push(requestId1);

    // Second submission with same email (anti-enumeration check)
    const res2 = await request(app).post('/api/v1/school-registrations').send(payload);

    expect(res2.status).toBe(202);
    expect(res2.body.data.received).toBe(true);

    const rows2 = await prisma.schoolRegistrationRequest.findMany({
      where: { email: regEmail1 },
    });
    expect(rows2).toHaveLength(1); // Still only one row
  });

  it('allows admin to list requests and view pending count', async () => {
    // Submit a second request for list/reject testing
    const resSub2 = await request(app)
      .post('/api/v1/school-registrations')
      .send({
        schoolName: `Siem Reap Learning Hub ${unique}`,
        city: 'Siem Reap',
        contactFirstName: 'Vannak',
        contactLastName: 'Meng',
        email: regEmail2,
        phone: '+85563999111',
      });
    expect(resSub2.status).toBe(202);

    const req2 = await prisma.schoolRegistrationRequest.findFirst({
      where: { email: regEmail2 },
    });
    expect(req2).toBeTruthy();
    requestId2 = req2!.id;
    createdRequestIds.push(requestId2);

    // List all pending
    const listRes = await adminAgent
      .get('/api/v1/admin/school-registrations')
      .query({ status: 'PENDING' });

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    const ids = listRes.body.data.map((r: { id: string }) => r.id);
    expect(ids).toContain(requestId1);
    expect(ids).toContain(requestId2);

    // Pending count
    const countRes = await adminAgent.get('/api/v1/admin/school-registrations/pending-count');
    expect(countRes.status).toBe(200);
    expect(countRes.body.data.count).toBeGreaterThanOrEqual(2);
  });

  it('admin approves a request: creates school, account, and invitation', async () => {
    const approveRes = await adminAgent.post(
      `/api/v1/admin/school-registrations/${requestId1}/approve`,
    );

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.approved).toBe(true);
    expect(approveRes.body.data.schoolId).toBeTruthy();

    const schoolId = approveRes.body.data.schoolId;
    createdSchoolIds.push(schoolId);

    // Verify DB request status
    const req = await prisma.schoolRegistrationRequest.findUnique({
      where: { id: requestId1 },
    });
    expect(req?.status).toBe('APPROVED');
    expect(req?.schoolId).toBe(schoolId);
    expect(req?.reviewedById).toBeTruthy();
    expect(req?.reviewedAt).toBeTruthy();

    // Verify school account created
    const schoolAccount = await prisma.parent.findUnique({
      where: { email: regEmail1 },
    });
    expect(schoolAccount).toBeTruthy();
    expect(schoolAccount?.role).toBe('SCHOOL');
    createdParentIds.push(schoolAccount!.id);

    // Verify invitation created
    const invitation = await prisma.accountInvitation.findFirst({
      where: { email: regEmail1 },
    });
    expect(invitation).toBeTruthy();
    expect(invitation?.role).toBe('SCHOOL');
    expect(invitation?.schoolId).toBe(schoolId);

    // Extract token from tokenHash is not possible, but we can verify acceptInvitation logic with an explicit token
    const token = tokenService.createInvitationToken();
    const tokenHash = tokenService.hashInvitationToken(token);
    await prisma.accountInvitation.update({
      where: { id: invitation!.id },
      data: { tokenHash },
    });

    const acceptRes = await request(app).post('/api/v1/auth/invitations/accept').send({
      token,
      password: 'SchoolManagerPassword123!',
    });
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.parent.mustResetPassword).toBe(false);
  });

  it('rejects approving twice with 409 Conflict', async () => {
    const res = await adminAgent.post(`/api/v1/admin/school-registrations/${requestId1}/approve`);

    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain('already been reviewed');
  });

  it('admin rejects a request and stores the reason', async () => {
    const reason = 'Cannot verify educational accreditation with the ministry.';
    const rejectRes = await adminAgent
      .post(`/api/v1/admin/school-registrations/${requestId2}/reject`)
      .send({ reason });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.rejected).toBe(true);

    const req = await prisma.schoolRegistrationRequest.findUnique({
      where: { id: requestId2 },
    });
    expect(req?.status).toBe('REJECTED');
    expect(req?.rejectionReason).toBe(reason);
    expect(req?.reviewedById).toBeTruthy();
    expect(req?.reviewedAt).toBeTruthy();

    // Rejecting twice also gives 409
    const rejectAgainRes = await adminAgent
      .post(`/api/v1/admin/school-registrations/${requestId2}/reject`)
      .send({ reason: 'Another reason here' });
    expect(rejectAgainRes.status).toBe(409);
  });

  it('enforces authentication and ADMIN authorization on admin routes', async () => {
    // Unauthenticated (401)
    const unauthList = await request(app).get('/api/v1/admin/school-registrations');
    expect(unauthList.status).toBe(401);

    const unauthCount = await request(app).get('/api/v1/admin/school-registrations/pending-count');
    expect(unauthCount.status).toBe(401);

    const unauthApprove = await request(app).post(
      `/api/v1/admin/school-registrations/${requestId1}/approve`,
    );
    expect(unauthApprove.status).toBe(401);

    const unauthReject = await request(app)
      .post(`/api/v1/admin/school-registrations/${requestId1}/reject`)
      .send({ reason: 'abc' });
    expect(unauthReject.status).toBe(401);

    // Non-admin parent (403)
    const forbiddenList = await parentAgent.get('/api/v1/admin/school-registrations');
    expect(forbiddenList.status).toBe(403);

    const forbiddenCount = await parentAgent.get(
      '/api/v1/admin/school-registrations/pending-count',
    );
    expect(forbiddenCount.status).toBe(403);

    const forbiddenApprove = await parentAgent.post(
      `/api/v1/admin/school-registrations/${requestId1}/approve`,
    );
    expect(forbiddenApprove.status).toBe(403);

    const forbiddenReject = await parentAgent
      .post(`/api/v1/admin/school-registrations/${requestId1}/reject`)
      .send({ reason: 'abc' });
    expect(forbiddenReject.status).toBe(403);
  });
});
