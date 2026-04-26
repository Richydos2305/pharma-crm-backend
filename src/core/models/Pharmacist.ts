import { Schema, model, HydratedDocument } from 'mongoose';
import { IPharmacist } from '../interfaces/models';

export type { IPharmacist };

const pharmacistSchema = new Schema<IPharmacist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String }
  },
  { timestamps: true }
);

pharmacistSchema.index({ userId: 1, name: 1 }, { unique: true });

export type IPharmacistDocument = HydratedDocument<IPharmacist>;
export const PharmacistModel = model<IPharmacist>('Pharmacist', pharmacistSchema);
