import { Schema, model, HydratedDocument } from 'mongoose';
import { IPatient, IPatientCustomFields } from '../interfaces/models';

export type { IPatient, IPatientCustomFields };

const patientSchema = new Schema<IPatient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pharmacistName: { type: [String], required: true },
    fullName: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    phoneNumber: { type: String, required: true, trim: true },
    customFields: { type: Schema.Types.Mixed, default: { sections: [] } },
    formSnapshot: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

patientSchema.index({ fullName: 'text', phoneNumber: 'text' });

export type IPatientDocument = HydratedDocument<IPatient>;
export const PatientModel = model<IPatient>('Patient', patientSchema);
