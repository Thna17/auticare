import { Router } from 'express';
import {
  createAdminSubscriptionRequestSchema,
  inviteSponsorshipRequestSchema,
  updateAdminSubscriptionRequestSchema,
} from '@auticare/contracts';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  acceptOffer,
  createSubscription,
  declineOffer,
  getMyPlan,
  getSchoolSubscription,
  inviteSponsorship,
  leaveSponsorship,
  listSubscriptions,
  updateSubscription,
  withdrawSponsorship,
} from './subscriptions.controller.js';

/** A parent's own plan, and a school admin's Business plan and sponsorships. */
export const subscriptionsRoutes = Router();
subscriptionsRoutes.use(requireAuth);

/** GET /api/v1/subscriptions/me — the parent's plan, limits and open offers. */
subscriptionsRoutes.get('/me', requireRole('PARENT'), getMyPlan);
subscriptionsRoutes.post('/offers/:id/accept', requireRole('PARENT'), acceptOffer);
subscriptionsRoutes.post('/offers/:id/decline', requireRole('PARENT'), declineOffer);
subscriptionsRoutes.post('/sponsorship/leave', requireRole('PARENT'), leaveSponsorship);

/** GET /api/v1/subscriptions/school — Business status and the five sponsorship slots. */
subscriptionsRoutes.get('/school', requireRole('SCHOOL'), getSchoolSubscription);
subscriptionsRoutes.post(
  '/school/sponsorships',
  requireRole('SCHOOL'),
  validateBody(inviteSponsorshipRequestSchema),
  inviteSponsorship,
);
subscriptionsRoutes.post(
  '/school/sponsorships/:id/withdraw',
  requireRole('SCHOOL'),
  withdrawSponsorship,
);

/** Platform admin: records plans by hand until a payment provider is chosen. */
export const adminSubscriptionsRoutes = Router();
adminSubscriptionsRoutes.use(requireAuth, requireRole('ADMIN'));

adminSubscriptionsRoutes.get('/', listSubscriptions);
adminSubscriptionsRoutes.post(
  '/',
  validateBody(createAdminSubscriptionRequestSchema),
  createSubscription,
);
adminSubscriptionsRoutes.patch(
  '/:id',
  validateBody(updateAdminSubscriptionRequestSchema),
  updateSubscription,
);
