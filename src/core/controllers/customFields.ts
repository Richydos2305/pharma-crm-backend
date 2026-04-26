import { Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../factories/ServiceFactory';
import { HttpStatus } from '../constants';
import { ResponseHandlerParams } from '../interfaces/helpers';

export const listCustomFields = async (_req: Request, _res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const customFieldService = ServiceFactory.createCustomFieldService();
  const fields = await customFieldService.list();
  return { status: HttpStatus.OK, message: 'Custom fields retrieved successfully', data: fields };
};

export const createCustomField = async (req: Request, _res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const customFieldService = ServiceFactory.createCustomFieldService();
  const field = await customFieldService.create(req.body);
  return { status: HttpStatus.CREATED, message: 'Custom field created successfully', data: field };
};

export const updateCustomField = async (req: Request, _res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const customFieldService = ServiceFactory.createCustomFieldService();
  const field = await customFieldService.update(req.params.id, req.body);
  return { status: HttpStatus.OK, message: 'Custom field updated successfully', data: field };
};

export const deleteCustomField = async (req: Request, _res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const customFieldService = ServiceFactory.createCustomFieldService();
  await customFieldService.delete(req.params.id);
  return { status: HttpStatus.OK, message: 'Custom field deleted successfully' };
};
