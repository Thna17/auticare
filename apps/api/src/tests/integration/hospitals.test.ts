import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = Date.now();
const password = 'AutiCareHospitalPassword123';
const parentEmail = `hospital-parent-${unique}@auticare.test`;
const adminEmail = `hospital-admin-${unique}@auticare.test`;
const createdParentIds: string[] = [];
const createdHospitalIds: string[] = [];

afterAll(async () => {
  await prisma.hospital.deleteMany({ where: { id: { in: createdHospitalIds } } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  await prisma.$disconnect();
});

describe('hospital directory authorization', () => {
  it('allows parents to browse hospitals but only administrators can create them', async () => {
    const parentAgent = request.agent(app);
    const registerResponse = await parentAgent.post('/api/v1/auth/register').send({
      email: parentEmail,
      password,
      firstName: 'Hospital',
      lastName: 'Parent',
    });
    createdParentIds.push(registerResponse.body.data.parent.id);

    const admin = await prisma.parent.create({
      data: {
        email: adminEmail,
        passwordHash: await passwordService.hash(password),
        firstName: 'Hospital',
        lastName: 'Admin',
        role: 'ADMIN',
        preference: { create: {} },
      },
    });
    createdParentIds.push(admin.id);

    const listResponse = await parentAgent.get('/api/v1/hospitals');
    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.data)).toBe(true);

    const hospitalInput = {
      name: `Care Centre ${unique}`,
      city: 'Phnom Penh',
      address: '123 Support Road',
      services: 'Occupational therapy and developmental pediatrics',
    };
    const parentCreateResponse = await parentAgent.post('/api/v1/hospitals').send(hospitalInput);
    expect(parentCreateResponse.status).toBe(403);

    const adminAgent = request.agent(app);
    const loginResponse = await adminAgent
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password });
    expect(loginResponse.status).toBe(200);

    const adminCreateResponse = await adminAgent.post('/api/v1/hospitals').send(hospitalInput);
    expect(adminCreateResponse.status).toBe(201);
    expect(adminCreateResponse.body.data.name).toBe(hospitalInput.name);
    createdHospitalIds.push(adminCreateResponse.body.data.id);
  });
});
