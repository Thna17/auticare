import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { requireRole } from '../auth/index.js';
import { validateQuery } from '../../common/middleware/validate-query.js';
import {
  createReport,
  deleteReport,
  listReports,
  getReportById,
  getReportAttachment,
  updateReport,
} from './schools.reports.controller.js';
import { listActivityReportsQuerySchema } from '@auticare/contracts';
import {
  createActivityReportRequestSchema,
  updateActivityReportRequestSchema,
} from './schools.reports.schemas.js';

// Sub-router mounted inside schoolsRoutes which already applies requireAuth.
export const schoolsReportsRoutes = Router();

/**
 * POST /api/v1/schools/reports
 * Create a new activity report. schoolId and reporterId are derived from the
 * authenticated staff member's session.
 */
schoolsReportsRoutes.post(
  '/reports',
  requireRole('SCHOOL'),
  validateBody(createActivityReportRequestSchema),
  createReport,
);

/**
 * GET /api/v1/schools/reports
 * List all reports created by this school. Supports optional query params:
 *   - childId: filter by child
 *   - status: filter by DRAFT or SUBMITTED
 * Data is strictly scoped to the authenticated staff member's school.
 */
schoolsReportsRoutes.get(
  '/reports',
  requireRole('SCHOOL', 'PARENT', 'ADMIN'),
  validateQuery(listActivityReportsQuerySchema),
  listReports,
);

/**
 * GET /api/v1/schools/reports/:id
 * Get a single report with child and reporter info.
 */
schoolsReportsRoutes.get('/reports/:id', requireRole('SCHOOL', 'PARENT', 'ADMIN'), getReportById);

/**
 * GET /api/v1/schools/reports/:id/attachments/:filename
 * Authorised download for a report's attachments. Same audience as the report
 * itself; the service rejects anything the caller may not see with 404.
 */
schoolsReportsRoutes.get(
  '/reports/:id/attachments/:filename',
  requireRole('SCHOOL', 'PARENT', 'ADMIN'),
  getReportAttachment,
);

/**
 * PATCH /api/v1/schools/reports/:id
 * Update an existing report. Only the original author or a school admin at the
 * same school may perform updates.
 */
schoolsReportsRoutes.patch(
  '/reports/:id',
  requireRole('SCHOOL'),
  validateBody(updateActivityReportRequestSchema),
  updateReport,
);

/**
 * DELETE /api/v1/schools/reports/:id
 * Remove a report belonging to the authenticated staff member's school.
 */
schoolsReportsRoutes.delete('/reports/:id', requireRole('SCHOOL'), deleteReport);
