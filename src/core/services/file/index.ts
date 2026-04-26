import { Types } from 'mongoose';
import { cloudinary } from '../../config/cloudinary';
import { FileRepository } from '../../repositories/FileRepository';
import { NotFoundError, SystemError } from '../../errors/CustomErrors';
import { logger } from '../../helpers/logger';
import { validateFileUpload } from '../../helpers/validation';
import { IFileDocument } from '../../models/File';
import { CloudinaryResourceType, CloudinaryUploadResult } from './interface';

export class FileService {
  constructor(private readonly fileRepo: FileRepository) {}

  private getResourceType(fileType: string): CloudinaryResourceType {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('audio/')) return 'video';
    return 'raw';
  }

  private uploadToCloudinary(file: Express.Multer.File, resourceType: CloudinaryResourceType): Promise<CloudinaryUploadResult> {
    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: resourceType, folder: 'patient-records' }, (error, result) => {
          if (error || !result) return reject(error ?? new Error('No result returned'));
          resolve({ secureUrl: result.secure_url, publicId: result.public_id, resourceType });
        })
        .end(file.buffer);
    });
  }

  async upload(file: Express.Multer.File | undefined, patientId: string, userId: string): Promise<IFileDocument> {
    validateFileUpload(file);

    try {
      const resourceType = this.getResourceType(file!.mimetype);
      const cloudinaryResult = await this.uploadToCloudinary(file!, resourceType);
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
