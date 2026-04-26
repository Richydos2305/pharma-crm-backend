import { Types } from 'mongoose';

export interface IUser {
  email: string;
  password: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
  companyName?: string;
  companyLogo?: string;
  primaryColor?: string;
}

export interface IRefreshToken {
  token: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  isRevoked: boolean;
}

export interface ICustomField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'file' | 'dropdown';
  required: boolean;
  description: string;
  options?: string[];
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

export interface IPatient {
  userId: Types.ObjectId;
  pharmacistName: string;
  fullName: string;
  age: number;
  address: string;
  phoneNumber: string;
  prescriptions: string[];
  appointmentDates: Date[];
  notes: string;
  customFields: Record<string, unknown>;
}
