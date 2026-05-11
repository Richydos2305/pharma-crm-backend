import { UserRepository } from '../../repositories/UserRepository';
import { sanitizeUser } from '../../helpers/index';
import { NotFoundError, SystemError } from '../../errors/CustomErrors';
import { logger } from '../../helpers/logger';
import { SanitizedUser, UpdateProfileBody } from '../auth/interface';
import { uploadToCloudinary } from '../../helpers';
import { CloudinaryFolder } from '../../constants';
import { validateFileUpload } from '../../helpers/validation';
import { cloudinary } from '../../config/cloudinary';

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

  async uploadLogo(userId: string, file: Express.Multer.File | undefined): Promise<SanitizedUser> {
    validateFileUpload(file);
    try {
      const existing = await this.userRepo.findOne({ _id: userId });
      if (!existing) throw new NotFoundError('User not found');

      if (existing.companyLogoPublicId) {
        await cloudinary.uploader.destroy(existing.companyLogoPublicId, { resource_type: 'image' });
      }

      const result = await uploadToCloudinary(file!, { resource_type: 'image', folder: CloudinaryFolder.COMPANY_LOGOS });
      const user = await this.userRepo.updateOne(userId, { companyLogo: result.secureUrl, companyLogoPublicId: result.publicId }, { new: true });
      if (!user) throw new NotFoundError('User not found');
      logger.info('Company Logo Uploaded', { userId });
      return sanitizeUser(user);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Logo Upload Failed', { error, userId });
      throw new SystemError('Failed to upload logo to storage');
    }
  }
}
