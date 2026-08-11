import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = Date.now();
const password = 'AutiCareTestPassword123';

const schoolAEmail = `school-a-${unique}@auticare.test`;
const schoolBEmail = `school-b-${unique}@auticare.test`;
const parentEmail = `school-parent-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdSchoolIds: string[] = [];
let schoolAId = '';
let schoolBId = '';

// Agents are logged in once (in beforeAll) and reused, to stay under the auth
// login rate limit shared across the whole integration suite.
let schoolA: ReturnType<typeof request.agent>;
let schoolB: ReturnType<typeof request.agent>;
let parent: ReturnType<typeof request.agent>;

// The complete set of fields the public detail endpoint is allowed to expose.
const publicSchoolFields = [
  'id',
  'name',
  'city',
  'address',
  'description',
  'logoUrl',
  'coverImageUrl',
  'availabilityStatus',
  'waitlistEstimate',
  'studentTeacherRatio',
  'specializations',
  'isVerified',
  'rating',
  'reviewCount',
  'createdAt',
  'updatedAt',
  'email',
  'website',
  'admissionRequirements',
  'operatingHours',
  'facilities',
];

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);
  const [a, b] = await Promise.all([
    prisma.school.create({
      data: { name: `School A ${unique}`, city: 'Testville', address: '1 A Street' },
    }),
    prisma.school.create({
      data: { name: `School B ${unique}`, city: 'Testville', address: '1 B Street' },
    }),
  ]);
  schoolAId = a.id;
  schoolBId = b.id;
  createdSchoolIds.push(a.id, b.id);

  const [aAccount, bAccount, parentAccount] = await Promise.all([
    prisma.parent.create({
      data: {
        email: schoolAEmail,
        firstName: 'School',
        lastName: 'A',
        role: 'SCHOOL',
        passwordHash,
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: schoolBEmail,
        firstName: 'School',
        lastName: 'B',
        role: 'SCHOOL',
        passwordHash,
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: parentEmail,
        firstName: 'Regular',
        lastName: 'Parent',
        role: 'PARENT',
        passwordHash,
        preference: { create: {} },
      },
    }),
  ]);
  createdParentIds.push(aAccount.id, bAccount.id, parentAccount.id);

  await Promise.all([
    prisma.schoolStaff.create({ data: { parentId: aAccount.id, schoolId: a.id } }),
    prisma.schoolStaff.create({ data: { parentId: bAccount.id, schoolId: b.id } }),
  ]);

  schoolA = request.agent(app);
  schoolB = request.agent(app);
  parent = request.agent(app);
  await schoolA.post('/api/v1/auth/login').send({ email: schoolAEmail, password });
  await schoolB.post('/api/v1/auth/login').send({ email: schoolBEmail, password });
  await parent.post('/api/v1/auth/login').send({ email: parentEmail, password });
});

afterAll(async () => {
  await prisma.school.deleteMany({ where: { id: { in: createdSchoolIds } } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  await prisma.$disconnect();
});

describe('school profile access control', () => {
  it('scopes GET/PATCH /schools/me to the caller’s own record', async () => {
    const aMe = await schoolA.get('/api/v1/schools/me');
    expect(aMe.status).toBe(200);
    expect(aMe.body.data.id).toBe(schoolAId);

    const bMe = await schoolB.get('/api/v1/schools/me');
    expect(bMe.body.data.id).toBe(schoolBId);

    const patchA = await schoolA.patch('/api/v1/schools/me').send({ studentTeacherRatio: '7:1' });
    expect(patchA.status).toBe(200);
    expect(patchA.body.data.id).toBe(schoolAId);
    expect(patchA.body.data.studentTeacherRatio).toBe('7:1');

    // School B is untouched by School A's update.
    const bAfter = await schoolB.get('/api/v1/schools/me');
    expect(bAfter.body.data.studentTeacherRatio).toBeNull();
  });

  it('cannot target another school by putting an id in the PATCH /schools/me body', async () => {
    const spoof = await schoolA
      .patch('/api/v1/schools/me')
      .send({ studentTeacherRatio: '99:1', id: schoolBId, schoolId: schoolBId });
    // Rejected outright (strict schema) — never applied to either record.
    expect(spoof.status).toBe(400);

    const [aRow, bRow] = await Promise.all([
      prisma.school.findUnique({ where: { id: schoolAId } }),
      prisma.school.findUnique({ where: { id: schoolBId } }),
    ]);
    expect(aRow?.studentTeacherRatio).toBe('7:1'); // unchanged from previous test
    expect(bRow?.studentTeacherRatio).toBeNull();
  });

  it('has no endpoint for a school to PATCH another school by arbitrary id', async () => {
    // PATCH /schools/:schoolId is ADMIN-only.
    const res = await schoolA.patch(`/api/v1/schools/${schoolBId}`).send({ name: 'Hijacked' });
    expect(res.status).toBe(403);
    const bRow = await prisma.school.findUnique({ where: { id: schoolBId } });
    expect(bRow?.name).not.toBe('Hijacked');
  });

  it('blocks PARENT accounts from every school-write endpoint with 403 (not 500)', async () => {
    expect((await parent.get('/api/v1/schools/me')).status).toBe(403);
    expect(
      (await parent.patch('/api/v1/schools/me').send({ studentTeacherRatio: '1:1' })).status,
    ).toBe(403);
    expect((await parent.patch(`/api/v1/schools/${schoolAId}`).send({ name: 'x' })).status).toBe(
      403,
    );
    expect(
      (
        await parent
          .post('/api/v1/schools/activity-reports')
          .send({ childId: 'x', title: 'x', summary: 'x', activityDate: '2026-01-01' })
      ).status,
    ).toBe(403);
  });

  it('never lets isVerified or rating be set via PATCH /schools/me', async () => {
    const res = await schoolA
      .patch('/api/v1/schools/me')
      .send({ name: 'Trusted School', isVerified: true, rating: 5 });
    expect(res.status).toBe(400); // strict schema rejects the unknown keys

    const row = await prisma.school.findUnique({ where: { id: schoolAId } });
    expect(row?.isVerified).toBe(false); // still not verified
    expect(row?.name).not.toBe('Trusted School'); // whole request rejected, nothing applied
  });

  it('exposes only public fields via GET /schools/:id (no credentials/internal fields)', async () => {
    const res = await parent.get(`/api/v1/schools/${schoolAId}`);
    expect(res.status).toBe(200);

    // Every returned key must be within the allowed public set — catches any leak.
    for (const key of Object.keys(res.body.data)) {
      expect(publicSchoolFields).toContain(key);
    }
    // Explicitly assert no credential/internal fields leak through.
    expect(res.body.data).not.toHaveProperty('passwordHash');
    expect(res.body.data).not.toHaveProperty('staff');
    expect(res.body.data).not.toHaveProperty('account');
    expect(res.body.data).not.toHaveProperty('parentId');
  });

  it('lets a SCHOOL read another school read-only via GET /schools/:id (no write access)', async () => {
    // GET /schools/:id is public read-only for any authenticated account, so a school
    // can VIEW a peer's profile — but the read exposes only public fields and grants
    // no write path (write scoping is covered by the tests above).
    const res = await schoolA.get(`/api/v1/schools/${schoolBId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(schoolBId);
    for (const key of Object.keys(res.body.data)) {
      expect(publicSchoolFields).toContain(key);
    }
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });
});
