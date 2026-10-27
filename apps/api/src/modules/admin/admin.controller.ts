import type { Request, Response } from 'express';
import {
  adminAuditQuerySchema,
  adminListQuerySchema,
  partnershipStatuses,
} from '@auticare/contracts';
import { AppError } from '../../common/errors/app-error.js';
import { created, ok } from '../../common/http/response.js';
import { AdminContentService } from './admin-content.service.js';
import { AdminOperationsService } from './admin-operations.service.js';
import { AdminService } from './admin.service.js';

const service = new AdminService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

/** An optional query value that must be one of `allowed`. */
const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined => {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value))
    return value as T;
  throw new AppError('VALIDATION_ERROR', `Must be one of: ${allowed.join(', ')}.`, 400);
};

export const getOverview = async (req: Request, res: Response) =>
  ok(res, await service.overview(req.auth!));

export const listParents = async (req: Request, res: Response) =>
  ok(
    res,
    await service.listParents(req.auth!, {
      ...adminListQuerySchema.parse(req.query),
      status: oneOf(req.query.status, ['ACTIVE', 'SUSPENDED'] as const),
    }),
  );

export const suspendAccount = async (req: Request, res: Response) =>
  ok(res, await service.suspendAccount(req.auth!, requiredParam(req.params.id), req.body.reason));

export const reactivateAccount = async (req: Request, res: Response) =>
  ok(res, await service.reactivateAccount(req.auth!, requiredParam(req.params.id)));

export const listSchools = async (req: Request, res: Response) =>
  ok(
    res,
    await service.listSchools(req.auth!, {
      ...adminListQuerySchema.parse(req.query),
      status: oneOf(req.query.status, ['ACTIVE', 'INACTIVE'] as const),
    }),
  );

export const updateSchool = async (req: Request, res: Response) =>
  ok(res, await service.updateSchool(req.auth!, requiredParam(req.params.id), req.body));

export const listStaff = async (req: Request, res: Response) =>
  ok(
    res,
    await service.listStaff(req.auth!, {
      ...adminListQuerySchema.parse(req.query),
      schoolId: typeof req.query.schoolId === 'string' ? req.query.schoolId : undefined,
    }),
  );

export const getSponsorshipOverview = async (req: Request, res: Response) =>
  ok(res, await service.sponsorshipOverview(req.auth!));

export const listAudit = async (req: Request, res: Response) =>
  ok(res, await service.listAudit(req.auth!, adminAuditQuerySchema.parse(req.query)));

// --- Announcements, partnerships, analytics ---------------------------------

const operations = new AdminOperationsService();

export const listAnnouncements = async (req: Request, res: Response) =>
  ok(res, await operations.listAnnouncements(req.auth!));

export const createAnnouncement = async (req: Request, res: Response) =>
  created(res, await operations.saveAnnouncement(req.auth!, req.body));

export const updateAnnouncement = async (req: Request, res: Response) =>
  ok(res, await operations.saveAnnouncement(req.auth!, req.body, requiredParam(req.params.id)));

export const getVisibleAnnouncements = async (req: Request, res: Response) =>
  ok(res, await operations.visibleAnnouncements(req.auth!));

export const listPartnerships = async (req: Request, res: Response) =>
  ok(
    res,
    await operations.listPartnerships(req.auth!, oneOf(req.query.status, partnershipStatuses)),
  );

export const createPartnership = async (req: Request, res: Response) =>
  created(res, await operations.savePartnership(req.auth!, req.body));

export const updatePartnership = async (req: Request, res: Response) =>
  ok(res, await operations.savePartnership(req.auth!, req.body, requiredParam(req.params.id)));

export const getAnalytics = async (req: Request, res: Response) => {
  const months = Number(req.query.months ?? 6);
  if (!Number.isInteger(months) || months < 1 || months > 24) {
    throw new AppError('VALIDATION_ERROR', 'months must be a whole number from 1 to 24.', 400);
  }
  return ok(res, await operations.analytics(req.auth!, months));
};

// --- Content: activities, questionnaire, AI monitoring ----------------------

const content = new AdminContentService();

export const listAdminActivities = async (req: Request, res: Response) =>
  ok(res, await content.listActivities(req.auth!));

export const createAdminActivity = async (req: Request, res: Response) =>
  created(res, await content.saveActivity(req.auth!, req.body));

export const updateAdminActivity = async (req: Request, res: Response) =>
  ok(res, await content.saveActivity(req.auth!, req.body, requiredParam(req.params.id)));

export const getQuestionnaire = async (req: Request, res: Response) =>
  ok(res, await content.questionnaire(req.auth!));

export const createQuestion = async (req: Request, res: Response) =>
  created(res, await content.createQuestion(req.auth!, req.body));

export const updateQuestion = async (req: Request, res: Response) =>
  ok(res, await content.updateQuestion(req.auth!, requiredParam(req.params.id), req.body));

export const archiveQuestion = async (req: Request, res: Response) =>
  ok(res, await content.setQuestionActive(req.auth!, requiredParam(req.params.id), false));

export const restoreQuestion = async (req: Request, res: Response) =>
  ok(res, await content.setQuestionActive(req.auth!, requiredParam(req.params.id), true));

export const getAiMonitoring = async (req: Request, res: Response) => {
  const days = Number(req.query.days ?? 30);
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new AppError('VALIDATION_ERROR', 'days must be a whole number from 1 to 90.', 400);
  }
  return ok(res, await content.aiMonitoring(req.auth!, days));
};
