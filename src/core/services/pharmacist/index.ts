import { Types } from 'mongoose';
import { PharmacistRepository } from '../../repositories/PharmacistRepository';
import { validateCreatePharmacistPayload, validateUpdatePharmacistPayload } from '../../helpers/validation';
import { NotFoundError } from '../../errors/CustomErrors';
import { logger } from '../../helpers/logger';
import { IPharmacistDocument } from '../../models/Pharmacist';
import { CreatePharmacistBody, UpdatePharmacistBody, ListPharmacistsResult } from './interface';

export class PharmacistService {
  constructor(private readonly pharmacistRepo: PharmacistRepository) {}

  async list(userId: string): Promise<ListPharmacistsResult> {
    const pharmacists = await this.pharmacistRepo.find({ userId });
    return { pharmacists, total: pharmacists.length };
  }

  async getById(id: string, userId: string): Promise<IPharmacistDocument> {
    const pharmacist = await this.pharmacistRepo.findOne({ _id: id, userId });
    if (!pharmacist) throw new NotFoundError('Pharmacist not found');
    return pharmacist;
  }

  async create(body: CreatePharmacistBody, userId: string): Promise<IPharmacistDocument> {
    validateCreatePharmacistPayload(body);
    const pharmacist = await this.pharmacistRepo.create({
      ...body,
      userId: new Types.ObjectId(userId)
    });
    logger.info('Pharmacist Created', { pharmacistId: pharmacist._id.toString(), userId });
    return pharmacist;
  }

  async update(id: string, body: UpdatePharmacistBody, userId: string): Promise<IPharmacistDocument> {
    validateUpdatePharmacistPayload(body);
    const pharmacist = await this.pharmacistRepo.findOne({ _id: id, userId });
    if (!pharmacist) throw new NotFoundError('Pharmacist not found');
    const updated = await this.pharmacistRepo.updateOne(id, body, { new: true });
    if (!updated) throw new NotFoundError('Pharmacist not found');
    logger.info('Pharmacist Updated', { pharmacistId: id, userId });
    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const pharmacist = await this.pharmacistRepo.findOne({ _id: id, userId });
    if (!pharmacist) throw new NotFoundError('Pharmacist not found');
    await this.pharmacistRepo.deleteOne({ _id: id, userId });
    logger.info('Pharmacist Deleted', { pharmacistId: id, userId });
  }
}
