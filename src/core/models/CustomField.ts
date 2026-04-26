import { Schema, model, HydratedDocument } from 'mongoose';
import { ICustomField } from '../interfaces/models';

export type { ICustomField };

const customFieldSchema = new Schema<ICustomField>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['text', 'textarea', 'number', 'date', 'boolean', 'file', 'dropdown'] },
    required: { type: Boolean, default: false },
    description: { type: String, default: '' },
    options: [{ type: String }]
  },
  { timestamps: true }
);

export type ICustomFieldDocument = HydratedDocument<ICustomField>;
export const CustomFieldModel = model<ICustomField>('CustomField', customFieldSchema);
