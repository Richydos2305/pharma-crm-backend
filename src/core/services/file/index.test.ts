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

import { FileService } from './index';
import { FileRepository } from '../../repositories/FileRepository';
import { NotFoundError, SystemError, ValidationError } from '../../errors/CustomErrors';
import { cloudinary } from '../../config/cloudinary';
import { uploadToCloudinary } from '../../helpers';

const MOCK_USER_ID = '507f1f77bcf86cd799439011';
const MOCK_PATIENT_ID = '507f1f77bcf86cd799439012';
const OTHER_USER_ID = '507f1f77bcf86cd799439099';

// ─── Mock data factories ──────────────────────────────────────────────────────

const mockFileDoc = (overrides: Record<string, unknown> = {}) => ({
  _id: '507f1f77bcf86cd799439013',
  url: 'https://res.cloudinary.com/file.pdf',
  publicId: 'patient-records/file-123',
  resourceType: 'raw',
  patientId: MOCK_PATIENT_ID,
  userId: MOCK_USER_ID,
  ...overrides
});

const mockMulterFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'report.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  buffer: Buffer.from(''),
  size: 1024,
  stream: null as never,
  destination: '',
  filename: '',
  path: '',
  ...overrides
});

// ─── Repository / service factories ──────────────────────────────────────────

const makeFileRepo = (overrides = {}): FileRepository =>
  ({
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockFileDoc()),
    deleteOne: vi.fn().mockResolvedValue({}),
    ...overrides
  }) as unknown as FileRepository;

const makeService = (fileRepo = makeFileRepo()) => new FileService(fileRepo);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FileService.upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(uploadToCloudinary).mockResolvedValue({
      secureUrl: 'https://res.cloudinary.com/file.pdf',
      publicId: 'patient-records/file-123',
      resourceType: 'raw'
    });
  });

  it('uploads the file to Cloudinary and saves the metadata to the database', async () => {
    const fileRepo = makeFileRepo();
    const service = makeService(fileRepo);

    const result = await service.upload(mockMulterFile(), MOCK_PATIENT_ID, MOCK_USER_ID);

    expect(uploadToCloudinary).toHaveBeenCalledOnce();
    expect(fileRepo.create).toHaveBeenCalledOnce();
    expect(result.publicId).toBe('patient-records/file-123');
  });

  it('throws ValidationError when no file is provided', async () => {
    const service = makeService();

    await expect(service.upload(undefined, MOCK_PATIENT_ID, MOCK_USER_ID)).rejects.toThrow(ValidationError);
  });

  it('throws SystemError when the Cloudinary upload fails', async () => {
    vi.mocked(uploadToCloudinary).mockRejectedValue(new Error('Network error'));
    const service = makeService();

    await expect(service.upload(mockMulterFile(), MOCK_PATIENT_ID, MOCK_USER_ID)).rejects.toThrow(SystemError);
  });
});

describe('FileService.listByPatient', () => {
  it('returns all files for a given patient and user', async () => {
    const files = [mockFileDoc(), mockFileDoc({ _id: '507f1f77bcf86cd799439020' })];
    const service = makeService(makeFileRepo({ find: vi.fn().mockResolvedValue(files) }));

    const result = await service.listByPatient(MOCK_PATIENT_ID, MOCK_USER_ID);

    expect(result).toHaveLength(2);
  });

  it('returns an empty array when the patient does not belong to the requesting user', async () => {
    const service = makeService(makeFileRepo({ find: vi.fn().mockResolvedValue([]) }));

    const result = await service.listByPatient(MOCK_PATIENT_ID, OTHER_USER_ID);

    expect(result).toHaveLength(0);
  });
});

describe('FileService.delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cloudinary.uploader.destroy).mockResolvedValue({ result: 'ok' });
  });

  it('deletes the file from Cloudinary and removes the database record', async () => {
    const fileDoc = mockFileDoc();
    const fileRepo = makeFileRepo({ findOne: vi.fn().mockResolvedValue(fileDoc) });
    const service = makeService(fileRepo);

    await service.delete(fileDoc.publicId, MOCK_USER_ID);

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(fileDoc.publicId, { resource_type: fileDoc.resourceType });
    expect(fileRepo.deleteOne).toHaveBeenCalledOnce();
  });

  it('throws NotFoundError when the file record does not exist', async () => {
    const service = makeService();

    await expect(service.delete('patient-records/file-123', MOCK_USER_ID)).rejects.toThrow(NotFoundError);
  });

  it('throws SystemError when the Cloudinary delete call fails', async () => {
    vi.mocked(cloudinary.uploader.destroy).mockRejectedValue(new Error('Cloudinary error'));
    const fileDoc = mockFileDoc();
    const service = makeService(makeFileRepo({ findOne: vi.fn().mockResolvedValue(fileDoc) }));

    await expect(service.delete(fileDoc.publicId, MOCK_USER_ID)).rejects.toThrow(SystemError);
  });
});
