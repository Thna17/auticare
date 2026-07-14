import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { AuthService, type AuthSession } from './auth.service.js';
import { TokenService } from './token.service.js';

const authService = new AuthService();
const tokenService = new TokenService();

const setAuthCookies = (res: Response, session: AuthSession) => {
  const options = tokenService.cookieOptions();
  res.cookie('auticare_access', session.accessToken, {
    ...options,
    maxAge: tokenService.accessCookieMaxAge(),
  });
  res.cookie('auticare_refresh', session.refreshToken, {
    ...options,
    maxAge: tokenService.refreshCookieMaxAge(),
  });
};

const clearAuthCookies = (res: Response) => {
  const options = tokenService.cookieOptions();
  res.clearCookie('auticare_access', options);
  res.clearCookie('auticare_refresh', options);
};

export const register = async (req: Request, res: Response) => {
  const session = await authService.register(req.body);
  setAuthCookies(res, session);
  return created(res, { parent: session.parent });
};

export const login = async (req: Request, res: Response) => {
  const session = await authService.login(req.body);
  setAuthCookies(res, session);
  return ok(res, { parent: session.parent });
};

export const requestPasswordReset = async (req: Request, res: Response) =>
  ok(res, await authService.requestPasswordReset(req.body));

export const resetPassword = async (req: Request, res: Response) =>
  ok(res, await authService.resetPassword(req.body));

export const refresh = async (req: Request, res: Response) => {
  const session = await authService.refresh(req.cookies.auticare_refresh);
  setAuthCookies(res, session);
  return ok(res, { parent: session.parent });
};

export const logout = async (req: Request, res: Response) => {
  await authService.logout(req.cookies.auticare_refresh);
  clearAuthCookies(res);
  return ok(res, { loggedOut: true });
};

export const me = async (req: Request, res: Response) =>
  ok(res, await authService.me(req.auth!.parentId));
