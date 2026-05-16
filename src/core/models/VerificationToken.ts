import { Schema, model, HydratedDocument } from 'mongoose';
import { IVerificationToken } from '../interfaces/models';
import { VerificationTokenTypes } from '../constants';

export type { IVerificationToken };

const verificationTokenSchema = new Schema<IVerificationToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    type: { type: String, enum: Object.values(VerificationTokenTypes), required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export type IVerificationTokenDocument = HydratedDocument<IVerificationToken>;
export const VerificationTokenModel = model<IVerificationToken>('VerificationToken', verificationTokenSchema);
