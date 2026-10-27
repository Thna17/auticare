import { Router } from 'express';
import {
  createQuestionRequestSchema,
  saveActivityRequestSchema,
  updateQuestionRequestSchema,
  saveAnnouncementRequestSchema,
  savePartnershipRequestSchema,
  suspendAccountRequestSchema,
  updateAdminSchoolRequestSchema,
} from '@auticare/contracts';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  archiveQuestion,
  createAdminActivity,
  createQuestion,
  getAiMonitoring,
  getQuestionnaire,
  listAdminActivities,
  restoreQuestion,
  updateAdminActivity,
  updateQuestion,
  createAnnouncement,
  createPartnership,
  getAnalytics,
  getVisibleAnnouncements,
  listAnnouncements,
  listPartnerships,
  updateAnnouncement,
  updatePartnership,
  getOverview,
  getSponsorshipOverview,
  listAudit,
  listParents,
  listSchools,
  listStaff,
  reactivateAccount,
  suspendAccount,
  updateSchool,
} from './admin.controller.js';

/**
 * The platform admin's portal: overview, user management, sponsorships and
 * audit logs. Mounted at /api/v1/admin, beside the registration and
 * subscription routers that live under the same prefix.
 */
export const adminRoutes = Router();
adminRoutes.use(requireAuth, requireRole('ADMIN'));

adminRoutes.get('/overview', getOverview);

adminRoutes.get('/parents', listParents);
adminRoutes.post(
  '/accounts/:id/suspend',
  validateBody(suspendAccountRequestSchema),
  suspendAccount,
);
adminRoutes.post('/accounts/:id/reactivate', reactivateAccount);

adminRoutes.get('/schools', listSchools);
adminRoutes.patch('/schools/:id', validateBody(updateAdminSchoolRequestSchema), updateSchool);

adminRoutes.get('/staff', listStaff);

adminRoutes.get('/sponsorships', getSponsorshipOverview);

adminRoutes.get('/audit', listAudit);

adminRoutes.get('/announcements', listAnnouncements);
adminRoutes.post('/announcements', validateBody(saveAnnouncementRequestSchema), createAnnouncement);
adminRoutes.patch(
  '/announcements/:id',
  validateBody(saveAnnouncementRequestSchema),
  updateAnnouncement,
);

adminRoutes.get('/partnerships', listPartnerships);
adminRoutes.post('/partnerships', validateBody(savePartnershipRequestSchema), createPartnership);
adminRoutes.patch(
  '/partnerships/:id',
  validateBody(savePartnershipRequestSchema),
  updatePartnership,
);

adminRoutes.get('/analytics', getAnalytics);

adminRoutes.get('/activities', listAdminActivities);
adminRoutes.post('/activities', validateBody(saveActivityRequestSchema), createAdminActivity);
adminRoutes.patch('/activities/:id', validateBody(saveActivityRequestSchema), updateAdminActivity);

adminRoutes.get('/questionnaire', getQuestionnaire);
adminRoutes.post('/questions', validateBody(createQuestionRequestSchema), createQuestion);
adminRoutes.patch('/questions/:id', validateBody(updateQuestionRequestSchema), updateQuestion);
adminRoutes.post('/questions/:id/archive', archiveQuestion);
adminRoutes.post('/questions/:id/restore', restoreQuestion);

adminRoutes.get('/ai', getAiMonitoring);

/** GET /api/v1/announcements — the live announcements for the signed-in user. */
export const announcementsRoutes = Router();
announcementsRoutes.use(requireAuth);
announcementsRoutes.get('/', getVisibleAnnouncements);
