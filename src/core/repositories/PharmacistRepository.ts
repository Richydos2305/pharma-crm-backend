import { IPharmacist, PharmacistModel } from '../models/Pharmacist';
import { BaseRepository } from './BaseRepository';

export class PharmacistRepository extends BaseRepository<IPharmacist> {
  constructor() {
    super(PharmacistModel);
  }
}
