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
