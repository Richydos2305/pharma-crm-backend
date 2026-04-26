import { Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../factories/ServiceFactory';
import { HttpStatus } from '../constants';
import { ResponseHandlerParams } from '../interfaces/helpers';

export const getProfile = async (_req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const userService = ServiceFactory.createUserService();
  const user = await userService.getProfile(res.locals.user.id as string);
  return { status: HttpStatus.OK, message: 'User retrieved', data: user };
};

export const updateProfile = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const userService = ServiceFactory.createUserService();
  const user = await userService.updateProfile(res.locals.user.id as string, req.body);
  return { status: HttpStatus.OK, message: 'Profile updated', data: user };
};
