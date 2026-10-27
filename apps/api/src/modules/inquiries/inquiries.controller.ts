import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { InquiriesService } from './inquiries.service.js';

const service = new InquiriesService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const createInquiry = async (req: Request, res: Response) =>
  created(res, await service.create(req.auth!, req.body));

export const listMyInquiries = async (req: Request, res: Response) =>
  ok(res, await service.listMine(req.auth!));

export const listSchoolInquiries = async (req: Request, res: Response) =>
  ok(res, await service.listForSchool(req.auth!));

export const markSchoolInquiryRead = async (req: Request, res: Response) =>
  ok(res, await service.markSchoolInquiryRead(req.auth!, requiredParam(req.params.id)));
