import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/application', () => ({
  settings: {
    jwtAccessSecret: 'test-access-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    mongoUri: 'mongodb://localhost/test',
    port: '3000',
    nodeEnv: 'test'
  }
}));

import { PharmacistService } from './index';
import { PharmacistRepository } from '../../repositories/PharmacistRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { NotFoundError, ValidationError } from '../../errors/CustomErrors';

const MOCK_USER_ID = '507f1f77bcf86cd799439011';
const MOCK_PHARMACIST_ID = '507f1f77bcf86cd799439012';
const OTHER_USER_ID = '507f1f77bcf86cd799439099';

// ─── Mock data factories ──────────────────────────────────────────────────────

const mockPharmacist = (overrides: Record<string, unknown> = {}) => ({
  _id: MOCK_PHARMACIST_ID,
  name: 'Dr. Jones',
  phoneNumber: '07700900000',
  userId: MOCK_USER_ID,
  ...overrides
});

const mockUser = (overrides: Record<string, unknown> = {}) => ({
  _id: MOCK_USER_ID,
  branches: ['Main'],
  ...overrides
});

// ─── Repository / service factories ──────────────────────────────────────────

const makePharmacistRepo = (overrides = {}): PharmacistRepository =>
  ({
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockPharmacist()),
    updateOne: vi.fn().mockResolvedValue(mockPharmacist()),
    deleteOne: vi.fn().mockResolvedValue({}),
    ...overrides
  }) as unknown as PharmacistRepository;

const makeUserRepo = (overrides = {}): UserRepository =>
  ({
    findOne: vi.fn().mockResolvedValue(mockUser()),
    ...overrides
  }) as unknown as UserRepository;

const makeService = (pharmacistRepo = makePharmacistRepo(), userRepo = makeUserRepo()) => new PharmacistService(pharmacistRepo, userRepo);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PharmacistService.list', () => {
  it('returns all pharmacists and total count for a given user', async () => {
    const pharmacists = [mockPharmacist(), mockPharmacist({ _id: '507f1f77bcf86cd799439020' })];
    const service = makeService(makePharmacistRepo({ find: vi.fn().mockResolvedValue(pharmacists) }));

    const result = await service.list(MOCK_USER_ID);

    expect(result.pharmacists).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});

describe('PharmacistService.getById', () => {
  it('returns the pharmacist when it exists and belongs to the user', async () => {
    const service = makeService(makePharmacistRepo({ findOne: vi.fn().mockResolvedValue(mockPharmacist()) }));

    const result = await service.getById(MOCK_PHARMACIST_ID, MOCK_USER_ID);

    expect(result._id).toBe(MOCK_PHARMACIST_ID);
  });

  it('throws NotFoundError when the pharmacist is not found or belongs to a different user', async () => {
    const service = makeService();

    await expect(service.getById(MOCK_PHARMACIST_ID, OTHER_USER_ID)).rejects.toThrow(NotFoundError);
  });
});

describe('PharmacistService.create', () => {
  it('creates and returns a pharmacist for the given user', async () => {
    const pharmacistRepo = makePharmacistRepo();
    const service = makeService(pharmacistRepo);

    const result = await service.create({ name: 'Dr. Jones', phoneNumber: '07700900000' }, MOCK_USER_ID);

    expect(pharmacistRepo.create).toHaveBeenCalledOnce();
    expect(result._id).toBe(MOCK_PHARMACIST_ID);
  });

  it('creates a pharmacist without checking the user when no branch is provided', async () => {
    const userRepo = makeUserRepo();
    const service = makeService(makePharmacistRepo(), userRepo);

    await service.create({ name: 'Dr. Jones' }, MOCK_USER_ID);

    expect(userRepo.findOne).not.toHaveBeenCalled();
  });

  it("creates a pharmacist when the branch is one of the user's branches", async () => {
    const pharmacistRepo = makePharmacistRepo();
    const service = makeService(pharmacistRepo, makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser({ branches: ['Main', 'North'] })) }));

    await service.create({ name: 'Dr. Jones', branch: 'Main' }, MOCK_USER_ID);

    expect(pharmacistRepo.create).toHaveBeenCalledOnce();
  });

  it("throws ValidationError when the branch is not one of the user's branches", async () => {
    const service = makeService(makePharmacistRepo(), makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser({ branches: ['Main'] })) }));

    await expect(service.create({ name: 'Dr. Jones', branch: 'West' }, MOCK_USER_ID)).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when the user does not exist', async () => {
    const service = makeService(makePharmacistRepo(), makeUserRepo({ findOne: vi.fn().mockResolvedValue(null) }));

    await expect(service.create({ name: 'Dr. Jones', branch: 'Main' }, MOCK_USER_ID)).rejects.toThrow(ValidationError);
  });
});

describe('PharmacistService.update', () => {
  it('returns the updated pharmacist on success', async () => {
    const updated = mockPharmacist({ name: 'Dr. Smith' });
    const service = makeService(
      makePharmacistRepo({
        findOne: vi.fn().mockResolvedValue(mockPharmacist()),
        updateOne: vi.fn().mockResolvedValue(updated)
      })
    );

    const result = await service.update(MOCK_PHARMACIST_ID, { name: 'Dr. Smith' }, MOCK_USER_ID);

    expect(result.name).toBe('Dr. Smith');
  });

  it('throws NotFoundError when the pharmacist does not exist or belongs to a different user', async () => {
    const service = makeService();

    await expect(service.update(MOCK_PHARMACIST_ID, { name: 'Dr. Smith' }, OTHER_USER_ID)).rejects.toThrow(NotFoundError);
  });

  it("updates the pharmacist when the branch is one of the user's branches", async () => {
    const pharmacistRepo = makePharmacistRepo({ findOne: vi.fn().mockResolvedValue(mockPharmacist()) });
    const service = makeService(pharmacistRepo, makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser({ branches: ['Main', 'North'] })) }));

    await service.update(MOCK_PHARMACIST_ID, { branch: 'North' }, MOCK_USER_ID);

    expect(pharmacistRepo.updateOne).toHaveBeenCalledOnce();
  });

  it("throws ValidationError when the branch is not one of the user's branches", async () => {
    const pharmacistRepo = makePharmacistRepo({ findOne: vi.fn().mockResolvedValue(mockPharmacist()) });
    const service = makeService(pharmacistRepo, makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser({ branches: ['Main'] })) }));

    await expect(service.update(MOCK_PHARMACIST_ID, { branch: 'West' }, MOCK_USER_ID)).rejects.toThrow(ValidationError);
  });
});

describe('PharmacistService.delete', () => {
  it('deletes the pharmacist successfully', async () => {
    const pharmacistRepo = makePharmacistRepo({ findOne: vi.fn().mockResolvedValue(mockPharmacist()) });
    const service = makeService(pharmacistRepo);

    await service.delete(MOCK_PHARMACIST_ID, MOCK_USER_ID);

    expect(pharmacistRepo.deleteOne).toHaveBeenCalledOnce();
  });

  it('throws NotFoundError when the pharmacist does not exist or belongs to a different user', async () => {
    const service = makeService();

    await expect(service.delete(MOCK_PHARMACIST_ID, OTHER_USER_ID)).rejects.toThrow(NotFoundError);
  });
});
