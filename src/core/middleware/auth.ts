import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { settings } from '../config/application';
import { UnauthorizedError } from '../errors/CustomErrors';

export interface JwtPayload {
  id: string;
  role: string;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedError('No token provided');

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, settings.jwtAccessSecret) as JwtPayload;
    res.locals.user = payload;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
};
