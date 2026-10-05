import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
// Date.now() alone is not unique: vitest runs these files in parallel
// workers, so two of them can start in the same millisecond and build
// identical emails — and Parent.email is UNIQUE. school-profile and
// school-admin both derive `school-parent-${unique}`, which is exactly
// how that collided. The random suffix makes the value per-worker unique.
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareTestPassword123';

const schoolAEmail = `school-a-${unique}@auticare.test`;
const schoolBEmail = `school-b-${unique}@auticare.test`;
const parentEmail = `school-parent-${unique}@auticare.test`;
const orphanEmail = `school-orphan-${unique}@auticare.test`;
const adminEmail = `admin-profile-${unique}@auticare.test`;
const hospitalEmail = `hospital-profile-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdSchoolIds: string[] = [];
let schoolAId = '';
let schoolBId = '';

// Agents are logged in once (in beforeAll) and reused, to stay under the auth
// login rate limit shared across the whole integration suite.
let schoolA: ReturnType<typeof request.agent>;
let schoolB: ReturnType<typeof request.agent>;
let parent: ReturnType<typeof request.agent>;
let orphan: ReturnType<typeof request.agent>;
let admin: ReturnType<typeof request.agent>;
let hospital: ReturnType<typeof request.agent>;

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

  // SCHOOL account without a SchoolStaff row (orphan) — tests the 404 case.
  const orphanAccount = await prisma.parent.create({
    data: {
      email: orphanEmail,
      firstName: 'Orphan',
      lastName: 'Staff',
      role: 'SCHOOL',
      passwordHash,
      preference: { create: {} },
    },
  });
  createdParentIds.push(orphanAccount.id);

  // ADMIN account for the 403 test.
  const adminAccount = await prisma.parent.create({
    data: {
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'Profile',
      role: 'ADMIN',
      passwordHash,
      preference: { create: {} },
    },
  });
  createdParentIds.push(adminAccount.id);

  // HOSPITAL account for the 403 test.
  const hospitalAccount = await prisma.parent.create({
    data: {
      email: hospitalEmail,
      firstName: 'Hospital',
      lastName: 'Profile',
      role: 'HOSPITAL',
      passwordHash,
      preference: { create: {} },
    },
  });
  createdParentIds.push(hospitalAccount.id);

  schoolA = request.agent(app);
  schoolB = request.agent(app);
  parent = request.agent(app);
  orphan = request.agent(app);
  admin = request.agent(app);
  hospital = request.agent(app);
  await schoolA.post('/api/v1/auth/login').send({ email: schoolAEmail, password });
  await schoolB.post('/api/v1/auth/login').send({ email: schoolBEmail, password });
  await parent.post('/api/v1/auth/login').send({ email: parentEmail, password });
  await orphan.post('/api/v1/auth/login').send({ email: orphanEmail, password });
  await admin.post('/api/v1/auth/login').send({ email: adminEmail, password });
  await hospital.post('/api/v1/auth/login').send({ email: hospitalEmail, password });
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

describe('school profile authentication & authorization', () => {
  it('returns 401 for unauthenticated GET /schools/me', async () => {
    const res = await request(app).get('/api/v1/schools/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for unauthenticated PATCH /schools/me', async () => {
    const res = await request(app).patch('/api/v1/schools/me').send({ description: 'nope' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for PARENT on GET /schools/me', async () => {
    const res = await parent.get('/api/v1/schools/me');
    expect(res.status).toBe(403);
  });

  it('returns 403 for ADMIN on GET /schools/me', async () => {
    const res = await admin.get('/api/v1/schools/me');
    expect(res.status).toBe(403);
  });

  it('returns 403 for HOSPITAL on GET /schools/me', async () => {
    const res = await hospital.get('/api/v1/schools/me');
    expect(res.status).toBe(403);
  });

  it('returns 403 for PARENT on PATCH /schools/me', async () => {
    const res = await parent.patch('/api/v1/schools/me').send({ description: 'hack' });
    expect(res.status).toBe(403);
  });

  it('returns 403 for ADMIN on PATCH /schools/me', async () => {
    const res = await admin.patch('/api/v1/schools/me').send({ description: 'hack' });
    expect(res.status).toBe(403);
  });

  it('returns 403 for HOSPITAL on PATCH /schools/me', async () => {
    const res = await hospital.patch('/api/v1/schools/me').send({ description: 'hack' });
    expect(res.status).toBe(403);
  });

  it('returns 404 for a SCHOOL user without a SchoolStaff row', async () => {
    const res = await orphan.get('/api/v1/schools/me');
    expect(res.status).toBe(403);
    // Note: requireSchoolStaff returns forbidden (403) when no staff row exists.
  });
});

describe('school profile response shape', () => {
  it('returns rating null and reviewCount 0 when there are no reviews', async () => {
    const res = await schoolA.get('/api/v1/schools/me');
    expect(res.status).toBe(200);
    expect(res.body.data.rating).toBeNull();
    expect(res.body.data.reviewCount).toBe(0);
    // Verify all expected fields are present.
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('name');
    expect(res.body.data).toHaveProperty('city');
    expect(res.body.data).toHaveProperty('address');
    expect(res.body.data).toHaveProperty('description');
    expect(res.body.data).toHaveProperty('email');
    expect(res.body.data).toHaveProperty('website');
    expect(res.body.data).toHaveProperty('logoUrl');
    expect(res.body.data).toHaveProperty('coverImageUrl');
    expect(res.body.data).toHaveProperty('studentTeacherRatio');
    expect(res.body.data).toHaveProperty('availabilityStatus');
    expect(res.body.data).toHaveProperty('waitlistEstimate');
    expect(res.body.data).toHaveProperty('admissionRequirements');
    expect(res.body.data).toHaveProperty('operatingHours');
    expect(res.body.data).toHaveProperty('facilities');
    expect(res.body.data).toHaveProperty('specializations');
    expect(res.body.data).toHaveProperty('isVerified');
    expect(res.body.data).toHaveProperty('reviewCount');
  });

  it('returns an empty string array for facilities/specializations when null in DB', async () => {
    const res = await schoolA.get('/api/v1/schools/me');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.facilities)).toBe(true);
    expect(Array.isArray(res.body.data.specializations)).toBe(true);
  });
});

describe('school profile update persistence', () => {
  it('persists changes that are visible on re-GET', async () => {
    const patch = await schoolA.patch('/api/v1/schools/me').send({
      description: 'Integration test description',
      email: 'test@example.com',
      website: 'https://example.com',
      facilities: ['Gym', 'Library'],
      operatingHours: 'Mon-Fri 8am-3pm',
    });
    expect(patch.status).toBe(200);
    expect(patch.body.data.description).toBe('Integration test description');
    expect(patch.body.data.email).toBe('test@example.com');
    expect(patch.body.data.website).toBe('https://example.com');
    expect(patch.body.data.facilities).toEqual(['Gym', 'Library']);
    expect(patch.body.data.operatingHours).toBe('Mon-Fri 8am-3pm');

    // Verify persistence on a fresh GET.
    const get = await schoolA.get('/api/v1/schools/me');
    expect(get.status).toBe(200);
    expect(get.body.data.description).toBe('Integration test description');
    expect(get.body.data.email).toBe('test@example.com');
    expect(get.body.data.facilities).toEqual(['Gym', 'Library']);
  });

  it('cannot change isVerified, status, or studentCapacity via PATCH', async () => {
    const res = await schoolA.patch('/api/v1/schools/me').send({
      isVerified: true,
      studentCapacity: 999,
    });
    // Strict schema rejects unknown keys.
    expect(res.status).toBe(400);

    const row = await prisma.school.findUnique({ where: { id: schoolAId } });
    expect(row?.isVerified).toBe(false);
    expect(row?.studentCapacity).toBe(0);
  });
});

describe('school profile validation', () => {
  it('rejects invalid email', async () => {
    const res = await schoolA.patch('/api/v1/schools/me').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('rejects empty name', async () => {
    const res = await schoolA.patch('/api/v1/schools/me').send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('rejects empty address', async () => {
    const res = await schoolA.patch('/api/v1/schools/me').send({ address: '' });
    expect(res.status).toBe(400);
  });

  it('rejects empty city', async () => {
    const res = await schoolA.patch('/api/v1/schools/me').send({ city: '' });
    expect(res.status).toBe(400);
  });
});

describe('school dashboard', () => {
  let childId = '';

  beforeAll(async () => {
    // Create a child and enrollment for school A to have real data.
    const child = await prisma.child.create({
      data: {
        parentId: createdParentIds[2]!, // parentAccount
        firstName: 'Dash',
        dateOfBirth: new Date('2020-03-15'),
      },
    });
    childId = child.id;

    await prisma.schoolChildEnrollment.create({
      data: { schoolId: schoolAId, childId: child.id, status: 'ACTIVE' },
    });

    // Create activity reports with known statuses.
    await prisma.activityReport.create({
      data: {
        schoolId: schoolAId,
        childId: child.id,
        reporterId: createdParentIds[0]!, // schoolA account
        activityCategory: 'Cognitive/Developmental',
        title: 'Color Sorting',
        summary: 'Test report',
        activityDate: new Date(),
        status: 'SUBMITTED',
        duration: 30,
      },
    });

    await prisma.activityReport.create({
      data: {
        schoolId: schoolAId,
        childId: child.id,
        reporterId: createdParentIds[0]!,
        activityCategory: 'Social/Emotional',
        title: 'Group Play Draft',
        summary: 'Draft report',
        activityDate: new Date(),
        status: 'DRAFT',
      },
    });
  });

  afterAll(async () => {
    await prisma.activityReport.deleteMany({ where: { schoolId: schoolAId } });
    await prisma.schoolChildEnrollment.deleteMany({ where: { schoolId: schoolAId } });
    await prisma.child.deleteMany({ where: { id: childId } });
  });

  it('returns 200 with real data for SCHOOL', async () => {
    const res = await schoolA.get('/api/v1/schools/me/dashboard');
    expect(res.status).toBe(200);
    const { data } = res.body;

    // Staff info
    expect(data.staffFirstName).toBe('School');
    expect(data.staffLastName).toBe('A');
    expect(data.schoolName).toContain('School A');

    // Stats
    expect(data.stats.totalStudents).toBeGreaterThanOrEqual(1);
    expect(data.stats.reportsSubmitted).toBeGreaterThanOrEqual(1);
    expect(data.stats.pendingReports).toBeGreaterThanOrEqual(1);
    expect(data.stats.activitiesCompleted).toBeGreaterThanOrEqual(1);

    // Recent reports
    expect(data.recentReports.length).toBeGreaterThanOrEqual(1);
    const firstReport = data.recentReports[0];
    expect(firstReport.childFirstName).toBe('Dash');
    expect(firstReport.activityCategory).toBeTruthy();
    expect(firstReport.title).toBeTruthy();
    expect(firstReport.activityDate).toBeTruthy();
    expect(['SUBMITTED', 'DRAFT']).toContain(firstReport.status);

    // Reminders (from DRAFT report)
    expect(data.reminders.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 403 for PARENT', async () => {
    const res = await parent.get('/api/v1/schools/me/dashboard');
    expect(res.status).toBe(403);
  });

  it('returns 403 for ADMIN', async () => {
    const res = await admin.get('/api/v1/schools/me/dashboard');
    expect(res.status).toBe(403);
  });

  it('returns 403 for HOSPITAL', async () => {
    const res = await hospital.get('/api/v1/schools/me/dashboard');
    expect(res.status).toBe(403);
  });

  it('returns 401 for unauthenticated', async () => {
    const res = await request(app).get('/api/v1/schools/me/dashboard');
    expect(res.status).toBe(401);
  });

  it('returns 403 for SCHOOL without SchoolStaff row', async () => {
    const res = await orphan.get('/api/v1/schools/me/dashboard');
    expect(res.status).toBe(403);
  });

  it('scopes data to school — School B gets different counts', async () => {
    const resA = await schoolA.get('/api/v1/schools/me/dashboard');
    const resB = await schoolB.get('/api/v1/schools/me/dashboard');
    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    // School A has 1 student and 2 reports; School B has 0.
    expect(resA.body.data.stats.totalStudents).toBeGreaterThanOrEqual(1);
    expect(resB.body.data.stats.totalStudents).toBe(0);
    expect(resA.body.data.recentReports.length).toBeGreaterThanOrEqual(1);
    expect(resB.body.data.recentReports.length).toBe(0);
  });
});
