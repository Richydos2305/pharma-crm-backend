import { UserRepository } from '../../repositories/UserRepository';
import { sanitizeUser } from '../../helpers/index';
import { NotFoundError } from '../../errors/CustomErrors';
import { logger } from '../../helpers/logger';
import { SanitizedUser, UpdateProfileBody } from '../auth/interface';

export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async getProfile(userId: string): Promise<SanitizedUser> {
    const user = await this.userRepo.findOne({ _id: userId });
    if (!user) throw new NotFoundError('User not found');
    return sanitizeUser(user);
  }

  async updateProfile(userId: string, body: UpdateProfileBody): Promise<SanitizedUser> {
    const user = await this.userRepo.updateOne(userId, body, { new: true });
    if (!user) throw new NotFoundError('User not found');
    logger.info('Profile Updated', { userId });
    return sanitizeUser(user);
  }
}
