import { Schema, model, HydratedDocument } from 'mongoose';
import { IUser } from '../interfaces/models';

export type { IUser };

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, default: 'Owner' },
    phoneNumber: { type: String },
    companyName: { type: String },
    companyLogo: { type: String },
    primaryColor: { type: String }
  },
  { timestamps: true }
);

export type IUserDocument = HydratedDocument<IUser>;
export const UserModel = model<IUser>('User', userSchema);
