import { Request, Response, NextFunction } from 'express';
import { ResponseHandlerParams } from '../interfaces/helpers';
import { responseHandler } from '../helpers/index';

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<ResponseHandlerParams>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next)
      .then((result) => responseHandler(res, result))
      .catch(next);
  };
