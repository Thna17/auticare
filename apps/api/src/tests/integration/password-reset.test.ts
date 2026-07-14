import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';

const app = createApp();
const unique = Date.now();
const email = `reset-${unique}@auticare.test`;
const originalPassword = 'AutiCareOriginalPassword123';
const nextPassword = 'AutiCareNextPassword123';
const createdParentIds: string[] = [];

afterAll(async () => {
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  await prisma.$disconnect();
});

describe('password reset', () => {
  it('creates a reset token, updates the password, and rejects token reuse', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      email,
      password: originalPassword,
      firstName: 'Reset',
      lastName: 'Parent',
    });
    expect(registerResponse.status).toBe(201);
    createdParentIds.push(registerResponse.body.data.parent.id);

    const forgotResponse = await request(app).post('/api/v1/auth/forgot-password').send({ email });
    expect(forgotResponse.status).toBe(200);
    expect(forgotResponse.body.data.message).toContain('If an account exists');
    expect(forgotResponse.body.data.resetToken).toBeTruthy();

    const resetResponse = await request(app).post('/api/v1/auth/reset-password').send({
      token: forgotResponse.body.data.resetToken,
      password: nextPassword,
    });
    expect(resetResponse.status).toBe(200);

    const reusedTokenResponse = await request(app).post('/api/v1/auth/reset-password').send({
      token: forgotResponse.body.data.resetToken,
      password: 'AnotherPassword123',
    });
    expect(reusedTokenResponse.status).toBe(400);
    expect(reusedTokenResponse.body.error.code).toBe('VALIDATION_ERROR');

    const oldLoginResponse = await request(app).post('/api/v1/auth/login').send({
      email,
      password: originalPassword,
    });
    expect(oldLoginResponse.status).toBe(401);

    const newLoginResponse = await request(app).post('/api/v1/auth/login').send({
      email,
      password: nextPassword,
    });
    expect(newLoginResponse.status).toBe(200);
    expect(newLoginResponse.body.data.parent.email).toBe(email);
  });

  it('returns the same response shape for unknown emails', async () => {
    const forgotResponse = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: `missing-${unique}@auticare.test` });
    expect(forgotResponse.status).toBe(200);
    expect(forgotResponse.body.data.message).toContain('If an account exists');
    expect(forgotResponse.body.data.resetToken).toBeUndefined();
  });
});
