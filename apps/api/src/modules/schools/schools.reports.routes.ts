import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../../common/middleware/validate.js';
import { requireRole } from '../auth/index.js';
import {
  createReport,
  listReports,
  getReportById,
  getReportAttachment,
  updateReport,
} from './schools.reports.controller.js';
import {
  createActivityReportRequestSchema,
  reportStatuses,
  updateActivityReportRequestSchema,
} from './schools.reports.schemas.js';

// Query-param validation (separate from body validation).
const listReportsQuerySchema = z.object({
  childId: z.string().optional(),
  status: z.enum(reportStatuses).optional(),
});

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
  (req, _res, next) => {
    // Express 5: req.query is getter-only — validate in place instead of
    // reassigning (the schema is pass-through, so no transformation needed).
    listReportsQuerySchema.parse(req.query);
    next();
  },
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
