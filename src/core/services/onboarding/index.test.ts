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

import { OnboardingService } from './index';
import { PatientRepository } from '../../repositories/PatientRepository';
import { PharmacistRepository } from '../../repositories/PharmacistRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { SettingRepository } from '../../repositories/SettingRepository';

const MOCK_USER_ID = '507f1f77bcf86cd799439011';

// ─── Mock data factories ──────────────────────────────────────────────────────

const mockUser = (overrides: Record<string, unknown> = {}) => ({
  _id: MOCK_USER_ID,
  companyName: 'Pharma Corp',
  phoneNumber: '07700900000',
  ...overrides
});

const mockSetting = (overrides: Record<string, unknown> = {}) => ({
  _id: '507f1f77bcf86cd799439014',
  userId: MOCK_USER_ID,
  formConfig: { schema: { name: 'text' } },
  ...overrides
});

// ─── Repository / service factories ──────────────────────────────────────────

const makePatientRepo = (overrides = {}): PatientRepository =>
  ({
    countDocuments: vi.fn().mockResolvedValue(0),
    ...overrides
  }) as unknown as PatientRepository;

const makePharmacistRepo = (overrides = {}): PharmacistRepository =>
  ({
    countDocuments: vi.fn().mockResolvedValue(0),
    ...overrides
  }) as unknown as PharmacistRepository;

const makeUserRepo = (overrides = {}): UserRepository =>
  ({
    findOne: vi.fn().mockResolvedValue(null),
    ...overrides
  }) as unknown as UserRepository;

const makeSettingRepo = (overrides = {}): SettingRepository =>
  ({
    findOne: vi.fn().mockResolvedValue(null),
    ...overrides
  }) as unknown as SettingRepository;

const makeService = ({
  patientRepo = makePatientRepo(),
  pharmacistRepo = makePharmacistRepo(),
  userRepo = makeUserRepo(),
  settingRepo = makeSettingRepo()
} = {}) => new OnboardingService(patientRepo, pharmacistRepo, userRepo, settingRepo);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OnboardingService.getStatus', () => {
  describe('profileComplete', () => {
    it('is false when user has companyName but no phoneNumber', async () => {
      const service = makeService({
        userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser({ phoneNumber: undefined })) })
      });

      const result = await service.getStatus(MOCK_USER_ID);

      expect(result.steps.profileComplete).toBe(false);
    });

    it('is true when user has both companyName and phoneNumber', async () => {
      const service = makeService({
        userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser()) })
      });

      const result = await service.getStatus(MOCK_USER_ID);

      expect(result.steps.profileComplete).toBe(true);
    });

    it('is false when companyName is an empty string', async () => {
      const service = makeService({
        userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser({ companyName: '' })) })
      });

      const result = await service.getStatus(MOCK_USER_ID);

      expect(result.steps.profileComplete).toBe(false);
    });

    it('is false when phoneNumber is an empty string', async () => {
      const service = makeService({
        userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser({ phoneNumber: '' })) })
      });

      const result = await service.getStatus(MOCK_USER_ID);

      expect(result.steps.profileComplete).toBe(false);
    });
  });

  describe('firstPharmacistAdded', () => {
    it('is false when no pharmacists exist', async () => {
      const service = makeService();

      const result = await service.getStatus(MOCK_USER_ID);

      expect(result.steps.firstPharmacistAdded).toBe(false);
    });

    it('is true when at least one pharmacist exists', async () => {
      const service = makeService({
        pharmacistRepo: makePharmacistRepo({ countDocuments: vi.fn().mockResolvedValue(1) })
      });

      const result = await service.getStatus(MOCK_USER_ID);

      expect(result.steps.firstPharmacistAdded).toBe(true);
    });
  });

  describe('formBuilt', () => {
    it('is false when the settings document does not exist', async () => {
      const service = makeService();

      const result = await service.getStatus(MOCK_USER_ID);

      expect(result.steps.formBuilt).toBe(false);
    });

    it('is false when formConfig.schema is an empty object', async () => {
      const service = makeService({
        settingRepo: makeSettingRepo({
          findOne: vi.fn().mockResolvedValue(mockSetting({ formConfig: { schema: {} } }))
        })
      });

      const result = await service.getStatus(MOCK_USER_ID);

      expect(result.steps.formBuilt).toBe(false);
    });

    it('is true when formConfig.schema has at least one key', async () => {
      const service = makeService({
        settingRepo: makeSettingRepo({ findOne: vi.fn().mockResolvedValue(mockSetting()) })
      });

      const result = await service.getStatus(MOCK_USER_ID);

      expect(result.steps.formBuilt).toBe(true);
    });
  });

  describe('firstPatientAdded', () => {
    it('is false when no patients exist', async () => {
      const service = makeService();

      const result = await service.getStatus(MOCK_USER_ID);

      expect(result.steps.firstPatientAdded).toBe(false);
    });

    it('is true when at least one patient exists', async () => {
      const service = makeService({
        patientRepo: makePatientRepo({ countDocuments: vi.fn().mockResolvedValue(1) })
      });

      const result = await service.getStatus(MOCK_USER_ID);

      expect(result.steps.firstPatientAdded).toBe(true);
    });
  });

  describe('allComplete', () => {
    it('is true when all four steps are complete', async () => {
      const service = makeService({
        patientRepo: makePatientRepo({ countDocuments: vi.fn().mockResolvedValue(1) }),
        pharmacistRepo: makePharmacistRepo({ countDocuments: vi.fn().mockResolvedValue(1) }),
        userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser()) }),
        settingRepo: makeSettingRepo({ findOne: vi.fn().mockResolvedValue(mockSetting()) })
      });

      const result = await service.getStatus(MOCK_USER_ID);

      expect(result.allComplete).toBe(true);
    });

    it('is false when any one step is incomplete', async () => {
      const service = makeService({
        patientRepo: makePatientRepo({ countDocuments: vi.fn().mockResolvedValue(0) }),
        pharmacistRepo: makePharmacistRepo({ countDocuments: vi.fn().mockResolvedValue(1) }),
        userRepo: makeUserRepo({ findOne: vi.fn().mockResolvedValue(mockUser()) }),
        settingRepo: makeSettingRepo({ findOne: vi.fn().mockResolvedValue(mockSetting()) })
      });

      const result = await service.getStatus(MOCK_USER_ID);

      expect(result.allComplete).toBe(false);
    });
  });
});
