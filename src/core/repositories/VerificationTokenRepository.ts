import { IVerificationToken, VerificationTokenModel } from '../models/VerificationToken';
import { BaseRepository } from './BaseRepository';

export class VerificationTokenRepository extends BaseRepository<IVerificationToken> {
  constructor() {
    super(VerificationTokenModel);
  }
}
