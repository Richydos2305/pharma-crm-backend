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
import { VerificationTokenRepository } from '../../repositories/VerificationTokenRepository';
import { EmailService } from '../email/index';
import { ConflictError, UnauthorizedError, EmailNotVerifiedError } from '../../errors/CustomErrors';
import { VerificationTokenTypes } from '../../constants';

let hashedPassword: string;

beforeAll(async () => {
  hashedPassword = await bcrypt.hash('correct-password', 10);
});

const MOCK_USER_ID = '507f1f77bcf86cd799439011';

// ─── Mock data factories ──────────────────────────────────────────────────────

const mockUser = (overrides: Record<string, unknown> = {}) => ({
  _id: MOCK_USER_ID,
  email: 'test@pharmacy.com',
  get password() {
    return hashedPassword;
  },
  fullName: 'John Doe',
  role: 'pharmacist',
  isEmailVerified: true,
  toObject() {
    return { ...this };
  },
  ...overrides
});

const mockTokenRecord = (overrides: Record<string, unknown> = {}) => ({
  _id: { toString: () => 'token-doc-id' },
  token: 'some-refresh-token',
  isRevoked: false,
  userId: { toString: () => MOCK_USER_ID },
  toObject() {
    return { ...this };
  },
  ...overrides
});

const mockVerificationToken = (overrides: Record<string, unknown> = {}) => ({
  _id: { toString: () => 'verification-token-id' },
  token: 'hashed-token-value',
  userId: { toString: () => MOCK_USER_ID },
  type: VerificationTokenTypes.EMAIL_VERIFICATION,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  ...overrides
});

// ─── Repository / service factories ──────────────────────────────────────────

const makeUserRepo = (overrides = {}): UserRepository =>
  ({
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockUser()),
    updateOne: vi.fn().mockResolvedValue(mockUser()),
    deleteOne: vi.fn().mockResolvedValue({}),
    ...overrides
  }) as unknown as UserRepository;

const makeTokenRepo = (overrides = {}): RefreshTokenRepository =>
  ({
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    updateOne: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({}),
    ...overrides
  }) as unknown as RefreshTokenRepository;

const makeVerificationTokenRepo = (overrides = {}): VerificationTokenRepository =>
  ({
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    deleteOne: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({}),
    ...overrides
  }) as unknown as VerificationTokenRepository;

const makeEmailService = (): EmailService =>
  ({
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined)
  }) as unknown as EmailService;

const makeService = ({
  userRepo = makeUserRepo(),
  tokenRepo = makeTokenRepo(),
  verificationTokenRepo = makeVerificationTokenRepo(),
  emailService = makeEmailService()
} = {}) => new AuthService(userRepo, tokenRepo, verificationTokenRepo, emailService);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthService.register', () => {
  it('sends verification email and returns message when email is not taken', async () => {
    const emailService = makeEmailService();
    const service = makeService({
      userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(null) }),
      emailService
    });

    const result = await service.register({ email: 'test@pharmacy.com', password: 'password123', fullName: 'John Doe' });

    expect(result).toHaveProperty('message');
    expect(emailService.sendVerificationEmail).toHaveBeenCalledOnce();
  });

  it('throws ConflictError when email already exists', async () => {
    const service = makeService({
      userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser()) })
    });

    await expect(service.register({ email: 'test@pharmacy.com', password: 'password123', fullName: 'John Doe' })).rejects.toThrow(ConflictError);
  });
});

describe('AuthService.login', () => {
  it('returns tokens and sanitised user on valid verified credentials', async () => {
    const service = makeService({
      userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser()) })
    });

    const result = await service.login({ email: 'test@pharmacy.com', password: 'correct-password' });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user).not.toHaveProperty('password');
  });

  it('throws UnauthorizedError when user is not found', async () => {
    const service = makeService();

    await expect(service.login({ email: 'x@x.com', password: 'password123' })).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when password does not match', async () => {
    const service = makeService({
      userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser()) })
    });

    await expect(service.login({ email: 'test@pharmacy.com', password: 'wrong-password' })).rejects.toThrow(UnauthorizedError);
  });

  it('throws EmailNotVerifiedError when user email is not verified', async () => {
    const service = makeService({
      userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser({ isEmailVerified: false })) })
    });

    await expect(service.login({ email: 'test@pharmacy.com', password: 'correct-password' })).rejects.toThrow(EmailNotVerifiedError);
  });
});

describe('AuthService.refresh', () => {
  it('issues new tokens and revokes the old token', async () => {
    const validToken = jwt.sign({ id: MOCK_USER_ID }, 'test-refresh-secret', { expiresIn: '7d' });
    const tokenRepo = makeTokenRepo({
      findOne: vi.fn().mockResolvedValue(mockTokenRecord({ token: validToken })),
      updateOne: vi.fn().mockResolvedValue({})
    });
    const userRepo = makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser()) });
    const service = makeService({ tokenRepo, userRepo });

    const result = await service.refresh(validToken);

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(tokenRepo.updateOne).toHaveBeenCalledWith('token-doc-id', { isRevoked: true }, { new: true });
  });

  it('throws UnauthorizedError when token record is not found', async () => {
    const service = makeService();

    await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedError);
  });
});

describe('AuthService.logout', () => {
  it('marks the token as revoked', async () => {
    const tokenRepo = makeTokenRepo({
      findOne: vi.fn().mockResolvedValue(mockTokenRecord())
    });
    const service = makeService({ tokenRepo });

    await service.logout('some-token');

    expect(tokenRepo.updateOne).toHaveBeenCalledWith('token-doc-id', { isRevoked: true }, { new: true });
  });

  it('does not throw when token record does not exist', async () => {
    const service = makeService();

    await expect(service.logout('non-existent-token')).resolves.toBeUndefined();
  });
});

describe('AuthService.verifyEmail', () => {
  it('marks the user as verified and deletes the token when the token is valid and not expired', async () => {
    const userRepo = makeUserRepo();
    const verificationTokenRepo = makeVerificationTokenRepo({
      findOne: vi.fn().mockResolvedValue(mockVerificationToken())
    });
    const service = makeService({ userRepo, verificationTokenRepo });

    await service.verifyEmail('raw-token');

    expect(userRepo.updateOne).toHaveBeenCalledWith(MOCK_USER_ID, { isEmailVerified: true }, { new: true });
    expect(verificationTokenRepo.deleteOne).toHaveBeenCalledOnce();
  });

  it('throws UnauthorizedError when the verification token record is not found', async () => {
    const service = makeService();

    await expect(service.verifyEmail('invalid-token')).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError and deletes the token record when the token is expired', async () => {
    const verificationTokenRepo = makeVerificationTokenRepo({
      findOne: vi.fn().mockResolvedValue(mockVerificationToken({ expiresAt: new Date(Date.now() - 1000) }))
    });
    const service = makeService({ verificationTokenRepo });

    await expect(service.verifyEmail('expired-token')).rejects.toThrow(UnauthorizedError);
    expect(verificationTokenRepo.deleteOne).toHaveBeenCalledOnce();
  });
});

describe('AuthService.resendVerification', () => {
  it('purges old tokens and sends a new verification email when the user is unverified', async () => {
    const emailService = makeEmailService();
    const verificationTokenRepo = makeVerificationTokenRepo();
    const service = makeService({
      userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser({ isEmailVerified: false })) }),
      emailService,
      verificationTokenRepo
    });

    await service.resendVerification({ email: 'test@pharmacy.com' });

    expect(verificationTokenRepo.deleteMany).toHaveBeenCalledOnce();
    expect(verificationTokenRepo.create).toHaveBeenCalledOnce();
    expect(emailService.sendVerificationEmail).toHaveBeenCalledOnce();
  });

  it('returns silently without sending an email when the email is not registered', async () => {
    const emailService = makeEmailService();
    const service = makeService({ emailService });

    await expect(service.resendVerification({ email: 'unknown@example.com' })).resolves.toBeUndefined();
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('throws ConflictError when the user email is already verified', async () => {
    const service = makeService({
      userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser()) })
    });

    await expect(service.resendVerification({ email: 'test@pharmacy.com' })).rejects.toThrow(ConflictError);
  });
});

describe('AuthService.forgotPassword', () => {
  it('purges old reset tokens and sends a password reset email when the user exists', async () => {
    const emailService = makeEmailService();
    const verificationTokenRepo = makeVerificationTokenRepo();
    const service = makeService({
      userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser()) }),
      emailService,
      verificationTokenRepo
    });

    await service.forgotPassword({ email: 'test@pharmacy.com' });

    expect(verificationTokenRepo.deleteMany).toHaveBeenCalledOnce();
    expect(verificationTokenRepo.create).toHaveBeenCalledOnce();
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledOnce();
  });

  it('returns silently without sending an email when the email is not registered', async () => {
    const emailService = makeEmailService();
    const service = makeService({ emailService });

    await expect(service.forgotPassword({ email: 'unknown@example.com' })).resolves.toBeUndefined();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe('AuthService.resetPassword', () => {
  it('stores a hashed password, deletes the token, and revokes all refresh tokens on success', async () => {
    const userRepo = makeUserRepo({
      findOne: vi.fn().mockResolvedValue(mockUser())
    });
    const tokenRepo = makeTokenRepo();
    const verificationTokenRepo = makeVerificationTokenRepo({
      findOne: vi.fn().mockResolvedValue(mockVerificationToken({ type: VerificationTokenTypes.PASSWORD_RESET }))
    });
    const service = makeService({ userRepo, tokenRepo, verificationTokenRepo });

    await service.resetPassword({ token: 'raw-reset-token', newPassword: 'newPassword123' });

    const [, updatedFields] = (userRepo.updateOne as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(updatedFields.password).not.toBe('newPassword123');
    expect(verificationTokenRepo.deleteOne).toHaveBeenCalledOnce();
    expect(tokenRepo.deleteMany).toHaveBeenCalledOnce();
  });

  it('throws UnauthorizedError when the reset token record is not found', async () => {
    const service = makeService();

    await expect(service.resetPassword({ token: 'invalid-token', newPassword: 'newPassword123' })).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError and deletes the token record when the reset token is expired', async () => {
    const verificationTokenRepo = makeVerificationTokenRepo({
      findOne: vi.fn().mockResolvedValue(
        mockVerificationToken({
          type: VerificationTokenTypes.PASSWORD_RESET,
          expiresAt: new Date(Date.now() - 1000)
        })
      )
    });
    const service = makeService({ verificationTokenRepo });

    await expect(service.resetPassword({ token: 'expired-token', newPassword: 'newPassword123' })).rejects.toThrow(UnauthorizedError);
    expect(verificationTokenRepo.deleteOne).toHaveBeenCalledOnce();
  });
});
