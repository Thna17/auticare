import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@auticare/contracts';
import { forbidden, unauthorized } from '../../common/errors/app-error.js';
import { TokenService } from './token.service.js';

const tokenService = new TokenService();

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies.auticare_access;
  if (!token || typeof token !== 'string') throw unauthorized();
  try {
    const payload = tokenService.verifyAccessToken(token);
    req.auth = { parentId: payload.sub, role: payload.role };
    next();
  } catch {
    throw unauthorized();
  }
};

export const requireRole =
  (...roles: readonly UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw unauthorized();
    if (!roles.includes(req.auth.role)) throw forbidden();
    next();
  };
