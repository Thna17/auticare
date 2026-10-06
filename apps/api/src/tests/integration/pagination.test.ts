import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
// Random suffix as well as the timestamp: vitest runs test files in parallel
// workers and Parent.email is UNIQUE, so two files starting in the same
// millisecond would otherwise build the same address.
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareTestPassword123';
const parentEmail = `page-parent-${unique}@auticare.test`;
const schoolEmail = `page-school-${unique}@auticare.test`;

const DRAFTS = 25;
const REQUESTED_ENROLLMENTS = 22;
const DECIDED_ENROLLMENTS = 8;
const SUBMITTED = 25;
const LIMIT = 20;

const parentAgent = request.agent(app);
const schoolAgent = request.agent(app);

let schoolId = '';
let schoolUserId = '';
let parentId = '';
let childId = '';

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);
  const school = await prisma.school.create({
    data: {
      name: `Paging School ${unique}`,
      city: 'Phnom Penh',
      address: 'Paging Road 1',
      description: 'Test school',
    },
  });
  schoolId = school.id;

  const schoolUser = await prisma.parent.create({
    data: {
      email: schoolEmail,
      firstName: 'School',
      lastName: 'Pager',
      role: 'SCHOOL',
      passwordHash,
      preference: { create: {} },
    },
  });
  schoolUserId = schoolUser.id;
  await prisma.schoolStaff.create({
    data: { schoolId, parentId: schoolUser.id, title: 'Teacher' },
  });

  const register = await parentAgent.post('/api/v1/auth/register').send({
    email: parentEmail,
    password,
    firstName: 'Paging',
    lastName: 'Parent',
  });
  expect(register.status).toBe(201);
  parentId = register.body.data.parent.id;

  const child = await parentAgent
    .post('/api/v1/children')
    .send({ firstName: 'Paging Child', dateOfBirth: '2021-03-04' });
  expect(child.status).toBe(201);
  childId = child.body.data.id;

  await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });

  // Enough rows on both sides of the status filter that a page cannot hold either
  // set — this is what makes "filtered, then paged" distinguishable from "paged,
  // then filtered".
  await prisma.activityReport.createMany({
    data: Array.from({ length: DRAFTS + SUBMITTED }, (_, index) => ({
      schoolId,
      childId,
      reporterId: schoolUserId,
      activityCategory: 'Social/Emotional',
      title: `Report ${index + 1}`,
      summary: 'Seeded for pagination.',
      activityDate: new Date(2026, 0, index + 1),
      status: index < DRAFTS ? 'DRAFT' : 'SUBMITTED',
    })),
  });

  await prisma.notification.createMany({
    data: Array.from({ length: 30 }, (_, index) => ({
      parentId,
      type: 'SYSTEM' as const,
      title: `Notice ${index + 1}`,
      body: 'Seeded for pagination.',
      status: index < 12 ? ('UNREAD' as const) : ('READ' as const),
    })),
  });

  // School-side enrollment requests, enough of each kind to cross a page
  // boundary. The notification points at its admission request through the bare
  // enrollmentId column — there is no Prisma relation — so the status filter has
  // to resolve the ids first; these rows are what proves it does.
  for (const [status, count] of [
    ['REQUESTED', REQUESTED_ENROLLMENTS],
    ['APPROVED', DECIDED_ENROLLMENTS],
  ] as const) {
    for (let index = 0; index < count; index += 1) {
      const admission = await prisma.admissionRequest.create({
        data: { parentId, schoolId, childId, status, message: `${status} ${index + 1}` },
      });
      await prisma.notification.create({
        data: {
          parentId,
          schoolId,
          type: 'ENROLLMENT_REQUEST',
          title: `${status} request ${index + 1}`,
          body: 'Seeded for pagination.',
          enrollmentId: admission.id,
        },
      });
    }
  }
});

afterAll(async () => {
  if (childId) {
    await prisma.activityReport.deleteMany({ where: { childId } });
    await prisma.schoolChildEnrollment.deleteMany({ where: { childId } });
  }
  if (parentId) {
    await prisma.notification.deleteMany({ where: { parentId } });
    await prisma.admissionRequest.deleteMany({ where: { parentId } });
  }
  await prisma.parent.deleteMany({
    where: { id: { in: [parentId, schoolUserId].filter(Boolean) } },
  });
  if (schoolId) await prisma.school.deleteMany({ where: { id: schoolId } });
  await prisma.$disconnect();
});

describe('pagination meta', () => {
  it('defaults to page 1 with the schema default limit', async () => {
    const res = await schoolAgent.get('/api/v1/schools/reports');
    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: LIMIT });
    expect(res.body.data.reports.length).toBe(LIMIT);
  });

  it('reports totalPages of at least 1 when nothing matches', async () => {
    const res = await schoolAgent.get('/api/v1/schools/reports?childId=does-not-exist');
    expect(res.status).toBe(200);
    expect(res.body.data.reports).toEqual([]);
    // "Page 1 of 0" is what a bare ceil() gives, and it is what a client renders.
    expect(res.body.data.pagination).toMatchObject({ total: 0, totalPages: 1 });
  });

  it('refuses a limit above the cap instead of honouring it', async () => {
    const res = await schoolAgent.get('/api/v1/schools/reports?limit=5000');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('refuses page 0, so the offset can never go negative', async () => {
    const res = await schoolAgent.get('/api/v1/schools/reports?page=0');
    expect(res.status).toBe(400);
  });
});

describe('page boundaries', () => {
  it('neither repeats nor skips a row across consecutive pages', async () => {
    const first = await schoolAgent.get('/api/v1/schools/reports?limit=10&page=1');
    const second = await schoolAgent.get('/api/v1/schools/reports?limit=10&page=2');
    const third = await schoolAgent.get('/api/v1/schools/reports?limit=10&page=3');

    const ids = [first, second, third].flatMap((res) =>
      (res.body.data.reports as { id: string }[]).map((report) => report.id),
    );
    expect(ids.length).toBe(30);
    // An off-by-one in the offset shows up here and almost nowhere else: the
    // page sizes stay right while a row is served twice or missed entirely.
    expect(new Set(ids).size).toBe(30);
  });

  it('serves the remainder on the last page', async () => {
    const total = (await schoolAgent.get('/api/v1/schools/reports')).body.data.pagination.total;
    const lastPage = Math.ceil(total / LIMIT);
    const res = await schoolAgent.get(`/api/v1/schools/reports?page=${lastPage}`);
    expect(res.body.data.reports.length).toBe(total - (lastPage - 1) * LIMIT);
  });

  it('returns an empty page past the end rather than failing', async () => {
    const res = await schoolAgent.get('/api/v1/schools/reports?page=999');
    expect(res.status).toBe(200);
    expect(res.body.data.reports).toEqual([]);
    expect(res.body.data.pagination.total).toBeGreaterThan(0);
  });
});

describe('filters are applied before the page is cut', () => {
  // The PARENT and ADMIN branches of listReports used to fetch every report and
  // filter the array afterwards. Paginating that order is wrong: the page is cut
  // from the unfiltered set and only then thinned, so page 1 of a status filter
  // comes back short — or empty — while matches sit on later pages.
  it('counts only matching rows in the total', async () => {
    const res = await schoolAgent.get('/api/v1/schools/reports?status=DRAFT');
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(DRAFTS);
    expect(res.body.data.pagination.totalPages).toBe(Math.ceil(DRAFTS / LIMIT));
  });

  it('fills the first page entirely with matching rows', async () => {
    const res = await schoolAgent.get('/api/v1/schools/reports?status=DRAFT');
    expect(res.body.data.reports.length).toBe(LIMIT);
    for (const report of res.body.data.reports as { status: string }[]) {
      expect(report.status).toBe('DRAFT');
    }
  });

  it('puts the filtered remainder on the second page', async () => {
    const res = await schoolAgent.get('/api/v1/schools/reports?status=DRAFT&page=2');
    expect(res.body.data.reports.length).toBe(DRAFTS - LIMIT);
    for (const report of res.body.data.reports as { status: string }[]) {
      expect(report.status).toBe('DRAFT');
    }
  });

  it('applies the same filter for a parent, whose branch filtered in memory', async () => {
    const res = await parentAgent.get('/api/v1/schools/reports?status=SUBMITTED');
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(SUBMITTED);
    for (const report of res.body.data.reports as { status: string }[]) {
      expect(report.status).toBe('SUBMITTED');
    }
  });
});

describe('school notification views', () => {
  // These tabs used to narrow the fetched array. PENDING and DECIDED select on
  // the linked admission request's status, which is not a column on Notification
  // — so under paging the browser was filtering 20 rows that had already been cut
  // from the newest end, and "No matches" appeared while matches sat further back.
  it('counts every pending request, not just those on the first page', async () => {
    const res = await schoolAgent.get('/api/v1/schools/notifications?view=PENDING');
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(REQUESTED_ENROLLMENTS);
    expect(res.body.data.notifications.length).toBe(LIMIT);
    for (const item of res.body.data.notifications as { admissionStatus: string }[]) {
      expect(item.admissionStatus).toBe('REQUESTED');
    }
  });

  it('serves the pending remainder on the second page', async () => {
    const res = await schoolAgent.get('/api/v1/schools/notifications?view=PENDING&page=2');
    expect(res.body.data.notifications.length).toBe(REQUESTED_ENROLLMENTS - LIMIT);
    for (const item of res.body.data.notifications as { admissionStatus: string }[]) {
      expect(item.admissionStatus).toBe('REQUESTED');
    }
  });

  it('separates decided requests from pending ones', async () => {
    const res = await schoolAgent.get('/api/v1/schools/notifications?view=DECIDED');
    expect(res.body.data.pagination.total).toBe(DECIDED_ENROLLMENTS);
    for (const item of res.body.data.notifications as { admissionStatus: string }[]) {
      expect(['APPROVED', 'REJECTED']).toContain(item.admissionStatus);
    }
  });

  it('rejects a view the UI does not offer', async () => {
    const res = await schoolAgent.get('/api/v1/schools/notifications?view=SOMETHING');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('parent notifications', () => {
  it('pages the list and keeps the newest first within a page', async () => {
    const res = await parentAgent.get('/api/v1/parents/notifications?limit=10');
    expect(res.status).toBe(200);
    expect(res.body.data.notifications.length).toBe(10);
    const dates = (res.body.data.notifications as { createdAt: string }[]).map((item) =>
      Date.parse(item.createdAt),
    );
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it('counts unread across every page, not just the fetched one', async () => {
    const res = await parentAgent.get('/api/v1/parents/notifications?isRead=false&limit=5');

    // 12 unread SYSTEM notices, plus all 30 enrollment-request notifications.
    //
    // Those 30 are addressed to the school, but listNotificationsForParent keys
    // on parentId alone and parentId is the *sender* on a school-bound row — so
    // they appear in the parent's own list too. That is pre-existing behaviour,
    // not something paging introduced, and it is asserted here rather than
    // quietly worked around: the parent page does render ENROLLMENT_REQUEST, so
    // it may well be deliberate, but it is worth a decision either way.
    const unread = 12 + REQUESTED_ENROLLMENTS + DECIDED_ENROLLMENTS;
    expect(res.body.data.pagination.total).toBe(unread);

    // The point of the test: a count taken from the rows on screen would say 5.
    expect(res.body.data.notifications.length).toBe(5);
    for (const item of res.body.data.notifications as { status: string }[]) {
      expect(item.status).toBe('UNREAD');
    }
  });
});
