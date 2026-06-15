import { Types } from 'mongoose';
import { PatientRepository } from '../../repositories/PatientRepository';
import { PharmacistRepository } from '../../repositories/PharmacistRepository';
import { SettingRepository } from '../../repositories/SettingRepository';
import { FileService } from '../file/index';
import { validateCreatePatientPayload, validateUpdatePatientPayload } from '../../helpers/validation';
import { NotFoundError, ValidationError } from '../../errors/CustomErrors';
import { logger } from '../../helpers/logger';
import { IPatient, IPatientCustomFields, IPatientDocument } from '../../models/Patient';
import { PatientFormFieldIds } from '../../constants';
import { CreatePatientBody, UpdatePatientBody, ListPatientsQuery, ListPatientsResult } from './interface';

export class PatientService {
  constructor(
    private readonly patientRepo: PatientRepository,
    private readonly pharmacistRepo: PharmacistRepository,
    private readonly settingRepo: SettingRepository,
    private readonly fileService: FileService
  ) {}

  async list(query: ListPatientsQuery, userId: string): Promise<ListPatientsResult> {
    const filter = query.search ? { userId, $text: { $search: query.search } } : { userId };
    const patients = await this.patientRepo.find(filter);
    return { patients, total: patients.length };
  }

  async getById(id: string, userId: string): Promise<IPatientDocument> {
    const patient = await this.patientRepo.findOne({ _id: id, userId });
    if (!patient) throw new NotFoundError('Patient not found');
    return patient;
  }

  async create(body: CreatePatientBody, userId: string): Promise<IPatientDocument> {
    validateCreatePatientPayload(body);
    const pharmacistName = await this.resolvePharmacistNames(body.customFields, userId);
    const setting = await this.settingRepo.findOne({ userId: new Types.ObjectId(userId) });
    const formSnapshot = setting?.formConfig?.schema;
    const patient = await this.patientRepo.create({
      ...body,
      pharmacistName,
      userId: new Types.ObjectId(userId),
      ...(formSnapshot !== undefined && { formSnapshot })
    });
    logger.info('Patient Created', { patientId: patient._id.toString(), userId });
    return patient;
  }

  async update(id: string, body: UpdatePatientBody, userId: string): Promise<IPatientDocument> {
    validateUpdatePatientPayload(body);
    const existing = await this.patientRepo.findOne({ _id: id, userId });
    if (!existing) throw new NotFoundError('Patient not found');
    const update: Partial<IPatient> = { ...body };
    if (body.customFields) {
      update.pharmacistName = await this.resolvePharmacistNames(body.customFields, userId);
    }
    const patient = await this.patientRepo.updateOne(id, update, { new: true });
    if (!patient) throw new NotFoundError('Patient not found');
    logger.info('Patient Updated', { patientId: id, userId });
    return patient;
  }

  async delete(id: string, userId: string): Promise<void> {
    const patient = await this.patientRepo.findOne({ _id: id, userId });
    if (!patient) throw new NotFoundError('Patient not found');

    const files = await this.fileService.listByPatient(id, userId);
    for (const file of files) {
      try {
        await this.fileService.delete(file.publicId, userId);
      } catch (error) {
        logger.error('Failed to delete file during patient deletion', { publicId: file.publicId, patientId: id, error });
      }
    }

    await this.patientRepo.deleteOne({ _id: id, userId });
    logger.info('Patient Deleted', { patientId: id, userId });
  }

  private derivePharmacistNames(customFields: IPatientCustomFields): string[] {
    const names: string[] = [];
    for (const section of customFields.sections) {
      for (const fields of section.fields) {
        const value = fields[PatientFormFieldIds.ATTENDED_BY];
        if (typeof value === 'string' && value.trim() !== '') {
          names.push(value);
        }
      }
    }
    return names;
  }

  private async resolvePharmacistNames(customFields: IPatientCustomFields, userId: string): Promise<string[]> {
    const names = this.derivePharmacistNames(customFields);
    if (names.length === 0) {
      throw new ValidationError('Attended by pharmacist required');
    }
    for (const name of new Set(names)) {
      const pharmacist = await this.pharmacistRepo.findOne({ userId, name });
      if (!pharmacist) throw new ValidationError(`Pharmacist "${name}" not found or does not belong to this user`);
    }
    return names;
  }
}
