import type { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header('x-request-id') ?? nanoid();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
