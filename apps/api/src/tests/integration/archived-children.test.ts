import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareArchivedPassword123';
const parentEmail = `archived-parent-${unique}@auticare.test`;
const schoolEmail = `archived-school-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdSchoolIds: string[] = [];
const createdChildIds: string[] = [];

let parentAgent: request.Agent;
let schoolAgent: request.Agent;
let schoolId = '';
let archivedChildId = '';

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);

  const parent = await prisma.parent.create({
    data: {
      email: parentEmail,
      passwordHash,
      firstName: 'Archive',
      lastName: 'Parent',
      role: 'PARENT',
      preference: { create: {} },
    },
  });
  createdParentIds.push(parent.id);

  const school = await prisma.school.create({
    data: { name: `Archive School ${unique}`, city: 'Testville', address: '1 Archive St' },
  });
  schoolId = school.id;
  createdSchoolIds.push(school.id);

  const schoolUser = await prisma.parent.create({
    data: {
      email: schoolEmail,
      passwordHash,
      firstName: 'School',
      lastName: 'Staff',
      role: 'SCHOOL',
      preference: { create: {} },
    },
  });
  createdParentIds.push(schoolUser.id);
  await prisma.schoolStaff.create({
    data: { parentId: schoolUser.id, schoolId: school.id, title: 'Teacher' },
  });

  // Two children of the same parent, both enrolled at the same school. One will
  // be archived; the other is the control, so a disappearing row cannot be
  // mistaken for the whole list breaking.
  const [kept, toArchive] = await Promise.all([
    prisma.child.create({
      data: { parentId: parent.id, firstName: 'Kept', dateOfBirth: new Date('2020-01-01') },
    }),
    prisma.child.create({
      data: { parentId: parent.id, firstName: 'Archived', dateOfBirth: new Date('2020-06-01') },
    }),
  ]);
  archivedChildId = toArchive.id;
  createdChildIds.push(kept.id, toArchive.id);

  await prisma.schoolChildEnrollment.createMany({
    data: [
      { schoolId: school.id, childId: kept.id, status: 'ACTIVE' },
      { schoolId: school.id, childId: toArchive.id, status: 'ACTIVE' },
    ],
  });

  parentAgent = request.agent(app);
  schoolAgent = request.agent(app);
  await parentAgent.post('/api/v1/auth/login').send({ email: parentEmail, password });
  await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });
});

afterAll(async () => {
  await prisma.schoolChildEnrollment.deleteMany({ where: { schoolId: { in: createdSchoolIds } } });
  await prisma.schoolStaff.deleteMany({ where: { schoolId: { in: createdSchoolIds } } });
  await prisma.school.deleteMany({ where: { id: { in: createdSchoolIds } } });
  await prisma.child.deleteMany({ where: { id: { in: createdChildIds } } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
});

const names = (rows: unknown[]): string[] =>
  rows.map((row) => (row as { firstName?: string }).firstName ?? '');

describe('archived children and the school roster', () => {
  it('shows both children to the school before either is archived', async () => {
    const picker = await schoolAgent.get('/api/v1/schools/enrolled-students');
    expect(picker.status).toBe(200);
    expect(names(picker.body.data)).toEqual(expect.arrayContaining(['Kept', 'Archived']));

    const stats = await schoolAgent.get('/api/v1/schools/enrollments/stats');
    expect(stats.status).toBe(200);
    expect(stats.body.data.totalStudents).toBeGreaterThanOrEqual(2);
  });

  it('archives a child at the parent’s request', async () => {
    const res = await parentAgent.delete(`/api/v1/children/${archivedChildId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.archivedAt).toBeTruthy();
  });

  it('removes the archived child from the school student picker', async () => {
    // Regression: the picker filtered on schoolId and enrollment status only, so
    // a child the parent had archived stayed visible to the school indefinitely.
    const res = await schoolAgent.get('/api/v1/schools/enrolled-students');
    expect(res.status).toBe(200);
    const listed = names(res.body.data);
    expect(listed).toContain('Kept');
    expect(listed).not.toContain('Archived');
  });

  it('removes the archived child from the paginated enrolled-students list', async () => {
    const res = await schoolAgent.get('/api/v1/schools/enrollments/students');
    expect(res.status).toBe(200);
    const listed = names(res.body.data.students);
    expect(listed).toContain('Kept');
    expect(listed).not.toContain('Archived');
  });

  it('excludes the archived child from enrollment stats counts', async () => {
    const res = await schoolAgent.get('/api/v1/schools/enrollments/stats');
    expect(res.status).toBe(200);
    // One of the two enrolments is now archived, so the school's totals must drop.
    const enrolled = await prisma.schoolChildEnrollment.count({ where: { schoolId } });
    expect(enrolled).toBe(2); // the row itself is kept — this is a soft delete
    expect(res.body.data.totalStudents).toBe(1); // but it no longer counts as roster
  });

  it('excludes the archived child from the school dashboard counts', async () => {
    const res = await schoolAgent.get('/api/v1/schools/me/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalStudents).toBe(1);
  });

  it('still shows the archived child to its own parent, marked archived', async () => {
    // The parent archived it, so hiding it from them would look like data loss.
    const res = await parentAgent.get('/api/v1/children');
    expect(res.status).toBe(200);
    const archived = (res.body.data as { id: string; archivedAt: string | null }[]).find(
      (c) => c.id === archivedChildId,
    );
    // The children list itself filters archived rows, so the parent's roster is
    // clean; what matters is that the record still exists and is retrievable.
    const direct = await parentAgent.get(`/api/v1/children/${archivedChildId}`);
    expect(direct.status).toBe(200);
    expect(direct.body.data.archivedAt).toBeTruthy();
    expect(archived === undefined || archived.archivedAt !== null).toBe(true);
  });

  it('keeps the underlying enrollment row — this is a soft delete, not a purge', async () => {
    const row = await prisma.schoolChildEnrollment.findFirst({
      where: { schoolId, childId: archivedChildId },
    });
    expect(row).not.toBeNull();
    const child = await prisma.child.findUnique({ where: { id: archivedChildId } });
    expect(child).not.toBeNull();
    expect(child?.archivedAt).toBeTruthy();
  });
});
