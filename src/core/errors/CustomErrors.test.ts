import { describe, it, expect } from 'vitest';
import { ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, SystemError, isCustomError } from './CustomErrors';

describe('ValidationError', () => {
  it('has correct status, code, and name', () => {
    const err = new ValidationError('invalid');
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.name).toBe('ValidationError');
    expect(err.message).toBe('invalid');
  });
});

describe('UnauthorizedError', () => {
  it('has correct status, code, and name', () => {
    const err = new UnauthorizedError('unauth');
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.name).toBe('UnauthorizedError');
  });
});

describe('ForbiddenError', () => {
  it('has correct status, code, and name', () => {
    const err = new ForbiddenError('forbidden');
    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.name).toBe('ForbiddenError');
  });
});

describe('NotFoundError', () => {
  it('has correct status, code, and name', () => {
    const err = new NotFoundError('not found');
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.name).toBe('NotFoundError');
  });
});

describe('ConflictError', () => {
  it('has correct status, code, and name', () => {
    const err = new ConflictError('conflict');
    expect(err.status).toBe(409);
    expect(err.code).toBe('CONFLICT');
    expect(err.name).toBe('ConflictError');
  });
});

describe('SystemError', () => {
  it('has correct status, code, and name', () => {
    const err = new SystemError('system');
    expect(err.status).toBe(500);
    expect(err.code).toBe('SYSTEM_ERROR');
    expect(err.name).toBe('SystemError');
  });
});

describe('isCustomError', () => {
  it('returns true for each custom error class', () => {
    expect(isCustomError(new ValidationError('x'))).toBe(true);
    expect(isCustomError(new UnauthorizedError('x'))).toBe(true);
    expect(isCustomError(new ForbiddenError('x'))).toBe(true);
    expect(isCustomError(new NotFoundError('x'))).toBe(true);
    expect(isCustomError(new ConflictError('x'))).toBe(true);
    expect(isCustomError(new SystemError('x'))).toBe(true);
  });

  it('returns false for a plain Error', () => {
    expect(isCustomError(new Error('x'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isCustomError(null)).toBe(false);
  });
});
