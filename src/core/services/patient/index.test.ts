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

import { PatientService } from './index';
import { PatientRepository } from '../../repositories/PatientRepository';
import { PharmacistRepository } from '../../repositories/PharmacistRepository';
import { SettingRepository } from '../../repositories/SettingRepository';
import { FileService } from '../file/index';
import { NotFoundError, ValidationError } from '../../errors/CustomErrors';

const MOCK_USER_ID = '507f1f77bcf86cd799439011';
const MOCK_PATIENT_ID = '507f1f77bcf86cd799439012';
const OTHER_USER_ID = '507f1f77bcf86cd799439099';

// ─── Mock data factories ──────────────────────────────────────────────────────

const mockPatient = (overrides: Record<string, unknown> = {}) => ({
  _id: MOCK_PATIENT_ID,
  fullName: 'Jane Smith',
  age: 30,
  phoneNumber: '07700900000',
  pharmacistName: 'Dr. Jones',
  userId: MOCK_USER_ID,
  ...overrides
});

const mockPharmacist = (overrides: Record<string, unknown> = {}) => ({
  _id: '507f1f77bcf86cd799439013',
  name: 'Dr. Jones',
  userId: MOCK_USER_ID,
  ...overrides
});

const mockSetting = (overrides: Record<string, unknown> = {}) => ({
  _id: '507f1f77bcf86cd799439014',
  userId: MOCK_USER_ID,
  formConfig: { schema: { fields: [] } },
  ...overrides
});

const mockFile = (overrides: Record<string, unknown> = {}) => ({
  _id: '507f1f77bcf86cd799439015',
  publicId: 'patient-records/file-123',
  userId: MOCK_USER_ID,
  patientId: MOCK_PATIENT_ID,
  ...overrides
});

const createPatientBody = () => ({
  fullName: 'Jane Smith',
  age: 30,
  phoneNumber: '07700900000',
  pharmacistName: 'Dr. Jones'
});

// ─── Repository / service factories ──────────────────────────────────────────

const makePatientRepo = (overrides = {}): PatientRepository =>
  ({
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockPatient()),
    updateOne: vi.fn().mockResolvedValue(mockPatient()),
    deleteOne: vi.fn().mockResolvedValue({}),
    ...overrides
  }) as unknown as PatientRepository;

const makePharmacistRepo = (overrides = {}): PharmacistRepository =>
  ({
    findOne: vi.fn().mockResolvedValue(null),
    ...overrides
  }) as unknown as PharmacistRepository;

const makeSettingRepo = (overrides = {}): SettingRepository =>
  ({
    findOne: vi.fn().mockResolvedValue(null),
    ...overrides
  }) as unknown as SettingRepository;

const makeFileService = (overrides = {}): FileService =>
  ({
    listByPatient: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides
  }) as unknown as FileService;

const makeService = ({
  patientRepo = makePatientRepo(),
  pharmacistRepo = makePharmacistRepo(),
  settingRepo = makeSettingRepo(),
  fileService = makeFileService()
} = {}) => new PatientService(patientRepo, pharmacistRepo, settingRepo, fileService);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PatientService.list', () => {
  it('returns all patients and total count for a given user', async () => {
    const patients = [mockPatient(), mockPatient({ _id: '507f1f77bcf86cd799439020' })];
    const service = makeService({
      patientRepo: makePatientRepo({ find: vi.fn().mockResolvedValue(patients) })
    });

    const result = await service.list({}, MOCK_USER_ID);

    expect(result.patients).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('applies a $text search filter when a search query is provided', async () => {
    const patientRepo = makePatientRepo({ find: vi.fn().mockResolvedValue([mockPatient()]) });
    const service = makeService({ patientRepo });

    await service.list({ search: 'Jane' }, MOCK_USER_ID);

    expect(patientRepo.find).toHaveBeenCalledWith({ userId: MOCK_USER_ID, $text: { $search: 'Jane' } });
  });
});

describe('PatientService.getById', () => {
  it('returns the patient when it exists and belongs to the user', async () => {
    const patient = mockPatient();
    const service = makeService({
      patientRepo: makePatientRepo({ findOne: vi.fn().mockResolvedValue(patient) })
    });

    const result = await service.getById(MOCK_PATIENT_ID, MOCK_USER_ID);

    expect(result._id).toBe(MOCK_PATIENT_ID);
  });

  it('throws NotFoundError when the patient is not found', async () => {
    const service = makeService();

    await expect(service.getById(MOCK_PATIENT_ID, MOCK_USER_ID)).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when the patient exists but belongs to a different user', async () => {
    const service = makeService({
      patientRepo: makePatientRepo({ findOne: vi.fn().mockResolvedValue(null) })
    });

    await expect(service.getById(MOCK_PATIENT_ID, OTHER_USER_ID)).rejects.toThrow(NotFoundError);
  });
});

describe('PatientService.create', () => {
  it('creates and returns a patient with the form snapshot from user settings', async () => {
    const setting = mockSetting();
    const patient = mockPatient({ formSnapshot: setting.formConfig.schema });
    const patientRepo = makePatientRepo({ create: vi.fn().mockResolvedValue(patient) });
    const service = makeService({
      patientRepo,
      pharmacistRepo: makePharmacistRepo({ findOne: vi.fn().mockResolvedValue(mockPharmacist()) }),
      settingRepo: makeSettingRepo({ findOne: vi.fn().mockResolvedValue(setting) })
    });

    const result = await service.create(createPatientBody(), MOCK_USER_ID);

    expect(patientRepo.create).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ _id: MOCK_PATIENT_ID });
  });

  it('creates a patient without a form snapshot when no settings exist', async () => {
    const patientRepo = makePatientRepo();
    const service = makeService({
      patientRepo,
      pharmacistRepo: makePharmacistRepo({ findOne: vi.fn().mockResolvedValue(mockPharmacist()) }),
      settingRepo: makeSettingRepo({ findOne: vi.fn().mockResolvedValue(null) })
    });

    await service.create(createPatientBody(), MOCK_USER_ID);

    const [createdDoc] = (patientRepo.create as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(createdDoc).not.toHaveProperty('formSnapshot');
  });

  it('throws ValidationError when the named pharmacist does not belong to the user', async () => {
    const service = makeService({
      pharmacistRepo: makePharmacistRepo({ findOne: vi.fn().mockResolvedValue(null) })
    });

    await expect(service.create(createPatientBody(), MOCK_USER_ID)).rejects.toThrow(ValidationError);
  });
});

describe('PatientService.update', () => {
  it('returns the updated patient on success', async () => {
    const updated = mockPatient({ fullName: 'Jane Updated' });
    const service = makeService({
      patientRepo: makePatientRepo({
        findOne: vi.fn().mockResolvedValue(mockPatient()),
        updateOne: vi.fn().mockResolvedValue(updated)
      })
    });

    const result = await service.update(MOCK_PATIENT_ID, { fullName: 'Jane Updated' }, MOCK_USER_ID);

    expect(result.fullName).toBe('Jane Updated');
  });

  it('throws NotFoundError when the patient does not exist or belongs to a different user', async () => {
    const service = makeService();

    await expect(service.update(MOCK_PATIENT_ID, { fullName: 'Jane Updated' }, MOCK_USER_ID)).rejects.toThrow(NotFoundError);
  });
});

describe('PatientService.delete', () => {
  it('deletes the patient and all associated files', async () => {
    const files = [mockFile(), mockFile({ publicId: 'patient-records/file-456' })];
    const fileService = makeFileService({ listByPatient: vi.fn().mockResolvedValue(files) });
    const patientRepo = makePatientRepo({ findOne: vi.fn().mockResolvedValue(mockPatient()) });
    const service = makeService({ patientRepo, fileService });

    await service.delete(MOCK_PATIENT_ID, MOCK_USER_ID);

    expect(fileService.delete).toHaveBeenCalledTimes(2);
    expect(patientRepo.deleteOne).toHaveBeenCalledOnce();
  });

  it('still deletes the patient even when a file deletion fails', async () => {
    const files = [mockFile()];
    const fileService = makeFileService({
      listByPatient: vi.fn().mockResolvedValue(files),
      delete: vi.fn().mockRejectedValue(new Error('Cloudinary error'))
    });
    const patientRepo = makePatientRepo({ findOne: vi.fn().mockResolvedValue(mockPatient()) });
    const service = makeService({ patientRepo, fileService });

    await service.delete(MOCK_PATIENT_ID, MOCK_USER_ID);

    expect(patientRepo.deleteOne).toHaveBeenCalledOnce();
  });

  it('throws NotFoundError when the patient does not exist or belongs to a different user', async () => {
    const service = makeService();

    await expect(service.delete(MOCK_PATIENT_ID, MOCK_USER_ID)).rejects.toThrow(NotFoundError);
  });
});
