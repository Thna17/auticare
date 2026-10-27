import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

/**
 * Subscriptions against a real database: the admin records plans by hand, the
 * server enforces the Pro two-child limit, a Business school offers sponsored
 * Pro accounts (five at most) without ever seeing child data, and ending a plan
 * stops access without deleting anything.
 */

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareTestPassword123';

const adminEmail = `subs-admin-${unique}@auticare.test`;
const schoolAdminEmail = `subs-school-${unique}@auticare.test`;
const freeEmail = `subs-free-${unique}@auticare.test`;
const proEmail = `subs-pro-${unique}@auticare.test`;
const sponsoredEmail = `subs-sponsored-${unique}@auticare.test`;
const extraEmails = [1, 2, 3, 4, 5].map((n) => `subs-extra${n}-${unique}@auticare.test`);

const createdParentIds: string[] = [];
let schoolId = '';
let proSubscriptionId = '';
let businessSubscriptionId = '';
let offerId = '';

const adminAgent = request.agent(app);
const schoolAgent = request.agent(app);
const freeAgent = request.agent(app);
const proAgent = request.agent(app);
const sponsoredAgent = request.agent(app);

const addChild = (agent: ReturnType<typeof request.agent>, firstName: string) =>
  agent.post('/api/v1/children').send({ firstName, dateOfBirth: '2021-05-01' });

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);
  const school = await prisma.school.create({
    data: { name: 'Bright Steps', city: 'Phnom Penh', address: 'Street 2' },
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
  const schoolAdmin = await prisma.parent.create({
    data: {
      email: schoolAdminEmail,
      firstName: 'School',
      lastName: 'Admin',
      role: 'SCHOOL',
      passwordHash,
      preference: { create: {} },
    },
  });
  createdParentIds.push(admin.id, schoolAdmin.id);
  await prisma.schoolStaff.create({
    data: { parentId: schoolAdmin.id, schoolId, role: 'ADMIN' },
  });

  for (const [agent, email] of [
    [freeAgent, freeEmail],
    [proAgent, proEmail],
    [sponsoredAgent, sponsoredEmail],
  ] as const) {
    const registered = await agent
      .post('/api/v1/auth/register')
      .send({ email, password, firstName: 'Family', lastName: 'Parent' });
    expect(registered.status).toBe(201);
    createdParentIds.push(registered.body.data.parent.id);
  }

  for (const [agent, email] of [
    [adminAgent, adminEmail],
    [schoolAgent, schoolAdminEmail],
  ] as const) {
    const login = await agent.post('/api/v1/auth/login').send({ email, password });
    expect(login.status).toBe(200);
  }
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { parentId: { in: createdParentIds } } });
  await prisma.school.deleteMany({ where: { id: schoolId } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  await prisma.$disconnect();
});

describe('parent plans', () => {
  it('a new parent is on Free with no child limit, because Free limits are not decided yet', async () => {
    const me = await freeAgent.get('/api/v1/subscriptions/me');
    expect(me.status).toBe(200);
    expect(me.body.data).toMatchObject({ plan: 'FREE', source: null, maxChildren: null });

    for (const name of ['A', 'B', 'C']) expect((await addChild(freeAgent, name)).status).toBe(201);
  });

  it('only the admin can record a plan', async () => {
    const res = await proAgent
      .post('/api/v1/admin/subscriptions')
      .send({ plan: 'PRO', interval: 'MONTHLY', parentEmail: proEmail });
    expect(res.status).toBe(403);
  });

  it('the admin records Pro by hand at the confirmed price, and cannot stack a second one', async () => {
    const res = await adminAgent
      .post('/api/v1/admin/subscriptions')
      .send({ plan: 'PRO', interval: 'YEARLY', parentEmail: proEmail });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      plan: 'PRO',
      interval: 'YEARLY',
      priceCents: 20000,
      currency: 'USD',
      status: 'ACTIVE',
      grantsAccess: true,
      owner: { type: 'PARENT', email: proEmail },
    });
    proSubscriptionId = res.body.data.id;

    const again = await adminAgent
      .post('/api/v1/admin/subscriptions')
      .send({ plan: 'PRO', interval: 'MONTHLY', parentEmail: proEmail });
    expect(again.status).toBe(409);
  });

  it('Pro allows two active children; a third, or restoring an archived one, is refused', async () => {
    const me = await proAgent.get('/api/v1/subscriptions/me');
    expect(me.body.data).toMatchObject({ plan: 'PRO', source: 'PERSONAL', maxChildren: 2 });

    const first = await addChild(proAgent, 'One');
    expect(first.status).toBe(201);
    expect((await addChild(proAgent, 'Two')).status).toBe(201);

    const third = await addChild(proAgent, 'Three');
    expect(third.status).toBe(403);
    expect(third.body.error.code).toBe('PLAN_LIMIT_REACHED');

    // Archiving frees a place; restoring it again while two are active is refused.
    expect((await proAgent.delete(`/api/v1/children/${first.body.data.id}`)).status).toBe(200);
    expect((await addChild(proAgent, 'Three')).status).toBe(201);
    const restore = await proAgent.post(`/api/v1/children/${first.body.data.id}/restore`);
    expect(restore.status).toBe(403);
  });

  it('a new child starts with the questionnaire not started', async () => {
    const dash = await proAgent.get('/api/v1/dashboard/parent');
    expect(dash.status).toBe(200);
    expect(dash.body.data.questionnaireStatus).toBe('NOT_STARTED');
  });

  it('canceling keeps Pro until the paid-through date; expiring ends it and deletes nothing', async () => {
    const before = await prisma.child.count({ where: { parent: { email: proEmail } } });

    const noDate = await adminAgent
      .patch(`/api/v1/admin/subscriptions/${proSubscriptionId}`)
      .send({ status: 'CANCELED' });
    expect(noDate.status).toBe(400);

    const canceled = await adminAgent
      .patch(`/api/v1/admin/subscriptions/${proSubscriptionId}`)
      .send({ status: 'CANCELED', currentPeriodEnd: '2099-01-31' });
    expect(canceled.status).toBe(200);
    expect(canceled.body.data.grantsAccess).toBe(true);
    expect((await proAgent.get('/api/v1/subscriptions/me')).body.data.plan).toBe('PRO');

    const expired = await adminAgent
      .patch(`/api/v1/admin/subscriptions/${proSubscriptionId}`)
      .send({ status: 'EXPIRED' });
    expect(expired.status).toBe(200);
    expect((await proAgent.get('/api/v1/subscriptions/me')).body.data.plan).toBe('FREE');
    expect(await prisma.child.count({ where: { parent: { email: proEmail } } })).toBe(before);

    // EXPIRED is final.
    const revive = await adminAgent
      .patch(`/api/v1/admin/subscriptions/${proSubscriptionId}`)
      .send({ status: 'ACTIVE' });
    expect(revive.status).toBe(400);
  });
});

describe('Business and sponsored Pro family accounts', () => {
  it('a school without Business cannot offer sponsored accounts', async () => {
    const res = await schoolAgent
      .post('/api/v1/subscriptions/school/sponsorships')
      .send({ email: sponsoredEmail });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PLAN_LIMIT_REACHED');
  });

  it('the admin records Business; the school sees five slots', async () => {
    const res = await adminAgent
      .post('/api/v1/admin/subscriptions')
      .send({ plan: 'BUSINESS', interval: 'MONTHLY', schoolId });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      priceCents: 6000,
      owner: { type: 'SCHOOL', id: schoolId },
    });
    businessSubscriptionId = res.body.data.id;

    const school = await schoolAgent.get('/api/v1/subscriptions/school');
    expect(school.status).toBe(200);
    expect(school.body.data).toMatchObject({ businessActive: true, slotsTotal: 5, slotsUsed: 0 });
  });

  it('the school offers a slot; the parent accepts with their own account and gets Pro', async () => {
    await addChild(sponsoredAgent, 'PrivateChildName');

    const invited = await schoolAgent
      .post('/api/v1/subscriptions/school/sponsorships')
      .send({ email: sponsoredEmail.toUpperCase() });
    expect(invited.status).toBe(201);
    expect(invited.body.data.slotsUsed).toBe(1);

    const duplicate = await schoolAgent
      .post('/api/v1/subscriptions/school/sponsorships')
      .send({ email: sponsoredEmail });
    expect(duplicate.status).toBe(409);

    const me = await sponsoredAgent.get('/api/v1/subscriptions/me');
    expect(me.body.data.plan).toBe('FREE');
    expect(me.body.data.offers).toHaveLength(1);
    offerId = me.body.data.offers[0].id;

    // Another parent cannot accept an offer made to someone else.
    expect((await freeAgent.post(`/api/v1/subscriptions/offers/${offerId}/accept`)).status).toBe(
      404,
    );

    const accepted = await sponsoredAgent.post(`/api/v1/subscriptions/offers/${offerId}/accept`);
    expect(accepted.status).toBe(200);
    expect(accepted.body.data).toMatchObject({
      plan: 'PRO',
      source: 'SPONSORED',
      maxChildren: 2,
      sponsorship: { schoolName: 'Bright Steps', grantsAccess: true },
    });
  });

  it('sponsorship never exposes child data to the school', async () => {
    const school = await schoolAgent.get('/api/v1/subscriptions/school');
    const body = JSON.stringify(school.body.data);
    expect(body).not.toContain('PrivateChildName');
    expect(Object.keys(school.body.data.sponsorships[0]).sort()).toEqual(
      ['acceptedAt', 'email', 'endedAt', 'endedReason', 'id', 'invitedAt', 'status'].sort(),
    );

    const children = await schoolAgent.get('/api/v1/children');
    expect(children.status).toBe(403);
  });

  it('at most five slots are open at once; withdrawing one frees it', async () => {
    for (const email of extraEmails.slice(0, 4)) {
      const res = await schoolAgent
        .post('/api/v1/subscriptions/school/sponsorships')
        .send({ email });
      expect(res.status).toBe(201);
    }
    const sixth = await schoolAgent
      .post('/api/v1/subscriptions/school/sponsorships')
      .send({ email: extraEmails[4] });
    expect(sixth.status).toBe(403);

    const school = await schoolAgent.get('/api/v1/subscriptions/school');
    expect(school.body.data.slotsUsed).toBe(5);
    const pending = school.body.data.sponsorships.find(
      (s: { email: string }) => s.email === extraEmails[0],
    );
    const withdrawn = await schoolAgent.post(
      `/api/v1/subscriptions/school/sponsorships/${pending.id}/withdraw`,
    );
    expect(withdrawn.status).toBe(200);
    expect(withdrawn.body.data.slotsUsed).toBe(4);
  });

  it("when the school's Business plan expires the sponsored parent falls back to Free, keeping their data", async () => {
    const expired = await adminAgent
      .patch(`/api/v1/admin/subscriptions/${businessSubscriptionId}`)
      .send({ status: 'EXPIRED' });
    expect(expired.status).toBe(200);

    const me = await sponsoredAgent.get('/api/v1/subscriptions/me');
    expect(me.body.data).toMatchObject({
      plan: 'FREE',
      sponsorship: { grantsAccess: false },
    });
    expect(await prisma.child.count({ where: { parent: { email: sponsoredEmail } } })).toBe(1);
  });

  it('the parent can leave a sponsorship', async () => {
    const left = await sponsoredAgent.post('/api/v1/subscriptions/sponsorship/leave');
    expect(left.status).toBe(200);
    expect(left.body.data.sponsorship).toBeNull();
  });
});
