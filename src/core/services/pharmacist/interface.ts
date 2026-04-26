import { IPharmacistDocument } from '../../models/Pharmacist';

export interface CreatePharmacistBody {
  name: string;
  phoneNumber?: string;
}

export interface UpdatePharmacistBody {
  name?: string;
  phoneNumber?: string;
}

export interface ListPharmacistsResult {
  pharmacists: IPharmacistDocument[];
  total: number;
}
