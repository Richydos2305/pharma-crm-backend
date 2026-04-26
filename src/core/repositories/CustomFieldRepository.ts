import { ICustomField, CustomFieldModel } from '../models/CustomField';
import { BaseRepository } from './BaseRepository';

export class CustomFieldRepository extends BaseRepository<ICustomField> {
  constructor() {
    super(CustomFieldModel);
  }
}
