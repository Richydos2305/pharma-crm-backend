import { Schema, model, HydratedDocument } from 'mongoose';
import { ISetting } from '../interfaces/models';

export type { ISetting };

const formCustomFieldSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['text', 'textarea', 'number', 'date', 'boolean', 'file', 'dropdown']
    },
    required: { type: Boolean, default: false },
    section: { type: String, trim: true },
    description: { type: String, trim: true },
    options: [{ type: String, trim: true }]
  },
  { _id: false }
);

const settingSchema = new Schema<ISetting>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    formConfig: {
      customFields: { type: [formCustomFieldSchema], default: [] }
    }
  },
  { timestamps: true }
);

export type ISettingDocument = HydratedDocument<ISetting>;
export const SettingModel = model<ISetting>('Setting', settingSchema);
