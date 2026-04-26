import { CustomFieldRepository } from '../../repositories/CustomFieldRepository';
import { validateCreateCustomFieldPayload, validateUpdateCustomFieldPayload } from '../../helpers/validation';
import { ConflictError, NotFoundError } from '../../errors/CustomErrors';
import { logger } from '../../helpers/logger';
import { ICustomFieldDocument } from '../../models/CustomField';
import { CreateCustomFieldBody, UpdateCustomFieldBody } from './interface';

export class CustomFieldService {
  constructor(private readonly customFieldRepo: CustomFieldRepository) {}

  async list(): Promise<ICustomFieldDocument[]> {
    return this.customFieldRepo.find({});
  }

  async create(body: CreateCustomFieldBody): Promise<ICustomFieldDocument> {
    validateCreateCustomFieldPayload(body);
    const existing = await this.customFieldRepo.findOne({ name: body.name });
    if (existing) throw new ConflictError(`Custom field '${body.name}' already exists`);
    const field = await this.customFieldRepo.create(body);
    logger.info('Custom Field Created', { fieldId: field._id.toString(), name: body.name });
    return field;
  }

  async update(id: string, body: UpdateCustomFieldBody): Promise<ICustomFieldDocument> {
    validateUpdateCustomFieldPayload(body);
    const field = await this.customFieldRepo.updateOne(id, body, { new: true });
    if (!field) throw new NotFoundError('Custom field not found');
    logger.info('Custom Field Updated', { fieldId: id });
    return field;
  }

  async delete(id: string): Promise<void> {
    const field = await this.customFieldRepo.findOne({ _id: id });
    if (!field) throw new NotFoundError('Custom field not found');
    await this.customFieldRepo.deleteOne({ _id: id });
    logger.info('Custom Field Deleted', { fieldId: id });
  }
}
