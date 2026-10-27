import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../database/prisma.js';
import { createApp } from '../../app.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();

const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const parentEmailA = `parent-a-${unique}@auticare.test`;
const parentEmailB = `parent-b-${unique}@auticare.test`;
const schoolEmailA = `school-a-${unique}@auticare.test`;
const schoolEmailB = `school-b-${unique}@auticare.test`;
const password = 'AutiCareTestPassword123';

const parentAgentA = request.agent(app);
const parentAgentB = request.agent(app);
const schoolAgentA = request.agent(app);
const schoolAgentB = request.agent(app);

let parentAId: string;
let parentBId: string;
let staffAId: string;
let staffBId: string;
let childAId: string;
let schoolAId: string;
let schoolBId: string;

describe('Parent Portal Integration Test Suite', () => {
  beforeAll(async () => {
    const passwordHash = await passwordService.hash(password);

    // 1. Create Parent A & Parent B
    const parentA = await prisma.parent.create({
      data: {
        email: parentEmailA,
        passwordHash,
        firstName: 'Alice',
        lastName: 'Parent',
        role: 'PARENT',
        preference: { create: {} },
      },
    });
    parentAId = parentA.id;

    const parentB = await prisma.parent.create({
      data: {
        email: parentEmailB,
        passwordHash,
        firstName: 'Bob',
        lastName: 'Parent',
        role: 'PARENT',
        preference: { create: {} },
      },
    });
    parentBId = parentB.id;

    // 2. Create Child A for Parent A
    const childA = await prisma.child.create({
      data: {
        parentId: parentA.id,
        firstName: 'Tommy',
        lastName: 'Parent',
        dateOfBirth: new Date('2022-01-01'),
      },
    });
    childAId = childA.id;

    // 3. Create Schools A and B
    const schoolA = await prisma.school.create({
      data: {
        name: `School Alpha ${unique}`,
        email: schoolEmailA,
        address: '123 Alpha St',
        city: 'Phnom Penh',
        status: 'ACTIVE',
      },
    });
    schoolAId = schoolA.id;

    const schoolUserA = await prisma.parent.create({
      data: {
        email: schoolEmailA,
        passwordHash,
        firstName: 'Staff',
        lastName: 'Alpha',
        role: 'SCHOOL',
      },
    });
    staffAId = schoolUserA.id;

    await prisma.schoolStaff.create({
      data: {
        schoolId: schoolA.id,
        parentId: schoolUserA.id,
        role: 'ADMIN',
      },
    });

    const schoolB = await prisma.school.create({
      data: {
        name: `School Beta ${unique}`,
        email: schoolEmailB,
        address: '456 Beta St',
        city: 'Phnom Penh',
        status: 'ACTIVE',
      },
    });
    schoolBId = schoolB.id;

    const schoolUserB = await prisma.parent.create({
      data: {
        email: schoolEmailB,
        passwordHash,
        firstName: 'Staff',
        lastName: 'Beta',
        role: 'SCHOOL',
      },
    });
    staffBId = schoolUserB.id;

    await prisma.schoolStaff.create({
      data: {
        schoolId: schoolB.id,
        parentId: schoolUserB.id,
        role: 'ADMIN',
      },
    });

    // Login each agent
    await parentAgentA.post('/api/v1/auth/login').send({ email: parentEmailA, password });
    await parentAgentB.post('/api/v1/auth/login').send({ email: parentEmailB, password });
    await schoolAgentA.post('/api/v1/auth/login').send({ email: schoolEmailA, password });
    await schoolAgentB.post('/api/v1/auth/login').send({ email: schoolEmailB, password });
  });

  afterAll(async () => {
    // Cleanup
    if (childAId) {
      await prisma.behaviorObservation.deleteMany({ where: { childId: childAId } });
      const screenings = await prisma.screening.findMany({
        where: { childId: childAId },
        select: { id: true },
      });
      const screeningIds = screenings.map((s) => s.id);
      if (screeningIds.length > 0) {
        await prisma.screeningAnswer.deleteMany({ where: { screeningId: { in: screeningIds } } });
        const results = await prisma.screeningResult.findMany({
          where: { screeningId: { in: screeningIds } },
          select: { id: true },
        });
        const resultIds = results.map((r) => r.id);
        if (resultIds.length > 0) {
          await prisma.screeningCategoryScore.deleteMany({
            where: { resultId: { in: resultIds } },
          });
        }
        await prisma.screeningResult.deleteMany({ where: { screeningId: { in: screeningIds } } });
        await prisma.screening.deleteMany({ where: { id: { in: screeningIds } } });
      }
      await prisma.child.deleteMany({ where: { id: childAId } });
    }
    const orgIds = [schoolAId, schoolBId].filter(Boolean);
    if (orgIds.length > 0) {
      await prisma.organizationInquiry.deleteMany({ where: { schoolId: { in: orgIds } } });
      await prisma.schoolStaff.deleteMany({ where: { schoolId: { in: orgIds } } });
    }
    const parentIds = [parentAId, parentBId, staffAId, staffBId].filter(Boolean);
    if (parentIds.length > 0) {
      await prisma.notification.deleteMany({ where: { parentId: { in: parentIds } } });
      await prisma.parent.deleteMany({ where: { id: { in: parentIds } } });
    }
    if (orgIds.length > 0) {
      await prisma.school.deleteMany({ where: { id: { in: orgIds } } });
    }
  });

  describe('1. Data Isolation between Parents', () => {
    it('prevents Parent B from accessing Parent A child (403 or 404)', async () => {
      const res = await parentAgentB.get(`/api/v1/children/${childAId}`);
      expect([403, 404]).toContain(res.status);
    });

    it('prevents Parent B from reading observations for Parent A child (403 or 404)', async () => {
      const res = await parentAgentB.get(`/api/v1/observations?childId=${childAId}`);
      expect([403, 404]).toContain(res.status);
    });
  });

  describe('2. Observation Round-trip with New Categories and Fields', () => {
    it('creates an observation with trigger, duration, parentResponse, outcome and reads it back', async () => {
      const createRes = await parentAgentA.post('/api/v1/observations').send({
        childId: childAId,
        category: 'SLEEP',
        note: 'Child had difficulty sleeping due to thunderstorm.',
        intensity: 3,
        occurredAt: new Date().toISOString(),
        trigger: 'Thunder and lightning sounds',
        durationMinutes: 45,
        parentResponse: 'Played calming ambient music and used soft lighting',
        outcome: 'Fell asleep peacefully after 30 minutes',
      });

      expect(createRes.status).toBe(201);
      const obs = createRes.body.data;
      expect(obs.category).toBe('SLEEP');
      expect(obs.trigger).toBe('Thunder and lightning sounds');
      expect(obs.durationMinutes).toBe(45);
      expect(obs.parentResponse).toBe('Played calming ambient music and used soft lighting');
      expect(obs.outcome).toBe('Fell asleep peacefully after 30 minutes');

      // Fetch list
      const listRes = await parentAgentA.get(`/api/v1/observations?childId=${childAId}`);

      expect(listRes.status).toBe(200);
      const found = listRes.body.data.find(
        (o: {
          id: string;
          trigger?: string;
          durationMinutes?: number;
          parentResponse?: string;
          outcome?: string;
        }) => o.id === obs.id,
      );
      expect(found).toBeDefined();
      expect(found.trigger).toBe('Thunder and lightning sounds');
      expect(found.durationMinutes).toBe(45);
      expect(found.parentResponse).toBe('Played calming ambient music and used soft lighting');
      expect(found.outcome).toBe('Fell asleep peacefully after 30 minutes');
    });
  });

  describe('3. Inquiries and Scoping', () => {
    it('submitting an inquiry stores childFirstName only and notifies the school', async () => {
      const inquiryRes = await parentAgentA.post('/api/v1/inquiries').send({
        schoolId: schoolAId,
        subject: 'Enrollment question',
        message: 'Interested in enrollment for fall semester.',
        childFirstName: 'Tommy',
      });

      expect(inquiryRes.status).toBe(201);
      const inquiry = inquiryRes.body.data;
      expect(inquiry.childFirstName).toBe('Tommy');
      expect(inquiry.childId).toBeUndefined();

      // School A staff should see this inquiry
      const schoolAList = await schoolAgentA.get('/api/v1/inquiries/school');
      expect(schoolAList.status).toBe(200);
      expect(schoolAList.body.data.length).toBeGreaterThanOrEqual(1);

      // School B staff should NOT see School A inquiry
      const schoolBList = await schoolAgentB.get('/api/v1/inquiries/school');
      expect(schoolBList.status).toBe(200);
      const leak = schoolBList.body.data.find((i: { id: string }) => i.id === inquiry.id);
      expect(leak).toBeUndefined();
    });
  });

  describe('4. Notification Archiving and Mark-All-Read', () => {
    it('mark-all-read touches only caller notifications and archived are excluded from default list', async () => {
      const notifA1 = await prisma.notification.create({
        data: {
          parentId: parentAId,
          title: 'Notif A1',
          body: 'Body A1',
          type: 'SYSTEM',
          status: 'UNREAD',
        },
      });

      const notifA2 = await prisma.notification.create({
        data: {
          parentId: parentAId,
          title: 'Notif A2',
          body: 'Body A2',
          type: 'SYSTEM',
          status: 'UNREAD',
        },
      });

      const notifB = await prisma.notification.create({
        data: {
          parentId: parentBId,
          title: 'Notif B',
          body: 'Body B',
          type: 'SYSTEM',
          status: 'UNREAD',
        },
      });

      // Archive notifA1
      const archiveRes = await parentAgentA.patch(
        `/api/v1/parents/notifications/${notifA1.id}/archive`,
      );
      expect(archiveRes.status).toBe(200);
      expect(archiveRes.body.data.status).toBe('ARCHIVED');

      // Default list should exclude ARCHIVED notifA1
      const defaultListRes = await parentAgentA.get('/api/v1/parents/notifications');
      expect(defaultListRes.status).toBe(200);
      const items = defaultListRes.body.data.notifications;
      expect(items.some((n: { id: string }) => n.id === notifA1.id)).toBe(false);

      // List with status=ARCHIVED should include notifA1
      const archivedListRes = await parentAgentA.get(
        '/api/v1/parents/notifications?status=ARCHIVED',
      );
      expect(archivedListRes.status).toBe(200);
      const archivedItems = archivedListRes.body.data.notifications;
      expect(archivedItems.some((n: { id: string }) => n.id === notifA1.id)).toBe(true);

      // Mark all read for Parent A
      const markAllRes = await parentAgentA.patch('/api/v1/parents/notifications/read-all');
      expect(markAllRes.status).toBe(200);

      // Verify Parent B notification is still UNREAD
      const checkNotifA2 = await prisma.notification.findUnique({ where: { id: notifA2.id } });
      expect(checkNotifA2?.status).toBe('READ');
      const checkNotifB = await prisma.notification.findUnique({ where: { id: notifB.id } });
      expect(checkNotifB?.status).toBe('UNREAD');
    });
  });

  describe('5. Child Questionnaire Status Transitions', () => {
    it('transitions from NOT_STARTED to IN_PROGRESS to COMPLETED', async () => {
      // 1. New child questionnaireStatus is NOT_STARTED
      const childRes = await parentAgentA.get(`/api/v1/children/${childAId}`);
      expect(childRes.status).toBe(200);
      expect(childRes.body.data.questionnaireStatus).toBe('NOT_STARTED');

      // 2. Start questionnaire session (draft) -> status becomes IN_PROGRESS
      const sessionRes = await parentAgentA
        .post('/api/v1/screening/sessions')
        .send({ childId: childAId });

      expect(sessionRes.status).toBe(201);
      const sessionId = sessionRes.body.data.session.id;
      const questions = sessionRes.body.data.questions as { id: string }[];

      const childInProgress = await parentAgentA.get(`/api/v1/children/${childAId}`);
      expect(childInProgress.status).toBe(200);
      expect(childInProgress.body.data.questionnaireStatus).toBe('IN_PROGRESS');

      // 3. Complete all answers & submit questionnaire session -> status becomes COMPLETED
      for (const q of questions) {
        await parentAgentA
          .patch(`/api/v1/screening/sessions/${sessionId}/answers`)
          .send({ questionId: q.id, answerValue: 4 });
      }

      const finalizeRes = await parentAgentA.post(`/api/v1/screening/sessions/${sessionId}/submit`);

      expect(finalizeRes.status).toBe(200);

      const childCompleted = await parentAgentA.get(`/api/v1/children/${childAId}`);
      expect(childCompleted.status).toBe(200);
      expect(childCompleted.body.data.questionnaireStatus).toBe('COMPLETED');
    }, 30_000);
  });

  describe('6. Review additions: inquiry privacy, AI and favourite ownership', () => {
    it('a teacher cannot read the school inquiry list, and the notification carries no message', async () => {
      const teacherEmail = `teacher-${unique}@auticare.test`;
      const teacher = await prisma.parent.create({
        data: {
          email: teacherEmail,
          passwordHash: await passwordService.hash(password),
          firstName: 'Class',
          lastName: 'Teacher',
          role: 'SCHOOL',
        },
      });
      try {
        await prisma.schoolStaff.create({
          data: { schoolId: schoolAId, parentId: teacher.id, role: 'TEACHER' },
        });
        const teacherAgent = request.agent(app);
        await teacherAgent.post('/api/v1/auth/login').send({ email: teacherEmail, password });
        expect((await teacherAgent.get('/api/v1/inquiries/school')).status).toBe(403);

        const secret = `Private message ${unique}`;
        const sent = await parentAgentA
          .post('/api/v1/inquiries')
          .send({ schoolId: schoolAId, subject: 'Question', message: secret });
        expect(sent.status).toBe(201);

        // Addressed to the school admin, never to the parent who sent it.
        const forSchool = await prisma.notification.findMany({
          where: { schoolId: schoolAId, title: 'New parent inquiry' },
        });
        expect(forSchool.length).toBeGreaterThanOrEqual(1);
        expect(forSchool.every((n) => n.parentId === staffAId)).toBe(true);
        expect(forSchool.some((n) => n.body.includes(secret))).toBe(false);

        const parentList = await parentAgentA.get('/api/v1/parents/notifications');
        const titles = parentList.body.data.notifications.map((n: { title: string }) => n.title);
        expect(titles).not.toContain('New parent inquiry');
      } finally {
        await prisma.schoolStaff.deleteMany({ where: { parentId: teacher.id } });
        await prisma.parent.deleteMany({ where: { id: teacher.id } });
      }
    });

    it('only the owner can save or rate an AI answer', async () => {
      const conversation = await prisma.aiConversation.create({
        data: { parentId: parentAId, title: 'Sleep', language: 'en' },
      });
      const answer = await prisma.aiMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: 'Try a calm routine.',
        },
      });
      try {
        expect((await parentAgentB.post(`/api/v1/ai/messages/${answer.id}/save`)).status).toBe(404);
        expect(
          (
            await parentAgentB
              .post(`/api/v1/ai/messages/${answer.id}/feedback`)
              .send({ feedback: 'NOT_HELPFUL' })
          ).status,
        ).toBe(404);

        expect((await parentAgentA.post(`/api/v1/ai/messages/${answer.id}/save`)).status).toBe(200);
        const savedA = await parentAgentA.get('/api/v1/ai/saved');
        expect(savedA.body.data.map((m: { id: string }) => m.id)).toContain(answer.id);
        const savedB = await parentAgentB.get('/api/v1/ai/saved');
        expect(savedB.body.data.map((m: { id: string }) => m.id)).not.toContain(answer.id);
      } finally {
        await prisma.aiConversation.deleteMany({ where: { id: conversation.id } });
      }
    });

    it('favourites are per parent, and favoriteOnly=false does not filter', async () => {
      const activity = await prisma.activity.create({
        data: {
          title: `Favourite test ${unique}`,
          category: 'Sensory',
          minAgeMonths: 0,
          maxAgeMonths: 216,
          summary: 'Test activity.',
        },
      });
      try {
        expect((await parentAgentA.post(`/api/v1/activities/${activity.id}/favorite`)).status).toBe(
          200,
        );
        const ids = async (agent: ReturnType<typeof request.agent>, favoriteOnly: string) =>
          (
            (await agent.get('/api/v1/activities').query({ favoriteOnly })).body.data as {
              id: string;
            }[]
          ).map((a) => a.id);
        expect(await ids(parentAgentA, 'true')).toContain(activity.id);
        expect(await ids(parentAgentB, 'true')).not.toContain(activity.id);
        // "false" must not be read as true.
        expect((await ids(parentAgentB, 'false')).length).toBeGreaterThan(0);
        expect(await ids(parentAgentB, 'false')).toContain(activity.id);
      } finally {
        await prisma.activity.deleteMany({ where: { id: activity.id } });
      }
    });
  });
});
