import { IPatient, PatientModel } from '../models/Patient';
import { BaseRepository } from './BaseRepository';

export class PatientRepository extends BaseRepository<IPatient> {
  constructor() {
    super(PatientModel);
  }
}
