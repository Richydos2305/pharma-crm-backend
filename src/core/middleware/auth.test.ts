import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

vi.mock('../config/application', () => ({
  settings: {
    jwtAccessSecret: 'test-access-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    mongoUri: 'mongodb://localhost/test',
    port: '3000',
    nodeEnv: 'test'
  }
}));

import { verifyToken } from './auth';
import { UnauthorizedError } from '../errors/CustomErrors';

const MOCK_USER_ID = '507f1f77bcf86cd799439011';
const ACCESS_SECRET = 'test-access-secret';

// ─── Request / response factories ────────────────────────────────────────────

const makeReq = (authHeader?: string): Request => ({ headers: { authorization: authHeader } }) as unknown as Request;

const makeRes = (): Response => {
  const res = { locals: {} } as Response;
  return res;
};

const makeNext = (): NextFunction => vi.fn() as unknown as NextFunction;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('verifyToken', () => {
  it('sets res.locals.user and calls next() when a valid Bearer token is provided', () => {
    const token = jwt.sign({ id: MOCK_USER_ID, role: 'pharmacist' }, ACCESS_SECRET, { expiresIn: '1h' });
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = makeNext();

    verifyToken(req, res, next);

    expect(res.locals.user).toMatchObject({ id: MOCK_USER_ID, role: 'pharmacist' });
    expect(next).toHaveBeenCalledOnce();
  });

  it('throws UnauthorizedError when the Authorization header is missing', () => {
    const req = makeReq(undefined);
    const res = makeRes();
    const next = makeNext();

    expect(() => verifyToken(req, res, next)).toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when the Authorization header does not start with Bearer', () => {
    const token = jwt.sign({ id: MOCK_USER_ID, role: 'pharmacist' }, ACCESS_SECRET);
    const req = makeReq(`Token ${token}`);
    const res = makeRes();
    const next = makeNext();

    expect(() => verifyToken(req, res, next)).toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when the token signature is invalid', () => {
    const req = makeReq('Bearer not-a-valid-token');
    const res = makeRes();
    const next = makeNext();

    expect(() => verifyToken(req, res, next)).toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when the token is expired', () => {
    const token = jwt.sign({ id: MOCK_USER_ID, role: 'pharmacist' }, ACCESS_SECRET, { expiresIn: 0 });
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = makeNext();

    expect(() => verifyToken(req, res, next)).toThrow(UnauthorizedError);
  });
});
