import { IPatientCustomFields, IPatientDocument } from '../../models/Patient';

export interface CreatePatientBody {
  _id?: string;
  fullName: string;
  age: number;
  phoneNumber: string;
  customFields: IPatientCustomFields;
}

export interface UpdatePatientBody {
  fullName?: string;
  age?: number;
  phoneNumber?: string;
  customFields?: IPatientCustomFields;
}

export interface ListPatientsQuery {
  search?: string;
}

export interface ListPatientsResult {
  patients: IPatientDocument[];
  total: number;
}
