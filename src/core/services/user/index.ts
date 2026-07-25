import { UserRepository } from '../../repositories/UserRepository';
import { PharmacistRepository } from '../../repositories/PharmacistRepository';
import { sanitizeUser } from '../../helpers/index';
import { NotFoundError, SystemError, ValidationError } from '../../errors/CustomErrors';
import { logger } from '../../helpers/logger';
import { SanitizedUser, UpdateProfileBody } from '../auth/interface';
import { uploadToCloudinary } from '../../helpers';
import { CloudinaryFolder } from '../../constants';
import { validateFileUpload } from '../../helpers/validation';
import { cloudinary } from '../../config/cloudinary';

export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly pharmacistRepo: PharmacistRepository
  ) {}

  async getProfile(userId: string): Promise<SanitizedUser> {
    const user = await this.userRepo.findOne({ _id: userId });
    if (!user) throw new NotFoundError('User not found');
    return sanitizeUser(user);
  }

  async updateProfile(userId: string, body: UpdateProfileBody): Promise<SanitizedUser> {
    if (body.branches) {
      const existing = await this.userRepo.findOne({ _id: userId });
      if (!existing) throw new NotFoundError('User not found');
      await this.validateBranchRemovalAllowed(userId, existing.branches, body.branches);
    }
    const user = await this.userRepo.updateOne(userId, body, { new: true });
    if (!user) throw new NotFoundError('User not found');
    logger.info('Profile Updated', { userId });
    return sanitizeUser(user);
  }

  private async validateBranchRemovalAllowed(userId: string, existingBranches: string[], newBranches: string[]): Promise<void> {
    const removedBranches = existingBranches.filter((b) => !newBranches.includes(b));
    if (removedBranches.length === 0) return;
    const stillAssigned = await this.pharmacistRepo.find({ userId, branch: { $in: removedBranches } });
    if (stillAssigned.length > 0) {
      const branches = [...new Set(stillAssigned.map((p) => p.branch))].join(', ');
      throw new ValidationError(`Cannot remove branch(es) still assigned to a pharmacist: ${branches}`);
    }
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
