import { Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../factories/ServiceFactory';
import { HttpStatus } from '../constants';
import { ResponseHandlerParams } from '../interfaces/helpers';
import { sanitizePatient } from '../helpers/index';

export const listPatients = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const patientService = ServiceFactory.createPatientService();
  const userId = res.locals.user.id as string;
  const { patients, total } = await patientService.list(req.query, userId);
  return {
    status: HttpStatus.OK,
    message: 'Patients retrieved successfully',
    data: { patients: patients.map(sanitizePatient), total }
  };
};

export const getPatient = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const patientService = ServiceFactory.createPatientService();
  const userId = res.locals.user.id as string;
  const patient = await patientService.getById(req.params.id, userId);
  return { status: HttpStatus.OK, message: 'Patient retrieved successfully', data: sanitizePatient(patient) };
};

export const createPatient = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const patientService = ServiceFactory.createPatientService();
  const userId = res.locals.user.id as string;
  const patient = await patientService.create(req.body, userId);
  return { status: HttpStatus.CREATED, message: 'Patient created successfully', data: sanitizePatient(patient) };
};

export const updatePatient = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const patientService = ServiceFactory.createPatientService();
  const userId = res.locals.user.id as string;
  const patient = await patientService.update(req.params.id, req.body, userId);
  return { status: HttpStatus.OK, message: 'Patient updated successfully', data: sanitizePatient(patient) };
};

export const deletePatient = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const patientService = ServiceFactory.createPatientService();
  const userId = res.locals.user.id as string;
  await patientService.delete(req.params.id, userId);
  return { status: HttpStatus.OK, message: 'Patient deleted successfully' };
};
