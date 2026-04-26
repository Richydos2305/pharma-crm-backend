export class ValidationError extends Error {
  readonly status = 400;
  readonly code = 'VALIDATION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  readonly status = 401;
  readonly code = 'UNAUTHORIZED';
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  readonly code = 'FORBIDDEN';
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  readonly status = 404;
  readonly code = 'NOT_FOUND';
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  readonly status = 409;
  readonly code = 'CONFLICT';
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class SystemError extends Error {
  readonly status = 500;
  readonly code = 'SYSTEM_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'SystemError';
  }
}

export type AppError = ValidationError | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | SystemError;

export const isCustomError = (err: unknown): err is AppError =>
  err instanceof ValidationError ||
  err instanceof UnauthorizedError ||
  err instanceof ForbiddenError ||
  err instanceof NotFoundError ||
  err instanceof ConflictError ||
  err instanceof SystemError;
