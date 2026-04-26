import { Request, Response, NextFunction } from 'express';
import { isCustomError } from '../errors/CustomErrors';
import { logger } from '../helpers/logger';
import { responseHandler } from '../helpers/index';

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (isCustomError(err)) {
    logger.warn('Handled Error', { code: err.code, message: err.message });
    responseHandler(res, { status: err.status, message: err.message, error: { code: err.code } });
  } else {
    logger.error('unhandled_error', { error: err });
    responseHandler(res, { status: 500, message: 'Internal server error', error: { code: 'INTERNAL_ERROR' } });
  }
};
