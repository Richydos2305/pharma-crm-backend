import { Schema, model, HydratedDocument } from 'mongoose';
import { IRefreshToken } from '../interfaces/models';

export type { IRefreshToken };

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export type IRefreshTokenDocument = HydratedDocument<IRefreshToken>;
export const RefreshTokenModel = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
