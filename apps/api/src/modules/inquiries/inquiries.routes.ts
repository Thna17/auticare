import { Router } from 'express';
import { createOrganizationInquiryRequestSchema } from '@auticare/contracts';
import { inquiryRateLimit } from '../../common/security/rate-limits.js';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  createInquiry,
  listMyInquiries,
  listSchoolInquiries,
  markSchoolInquiryRead,
} from './inquiries.controller.js';

export const inquiriesRoutes = Router();

inquiriesRoutes.use(requireAuth);

/** POST /api/v1/inquiries — send inquiry to a school or hospital (PARENT). */
inquiriesRoutes.post(
  '/',
  requireRole('PARENT'),
  inquiryRateLimit,
  validateBody(createOrganizationInquiryRequestSchema),
  createInquiry,
);

/** GET /api/v1/inquiries/mine — parent\'s sent inquiries and statuses (PARENT). */
inquiriesRoutes.get('/mine', requireRole('PARENT'), listMyInquiries);

/** GET /api/v1/inquiries/school — school admin view of inquiries for their school (SCHOOL). */
inquiriesRoutes.get('/school', requireRole('SCHOOL'), listSchoolInquiries);

/** POST /api/v1/inquiries/school/:id/read — mark school inquiry as read (SCHOOL). */
inquiriesRoutes.post('/school/:id/read', requireRole('SCHOOL'), markSchoolInquiryRead);
