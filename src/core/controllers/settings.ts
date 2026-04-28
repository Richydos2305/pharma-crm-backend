import { Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../factories/ServiceFactory';
import { HttpStatus } from '../constants';
import { ResponseHandlerParams } from '../interfaces/helpers';

export const getSettings = async (_req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const settingService = ServiceFactory.createSettingService();
  const userId = res.locals.user.id as string;
  const result = await settingService.get(userId);
  return { status: HttpStatus.OK, message: 'Settings retrieved successfully', data: result };
};

export const createSettings = async (_req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const settingService = ServiceFactory.createSettingService();
  const userId = res.locals.user.id as string;
  const result = await settingService.create(userId);
  return { status: HttpStatus.CREATED, message: 'Settings created successfully', data: result };
};

export const updateSettings = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const settingService = ServiceFactory.createSettingService();
  const userId = res.locals.user.id as string;
  const result = await settingService.set(userId, req.body);
  return { status: HttpStatus.OK, message: 'Settings updated successfully', data: result };
};
