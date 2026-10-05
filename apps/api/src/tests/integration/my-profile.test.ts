import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareProfilePassword123';
const parentEmail = `profile-parent-${unique}@auticare.test`;
const otherEmail = `profile-other-${unique}@auticare.test`;
const schoolEmail = `profile-school-${unique}@auticare.test`;

const createdParentIds: string[] = [];
let parentAgent: request.Agent;
let schoolAgent: request.Agent;
let parentId = '';
let otherId = '';

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);
  const [parent, other, school] = await Promise.all([
    prisma.parent.create({
      data: {
        email: parentEmail,
        passwordHash,
        firstName: 'Original',
        lastName: 'Name',
        role: 'PARENT',
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: otherEmail,
        passwordHash,
        firstName: 'Other',
        lastName: 'Person',
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
  parentId = parent.id;
  otherId = other.id;
  createdParentIds.push(parent.id, other.id, school.id);

  parentAgent = request.agent(app);
  schoolAgent = request.agent(app);
  await parentAgent.post('/api/v1/auth/login').send({ email: parentEmail, password });
  await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });
});

afterAll(async () => {
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
});

describe('PATCH /auth/me', () => {
  it('updates the signed-in account holder’s own name', async () => {
    const res = await parentAgent
      .patch('/api/v1/auth/me')
      .send({ firstName: 'Updated', lastName: 'Parent' });

    expect(res.status).toBe(200);
    expect(res.body.data.parent.firstName).toBe('Updated');
    expect(res.body.data.parent.lastName).toBe('Parent');

    // Persisted, not just echoed.
    const reread = await parentAgent.get('/api/v1/auth/me');
    expect(reread.body.data.parent.firstName).toBe('Updated');
  });

  it('sets and then clears the optional contact fields', async () => {
    const set = await parentAgent
      .patch('/api/v1/auth/me')
      .send({ phoneNumber: '+855 12 345 678', socialMediaAccount: '@carer' });
    expect(set.status).toBe(200);
    expect(set.body.data.parent.phoneNumber).toBe('+855 12 345 678');
    expect(set.body.data.parent.socialMediaAccount).toBe('@carer');

    // null clears; an empty string would store an empty string instead.
    const cleared = await parentAgent
      .patch('/api/v1/auth/me')
      .send({ phoneNumber: null, socialMediaAccount: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.data.parent.phoneNumber).toBeNull();
    expect(cleared.body.data.parent.socialMediaAccount).toBeNull();
  });

  it('accepts a partial update without disturbing the other fields', async () => {
    await parentAgent.patch('/api/v1/auth/me').send({ phoneNumber: '+855 99 888 777' });
    const res = await parentAgent.patch('/api/v1/auth/me').send({ firstName: 'Solo' });

    expect(res.status).toBe(200);
    expect(res.body.data.parent.firstName).toBe('Solo');
    expect(res.body.data.parent.phoneNumber).toBe('+855 99 888 777');
  });

  it('rejects an empty body rather than performing a no-op write', async () => {
    const res = await parentAgent.patch('/api/v1/auth/me').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a blank name', async () => {
    const res = await parentAgent.patch('/api/v1/auth/me').send({ firstName: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an over-long value', async () => {
    const res = await parentAgent.patch('/api/v1/auth/me').send({ lastName: 'x'.repeat(81) });
    expect(res.status).toBe(400);
  });

  it('ignores attempts to change email, role or password', async () => {
    const res = await parentAgent.patch('/api/v1/auth/me').send({
      firstName: 'Legit',
      email: 'attacker@evil.test',
      role: 'ADMIN',
      passwordHash: 'nope',
    });

    expect(res.status).toBe(200);
    // The accepted field applied; the privileged ones are not in the schema, so
    // zod strips them and they never reach the update.
    expect(res.body.data.parent.firstName).toBe('Legit');
    expect(res.body.data.parent.email).toBe(parentEmail);
    expect(res.body.data.parent.role).toBe('PARENT');

    const row = await prisma.parent.findUnique({ where: { id: parentId } });
    expect(row?.email).toBe(parentEmail);
    expect(row?.role).toBe('PARENT');
    expect(row?.passwordHash).not.toBe('nope');
  });

  it('cannot touch another account, because the id comes from the session', async () => {
    const before = await prisma.parent.findUnique({ where: { id: otherId } });

    const res = await parentAgent
      .patch('/api/v1/auth/me')
      .send({ firstName: 'Hijacked', id: otherId, parentId: otherId });
    expect(res.status).toBe(200);

    const after = await prisma.parent.findUnique({ where: { id: otherId } });
    expect(after?.firstName).toBe(before?.firstName);
    expect(after?.firstName).not.toBe('Hijacked');
  });

  it('works for a non-PARENT role — every user is an account holder', async () => {
    const res = await schoolAgent.patch('/api/v1/auth/me').send({ firstName: 'Staffer' });
    expect(res.status).toBe(200);
    expect(res.body.data.parent.firstName).toBe('Staffer');
    expect(res.body.data.parent.role).toBe('SCHOOL');
  });

  it('requires authentication', async () => {
    const res = await request(app).patch('/api/v1/auth/me').send({ firstName: 'Nobody' });
    expect(res.status).toBe(401);
  });

  it('exposes the contact fields on GET /auth/me too', async () => {
    await parentAgent.patch('/api/v1/auth/me').send({ phoneNumber: '+855 11 222 333' });
    const res = await parentAgent.get('/api/v1/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.data.parent).toHaveProperty('phoneNumber', '+855 11 222 333');
    expect(res.body.data.parent).toHaveProperty('socialMediaAccount');
  });
});
