import { Types } from 'mongoose';
import { PatientRepository } from '../../repositories/PatientRepository';
import { PharmacistRepository } from '../../repositories/PharmacistRepository';
import { validateCreatePatientPayload, validateUpdatePatientPayload } from '../../helpers/validation';
import { NotFoundError, ValidationError } from '../../errors/CustomErrors';
import { logger } from '../../helpers/logger';
import { IPatientDocument } from '../../models/Patient';
import { CreatePatientBody, UpdatePatientBody, ListPatientsQuery, ListPatientsResult } from './interface';

export class PatientService {
  constructor(
    private readonly patientRepo: PatientRepository,
    private readonly pharmacistRepo: PharmacistRepository
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
    const pharmacist = await this.pharmacistRepo.findOne({ userId, name: body.pharmacistName });
    if (!pharmacist) throw new ValidationError('Pharmacist not found or does not belong to this user');
    const patient = await this.patientRepo.create({
      ...body,
      userId: new Types.ObjectId(userId),
      appointmentDates: body.appointmentDates?.map((d) => new Date(d))
    });
    logger.info('Patient Created', { patientId: patient._id.toString(), userId });
    return patient;
  }

  async update(id: string, body: UpdatePatientBody, userId: string): Promise<IPatientDocument> {
    validateUpdatePatientPayload(body);
    const existing = await this.patientRepo.findOne({ _id: id, userId });
    if (!existing) throw new NotFoundError('Patient not found');
    const update = {
      ...body,
      ...(body.appointmentDates && { appointmentDates: body.appointmentDates.map((d) => new Date(d)) })
    };
    const patient = await this.patientRepo.updateOne(id, update, { new: true });
    if (!patient) throw new NotFoundError('Patient not found');
    logger.info('Patient Updated', { patientId: id, userId });
    return patient;
  }

  async delete(id: string, userId: string): Promise<void> {
    const patient = await this.patientRepo.findOne({ _id: id, userId });
    if (!patient) throw new NotFoundError('Patient not found');
    await this.patientRepo.deleteOne({ _id: id, userId });
    logger.info('Patient Deleted', { patientId: id, userId });
  }
}
