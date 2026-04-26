import { Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../factories/ServiceFactory';
import { HttpStatus } from '../constants';
import { ResponseHandlerParams } from '../interfaces/helpers';

export const uploadFile = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const fileService = ServiceFactory.createFileService();
  const userId = res.locals.user.id as string;
  const result = await fileService.upload(req.file, req.params.patientId, userId);
  return { status: HttpStatus.CREATED, message: 'File uploaded successfully', data: result };
};

export const listFiles = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const fileService = ServiceFactory.createFileService();
  const userId = res.locals.user.id as string;
  const result = await fileService.listByPatient(req.params.patientId, userId);
  return { status: HttpStatus.OK, message: 'Files retrieved successfully', data: result };
};

export const deleteFile = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const fileService = ServiceFactory.createFileService();
  const userId = res.locals.user.id as string;
  await fileService.delete(req.params.publicId, userId);
  return { status: HttpStatus.OK, message: 'File deleted successfully' };
};
