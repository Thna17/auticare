import type { Request, Response } from 'express';
import type { ListActivityReportsQuery } from '@auticare/contracts';
import { created, ok } from '../../common/http/response.js';
import { validatedQuery } from '../../common/middleware/validate-query.js';
import { SchoolsReportsService } from './schools.reports.service.js';

const service = new SchoolsReportsService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const createReport = async (req: Request, res: Response) =>
  created(res, await service.createReport(req.auth!, req.body));

export const listReports = async (req: Request, res: Response) =>
  ok(res, await service.listReports(req.auth!, validatedQuery<ListActivityReportsQuery>(req)));

export const getReportById = async (req: Request, res: Response) =>
  ok(res, await service.getReportById(req.auth!, requiredParam(req.params.id)));

/**
 * GET /api/v1/schools/reports/:id/attachments/:filename
 *
 * Downloads an authorized report attachment.
 * Headers are set explicitly: the Content-Type comes from our own extension allowlist
 * (never from the upload), `nosniff` stops the browser second-guessing it, and
 * `attachment` ensures safe handling in the browser.
 * Works seamlessly with local storage (sendFile) and remote streamable storage.
 */
export const getReportAttachment = async (req: Request, res: Response) => {
  const { absolutePath, streamResult, contentType, filename } = await service.getReportAttachment(
    req.auth!,
    requiredParam(req.params.id),
    requiredParam(req.params.filename),
  );

  res.setHeader('Content-Type', contentType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  if (streamResult.byteLength !== undefined) {
    res.setHeader('Content-Length', streamResult.byteLength);
  }

  if (absolutePath) {
    res.sendFile(absolutePath);
  } else {
    streamResult.stream.pipe(res);
  }
};

export const updateReport = async (req: Request, res: Response) =>
  ok(res, await service.updateReport(req.auth!, requiredParam(req.params.id), req.body));

export const deleteReport = async (req: Request, res: Response) =>
  ok(res, await service.deleteReport(req.auth!, requiredParam(req.params.id)));
