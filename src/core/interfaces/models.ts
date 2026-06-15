import { Types } from 'mongoose';
import { FormConfigData } from '../services/setting/interface';
import { VerificationTokenTypes } from '../constants';

export interface IUser {
  email: string;
  password: string;
  fullName: string;
  role: string;
  isEmailVerified: boolean;
  phoneNumber?: string;
  companyName?: string;
  companyLogo?: string;
  companyLogoPublicId?: string;
  primaryColor?: string;
}

export interface IRefreshToken {
  token: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  isRevoked: boolean;
}

export interface ISetting {
  userId: Types.ObjectId;
  formConfig?: FormConfigData;
}

export type VerificationTokenType = (typeof VerificationTokenTypes)[keyof typeof VerificationTokenTypes];

export interface IVerificationToken {
  userId: Types.ObjectId;
  token: string;
  type: VerificationTokenType;
  expiresAt: Date;
}

export interface IPharmacist {
  userId: Types.ObjectId;
  name: string;
  phoneNumber?: string;
}

export interface IFile {
  url: string;
  publicId: string;
  resourceType: string;
  patientId: Types.ObjectId;
  userId: Types.ObjectId;
}

export interface IPatientCustomFieldsSection {
  name: string;
  fields: Array<Record<string, unknown>>;
}

export interface IPatientCustomFields {
  sections: IPatientCustomFieldsSection[];
}

export interface IPatient {
  userId: Types.ObjectId;
  pharmacistName: string[];
  fullName: string;
  age: number;
  phoneNumber: string;
  customFields: IPatientCustomFields;
  formSnapshot?: Record<string, unknown>;
}
