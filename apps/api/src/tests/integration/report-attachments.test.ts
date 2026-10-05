import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';
import { uploadDir } from '../../modules/uploads/uploads.controller.js';

const app = createApp();
const passwordService = new PasswordService();
const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareAttachmentPassword123';

const ownerParentEmail = `attach-owner-${unique}@auticare.test`;
const otherParentEmail = `attach-other-${unique}@auticare.test`;
const schoolEmail = `attach-school-${unique}@auticare.test`;
const otherSchoolEmail = `attach-school2-${unique}@auticare.test`;

const createdParentIds: string[] = [];
const createdSchoolIds: string[] = [];
const createdChildIds: string[] = [];
const createdReportIds: string[] = [];
const writtenFiles: string[] = [];

let ownerAgent: request.Agent;
let otherParentAgent: request.Agent;
let schoolAgent: request.Agent;
let otherSchoolAgent: request.Agent;

let reportId = '';
const storedFilename = `${randomUUID()}.jpg`;

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);

  const [ownerParent, otherParent] = await Promise.all([
    prisma.parent.create({
      data: {
        email: ownerParentEmail,
        passwordHash,
        firstName: 'Owner',
        lastName: 'Parent',
        role: 'PARENT',
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: otherParentEmail,
        passwordHash,
        firstName: 'Other',
        lastName: 'Parent',
        role: 'PARENT',
        preference: { create: {} },
      },
    }),
  ]);
  createdParentIds.push(ownerParent.id, otherParent.id);

  const child = await prisma.child.create({
    data: { parentId: ownerParent.id, firstName: 'Attach', dateOfBirth: new Date('2020-01-01') },
  });
  createdChildIds.push(child.id);

  const [school, otherSchool] = await Promise.all([
    prisma.school.create({
      data: { name: `Attach School ${unique}`, city: 'Testville', address: '1 Attach St' },
    }),
    prisma.school.create({
      data: { name: `Other School ${unique}`, city: 'Testville', address: '2 Attach St' },
    }),
  ]);
  createdSchoolIds.push(school.id, otherSchool.id);

  const [schoolUser, otherSchoolUser] = await Promise.all([
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
    prisma.parent.create({
      data: {
        email: otherSchoolEmail,
        passwordHash,
        firstName: 'Other',
        lastName: 'Staff',
        role: 'SCHOOL',
        preference: { create: {} },
      },
    }),
  ]);
  createdParentIds.push(schoolUser.id, otherSchoolUser.id);
  await prisma.schoolStaff.create({
    data: { parentId: schoolUser.id, schoolId: school.id, title: 'Teacher' },
  });
  await prisma.schoolStaff.create({
    data: { parentId: otherSchoolUser.id, schoolId: otherSchool.id, title: 'Teacher' },
  });

  // A report owned by `school`, about `ownerParent`'s child, with one attachment.
  const report = await prisma.activityReport.create({
    data: {
      schoolId: school.id,
      childId: child.id,
      reporterId: schoolUser.id,
      activityCategory: 'Cognitive/Developmental',
      title: 'Attachment report',
      summary: 'Report with one attachment',
      activityDate: new Date('2026-05-01'),
      status: 'SUBMITTED',
      photoUrls: [`/uploads/activity-reports/${storedFilename}`],
    },
  });
  reportId = report.id;
  createdReportIds.push(report.id);

  // Put a real file on disk at the stored name so a successful download is a
  // genuine read, not a 404 that happens to look like authorisation working.
  fs.mkdirSync(uploadDir, { recursive: true });
  const absolute = path.join(uploadDir, storedFilename);
  fs.writeFileSync(absolute, Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x01]));
  writtenFiles.push(absolute);

  ownerAgent = request.agent(app);
  otherParentAgent = request.agent(app);
  schoolAgent = request.agent(app);
  otherSchoolAgent = request.agent(app);
  await ownerAgent.post('/api/v1/auth/login').send({ email: ownerParentEmail, password });
  await otherParentAgent.post('/api/v1/auth/login').send({ email: otherParentEmail, password });
  await schoolAgent.post('/api/v1/auth/login').send({ email: schoolEmail, password });
  await otherSchoolAgent.post('/api/v1/auth/login').send({ email: otherSchoolEmail, password });
});

afterAll(async () => {
  for (const file of writtenFiles) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  await prisma.activityReport.deleteMany({ where: { id: { in: createdReportIds } } });
  await prisma.schoolStaff.deleteMany({ where: { schoolId: { in: createdSchoolIds } } });
  await prisma.school.deleteMany({ where: { id: { in: createdSchoolIds } } });
  await prisma.child.deleteMany({ where: { id: { in: createdChildIds } } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
});

const attachmentPath = (id: string, filename: string) =>
  `/api/v1/schools/reports/${id}/attachments/${filename}`;

describe('activity report access control', () => {
  it("lets the child's own parent read the report", async () => {
    const res = await ownerAgent.get(`/api/v1/schools/reports/${reportId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(reportId);
  });

  it('does not let an unrelated parent read the report by id', async () => {
    // Regression test: this previously returned 200. getReportById checked the
    // caller's role and the SCHOOL scope, but never that a PARENT owned the
    // child — so any parent could read any report by id.
    const res = await otherParentAgent.get(`/api/v1/schools/reports/${reportId}`);
    expect(res.status).toBe(404);
  });

  it('does not let a school from another school read the report by id', async () => {
    const res = await otherSchoolAgent.get(`/api/v1/schools/reports/${reportId}`);
    expect(res.status).toBe(404);
  });

  it('lets the owning school read the report', async () => {
    const res = await schoolAgent.get(`/api/v1/schools/reports/${reportId}`);
    expect(res.status).toBe(200);
  });
});

describe('report attachment downloads', () => {
  it('serves the file to the owning school with safe headers', async () => {
    const res = await schoolAgent.get(attachmentPath(reportId, storedFilename));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/jpeg');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("serves the file to the child's own parent", async () => {
    const res = await ownerAgent.get(attachmentPath(reportId, storedFilename));
    expect(res.status).toBe(200);
  });

  it('returns 404 to an unrelated parent rather than the file', async () => {
    const res = await otherParentAgent.get(attachmentPath(reportId, storedFilename));
    expect(res.status).toBe(404);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get(attachmentPath(reportId, storedFilename));
    expect(res.status).toBe(401);
  });

  it('is no longer reachable through the old public /uploads path', async () => {
    // The express.static mount is gone, so this must not serve the file to an
    // anonymous caller any more.
    const res = await request(app).get(`/uploads/activity-reports/${storedFilename}`);
    expect(res.status).not.toBe(200);
  });

  it('rejects a filename the report does not reference', async () => {
    const strangerFile = `${randomUUID()}.jpg`;
    fs.writeFileSync(path.join(uploadDir, strangerFile), Buffer.from([0xff, 0xd8]));
    writtenFiles.push(path.join(uploadDir, strangerFile));

    const res = await schoolAgent.get(attachmentPath(reportId, strangerFile));
    expect(res.status).toBe(404);
  });

  it('rejects path traversal and non-conforming filenames', async () => {
    for (const bad of ['..%2f..%2f..%2fetc%2fpasswd', 'not-a-uuid.jpg', `${randomUUID()}.html`]) {
      const res = await schoolAgent.get(attachmentPath(reportId, bad));
      expect(res.status).not.toBe(200);
    }
  });
});

describe('upload filename handling', () => {
  it('ignores the client-supplied extension and stores an allowlisted one', async () => {
    // An attacker-shaped upload: JPEG content type, .html filename. Previously
    // this was stored as <uuid>.html and served as text/html from the API origin.
    const res = await schoolAgent
      .post('/api/v1/schools/upload/activity-photos')
      .attach('photos', Buffer.from([0xff, 0xd8, 0xff, 0xdb]), {
        filename: 'payload.html',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(200);
    const urls = res.body.data.urls as string[];
    expect(urls).toHaveLength(1);
    expect(urls[0]).toMatch(/\.jpg$/);
    expect(urls[0]).not.toContain('.html');

    writtenFiles.push(path.join(uploadDir, path.posix.basename(urls[0]!)));
  });
});
