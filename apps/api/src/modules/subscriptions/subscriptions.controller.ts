import type { Request, Response } from 'express';
import { subscriptionPlans, type SubscriptionPlan } from '@auticare/contracts';
import { AppError } from '../../common/errors/app-error.js';
import { created, ok } from '../../common/http/response.js';
import { SubscriptionsService } from './subscriptions.service.js';

const service = new SubscriptionsService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const getMyPlan = async (req: Request, res: Response) =>
  ok(res, await service.parentPlan(req.auth!));

export const acceptOffer = async (req: Request, res: Response) =>
  ok(res, await service.acceptOffer(req.auth!, requiredParam(req.params.id)));

export const declineOffer = async (req: Request, res: Response) =>
  ok(res, await service.declineOffer(req.auth!, requiredParam(req.params.id)));

export const leaveSponsorship = async (req: Request, res: Response) =>
  ok(res, await service.leaveSponsorship(req.auth!));

export const getSchoolSubscription = async (req: Request, res: Response) =>
  ok(res, await service.schoolSubscription(req.auth!));

export const inviteSponsorship = async (req: Request, res: Response) =>
  created(res, await service.inviteSponsorship(req.auth!, req.body.email));

export const withdrawSponsorship = async (req: Request, res: Response) =>
  ok(res, await service.withdrawSponsorship(req.auth!, requiredParam(req.params.id)));

export const listSubscriptions = async (req: Request, res: Response) => {
  const { plan } = req.query;
  if (plan !== undefined && !subscriptionPlans.includes(plan as never)) {
    throw new AppError('VALIDATION_ERROR', 'Unknown plan.', 400);
  }
  return ok(
    res,
    await service.adminList(req.auth!, { plan: plan as SubscriptionPlan | undefined }),
  );
};

export const createSubscription = async (req: Request, res: Response) =>
  created(res, await service.adminCreate(req.auth!, req.body));

export const updateSubscription = async (req: Request, res: Response) =>
  ok(res, await service.adminUpdate(req.auth!, requiredParam(req.params.id), req.body));
