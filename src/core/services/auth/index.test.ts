import { describe, it, expect, vi, beforeAll } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

vi.mock('../../config/application', () => ({
  settings: {
    jwtAccessSecret: 'test-access-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    mongoUri: 'mongodb://localhost/test',
    port: '3000',
    nodeEnv: 'test'
  }
}));

import { AuthService } from './index';
import { UserRepository } from '../../repositories/UserRepository';
import { RefreshTokenRepository } from '../../repositories/RefreshTokenRepository';
import { ConflictError, UnauthorizedError } from '../../errors/CustomErrors';

let hashedPassword: string;

beforeAll(async () => {
  hashedPassword = await bcrypt.hash('correct-password', 10);
});

const MOCK_USER_ID = '507f1f77bcf86cd799439011';

interface MockUser {
  _id: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
  toObject(): Record<string, unknown>;
}

interface MockTokenRecord {
  _id: { toString(): string };
  token: string;
  isRevoked: boolean;
  toObject(): Record<string, unknown>;
}

const mockUser = (): MockUser => ({
  _id: MOCK_USER_ID,
  email: 'test@pharmacy.com',
  password: hashedPassword,
  fullName: 'John Doe',
  role: 'pharmacist',
  toObject(): Record<string, unknown> {
    return { ...this };
  }
});

const mockTokenRecord = (): MockTokenRecord => ({
  _id: { toString: (): string => 'token-doc-id' },
  token: 'some-refresh-token',
  isRevoked: false,
  toObject(): Record<string, unknown> {
    return { ...this };
  }
});

describe('AuthService.register', () => {
  it('creates a user and returns sanitised data when email is not taken', async () => {
    const user = mockUser();
    const userRepo = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(user)
    } as unknown as UserRepository;
    const tokenRepo = {
      create: vi.fn().mockResolvedValue({})
    } as unknown as RefreshTokenRepository;
    const service = new AuthService(userRepo, tokenRepo);

    const result = await service.register({
      email: 'test@pharmacy.com',
      password: 'password123',
      fullName: 'John Doe'
    });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user).not.toHaveProperty('password');
    expect(result.user.email).toBe('test@pharmacy.com');
  });

  it('throws ConflictError when email already exists', async () => {
    const userRepo = {
      findOne: vi.fn().mockResolvedValue(mockUser())
    } as unknown as UserRepository;
    const tokenRepo = {} as unknown as RefreshTokenRepository;
    const service = new AuthService(userRepo, tokenRepo);

    await expect(service.register({ email: 'test@pharmacy.com', password: 'password123', fullName: 'John Doe' })).rejects.toThrow(ConflictError);
  });
});

describe('AuthService.login', () => {
  it('returns tokens and sanitised user on valid credentials', async () => {
    const user = mockUser();
    const userRepo = {
      findOne: vi.fn().mockResolvedValue(user)
    } as unknown as UserRepository;
    const tokenRepo = {
      create: vi.fn().mockResolvedValue({})
    } as unknown as RefreshTokenRepository;
    const service = new AuthService(userRepo, tokenRepo);

    const result = await service.login({ email: 'test@pharmacy.com', password: 'correct-password' });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user).not.toHaveProperty('password');
  });

  it('throws UnauthorizedError when user is not found', async () => {
    const userRepo = { findOne: vi.fn().mockResolvedValue(null) } as unknown as UserRepository;
    const tokenRepo = {} as unknown as RefreshTokenRepository;
    const service = new AuthService(userRepo, tokenRepo);

    await expect(service.login({ email: 'x@x.com', password: 'password123' })).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when password does not match', async () => {
    const user = mockUser();
    const userRepo = { findOne: vi.fn().mockResolvedValue(user) } as unknown as UserRepository;
    const tokenRepo = {} as unknown as RefreshTokenRepository;
    const service = new AuthService(userRepo, tokenRepo);

    await expect(service.login({ email: 'test@pharmacy.com', password: 'wrong-password' })).rejects.toThrow(UnauthorizedError);
  });
});

describe('AuthService.refresh', () => {
  it('issues new tokens and revokes the old token', async () => {
    const validToken = jwt.sign({ id: MOCK_USER_ID }, 'test-refresh-secret', { expiresIn: '7d' });
    const record = { ...mockTokenRecord(), token: validToken };

    const userRepo = {} as unknown as UserRepository;
    const tokenRepo = {
      findOne: vi.fn().mockResolvedValue(record),
      updateOne: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({})
    } as unknown as RefreshTokenRepository;
    const service = new AuthService(userRepo, tokenRepo);

    const result = await service.refresh(validToken);

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(tokenRepo.updateOne).toHaveBeenCalledWith('token-doc-id', { isRevoked: true }, { new: true });
  });

  it('throws UnauthorizedError when token record is not found', async () => {
    const userRepo = {} as unknown as UserRepository;
    const tokenRepo = { findOne: vi.fn().mockResolvedValue(null) } as unknown as RefreshTokenRepository;
    const service = new AuthService(userRepo, tokenRepo);

    await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedError);
  });
});

describe('AuthService.logout', () => {
  it('marks the token as revoked', async () => {
    const record = mockTokenRecord();
    const userRepo = {} as unknown as UserRepository;
    const tokenRepo = {
      findOne: vi.fn().mockResolvedValue(record),
      updateOne: vi.fn().mockResolvedValue({})
    } as unknown as RefreshTokenRepository;
    const service = new AuthService(userRepo, tokenRepo);

    await service.logout('some-token');

    expect(tokenRepo.updateOne).toHaveBeenCalledWith('token-doc-id', { isRevoked: true }, { new: true });
  });

  it('does not throw when token record does not exist', async () => {
    const userRepo = {} as unknown as UserRepository;
    const tokenRepo = { findOne: vi.fn().mockResolvedValue(null) } as unknown as RefreshTokenRepository;
    const service = new AuthService(userRepo, tokenRepo);

    await expect(service.logout('non-existent-token')).resolves.toBeUndefined();
  });
});
