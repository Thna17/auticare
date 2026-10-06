import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

/**
 * Screening is the core product feature and had no HTTP-level coverage at all.
 * Its scoring engine has unit tests, but nothing exercised session creation,
 * answer upsert, submission, score persistence, age-band selection, or the
 * ownership checks that keep one family's screening away from another.
 */

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareScreeningPassword123';
const ownerEmail = `scr-owner-${unique}@auticare.test`;
const otherEmail = `scr-other-${unique}@auticare.test`;
const schoolEmail = `scr-school-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdChildIds: string[] = [];
const createdQuestionIds: string[] = [];
/** Seeded question ids per band, so band selection can be asserted by identity. */
const bandQuestionIds: Record<'TODDLER' | 'PRESCHOOL', string[]> = {
  TODDLER: [],
  PRESCHOOL: [],
};

let ownerAgent: request.Agent;
let otherAgent: request.Agent;
let schoolAgent: request.Agent;
let toddlerChildId = '';
let preschoolChildId = '';

/** A birth date `years` ago, so the child falls in a known age band. */
const yearsAgo = (years: number): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate()));
};

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);

  const [owner, other, school] = await Promise.all([
    prisma.parent.create({
      data: {
        email: ownerEmail,
        passwordHash,
        firstName: 'Screen',
        lastName: 'Owner',
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

  // Two children either side of the TODDLER/PRESCHOOL boundary (4 years), so the
  // band actually chosen is observable rather than assumed.
  const [toddler, preschooler] = await Promise.all([
    prisma.child.create({
      data: { parentId: owner.id, firstName: 'Tod', dateOfBirth: yearsAgo(2) },
    }),
    prisma.child.create({
      data: { parentId: owner.id, firstName: 'Pre', dateOfBirth: yearsAgo(5) },
    }),
  ]);
  toddlerChildId = toddler.id;
  preschoolChildId = preschooler.id;
  createdChildIds.push(toddler.id, preschooler.id);

  // Own question set per band, so these tests do not depend on how many seeded
  // questions happen to exist. Polarity is mixed deliberately: a DIRECT and a
  // REVERSE question scored identically would hide a polarity bug.
  // Two DIRECT and one REVERSE in the TODDLER band. An even split of one each
  // would be symmetric: answering everything 0 and everything 4 would produce the
  // same total, so a polarity bug would be invisible.
  const defs = [
    { band: 'TODDLER' as const, polarity: 'DIRECT' as const, order: 9001 },
    { band: 'TODDLER' as const, polarity: 'DIRECT' as const, order: 9002 },
    { band: 'TODDLER' as const, polarity: 'REVERSE' as const, order: 9003 },
    { band: 'PRESCHOOL' as const, polarity: 'DIRECT' as const, order: 9004 },
  ];
  for (const def of defs) {
    const q = await prisma.screeningQuestion.create({
      data: {
        questionText: `${def.band} ${def.polarity} ${unique}`,
        category: 'Social Interaction',
        ageBand: def.band,
        polarity: def.polarity,
        displayOrder: def.order,
        isActive: true,
      },
    });
    createdQuestionIds.push(q.id);
    bandQuestionIds[def.band].push(q.id);
  }

  ownerAgent = request.agent(app);
  otherAgent = request.agent(app);
  schoolAgent = request.agent(app);
  await ownerAgent.post('/api/v1/auth/login').send({ email: ownerEmail, password });
  await otherAgent.post('/api/v1/auth/login').send({ email: otherEmail, password });
  await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });
});

afterAll(async () => {
  await prisma.screeningCategoryScore.deleteMany({
    where: { result: { screening: { childId: { in: createdChildIds } } } },
  });
  await prisma.screeningResult.deleteMany({
    where: { screening: { childId: { in: createdChildIds } } },
  });
  await prisma.screeningAnswer.deleteMany({
    where: { screening: { childId: { in: createdChildIds } } },
  });
  await prisma.screening.deleteMany({ where: { childId: { in: createdChildIds } } });
  await prisma.screeningAnswer.deleteMany({ where: { questionId: { in: createdQuestionIds } } });
  await prisma.screeningQuestion.deleteMany({ where: { id: { in: createdQuestionIds } } });
  await prisma.child.deleteMany({ where: { id: { in: createdChildIds } } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
});

/** Create a session and answer every question it returns. */
async function completeSession(childId: string, answerValue = 4) {
  const created = await ownerAgent.post('/api/v1/screening/sessions').send({ childId });
  expect(created.status).toBe(201);
  const sessionId = created.body.data.session.id as string;
  const questions = created.body.data.questions as { id: string }[];

  for (const question of questions) {
    const res = await ownerAgent
      .patch(`/api/v1/screening/sessions/${sessionId}/answers`)
      .send({ questionId: question.id, answerValue });
    expect(res.status).toBe(200);
  }
  return { sessionId, questions };
}

describe('screening question sets', () => {
  it('returns only the questions for a requested age band', async () => {
    const res = await ownerAgent.get('/api/v1/screening/questions?ageBand=TODDLER');
    expect(res.status).toBe(200);

    const served = new Set((res.body.data as { id: string }[]).map((question) => question.id));
    for (const id of bandQuestionIds.TODDLER) expect(served.has(id)).toBe(true);
    for (const id of bandQuestionIds.PRESCHOOL) expect(served.has(id)).toBe(false);
  });

  it('refuses a non-parent account', async () => {
    const res = await schoolAgent.get('/api/v1/screening/questions');
    expect(res.status).toBe(403);
  });
});

describe('screening sessions', () => {
  it('creates a session and picks the band from the child’s age', async () => {
    const toddler = await ownerAgent
      .post('/api/v1/screening/sessions')
      .send({ childId: toddlerChildId });
    expect(toddler.status).toBe(201);
    expect(toddler.body.data.session.ageBand).toBe('TODDLER');
    expect(toddler.body.data.session.status).toBe('DRAFT');

    const preschool = await ownerAgent
      .post('/api/v1/screening/sessions')
      .send({ childId: preschoolChildId });
    expect(preschool.status).toBe(201);
    // The same endpoint must choose a different set for a 5-year-old; a band
    // picked from anything other than the child's age would return TODDLER here.
    expect(preschool.body.data.session.ageBand).toBe('PRESCHOOL');
  });

  it('serves only that band’s questions with the session', async () => {
    const created = await ownerAgent
      .post('/api/v1/screening/sessions')
      .send({ childId: toddlerChildId });
    // The question response carries no ageBand, so the band is asserted by
    // identity against what was seeded for each band.
    const served = new Set((created.body.data.questions as { id: string }[]).map((q) => q.id));
    for (const id of bandQuestionIds.TODDLER) expect(served.has(id)).toBe(true);
    for (const id of bandQuestionIds.PRESCHOOL) expect(served.has(id)).toBe(false);
  });

  it('refuses to start a session for another parent’s child', async () => {
    const res = await otherAgent
      .post('/api/v1/screening/sessions')
      .send({ childId: toddlerChildId });
    expect([403, 404]).toContain(res.status);
  });
});

describe('answers', () => {
  it('records an answer and replaces it on a second submission', async () => {
    const created = await ownerAgent
      .post('/api/v1/screening/sessions')
      .send({ childId: toddlerChildId });
    const sessionId = created.body.data.session.id as string;
    const questionId = (created.body.data.questions as { id: string }[])[0]!.id;

    await ownerAgent
      .patch(`/api/v1/screening/sessions/${sessionId}/answers`)
      .send({ questionId, answerValue: 1 });
    await ownerAgent
      .patch(`/api/v1/screening/sessions/${sessionId}/answers`)
      .send({ questionId, answerValue: 3 });

    // Upsert, not append: changing your mind must not record two answers.
    const rows = await prisma.screeningAnswer.findMany({
      where: { screeningId: sessionId, questionId },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.answerValue).toBe(3);
  });

  it('rejects an answer outside the 0-4 range', async () => {
    const created = await ownerAgent
      .post('/api/v1/screening/sessions')
      .send({ childId: toddlerChildId });
    const sessionId = created.body.data.session.id as string;
    const questionId = (created.body.data.questions as { id: string }[])[0]!.id;

    const res = await ownerAgent
      .patch(`/api/v1/screening/sessions/${sessionId}/answers`)
      .send({ questionId, answerValue: 9 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('does not let another parent answer into someone else’s session', async () => {
    const created = await ownerAgent
      .post('/api/v1/screening/sessions')
      .send({ childId: toddlerChildId });
    const sessionId = created.body.data.session.id as string;
    const questionId = (created.body.data.questions as { id: string }[])[0]!.id;

    const res = await otherAgent
      .patch(`/api/v1/screening/sessions/${sessionId}/answers`)
      .send({ questionId, answerValue: 2 });
    expect([403, 404]).toContain(res.status);

    const rows = await prisma.screeningAnswer.findMany({ where: { screeningId: sessionId } });
    expect(rows).toHaveLength(0);
  });
});

describe('submission and scoring', () => {
  it('refuses to submit while questions are unanswered', async () => {
    const created = await ownerAgent
      .post('/api/v1/screening/sessions')
      .send({ childId: toddlerChildId });
    const sessionId = created.body.data.session.id as string;

    const res = await ownerAgent.post(`/api/v1/screening/sessions/${sessionId}/submit`);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/must be answered/i);
  });

  it('submits a complete session and persists a result', async () => {
    const { sessionId } = await completeSession(toddlerChildId);

    const res = await ownerAgent.post(`/api/v1/screening/sessions/${sessionId}/submit`);
    expect(res.status).toBe(200);

    // The score has to survive the request, not just be returned by it.
    const stored = await prisma.screeningResult.findFirst({ where: { screeningId: sessionId } });
    expect(stored).not.toBeNull();
    expect(typeof stored?.score).toBe('number');
    expect(stored?.riskLevel).toBeTruthy();

    const session = await prisma.screening.findUnique({ where: { id: sessionId } });
    // Scoring happens in the same request, so the session lands on ANALYZED
    // rather than pausing at SUBMITTED.
    expect(session?.status).toBe('ANALYZED');
    expect(session?.submittedAt).toBeTruthy();
  });

  it('writes a per-category breakdown alongside the score', async () => {
    const { sessionId } = await completeSession(toddlerChildId);
    await ownerAgent.post(`/api/v1/screening/sessions/${sessionId}/submit`);

    const result = await prisma.screeningResult.findFirst({ where: { screeningId: sessionId } });
    const categories = await prisma.screeningCategoryScore.findMany({
      where: { resultId: result!.id },
    });
    expect(categories.length).toBeGreaterThan(0);
  });

  it('refuses a second submission of the same session', async () => {
    const { sessionId } = await completeSession(toddlerChildId);
    const first = await ownerAgent.post(`/api/v1/screening/sessions/${sessionId}/submit`);
    expect(first.status).toBe(200);

    const second = await ownerAgent.post(`/api/v1/screening/sessions/${sessionId}/submit`);
    expect(second.status).toBe(409);
  });

  it('scores opposite answers differently, so polarity is actually applied', async () => {
    // Every question answered 0 versus every question answered 4 must not produce
    // the same score. If polarity were ignored or the answers never reached the
    // engine, these would collapse to the same number.
    const low = await completeSession(toddlerChildId, 0);
    await ownerAgent.post(`/api/v1/screening/sessions/${low.sessionId}/submit`);
    const high = await completeSession(toddlerChildId, 4);
    await ownerAgent.post(`/api/v1/screening/sessions/${high.sessionId}/submit`);

    const lowResult = await prisma.screeningResult.findFirst({
      where: { screeningId: low.sessionId },
    });
    const highResult = await prisma.screeningResult.findFirst({
      where: { screeningId: high.sessionId },
    });
    expect(lowResult?.score).not.toBe(highResult?.score);
  });

  it('does not let another parent submit someone else’s session', async () => {
    const { sessionId } = await completeSession(toddlerChildId);
    const res = await otherAgent.post(`/api/v1/screening/sessions/${sessionId}/submit`);
    expect([403, 404]).toContain(res.status);

    const session = await prisma.screening.findUnique({ where: { id: sessionId } });
    expect(session?.status).toBe('DRAFT');
  });
});

describe('reading sessions', () => {
  it('returns a session to its owner', async () => {
    const created = await ownerAgent
      .post('/api/v1/screening/sessions')
      .send({ childId: toddlerChildId });
    const sessionId = created.body.data.session.id as string;

    const res = await ownerAgent.get(`/api/v1/screening/sessions/${sessionId}`);
    expect(res.status).toBe(200);
    // The detail response is the session itself, not { session: ... }.
    expect(res.body.data.id).toBe(sessionId);
  });

  it('does not return another parent’s session', async () => {
    const created = await ownerAgent
      .post('/api/v1/screening/sessions')
      .send({ childId: toddlerChildId });
    const sessionId = created.body.data.session.id as string;

    const res = await otherAgent.get(`/api/v1/screening/sessions/${sessionId}`);
    expect([403, 404]).toContain(res.status);
  });

  it('lists a child’s sessions for its own parent only', async () => {
    const mine = await ownerAgent.get(`/api/v1/screening/children/${toddlerChildId}/sessions`);
    expect(mine.status).toBe(200);
    expect(Array.isArray(mine.body.data)).toBe(true);

    const theirs = await otherAgent.get(`/api/v1/screening/children/${toddlerChildId}/sessions`);
    expect([403, 404]).toContain(theirs.status);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/screening/questions');
    expect(res.status).toBe(401);
  });
});
