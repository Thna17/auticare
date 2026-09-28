import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { requireRole } from '../auth/index.js';
import { getMyProfile, updateMyProfile } from './schools.profile.controller.js';
import { updateSchoolProfileRequestSchema } from './schools.profile.schemas.js';

// Sub-router mounted inside schoolsRoutes which already applies requireAuth.
export const schoolsProfileRoutes = Router();

/**
 * GET /api/v1/schools/my-profile
 * Fetch the school details for the currently authenticated school staff member.
 * The school ID is derived from the user's session (via SchoolStaff), NOT from
 * the request body or URL parameters.
 */
schoolsProfileRoutes.get('/my-profile', requireRole('SCHOOL'), getMyProfile);

/**
 * PATCH /api/v1/schools/my-profile
 * Allow the school to update its own profile fields (description, address,
 * city, contact info, etc.). isVerified and rating are intentionally excluded.
 */
schoolsProfileRoutes.patch(
  '/my-profile',
  requireRole('SCHOOL'),
  validateBody(updateSchoolProfileRequestSchema),
  updateMyProfile,
);
