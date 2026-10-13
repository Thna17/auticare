import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const app = createApp();
const passwordService = new PasswordService();

const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'AutiCareTestPassword123';
const parentEmail = `school-fav-parent-${unique}@auticare.test`;
const schoolUserEmail = `school-fav-school-${unique}@auticare.test`;
const createdParentIds: string[] = [];
const createdSchoolIds: string[] = [];
let schoolId: string;

beforeAll(async () => {
  const passwordHash = await passwordService.hash(password);

  const [parent, schoolUser, school] = await Promise.all([
    prisma.parent.create({
      data: {
        email: parentEmail,
        firstName: 'Parent',
        lastName: 'Reviewer',
        role: 'PARENT',
        passwordHash,
        preference: { create: {} },
      },
    }),
    prisma.parent.create({
      data: {
        email: schoolUserEmail,
        firstName: 'School',
        lastName: 'Staffer',
        role: 'SCHOOL',
        passwordHash,
        preference: { create: {} },
      },
    }),
    prisma.school.create({
      data: {
        name: `Reviewable School ${unique}`,
        city: 'Siem Reap',
        address: 'Angkor Wat Blvd 88',
        description: 'Inclusive education and therapy center.',
      },
    }),
  ]);

  schoolId = school.id;
  createdParentIds.push(parent.id, schoolUser.id);
  createdSchoolIds.push(school.id);
});

afterAll(async () => {
  await prisma.review.deleteMany({ where: { schoolId } });
  await prisma.favoriteSchool.deleteMany({ where: { schoolId } });
  await prisma.school.deleteMany({ where: { id: { in: createdSchoolIds } } });
  await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  await prisma.$disconnect();
});

describe('School Favorites and Reviews endpoints', () => {
  it('manages parent school favorites and reviews cleanly', async () => {
    const parentAgent = request.agent(app);
    const schoolAgent = request.agent(app);

    await parentAgent.post('/api/v1/auth/login').send({ email: parentEmail, password });
    await schoolAgent.post('/api/v1/auth/login').send({ email: schoolUserEmail, password });

    // Initial detail check: not favorited
    const initialDetail = await parentAgent.get(`/api/v1/schools/${schoolId}`);
    expect(initialDetail.status).toBe(200);
    expect(initialDetail.body.data.isFavorite).toBe(false);

    // School role cannot favorite
    const schoolFavBlocked = await schoolAgent.post(`/api/v1/schools/${schoolId}/favorites`);
    expect(schoolFavBlocked.status).toBe(403);

    // Parent favorites school
    const favResponse = await parentAgent.post(`/api/v1/schools/${schoolId}/favorites`);
    expect(favResponse.status).toBe(200);
    expect(favResponse.body.data.favorited).toBe(true);
    expect(favResponse.body.data.schoolId).toBe(schoolId);

    // Detail reflects isFavorite = true
    const favDetail = await parentAgent.get(`/api/v1/schools/${schoolId}`);
    expect(favDetail.status).toBe(200);
    expect(favDetail.body.data.isFavorite).toBe(true);

    // Parent unfavorites school
    const unfavResponse = await parentAgent.delete(`/api/v1/schools/${schoolId}/favorites`);
    expect(unfavResponse.status).toBe(200);
    expect(unfavResponse.body.data.favorited).toBe(false);

    // Detail reflects isFavorite = false
    const unfavDetail = await parentAgent.get(`/api/v1/schools/${schoolId}`);
    expect(unfavDetail.status).toBe(200);
    expect(unfavDetail.body.data.isFavorite).toBe(false);

    // Initial reviews list is empty
    const initialReviews = await parentAgent.get(`/api/v1/schools/${schoolId}/reviews`);
    expect(initialReviews.status).toBe(200);
    expect(initialReviews.body.data.reviews).toEqual([]);
    expect(initialReviews.body.data.totalReviews).toBe(0);

    // School role cannot submit a review
    const schoolReviewBlocked = await schoolAgent
      .post(`/api/v1/schools/${schoolId}/reviews`)
      .send({ rating: 5, comment: 'Great school!' });
    expect(schoolReviewBlocked.status).toBe(403);

    // Invalid rating rejected
    const invalidRating = await parentAgent
      .post(`/api/v1/schools/${schoolId}/reviews`)
      .send({ rating: 6, comment: 'Out of bounds rating' });
    expect(invalidRating.status).toBe(400);

    // Parent submits valid review
    const createReview = await parentAgent.post(`/api/v1/schools/${schoolId}/reviews`).send({
      rating: 5,
      comment: 'Exceptional sensory support and caring teachers.',
    });
    expect(createReview.status).toBe(201);
    expect(createReview.body.data.rating).toBe(5);
    expect(createReview.body.data.comment).toBe('Exceptional sensory support and caring teachers.');
    expect(createReview.body.data.parentName).toBe('Parent Reviewer');

    // List reviews reflects the submitted review
    const updatedReviews = await parentAgent.get(`/api/v1/schools/${schoolId}/reviews`);
    expect(updatedReviews.status).toBe(200);
    expect(updatedReviews.body.data.totalReviews).toBe(1);
    expect(updatedReviews.body.data.averageRating).toBe(5);
    expect(updatedReviews.body.data.reviews[0].comment).toBe(
      'Exceptional sensory support and caring teachers.',
    );

    // School detail reflects review stats
    const detailAfterReview = await parentAgent.get(`/api/v1/schools/${schoolId}`);
    expect(detailAfterReview.status).toBe(200);
    expect(detailAfterReview.body.data.rating).toBe(5);
    expect(detailAfterReview.body.data.reviewCount).toBe(1);
  });
});
