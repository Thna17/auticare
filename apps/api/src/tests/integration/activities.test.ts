import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';
import { ageInMonths } from '../../modules/activities/activities.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareActivitiesPassword123';
const ownerEmail = `act-owner-${unique}@auticare.test`;
const otherEmail = `act-other-${unique}@auticare.test`;
const schoolEmail = `act-school-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdChildIds: string[] = [];
const createdActivityIds: string[] = [];

let ownerAgent: request.Agent;
let otherAgent: request.Agent;
let schoolAgent: request.Agent;
let toddlerChildId = '';
let olderChildId = '';
let archivedChildId = '';
let toddlerActivityId = '';
let olderActivityId = '';
let progressId = '';

/** A date exactly `months` whole months before now, in UTC. */
const monthsAgo = (months: number): Date => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, now.getUTCDate(), 12, 0, 0),
  );
};

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
  createdParentIds.push(owner.id, other.id, school.id);

  // 24 months old, 60 months old, plus an archived child.
  const [toddler, older, archived] = await Promise.all([
    prisma.child.create({
      data: { parentId: owner.id, firstName: 'Toddler', dateOfBirth: monthsAgo(24) },
    }),
    prisma.child.create({
      data: { parentId: owner.id, firstName: 'Older', dateOfBirth: monthsAgo(60) },
    }),
    prisma.child.create({
      data: {
        parentId: owner.id,
        firstName: 'Archived',
        dateOfBirth: monthsAgo(30),
        archivedAt: new Date(),
      },
    }),
  ]);
  toddlerChildId = toddler.id;
  olderChildId = older.id;
  archivedChildId = archived.id;
  createdChildIds.push(toddler.id, older.id, archived.id);

  // Two catalogue entries with non-overlapping age ranges, so age filtering is
  // observable rather than inferred.
  const toddlerActivity = await prisma.activity.create({
    data: {
      title: `Toddler activity ${unique}`,
      category: 'test-motor',
      minAgeMonths: 18,
      maxAgeMonths: 36,
      summary: 'Suits a two-year-old.',
    },
  });
  const olderActivity = await prisma.activity.create({
    data: {
      title: `Older activity ${unique}`,
      category: 'test-social',
      minAgeMonths: 48,
      maxAgeMonths: 84,
      summary: 'Suits a five-year-old.',
    },
  });
  toddlerActivityId = toddlerActivity.id;
  olderActivityId = olderActivity.id;
  createdActivityIds.push(toddlerActivity.id, olderActivity.id);

  ownerAgent = request.agent(app);
  otherAgent = request.agent(app);
  schoolAgent = request.agent(app);
  await ownerAgent.post('/api/v1/auth/login').send({ email: ownerEmail, password });
  await otherAgent.post('/api/v1/auth/login').send({ email: otherEmail, password });
  await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });
});

afterAll(async () => {
  await prisma.activityProgress.deleteMany({ where: { childId: { in: createdChildIds } } });
  await prisma.activity.deleteMany({ where: { id: { in: createdActivityIds } } });
  await prisma.child.deleteMany({ where: { id: { in: createdChildIds } } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
});

const titles = (rows: unknown[]): string[] => rows.map((row) => (row as { title: string }).title);

describe('ageInMonths', () => {
  it('counts whole months and does not round up before the day of the month', () => {
    const at = new Date(Date.UTC(2026, 5, 10));
    // Same day of month: a clean 12 months.
    expect(ageInMonths(new Date(Date.UTC(2025, 5, 10)), at)).toBe(12);
    // One day short of the day-of-month: still 11, not 12.
    expect(ageInMonths(new Date(Date.UTC(2025, 5, 11)), at)).toBe(11);
    // Never negative for a date in the future.
    expect(ageInMonths(new Date(Date.UTC(2027, 0, 1)), at)).toBe(0);
  });
});

describe('activity catalogue', () => {
  it('returns the whole catalogue without a childId', async () => {
    const res = await ownerAgent.get('/api/v1/activities');
    expect(res.status).toBe(200);
    const listed = titles(res.body.data);
    expect(listed).toContain(`Toddler activity ${unique}`);
    expect(listed).toContain(`Older activity ${unique}`);
  });

  it('narrows the catalogue to the child’s age in months', async () => {
    const toddler = await ownerAgent.get(`/api/v1/activities?childId=${toddlerChildId}`);
    expect(toddler.status).toBe(200);
    expect(titles(toddler.body.data)).toContain(`Toddler activity ${unique}`);
    expect(titles(toddler.body.data)).not.toContain(`Older activity ${unique}`);

    const older = await ownerAgent.get(`/api/v1/activities?childId=${olderChildId}`);
    expect(titles(older.body.data)).toContain(`Older activity ${unique}`);
    expect(titles(older.body.data)).not.toContain(`Toddler activity ${unique}`);
  });

  it('filters by category', async () => {
    const res = await ownerAgent.get('/api/v1/activities?category=test-social');
    expect(res.status).toBe(200);
    expect(titles(res.body.data)).toEqual([`Older activity ${unique}`]);
  });

  it('refuses a child that belongs to another parent', async () => {
    const res = await otherAgent.get(`/api/v1/activities?childId=${toddlerChildId}`);
    expect(res.status).toBe(404);
  });

  it('refuses an archived child, like the rest of the app', async () => {
    const res = await ownerAgent.get(`/api/v1/activities?childId=${archivedChildId}`);
    expect(res.status).toBe(404);
  });

  it('refuses a non-parent role', async () => {
    const res = await schoolAgent.get('/api/v1/activities');
    expect(res.status).toBe(403);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/activities');
    expect(res.status).toBe(401);
  });
});

describe('activity progress', () => {
  it('starts an activity for the caller’s own child', async () => {
    const res = await ownerAgent
      .post(`/api/v1/activities/${toddlerActivityId}/start`)
      .send({ childId: toddlerChildId });

    expect(res.status).toBe(201);
    expect(res.body.data.activityId).toBe(toddlerActivityId);
    expect(res.body.data.activityTitle).toBe(`Toddler activity ${unique}`);
    expect(res.body.data.completedAt).toBeNull();
    progressId = res.body.data.id;
  });

  it('is idempotent — starting twice does not duplicate the history', async () => {
    const again = await ownerAgent
      .post(`/api/v1/activities/${toddlerActivityId}/start`)
      .send({ childId: toddlerChildId });

    expect(again.status).toBe(201);
    expect(again.body.data.id).toBe(progressId);

    const rows = await prisma.activityProgress.count({
      where: { childId: toddlerChildId, activityId: toddlerActivityId },
    });
    expect(rows).toBe(1);
  });

  it('marks progress complete, then lets it be undone', async () => {
    const done = await ownerAgent
      .patch(`/api/v1/activities/progress/${progressId}`)
      .send({ completed: true });
    expect(done.status).toBe(200);
    expect(done.body.data.completedAt).not.toBeNull();

    const undone = await ownerAgent
      .patch(`/api/v1/activities/progress/${progressId}`)
      .send({ completed: false });
    expect(undone.status).toBe(200);
    expect(undone.body.data.completedAt).toBeNull();
  });

  it('records the parent’s own note', async () => {
    const res = await ownerAgent
      .patch(`/api/v1/activities/progress/${progressId}`)
      .send({ parentObservation: 'He stayed with it for ten minutes.' });
    expect(res.status).toBe(200);
    expect(res.body.data.parentObservation).toBe('He stayed with it for ten minutes.');
  });

  it('rejects an empty update', async () => {
    const res = await ownerAgent.patch(`/api/v1/activities/progress/${progressId}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('lists progress for the child, newest first', async () => {
    await ownerAgent
      .post(`/api/v1/activities/${olderActivityId}/start`)
      .send({ childId: toddlerChildId });

    const res = await ownerAgent.get(`/api/v1/activities/progress?childId=${toddlerChildId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    const started = (res.body.data as { startedAt: string }[]).map((r) => Date.parse(r.startedAt));
    expect(started).toEqual([...started].sort((a, b) => b - a));
  });

  it('does not let another parent read a child’s progress', async () => {
    const res = await otherAgent.get(`/api/v1/activities/progress?childId=${toddlerChildId}`);
    expect(res.status).toBe(404);
  });

  it('does not let another parent update a progress row by guessing its id', async () => {
    const res = await otherAgent
      .patch(`/api/v1/activities/progress/${progressId}`)
      .send({ completed: true });
    expect(res.status).toBe(404);

    const row = await prisma.activityProgress.findUnique({ where: { id: progressId } });
    expect(row?.completedAt).toBeNull();
  });

  it('refuses to start an activity for someone else’s child', async () => {
    const res = await otherAgent
      .post(`/api/v1/activities/${toddlerActivityId}/start`)
      .send({ childId: toddlerChildId });
    expect(res.status).toBe(404);
  });

  it('404s for an activity that does not exist', async () => {
    const res = await ownerAgent
      .post('/api/v1/activities/does-not-exist/start')
      .send({ childId: toddlerChildId });
    expect(res.status).toBe(404);
  });

  it('requires childId when listing progress', async () => {
    const res = await ownerAgent.get('/api/v1/activities/progress');
    expect(res.status).toBe(400);
  });
});
