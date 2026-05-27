import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/application', () => ({
  settings: {
    jwtAccessSecret: 'test-access-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    mongoUri: 'mongodb://localhost/test',
    port: '3000',
    nodeEnv: 'test'
  }
}));

vi.mock('../../config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      destroy: vi.fn()
    }
  }
}));

vi.mock('../../helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../helpers')>();
  return { ...actual, uploadToCloudinary: vi.fn() };
});

import { UserService } from './index';
import { UserRepository } from '../../repositories/UserRepository';
import { NotFoundError, SystemError, ValidationError } from '../../errors/CustomErrors';
import { cloudinary } from '../../config/cloudinary';
import { uploadToCloudinary } from '../../helpers';

const MOCK_USER_ID = '507f1f77bcf86cd799439011';

// ─── Mock data factories ──────────────────────────────────────────────────────

const mockUser = (overrides: Record<string, unknown> = {}) => ({
  _id: MOCK_USER_ID,
  email: 'test@pharmacy.com',
  password: 'hashed-password',
  fullName: 'John Doe',
  role: 'pharmacist',
  isEmailVerified: true,
  companyLogo: null,
  companyLogoPublicId: null,
  toObject() {
    return { ...this };
  },
  ...overrides
});

const mockFile = { mimetype: 'image/png', buffer: Buffer.from('') } as Express.Multer.File;

// ─── Repository / service factories ──────────────────────────────────────────

const makeUserRepo = (overrides = {}): UserRepository =>
  ({
    findOne: vi.fn().mockResolvedValue(null),
    updateOne: vi.fn().mockResolvedValue(mockUser()),
    ...overrides
  }) as unknown as UserRepository;

const makeService = (userRepo = makeUserRepo()) => new UserService(userRepo);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UserService.getProfile', () => {
  it('returns sanitised user when the user exists', async () => {
    const service = makeService(makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser()) }));

    const result = await service.getProfile(MOCK_USER_ID);

    expect(result.email).toBe('test@pharmacy.com');
    expect(result).not.toHaveProperty('password');
  });

  it('throws NotFoundError when the user is not found', async () => {
    const service = makeService();

    await expect(service.getProfile(MOCK_USER_ID)).rejects.toThrow(NotFoundError);
  });
});

describe('UserService.updateProfile', () => {
  it('returns sanitised updated user on success', async () => {
    const updated = mockUser({ fullName: 'Jane Doe' });
    const service = makeService(makeUserRepo({ updateOne: vi.fn().mockResolvedValue(updated) }));

    const result = await service.updateProfile(MOCK_USER_ID, { fullName: 'Jane Doe' });

    expect(result.fullName).toBe('Jane Doe');
    expect(result).not.toHaveProperty('password');
  });

  it('throws NotFoundError when the user is not found', async () => {
    const service = makeService(makeUserRepo({ updateOne: vi.fn().mockResolvedValue(null) }));

    await expect(service.updateProfile(MOCK_USER_ID, { fullName: 'Jane Doe' })).rejects.toThrow(NotFoundError);
  });
});

describe('UserService.uploadLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(uploadToCloudinary).mockResolvedValue({
      secureUrl: 'https://res.cloudinary.com/logo.png',
      publicId: 'company-logos/logo-123',
      resourceType: 'image'
    });
    vi.mocked(cloudinary.uploader.destroy).mockResolvedValue({ result: 'ok' });
  });

  it('uploads the new logo and returns the updated sanitised user', async () => {
    const user = mockUser({ companyLogoPublicId: null });
    const updated = mockUser({ companyLogo: 'https://res.cloudinary.com/logo.png' });
    const service = makeService(
      makeUserRepo({
        findOne: vi.fn().mockResolvedValue(user),
        updateOne: vi.fn().mockResolvedValue(updated)
      })
    );

    const result = await service.uploadLogo(MOCK_USER_ID, mockFile);

    expect(uploadToCloudinary).toHaveBeenCalledOnce();
    expect(result).not.toHaveProperty('password');
  });

  it('deletes the old logo from Cloudinary when one already exists', async () => {
    const user = mockUser({ companyLogoPublicId: 'old-logo-public-id' });
    const service = makeService(
      makeUserRepo({
        findOne: vi.fn().mockResolvedValue(user),
        updateOne: vi.fn().mockResolvedValue(mockUser())
      })
    );

    await service.uploadLogo(MOCK_USER_ID, mockFile);

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('old-logo-public-id', { resource_type: 'image' });
  });

  it('skips Cloudinary deletion when no previous logo exists', async () => {
    const user = mockUser({ companyLogoPublicId: null });
    const service = makeService(
      makeUserRepo({
        findOne: vi.fn().mockResolvedValue(user),
        updateOne: vi.fn().mockResolvedValue(mockUser())
      })
    );

    await service.uploadLogo(MOCK_USER_ID, mockFile);

    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the user is not found', async () => {
    const service = makeService(makeUserRepo({ findOne: vi.fn().mockResolvedValue(null) }));

    await expect(service.uploadLogo(MOCK_USER_ID, mockFile)).rejects.toThrow(NotFoundError);
  });

  it('throws ValidationError when no file is provided', async () => {
    const service = makeService();

    await expect(service.uploadLogo(MOCK_USER_ID, undefined)).rejects.toThrow(ValidationError);
  });

  it('throws SystemError when the Cloudinary upload fails', async () => {
    vi.mocked(uploadToCloudinary).mockRejectedValue(new Error('Network error'));
    const user = mockUser({ companyLogoPublicId: null });
    const service = makeService(makeUserRepo({ findOne: vi.fn().mockResolvedValue(user) }));

    await expect(service.uploadLogo(MOCK_USER_ID, mockFile)).rejects.toThrow(SystemError);
  });
});
