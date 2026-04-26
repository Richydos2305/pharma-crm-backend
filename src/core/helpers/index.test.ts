import { describe, it, expect, vi } from 'vitest';
import { responseHandler, sanitizeUser } from './index';

describe('responseHandler', () => {
  it('returns success: true with data for 2xx status', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as import('express').Response;
    responseHandler(res, { status: 200, message: 'OK', data: { id: 1 } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'OK', data: { id: 1 } });
  });

  it('returns success: false with error for 4xx status', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as import('express').Response;
    responseHandler(res, { status: 400, message: 'Bad Request', error: { code: 'VALIDATION_ERROR' } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Bad Request', error: { code: 'VALIDATION_ERROR' } });
  });
});

describe('sanitizeUser', () => {
  it('removes password and returns sanitised user fields', () => {
    const doc = {
      toObject: () => ({
        _id: '1',
        email: 'a@b.com',
        password: 'hashed',
        firstName: 'John',
        lastName: 'Doe',
        role: 'pharmacist',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } as unknown as import('mongoose').Document;
    const result = sanitizeUser(doc);
    expect(result).not.toHaveProperty('password');
    expect(result.email).toBe('a@b.com');
  });
});
