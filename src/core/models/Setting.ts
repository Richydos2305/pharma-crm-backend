import { Schema, model, HydratedDocument } from 'mongoose';
import { ISetting } from '../interfaces/models';

export type { ISetting };

const settingSchema = new Schema<ISetting>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    formConfig: {
      schema: { type: Schema.Types.Mixed }
    }
  },
  { timestamps: true }
);

export type ISettingDocument = HydratedDocument<ISetting>;
export const SettingModel = model<ISetting>('Setting', settingSchema);
