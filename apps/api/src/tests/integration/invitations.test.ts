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
const newPassword = 'NewSecurePassword123!';
const adminEmail = `admin-${unique}@auticare.test`;
const schoolStaffEmail = `school-staff-${unique}@auticare.test`;
const schoolManagerEmail = `school-mgr-${unique}@auticare.test`;
const hospitalAdminEmail = `hosp-mgr-${unique}@auticare.test`;
const guardianEmail = `guardian-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdSchoolIds: string[] = [];
const createdHospitalIds: string[] = [];

let adminAgent: ReturnType<typeof request.agent>;
let schoolStaffAgent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const adminHash = await passwordService.hash(adminPassword);

  // 1. Create system admin
  const admin = await prisma.parent.create({
    data: {
      email: adminEmail,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      passwordHash: adminHash,
      preference: { create: {} },
    },
  });
  createdParentIds.push(admin.id);

  // 2. Create school + staff
  const school = await prisma.school.create({
    data: {
      name: `Test Academy ${unique}`,
      city: 'Phnom Penh',
      address: 'Preah Monivong Blvd',
    },
  });
  createdSchoolIds.push(school.id);

  const schoolStaff = await prisma.parent.create({
    data: {
      email: schoolStaffEmail,
      firstName: 'Teacher',
      lastName: 'One',
      role: 'SCHOOL',
      passwordHash: adminHash,
      preference: { create: {} },
      schoolStaffProfiles: {
        create: {
          schoolId: school.id,
          title: 'Specialist',
          // The school's own account: only the school admin enrols students.
          role: 'ADMIN',
        },
      },
    },
  });
  createdParentIds.push(schoolStaff.id);

  adminAgent = request.agent(app);
  await adminAgent.post('/api/v1/auth/login').send({ email: adminEmail, password: adminPassword });

  schoolStaffAgent = request.agent(app);
  await schoolStaffAgent
    .post('/api/v1/auth/login')
    .send({ email: schoolStaffEmail, password: adminPassword });
});

afterAll(async () => {
  await prisma.accountInvitation.deleteMany({
    where: {
      email: {
        in: [
          schoolManagerEmail,
          hospitalAdminEmail,
          guardianEmail,
          `expired-${unique}@auticare.test`,
          `dup-${unique}@auticare.test`,
        ],
      },
    },
  });
  await prisma.auditEvent.deleteMany({
    where: {
      targetEmail: {
        in: [
          schoolManagerEmail,
          hospitalAdminEmail,
          guardianEmail,
          `expired-${unique}@auticare.test`,
          `dup-${unique}@auticare.test`,
        ],
      },
    },
  });
  await prisma.schoolChildEnrollment.deleteMany({
    where: { schoolId: { in: createdSchoolIds } },
  });
  await prisma.child.deleteMany({
    where: { parentId: { in: createdParentIds } },
  });
  await prisma.hospital.deleteMany({ where: { id: { in: createdHospitalIds } } });
  await prisma.school.deleteMany({ where: { id: { in: createdSchoolIds } } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  await prisma.$disconnect();
});

describe('Privileged Account Invitations & Provisioning', () => {
  describe('Hospital account provisioning without temporary password', () => {
    it('creates hospital manager with single-use invitation and never exposes plaintext password', async () => {
      const response = await adminAgent.post('/api/v1/hospitals/admin/accounts').send({
        hospital: {
          name: `Hope Hospital ${unique}`,
          city: 'Siem Reap',
          address: 'Wat Bo Rd',
          services: 'Pediatric Development',
        },
        account: {
          email: hospitalAdminEmail,
          firstName: 'Sophea',
          lastName: 'Director',
          title: 'Director',
        },
      });

      expect(response.status).toBe(201);
      expect(response.body.data.account.email).toBe(hospitalAdminEmail);
      expect(response.body.data.account.role).toBe('HOSPITAL');
      expect(response.body.data.invitationSent).toBe(true);
      expect(response.body.data.invitationUrl).toContain('/accept-invitation?token=');
      // No plaintext password returned!
      expect(response.body.data.account.password).toBeUndefined();
      expect(response.body.data.account.passwordHash).toBeUndefined();

      createdParentIds.push(response.body.data.account.id);
      createdHospitalIds.push(response.body.data.hospital.id);

      // Verify DB state: mustResetPassword is true
      const createdParent = await prisma.parent.findUnique({
        where: { email: hospitalAdminEmail },
      });
      expect(createdParent?.mustResetPassword).toBe(true);

      // Verify invitation token in DB
      const invitation = await prisma.accountInvitation.findFirst({
        where: { email: hospitalAdminEmail },
      });
      expect(invitation).toBeTruthy();
      expect(invitation?.acceptedAt).toBeNull();
      expect(invitation?.role).toBe('HOSPITAL');

      // Verify audit event
      const audit = await prisma.auditEvent.findFirst({
        where: {
          action: 'HOSPITAL_ACCOUNT_PROVISIONED',
          targetEmail: hospitalAdminEmail,
        },
      });
      expect(audit).toBeTruthy();
    });

    it('rejects duplicate hospital manager email with 409', async () => {
      const response = await adminAgent.post('/api/v1/hospitals/admin/accounts').send({
        hospital: {
          name: `Another Hospital ${unique}`,
          city: 'Battambang',
          address: 'Street 3',
          services: 'Pediatric Care',
        },
        account: {
          email: hospitalAdminEmail,
          firstName: 'Another',
          lastName: 'Director',
        },
      });

      expect(response.status).toBe(409);
    });

    it('allows non-admins to be forbidden from provisioning hospitals', async () => {
      const forbiddenResponse = await schoolStaffAgent
        .post('/api/v1/hospitals/admin/accounts')
        .send({
          hospital: {
            name: `Unauthorized Hospital ${unique}`,
            city: 'Phnom Penh',
            address: 'St 271',
          },
          account: {
            email: `unauth-${unique}@auticare.test`,
            firstName: 'Unauthorized',
            lastName: 'User',
          },
        });

      expect(forbiddenResponse.status).toBe(403);
    });
  });

  describe('School student enrollment guardian provisioning', () => {
    it('provisions guardian with mustResetPassword and single-use invitation without password', async () => {
      const response = await schoolStaffAgent.post('/api/v1/schools/enrollments/students').send({
        firstName: 'Dara',
        dateOfBirth: '2019-05-10',
        guardianFirstName: 'Bopha',
        guardianLastName: 'Guardian',
        guardianEmail,
        guardianPhone: '+85512345678',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.guardian.email).toBe(guardianEmail);
      // Ensure no temp password returned
      expect(response.body.data.guardian.temporaryPassword).toBeUndefined();
      expect(response.body.data.temporaryPassword).toBeUndefined();

      createdParentIds.push(response.body.data.guardian.id);

      const guardian = await prisma.parent.findUnique({
        where: { email: guardianEmail },
      });
      expect(guardian?.mustResetPassword).toBe(true);

      const invitation = await prisma.accountInvitation.findFirst({
        where: { email: guardianEmail },
      });
      expect(invitation).toBeTruthy();
      expect(invitation?.role).toBe('PARENT');
      expect(invitation?.acceptedAt).toBeNull();

      const audit = await prisma.auditEvent.findFirst({
        where: {
          action: 'GUARDIAN_PROVISIONED_BY_SCHOOL',
          targetEmail: guardianEmail,
        },
      });
      expect(audit).toBeTruthy();
    });
  });

  describe('Invitation verification and acceptance workflow', () => {
    it('verifies a valid invitation token', async () => {
      const invitations = await prisma.accountInvitation.findMany({
        where: { email: hospitalAdminEmail },
      });
      expect(invitations.length).toBeGreaterThan(0);

      // Create an explicit token to verify URL token behavior
      const plainToken = tokenService.createInvitationToken();
      const tokenHash = tokenService.hashInvitationToken(plainToken);
      await prisma.accountInvitation.create({
        data: {
          email: `verify-${unique}@auticare.test`,
          tokenHash,
          role: 'PARENT',
          expiresAt: tokenService.invitationTokenExpiresAt(),
        },
      });

      const verifyRes = await request(app)
        .get('/api/v1/auth/invitations/verify')
        .query({ token: plainToken });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.valid).toBe(true);
      expect(verifyRes.body.data.email).toBe(`verify-${unique}@auticare.test`);
      expect(verifyRes.body.data.role).toBe('PARENT');
    });

    it('rejects an invalid invitation token', async () => {
      const verifyRes = await request(app)
        .get('/api/v1/auth/invitations/verify')
        .query({ token: 'nonexistent-token-abc-123' });

      expect(verifyRes.status).toBe(404);
    });

    it('rejects an expired invitation token', async () => {
      const expiredToken = tokenService.createInvitationToken();
      const expiredHash = tokenService.hashInvitationToken(expiredToken);
      await prisma.accountInvitation.create({
        data: {
          email: `expired-${unique}@auticare.test`,
          tokenHash: expiredHash,
          role: 'PARENT',
          expiresAt: new Date(Date.now() - 1000 * 60), // expired 1 min ago
        },
      });

      const verifyRes = await request(app)
        .get('/api/v1/auth/invitations/verify')
        .query({ token: expiredToken });

      expect(verifyRes.status).toBe(400);
      expect(verifyRes.body.error.message).toContain('expired');
    });

    it('accepts an invitation, returns 200 with data.parent, sets auth cookies, issues a working session, and clears mustResetPassword', async () => {
      // Create user and token for acceptance test
      const testEmail = `accept-${unique}@auticare.test`;
      const plainToken = tokenService.createInvitationToken();
      const tokenHash = tokenService.hashInvitationToken(plainToken);

      const parent = await prisma.parent.create({
        data: {
          email: testEmail,
          firstName: 'Accept',
          lastName: 'Tester',
          role: 'HOSPITAL',
          mustResetPassword: true,
          passwordHash: await passwordService.hash('InitialUnusableHash123'),
          preference: { create: {} },
        },
      });
      createdParentIds.push(parent.id);

      await prisma.accountInvitation.create({
        data: {
          email: testEmail,
          tokenHash,
          role: 'HOSPITAL',
          parentId: parent.id,
          expiresAt: tokenService.invitationTokenExpiresAt(),
        },
      });

      // Accept invitation
      const acceptRes = await request(app).post('/api/v1/auth/invitations/accept').send({
        token: plainToken,
        password: newPassword,
      });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.data.parent).toBeTruthy();
      expect(acceptRes.body.data.parent.email).toBe(testEmail);
      expect(acceptRes.body.data.parent.mustResetPassword).toBe(false);

      // Assert auth cookies are set
      const cookies = acceptRes.headers['set-cookie'] as string[] | undefined;
      expect(cookies).toBeDefined();
      expect(cookies?.some((c) => c.includes('auticare_access='))).toBe(true);
      expect(cookies?.some((c) => c.includes('auticare_refresh='))).toBe(true);

      // Verify the session works: GET /api/v1/auth/me returns the account
      const meRes = await request(app).get('/api/v1/auth/me').set('Cookie', cookies!);
      expect(meRes.status).toBe(200);
      expect(meRes.body.data.parent.id).toBe(parent.id);
      expect(meRes.body.data.parent.email).toBe(testEmail);

      // Verify database updated
      const updatedParent = await prisma.parent.findUnique({ where: { email: testEmail } });
      expect(updatedParent?.mustResetPassword).toBe(false);

      const acceptedInvitation = await prisma.accountInvitation.findUnique({
        where: { tokenHash },
      });
      expect(acceptedInvitation?.acceptedAt).toBeTruthy();

      // Verify audit event
      const audit = await prisma.auditEvent.findFirst({
        where: {
          action: 'INVITATION_ACCEPTED',
          targetEmail: testEmail,
        },
      });
      expect(audit).toBeTruthy();

      // Accepting the same token twice fails the second time
      const replayRes = await request(app).post('/api/v1/auth/invitations/accept').send({
        token: plainToken,
        password: 'AnotherPassword456!',
      });
      expect(replayRes.status).toBe(400);
      expect(replayRes.body.error.message).toContain('already been accepted');
    });

    it('two parallel accepts give exactly one success (atomic single use)', async () => {
      const email = `parallel-${unique}@auticare.test`;
      const token = tokenService.createInvitationToken();
      const tokenHash = tokenService.hashInvitationToken(token);

      const parent = await prisma.parent.create({
        data: {
          email,
          firstName: 'Parallel',
          lastName: 'Tester',
          role: 'SCHOOL',
          mustResetPassword: true,
          passwordHash: await passwordService.hash('InitialUnusableHash123'),
          preference: { create: {} },
        },
      });
      createdParentIds.push(parent.id);

      await prisma.accountInvitation.create({
        data: {
          email,
          tokenHash,
          role: 'SCHOOL',
          parentId: parent.id,
          expiresAt: tokenService.invitationTokenExpiresAt(),
        },
      });

      // Submit two parallel accepts with the same token
      const [res1, res2] = await Promise.all([
        request(app).post('/api/v1/auth/invitations/accept').send({
          token,
          password: newPassword,
        }),
        request(app).post('/api/v1/auth/invitations/accept').send({
          token,
          password: newPassword,
        }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 400]);

      const successfulRes = res1.status === 200 ? res1 : res2;
      const failingRes = res1.status === 400 ? res1 : res2;

      expect(successfulRes.body.data.parent.email).toBe(email);
      expect(failingRes.body.error.message).toContain('already been accepted');
    });

    it('the verify GET does not consume the token (verify, then accept still works)', async () => {
      const email = `verify-noconsume-${unique}@auticare.test`;
      const token = tokenService.createInvitationToken();
      const tokenHash = tokenService.hashInvitationToken(token);

      const parent = await prisma.parent.create({
        data: {
          email,
          firstName: 'NoConsume',
          lastName: 'Tester',
          role: 'HOSPITAL',
          mustResetPassword: true,
          passwordHash: await passwordService.hash('InitialUnusableHash123'),
          preference: { create: {} },
        },
      });
      createdParentIds.push(parent.id);

      await prisma.accountInvitation.create({
        data: {
          email,
          tokenHash,
          role: 'HOSPITAL',
          parentId: parent.id,
          expiresAt: tokenService.invitationTokenExpiresAt(),
        },
      });

      // 1. Verify GET (read-only)
      const verifyRes = await request(app).get('/api/v1/auth/invitations/verify').query({ token });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.valid).toBe(true);

      // Verify token in DB is NOT marked accepted
      const unaccepted = await prisma.accountInvitation.findUnique({ where: { tokenHash } });
      expect(unaccepted?.acceptedAt).toBeNull();

      // 2. Accept POST succeeds afterwards
      const acceptRes = await request(app).post('/api/v1/auth/invitations/accept').send({
        token,
        password: newPassword,
      });
      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.data.parent.email).toBe(email);
    });

    it('rejects an expired or revoked invitation token on accept', async () => {
      const expiredEmail = `expired-accept-${unique}@auticare.test`;
      const expiredToken = tokenService.createInvitationToken();
      const expiredHash = tokenService.hashInvitationToken(expiredToken);

      const expiredParent = await prisma.parent.create({
        data: {
          email: expiredEmail,
          firstName: 'Expired',
          lastName: 'Tester',
          role: 'PARENT',
          passwordHash: await passwordService.hash('Unusable123!'),
          preference: { create: {} },
        },
      });
      createdParentIds.push(expiredParent.id);

      await prisma.accountInvitation.create({
        data: {
          email: expiredEmail,
          tokenHash: expiredHash,
          role: 'PARENT',
          parentId: expiredParent.id,
          expiresAt: new Date(Date.now() - 60 * 1000), // expired 1 min ago
        },
      });

      const expiredRes = await request(app).post('/api/v1/auth/invitations/accept').send({
        token: expiredToken,
        password: newPassword,
      });
      expect(expiredRes.status).toBe(400);
      expect(expiredRes.body.error.message).toContain('expired');

      // Revoked token
      const revokedEmail = `revoked-accept-${unique}@auticare.test`;
      const revokedToken = tokenService.createInvitationToken();
      const revokedHash = tokenService.hashInvitationToken(revokedToken);

      const revokedParent = await prisma.parent.create({
        data: {
          email: revokedEmail,
          firstName: 'Revoked',
          lastName: 'Tester',
          role: 'PARENT',
          passwordHash: await passwordService.hash('Unusable123!'),
          preference: { create: {} },
        },
      });
      createdParentIds.push(revokedParent.id);

      await prisma.accountInvitation.create({
        data: {
          email: revokedEmail,
          tokenHash: revokedHash,
          role: 'PARENT',
          parentId: revokedParent.id,
          expiresAt: tokenService.invitationTokenExpiresAt(),
          revokedAt: new Date(),
        },
      });

      const revokedRes = await request(app).post('/api/v1/auth/invitations/accept').send({
        token: revokedToken,
        password: newPassword,
      });
      expect(revokedRes.status).toBe(400);
      expect(revokedRes.body.error.message).toContain('revoked');
    });

    it('the send-code route is gone (404)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/invitations/send-code')
        .send({ token: 'test-token' });
      expect(res.status).toBe(404);
    });

    it('resends invitation, revokes previous token, and logs audit event', async () => {
      const resendEmail = `resend-${unique}@auticare.test`;
      const oldToken = tokenService.createInvitationToken();
      const oldHash = tokenService.hashInvitationToken(oldToken);

      const parent = await prisma.parent.create({
        data: {
          email: resendEmail,
          firstName: 'Resend',
          lastName: 'Tester',
          role: 'HOSPITAL',
          mustResetPassword: true,
          passwordHash: await passwordService.hash('RandomUnusableHash'),
          preference: { create: {} },
        },
      });
      createdParentIds.push(parent.id);

      await prisma.accountInvitation.create({
        data: {
          email: resendEmail,
          tokenHash: oldHash,
          role: 'HOSPITAL',
          parentId: parent.id,
          expiresAt: tokenService.invitationTokenExpiresAt(),
        },
      });

      // Admin resends invitation
      const resendRes = await adminAgent
        .post('/api/v1/auth/invitations/resend')
        .send({ email: resendEmail });

      expect(resendRes.status).toBe(200);
      expect(resendRes.body.data.invitationUrl).toContain('/accept-invitation?token=');

      // Previous token must now be revoked
      const oldInvitation = await prisma.accountInvitation.findUnique({
        where: { tokenHash: oldHash },
      });
      expect(oldInvitation?.revokedAt).toBeTruthy();

      // Verify old token can no longer be accepted
      const failAccept = await request(app).post('/api/v1/auth/invitations/accept').send({
        token: oldToken,
        password: 'NewResentPassword123!',
      });
      expect(failAccept.status).toBe(400);
      expect(failAccept.body.error.message).toContain('revoked');

      // Verify audit event recorded for resend
      const audit = await prisma.auditEvent.findFirst({
        where: {
          action: 'INVITATION_RESENT',
          targetEmail: resendEmail,
        },
      });
      expect(audit).toBeTruthy();
    });
  });
});
