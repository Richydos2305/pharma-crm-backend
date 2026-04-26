import { Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../factories/ServiceFactory';
import { HttpStatus } from '../constants';
import { ResponseHandlerParams } from '../interfaces/helpers';

export const listPharmacists = async (_req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const pharmacistService = ServiceFactory.createPharmacistService();
  const result = await pharmacistService.list(res.locals.user.id as string);
  return { status: HttpStatus.OK, message: 'Pharmacists retrieved successfully', data: result };
};

export const getPharmacist = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const pharmacistService = ServiceFactory.createPharmacistService();
  const pharmacist = await pharmacistService.getById(req.params.id, res.locals.user.id as string);
  return { status: HttpStatus.OK, message: 'Pharmacist retrieved successfully', data: pharmacist };
};

export const createPharmacist = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const pharmacistService = ServiceFactory.createPharmacistService();
  const pharmacist = await pharmacistService.create(req.body, res.locals.user.id as string);
  return { status: HttpStatus.CREATED, message: 'Pharmacist created successfully', data: pharmacist };
};

export const updatePharmacist = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const pharmacistService = ServiceFactory.createPharmacistService();
  const pharmacist = await pharmacistService.update(req.params.id, req.body, res.locals.user.id as string);
  return { status: HttpStatus.OK, message: 'Pharmacist updated successfully', data: pharmacist };
};

export const deletePharmacist = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const pharmacistService = ServiceFactory.createPharmacistService();
  await pharmacistService.delete(req.params.id, res.locals.user.id as string);
  return { status: HttpStatus.OK, message: 'Pharmacist deleted successfully' };
};
