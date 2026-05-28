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

import { SettingService } from './index';
import { SettingRepository } from '../../repositories/SettingRepository';
import { ConflictError, NotFoundError } from '../../errors/CustomErrors';

const MOCK_USER_ID = '507f1f77bcf86cd799439011';

// ─── Mock data factories ──────────────────────────────────────────────────────

const mockSetting = (overrides: Record<string, unknown> = {}) => ({
  _id: { toString: () => '507f1f77bcf86cd799439014' },
  userId: MOCK_USER_ID,
  formConfig: {},
  ...overrides
});

// ─── Repository / service factories ──────────────────────────────────────────

const makeSettingRepo = (overrides = {}): SettingRepository =>
  ({
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockSetting()),
    updateOne: vi.fn().mockResolvedValue(mockSetting()),
    ...overrides
  }) as unknown as SettingRepository;

const makeService = (settingRepo = makeSettingRepo()) => new SettingService(settingRepo);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SettingService.get', () => {
  it('returns the existing document without calling create when settings exist for the user', async () => {
    const setting = mockSetting();
    const settingRepo = makeSettingRepo({ findOne: vi.fn().mockResolvedValue(setting) });
    const service = makeService(settingRepo);

    const result = await service.get(MOCK_USER_ID);

    expect(result.userId).toBe(MOCK_USER_ID);
    expect(settingRepo.create).not.toHaveBeenCalled();
  });

  it('creates a new document with empty formConfig and returns it when no settings exist', async () => {
    const created = mockSetting({ formConfig: {} });
    const settingRepo = makeSettingRepo({ create: vi.fn().mockResolvedValue(created) });
    const service = makeService(settingRepo);

    const result = await service.get(MOCK_USER_ID);

    expect(settingRepo.create).toHaveBeenCalledOnce();
    expect(result.formConfig).toEqual({});
  });
});

describe('SettingService.create', () => {
  it('creates and returns a new settings document for the user', async () => {
    const settingRepo = makeSettingRepo({ findOne: vi.fn().mockResolvedValue(null) });
    const service = makeService(settingRepo);

    const result = await service.create(MOCK_USER_ID);

    expect(settingRepo.create).toHaveBeenCalledOnce();
    expect(result.userId).toBe(MOCK_USER_ID);
  });

  it('throws ConflictError when settings already exist for the user', async () => {
    const service = makeService(makeSettingRepo({ findOne: vi.fn().mockResolvedValue(mockSetting()) }));

    await expect(service.create(MOCK_USER_ID)).rejects.toThrow(ConflictError);
  });
});

describe('SettingService.set', () => {
  it('updates and returns the settings document when it exists', async () => {
    const updated = mockSetting({ formConfig: { schema: { fields: [] } } });
    const settingRepo = makeSettingRepo({
      findOne: vi.fn().mockResolvedValue(mockSetting()),
      updateOne: vi.fn().mockResolvedValue(updated)
    });
    const service = makeService(settingRepo);

    const result = await service.set(MOCK_USER_ID, { formConfig: { schema: { fields: [] } } });

    expect(settingRepo.updateOne).toHaveBeenCalledOnce();
    expect(result.formConfig).toEqual({ schema: { fields: [] } });
  });

  it('throws NotFoundError when no settings exist to update', async () => {
    const service = makeService();

    await expect(service.set(MOCK_USER_ID, { formConfig: { schema: {} } })).rejects.toThrow(NotFoundError);
  });
});
