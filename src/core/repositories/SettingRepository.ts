import { ISetting, SettingModel } from '../models/Setting';
import { BaseRepository } from './BaseRepository';

export class SettingRepository extends BaseRepository<ISetting> {
  constructor() {
    super(SettingModel);
  }
}
