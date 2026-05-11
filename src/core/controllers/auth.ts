import { Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../factories/ServiceFactory';
import { HttpStatus } from '../constants';
import { ResponseHandlerParams } from '../interfaces/helpers';

export const register = async (req: Request, _res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const authService = ServiceFactory.createAuthService();
  const result = await authService.register(req.body);
  return { status: HttpStatus.CREATED, message: 'User registered successfully', data: result };
};

export const login = async (req: Request, _res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const authService = ServiceFactory.createAuthService();
  const result = await authService.login(req.body);
  return { status: HttpStatus.OK, message: 'Login successful', data: result };
};

export const refresh = async (req: Request, _res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const authService = ServiceFactory.createAuthService();
  const result = await authService.refresh(req.body.token as string);
  return { status: HttpStatus.OK, message: 'Token refreshed', data: result };
};

export const logout = async (req: Request, _res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const authService = ServiceFactory.createAuthService();
  await authService.logout(req.body.token as string);
  return { status: HttpStatus.OK, message: 'Logged out successfully' };
};

export const verifyEmail = async (req: Request, _res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const authService = ServiceFactory.createAuthService();
  await authService.verifyEmail(req.body.token as string);
  return { status: HttpStatus.OK, message: 'Email verified successfully' };
};

export const resendVerification = async (req: Request, _res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const authService = ServiceFactory.createAuthService();
  await authService.resendVerification(req.body);
  return { status: HttpStatus.OK, message: 'Verification email sent' };
};

export const forgotPassword = async (req: Request, _res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const authService = ServiceFactory.createAuthService();
  await authService.forgotPassword(req.body);
  return { status: HttpStatus.OK, message: 'If that email exists, a reset link has been sent' };
};

export const resetPassword = async (req: Request, _res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const authService = ServiceFactory.createAuthService();
  await authService.resetPassword(req.body);
  return { status: HttpStatus.OK, message: 'Password reset successfully' };
};
