import { Schema, model, HydratedDocument } from 'mongoose';
import { IPatient } from '../interfaces/models';

export type { IPatient };

const patientSchema = new Schema<IPatient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pharmacistName: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    address: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    prescriptions: [{ type: String, trim: true }],
    appointmentDates: [{ type: Date }],
    notes: { type: String, default: '' },
    customFields: { type: Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true
  }
);

patientSchema.index({ fullName: 'text', phoneNumber: 'text' });

export type IPatientDocument = HydratedDocument<IPatient>;
export const PatientModel = model<IPatient>('Patient', patientSchema);
