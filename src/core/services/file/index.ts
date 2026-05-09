import { Types } from 'mongoose';
import { cloudinary } from '../../config/cloudinary';
import { FileRepository } from '../../repositories/FileRepository';
import { NotFoundError, SystemError } from '../../errors/CustomErrors';
import { logger } from '../../helpers/logger';
import { validateFileUpload } from '../../helpers/validation';
import { IFileDocument } from '../../models/File';
import { CloudinaryUploadResult } from '../../interfaces/helpers';
import { getCloudinaryResourceType, uploadToCloudinary } from '../../helpers';
import { CloudinaryFolder } from '../../constants';

export class FileService {
  constructor(private readonly fileRepo: FileRepository) {}

  async upload(file: Express.Multer.File | undefined, patientId: string, userId: string): Promise<IFileDocument> {
    validateFileUpload(file);

    try {
      const resourceType = getCloudinaryResourceType(file!.mimetype);
      const cloudinaryResult: CloudinaryUploadResult = await uploadToCloudinary(file!, {
        resource_type: resourceType,
        folder: CloudinaryFolder.PATIENT_RECORDS
      });
      const newFile = await this.fileRepo.create({
        url: cloudinaryResult.secureUrl,
        publicId: cloudinaryResult.publicId,
        resourceType: cloudinaryResult.resourceType,
        patientId: new Types.ObjectId(patientId),
        userId: new Types.ObjectId(userId)
      });
      logger.info('File Uploaded', { fileId: newFile._id.toString(), patientId, userId });
      return newFile;
    } catch (error) {
      logger.error('Cloudinary Upload Failed', { error, patientId });
      throw new SystemError('Failed to upload file to storage');
    }
  }

  async listByPatient(patientId: string, userId: string): Promise<IFileDocument[]> {
    return this.fileRepo.find({ patientId: new Types.ObjectId(patientId), userId });
  }

  async delete(publicId: string, userId: string): Promise<void> {
    const file = await this.fileRepo.findOne({ publicId, userId });
    if (!file) throw new NotFoundError('File not found');

    try {
      await cloudinary.uploader.destroy(file.publicId, {
        resource_type: file.resourceType as 'image' | 'video' | 'raw'
      });

      await this.fileRepo.deleteOne({ publicId, userId });
      logger.info('File Deleted', { publicId, userId });
    } catch (error) {
      logger.error('Cloudinary Delete Failed', { error, publicId: file.publicId });
      throw new SystemError('Failed to delete file from storage');
    }
  }
}
