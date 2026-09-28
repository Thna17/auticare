import type { Request, Response } from 'express';
import { ok } from '../../common/http/response.js';
import { SchoolNotificationsService } from './schools.notifications.service.js';

const service = new SchoolNotificationsService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const listNotifications = async (req: Request, res: Response) =>
  ok(res, await service.listNotificationItems(req.auth!, req.query));

export const decideEnrollmentRequest = async (req: Request, res: Response) =>
  ok(
    res,
    await service.decideEnrollmentRequest(
      req.auth!,
      requiredParam(req.params.id),
      req.body.decision,
    ),
  );

export const markNotificationRead = async (req: Request, res: Response) =>
  ok(res, await service.markAsRead(req.auth!, requiredParam(req.params.id)));

export const markAllNotificationsRead = async (req: Request, res: Response) =>
  ok(res, await service.markAllAsRead(req.auth!));
