import { Types } from 'mongoose';
import { SettingRepository } from '../../repositories/SettingRepository';
import { ConflictError, NotFoundError } from '../../errors/CustomErrors';
import { logger } from '../../helpers/logger';
import { ISettingDocument } from '../../models/Setting';
import { SettingsData } from './interface';

export class SettingService {
  constructor(private readonly settingRepo: SettingRepository) {}

  async get(userId: string): Promise<ISettingDocument> {
    const setting = await this.settingRepo.findOne({ userId: new Types.ObjectId(userId) });
    if (!setting) throw new NotFoundError('Settings not found');
    return setting;
  }

  async create(userId: string): Promise<ISettingDocument> {
    const existing = await this.settingRepo.findOne({ userId: new Types.ObjectId(userId) });
    if (existing) throw new ConflictError('Settings already exist for this user');
    const setting = await this.settingRepo.create({
      userId: new Types.ObjectId(userId),
      formConfig: { customFields: [] }
    });
    logger.info('Settings Created', { userId });
    return setting;
  }

  async set(userId: string, data: SettingsData): Promise<ISettingDocument> {
    const setting = await this.settingRepo.findOne({ userId: new Types.ObjectId(userId) });
    if (!setting) throw new NotFoundError('Settings not found');
    const update: Record<string, unknown> = {};
    if (data.formConfig !== undefined) update['formConfig'] = data.formConfig;
    const updated = await this.settingRepo.updateOne(setting._id.toString(), { $set: update }, { new: true });
    logger.info('Settings Updated', { userId });
    return updated!;
  }
}
