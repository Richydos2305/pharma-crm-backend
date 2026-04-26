import { Document } from 'mongoose';
import { Response } from 'express';
import { ResponseHandlerParams } from '../interfaces/helpers';
import { SanitizedUser } from '../services/auth/interface';

export { ResponseHandlerParams };

export const responseHandler = (res: Response, params: ResponseHandlerParams): void => {
  const success = params.status < 400;
  res
    .status(params.status)
    .json(success ? { success: true, message: params.message, data: params.data } : { success: false, message: params.message, error: params.error });
};

export const sanitizeUser = (user: Document): SanitizedUser => {
  const obj = user.toObject() as Record<string, unknown>;
  const { password: _password, _id, __v, ...rest } = obj;
  return { ...rest, id: String(_id) } as SanitizedUser;
};

export const sanitizePatient = (patient: Document): Record<string, unknown> => {
  const { _id, __v, ...rest } = patient.toObject() as Record<string, unknown>;
  return { ...rest, id: String(_id) };
};
