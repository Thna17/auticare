import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

/**
 * The platform admin's management views against a real database: only admins
 * get in, lists never carry child details, suspension stops sign-in without
 * touching data, suspending a school locks out its staff, and every action
 * lands in the audit log.
 */

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareTestPassword123';

const adminEmail = `adm-admin-${unique}@auticare.test`;
const parentEmail = `adm-parent-${unique}@auticare.test`;
const schoolAdminEmail = `adm-school-${unique}@auticare.test`;
const teacherUsername = `teacher${unique.replace(/[^a-z0-9]/gi, '').slice(-8)}.adm`;

const createdParentIds: string[] = [];
let schoolId = '';
let parentId = '';
let adminId = '';

const adminAgent = request.agent(app);
const parentAgent = request.agent(app);

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);
  const school = await prisma.school.create({
    data: { name: `Admin Test School ${unique}`, city: 'Kampot', address: 'Road 3' },
  });
  schoolId = school.id;

  const admin = await prisma.parent.create({
    data: {
      email: adminEmail,
      firstName: 'Platform',
      lastName: 'Admin',
      role: 'ADMIN',
      passwordHash,
      preference: { create: {} },
    },
  });
  adminId = admin.id;
  const schoolAdmin = await prisma.parent.create({
    data: {
      email: schoolAdminEmail,
      firstName: 'School',
      lastName: 'Head',
      role: 'SCHOOL',
      passwordHash,
      preference: { create: {} },
    },
  });
  const teacher = await prisma.parent.create({
    data: {
      email: `${teacherUsername}@staff.auticare.invalid`,
      username: teacherUsername,
      firstName: 'Class',
      lastName: 'Teacher',
      role: 'SCHOOL',
      passwordHash,
      mustResetPassword: true,
      preference: { create: {} },
    },
  });
  createdParentIds.push(admin.id, schoolAdmin.id, teacher.id);
  await prisma.schoolStaff.createMany({
    data: [
      { parentId: schoolAdmin.id, schoolId, role: 'ADMIN' },
      { parentId: teacher.id, schoolId, role: 'TEACHER', title: 'Speech' },
    ],
  });

  const registered = await parentAgent
    .post('/api/v1/auth/register')
    .send({ email: parentEmail, password, firstName: 'Family', lastName: 'Member' });
  expect(registered.status).toBe(201);
  parentId = registered.body.data.parent.id;
  createdParentIds.push(parentId);
  await parentAgent
    .post('/api/v1/children')
    .send({ firstName: 'SecretChildName', dateOfBirth: '2021-01-01' });

  expect(
    (await adminAgent.post('/api/v1/auth/login').send({ email: adminEmail, password })).status,
  ).toBe(200);
});

afterAll(async () => {
  await prisma.announcement.deleteMany({ where: { createdById: adminId } });
  await prisma.partnership.deleteMany({ where: { createdById: adminId } });
  await prisma.auditEvent.deleteMany({
    where: { OR: [{ actorId: adminId }, { targetId: { in: [...createdParentIds, schoolId] } }] },
  });
  await prisma.school.deleteMany({ where: { id: schoolId } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  await prisma.$disconnect();
});

const login = (email: string) => request(app).post('/api/v1/auth/login').send({ email, password });

describe('admin portal', () => {
  it('is closed to every role except ADMIN', async () => {
    for (const path of ['/overview', '/parents', '/schools', '/staff', '/audit', '/sponsorships']) {
      expect((await parentAgent.get(`/api/v1/admin${path}`)).status).toBe(403);
    }
    expect((await request(app).get('/api/v1/admin/parents')).status).toBe(401);
  });

  it('lists parents with plan and child count, but never child details', async () => {
    const res = await adminAgent.get('/api/v1/admin/parents').query({ search: parentEmail });
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0]).toMatchObject({
      email: parentEmail,
      plan: 'FREE',
      childCount: 1,
      status: 'ACTIVE',
    });
    expect(JSON.stringify(res.body.data)).not.toContain('SecretChildName');
  });

  it('suspending an account stops sign-in and refresh; reactivating restores it', async () => {
    const before = await prisma.child.count({ where: { parentId } });

    const suspended = await adminAgent
      .post(`/api/v1/admin/accounts/${parentId}/suspend`)
      .send({ reason: 'Reported abuse of the inquiry form' });
    expect(suspended.status).toBe(200);

    const blocked = await login(parentEmail);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.message).toContain('suspended');
    // The existing session cannot be refreshed either.
    expect([401, 403]).toContain((await parentAgent.post('/api/v1/auth/refresh')).status);
    expect(await prisma.child.count({ where: { parentId } })).toBe(before);

    const listed = await adminAgent
      .get('/api/v1/admin/parents')
      .query({ search: parentEmail, status: 'SUSPENDED' });
    expect(listed.body.data.items[0].suspendedReason).toBe('Reported abuse of the inquiry form');

    expect((await adminAgent.post(`/api/v1/admin/accounts/${parentId}/reactivate`)).status).toBe(
      200,
    );
    expect((await login(parentEmail)).status).toBe(200);
  });

  it('refuses to suspend an administrator', async () => {
    const res = await adminAgent
      .post(`/api/v1/admin/accounts/${adminId}/suspend`)
      .send({ reason: 'test' });
    expect(res.status).toBe(400);
  });

  it('lists schools and staff; teachers show a username and no placeholder email', async () => {
    const schools = await adminAgent.get('/api/v1/admin/schools').query({ search: unique });
    expect(schools.status).toBe(200);
    expect(schools.body.data.items[0]).toMatchObject({
      id: schoolId,
      status: 'ACTIVE',
      teacherCount: 1,
      businessActive: false,
      adminEmail: schoolAdminEmail,
    });

    const staff = await adminAgent.get('/api/v1/admin/staff').query({ schoolId });
    expect(staff.status).toBe(200);
    const teacher = staff.body.data.items.find((s: { role: string }) => s.role === 'TEACHER');
    expect(teacher).toMatchObject({
      username: teacherUsername,
      email: null,
      status: 'SETUP_PENDING',
      schoolName: `Admin Test School ${unique}`,
    });
  });

  it('suspending a school locks out its staff and hides it; reactivating restores both', async () => {
    expect((await login(schoolAdminEmail)).status).toBe(200);

    const suspended = await adminAgent
      .patch(`/api/v1/admin/schools/${schoolId}`)
      .send({ status: 'INACTIVE', reason: 'Licence expired' });
    expect(suspended.status).toBe(200);
    expect(suspended.body.data.status).toBe('INACTIVE');
    expect((await login(schoolAdminEmail)).status).toBe(403);

    const verified = await adminAgent
      .patch(`/api/v1/admin/schools/${schoolId}`)
      .send({ status: 'ACTIVE', isVerified: true });
    expect(verified.body.data).toMatchObject({ status: 'ACTIVE', isVerified: true });
    expect((await login(schoolAdminEmail)).status).toBe(200);
  });

  it('records each action in the audit log, filterable by action', async () => {
    const res = await adminAgent.get('/api/v1/admin/audit').query({ action: 'ACCOUNT_SUSPENDED' });
    expect(res.status).toBe(200);
    expect(res.body.data.actions).toContain('SCHOOL_SUSPENDED');
    const mine = res.body.data.items.find((e: { targetId: string }) => e.targetId === parentId);
    expect(mine).toMatchObject({ actorEmail: adminEmail, targetEmail: parentEmail });
    expect(
      res.body.data.items.every((e: { action: string }) => e.action === 'ACCOUNT_SUSPENDED'),
    ).toBe(true);
  });

  it('shows the overview and per-school sponsorship counts', async () => {
    const business = await prisma.subscription.create({
      data: { plan: 'BUSINESS', interval: 'MONTHLY', priceCents: 6000, schoolId },
    });
    await prisma.sponsorship.create({
      data: {
        schoolId,
        subscriptionId: business.id,
        email: `invitee-${unique}@auticare.test`,
        openKey: `${schoolId}:invitee`,
        invitedById: adminId,
      },
    });

    const overview = await adminAgent.get('/api/v1/admin/overview');
    expect(overview.status).toBe(200);
    expect(overview.body.data.parents.total).toBeGreaterThanOrEqual(1);
    expect(overview.body.data.subscriptions.business).toBeGreaterThanOrEqual(1);
    expect(typeof overview.body.data.aiConfigured).toBe('boolean');

    const sponsorships = await adminAgent.get('/api/v1/admin/sponsorships');
    const row = sponsorships.body.data.find((s: { schoolId: string }) => s.schoolId === schoolId);
    expect(row).toMatchObject({ businessActive: true, slotsUsed: 1, invited: 1, slotsTotal: 5 });
  });

  it('announcements reach only their audience, inside their time window', async () => {
    const forParents = await adminAgent.post('/api/v1/admin/announcements').send({
      title: 'New activities',
      body: 'Ten new sensory activities are in Resources.',
      audience: 'PARENTS',
      status: 'PUBLISHED',
    });
    expect(forParents.status).toBe(201);
    expect(forParents.body.data.live).toBe(true);

    const scheduled = await adminAgent.post('/api/v1/admin/announcements').send({
      title: 'Maintenance',
      body: 'AutiCare will be offline for one hour.',
      audience: 'ALL',
      status: 'PUBLISHED',
      publishAt: '2099-01-01T00:00:00.000Z',
    });
    expect(scheduled.body.data.live).toBe(false);

    const forSchools = await adminAgent.post('/api/v1/admin/announcements').send({
      title: 'For schools only',
      body: 'A note for school admins.',
      audience: 'SCHOOLS',
      status: 'PUBLISHED',
    });

    const parentView = await parentAgent.get('/api/v1/announcements');
    expect(parentView.status).toBe(200);
    const ids = parentView.body.data.map((a: { id: string }) => a.id);
    expect(ids).toContain(forParents.body.data.id);
    expect(ids).not.toContain(scheduled.body.data.id);
    expect(ids).not.toContain(forSchools.body.data.id);

    // Archiving takes it down straight away.
    const archived = await adminAgent
      .patch(`/api/v1/admin/announcements/${forParents.body.data.id}`)
      .send({
        title: 'New activities',
        body: 'Ten new sensory activities are in Resources.',
        audience: 'PARENTS',
        status: 'ARCHIVED',
      });
    expect(archived.body.data.publishedAt).not.toBeNull();
    const after = await parentAgent.get('/api/v1/announcements');
    expect(after.body.data.map((a: { id: string }) => a.id)).not.toContain(forParents.body.data.id);

    expect((await parentAgent.post('/api/v1/admin/announcements').send({})).status).toBe(403);
  });

  it('tracks partnerships with status and follow-up dates', async () => {
    const createdRes = await adminAgent.post('/api/v1/admin/partnerships').send({
      organizationName: `Partner ${unique}`,
      organizationType: 'NGO',
      contactEmail: 'Contact@Partner.test',
      status: 'PROSPECT',
      nextFollowUpAt: '2026-12-01',
    });
    expect(createdRes.status).toBe(201);
    expect(createdRes.body.data).toMatchObject({
      contactEmail: 'contact@partner.test',
      nextFollowUpAt: '2026-12-01',
      contactName: null,
    });

    const moved = await adminAgent
      .patch(`/api/v1/admin/partnerships/${createdRes.body.data.id}`)
      .send({ organizationName: `Partner ${unique}`, organizationType: 'NGO', status: 'ACTIVE' });
    expect(moved.body.data.status).toBe('ACTIVE');

    const active = await adminAgent.get('/api/v1/admin/partnerships').query({ status: 'ACTIVE' });
    expect(active.body.data.some((p: { id: string }) => p.id === createdRes.body.data.id)).toBe(
      true,
    );
  });

  it('returns monthly analytics as counts only', async () => {
    const res = await adminAgent.get('/api/v1/admin/analytics').query({ months: 3 });
    expect(res.status).toBe(200);
    expect(res.body.data.months).toHaveLength(3);
    const thisMonth = res.body.data.months[2];
    expect(thisMonth.month).toBe(new Date().toISOString().slice(0, 7));
    expect(thisMonth.parentRegistrations).toBeGreaterThanOrEqual(1);
    expect(thisMonth.recordedPlanValueCents).toBeGreaterThanOrEqual(6000);
    expect(JSON.stringify(res.body.data)).not.toContain('SecretChildName');
    expect((await adminAgent.get('/api/v1/admin/analytics').query({ months: 99 })).status).toBe(
      400,
    );
  });

  it('activities: drafts and archived ones never reach families', async () => {
    const title = `Admin draft activity ${unique}`;
    const draft = await adminAgent.post('/api/v1/admin/activities').send({
      title,
      category: 'Sensory',
      minAgeMonths: 12,
      maxAgeMonths: 60,
      summary: 'A calm sensory bin with rice and spoons.',
      steps: '1. Fill a tub. 2. Hide toys. 3. Explore together.',
      videoUrl: '',
      status: 'DRAFT',
      professionallyReviewed: false,
    });
    expect(draft.status).toBe(201);
    const id = draft.body.data.id;
    try {
      const titles = async () =>
        ((await parentAgent.get('/api/v1/activities')).body.data as { title: string }[]).map(
          (a) => a.title,
        );
      expect(await titles()).not.toContain(title);

      const body = {
        title,
        category: 'Sensory',
        minAgeMonths: 12,
        maxAgeMonths: 60,
        summary: 'A calm sensory bin with rice and spoons.',
        professionallyReviewed: true,
        reviewedBy: 'Dr. Sok, OT',
      };
      const published = await adminAgent
        .patch(`/api/v1/admin/activities/${id}`)
        .send({ ...body, status: 'PUBLISHED' });
      expect(published.body.data).toMatchObject({ status: 'PUBLISHED', reviewedBy: 'Dr. Sok, OT' });
      expect(await titles()).toContain(title);

      await adminAgent
        .patch(`/api/v1/admin/activities/${id}`)
        .send({ ...body, status: 'ARCHIVED' });
      expect(await titles()).not.toContain(title);

      const bad = await adminAgent
        .post('/api/v1/admin/activities')
        .send({ ...body, minAgeMonths: 50, maxAgeMonths: 10, status: 'DRAFT' });
      expect(bad.status).toBe(400);
    } finally {
      await prisma.activity.deleteMany({ where: { id } });
    }
  });

  it('questions: an edit becomes a new version and the old wording stays for past answers', async () => {
    // Created retired, so other test files that read the live questionnaire
    // never see it except for the moment it is live below.
    const original = await prisma.screeningQuestion.create({
      data: {
        questionText: `Original wording ${unique}`,
        category: 'Test',
        displayOrder: 9999,
        ageBand: 'PRESCHOOL',
        formKind: 'FULL',
        isActive: false,
      },
    });
    const ids = [original.id];
    try {
      const retired = await adminAgent
        .patch(`/api/v1/admin/questions/${original.id}`)
        .send({ questionText: 'Nope', category: 'Test', polarity: 'DIRECT', displayOrder: 9999 });
      expect(retired.status).toBe(400);

      await prisma.screeningQuestion.update({
        where: { id: original.id },
        data: { isActive: true },
      });
      const edited = await adminAgent.patch(`/api/v1/admin/questions/${original.id}`).send({
        questionText: `New wording ${unique}`,
        category: 'Test',
        polarity: 'DIRECT',
        displayOrder: 9999,
      });
      expect(edited.status).toBe(200);
      ids.push(edited.body.data.id);
      expect(edited.body.data).toMatchObject({
        version: 2,
        replacesId: original.id,
        isActive: true,
      });
      await adminAgent.post(`/api/v1/admin/questions/${edited.body.data.id}/archive`);

      const old = await prisma.screeningQuestion.findUnique({ where: { id: original.id } });
      expect(old).toMatchObject({ questionText: `Original wording ${unique}`, isActive: false });

      // The old version cannot be brought back while a newer one exists.
      expect((await adminAgent.post(`/api/v1/admin/questions/${original.id}/restore`)).status).toBe(
        400,
      );

      const listed = await adminAgent.get('/api/v1/admin/questionnaire');
      expect(listed.status).toBe(200);
      expect(listed.body.data.stats).toHaveLength(4);
    } finally {
      await prisma.screeningQuestion.deleteMany({ where: { id: { in: ids } } });
    }
  });

  it('AI monitoring shows usage and the safety rules, never conversation text', async () => {
    const res = await adminAgent.get('/api/v1/admin/ai').query({ days: 7 });
    expect(res.status).toBe(200);
    expect(res.body.data.daily).toHaveLength(7);
    expect(res.body.data.rules).toContain('you do not diagnose');
    expect(typeof res.body.data.configured).toBe('boolean');
    expect(JSON.stringify(res.body.data.totals)).not.toMatch(/content/);
    expect((await parentAgent.get('/api/v1/admin/ai')).status).toBe(403);
  });
});
