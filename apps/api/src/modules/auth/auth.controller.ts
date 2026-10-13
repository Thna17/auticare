import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { AuthService, type AuthSession } from './auth.service.js';
import { invitationService } from './invitation.service.js';
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

export const changePassword = async (req: Request, res: Response) =>
  ok(
    res,
    await authService.changePassword(req.auth!.parentId, req.body, req.cookies?.auticare_refresh),
  );

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

export const updateMe = async (req: Request, res: Response) =>
  ok(res, await authService.updateMyProfile(req.auth!.parentId, req.body));

export const verifyInvitation = async (req: Request, res: Response) => {
  const token = String(req.query.token ?? '');
  return ok(res, await invitationService.verifyInvitation(token));
};

export const acceptInvitation = async (req: Request, res: Response) =>
  ok(res, await invitationService.acceptInvitation(req.body));

export const resendInvitation = async (req: Request, res: Response) =>
  ok(res, await invitationService.resendInvitation(req.body, req.auth));
