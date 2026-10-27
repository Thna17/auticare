import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { AiService } from './ai.service.js';

const service = new AiService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

/** GET /api/v1/ai/status — whether a model is configured, and today's usage. */
export const getAiStatus = async (req: Request, res: Response) =>
  ok(res, await service.status(req.auth!));

export const listConversations = async (req: Request, res: Response) =>
  ok(res, await service.listConversations(req.auth!));

export const createConversation = async (req: Request, res: Response) =>
  created(res, await service.createConversation(req.auth!, req.body));

export const getConversation = async (req: Request, res: Response) =>
  ok(res, await service.getConversation(req.auth!, requiredParam(req.params.id)));

export const deleteConversation = async (req: Request, res: Response) =>
  ok(res, await service.deleteConversation(req.auth!, requiredParam(req.params.id)));

export const sendMessage = async (req: Request, res: Response) =>
  ok(res, await service.sendMessage(req.auth!, requiredParam(req.params.id), req.body));

export const listSavedMessages = async (req: Request, res: Response) =>
  ok(res, await service.listSaved(req.auth!));

export const toggleSaveMessage = async (req: Request, res: Response) =>
  ok(res, await service.toggleSaveMessage(req.auth!, requiredParam(req.params.id)));

export const saveFeedback = async (req: Request, res: Response) =>
  ok(res, await service.saveFeedback(req.auth!, requiredParam(req.params.id), req.body));
