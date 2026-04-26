import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/CustomErrors';

export const validate =
  (schema: Joi.ObjectSchema, target: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[target], { abortEarly: false });
    if (error) throw new ValidationError(error.details.map((d) => d.message).join(', '));
    next();
  };
