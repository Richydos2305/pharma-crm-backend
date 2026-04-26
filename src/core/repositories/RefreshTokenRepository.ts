import { IRefreshToken, RefreshTokenModel } from '../models/RefreshToken';
import { BaseRepository } from './BaseRepository';

export class RefreshTokenRepository extends BaseRepository<IRefreshToken> {
  constructor() {
    super(RefreshTokenModel);
  }
}
