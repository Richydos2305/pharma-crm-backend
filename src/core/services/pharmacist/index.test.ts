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
import { NotFoundError } from '../../errors/CustomErrors';

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

const makeService = (pharmacistRepo = makePharmacistRepo()) => new PharmacistService(pharmacistRepo);

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
