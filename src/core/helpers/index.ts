import { Document } from 'mongoose';
import { Response } from 'express';
import { ResponseHandlerParams, CloudinaryResourceType, CloudinaryUploadResult } from '../interfaces/helpers';
import { SanitizedUser } from '../services/auth/interface';
import { cloudinary } from '../config/cloudinary';

export { ResponseHandlerParams };

export const responseHandler = (res: Response, params: ResponseHandlerParams): void => {
  const success = params.status < 400;
  res
    .status(params.status)
    .json(success ? { success: true, message: params.message, data: params.data } : { success: false, message: params.message, error: params.error });
};

export const sanitizeUser = (user: Document): SanitizedUser => {
  const obj = user.toObject() as Record<string, unknown>;
  const { password: _password, _id, __v, companyLogoPublicId: _companyLogoPublicId, ...rest } = obj;
  return { ...rest, id: String(_id) } as SanitizedUser;
};

export const sanitizePatient = (patient: Document): Record<string, unknown> => {
  const { _id, __v, ...rest } = patient.toObject() as Record<string, unknown>;
  return { ...rest, id: String(_id) };
};

export const getCloudinaryResourceType = (mimetype: string): CloudinaryResourceType => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('audio/')) return 'video';
  return 'raw';
};

export const uploadToCloudinary = (
  file: Express.Multer.File,
  options: { resource_type: CloudinaryResourceType; folder: string }
): Promise<CloudinaryUploadResult> => {
  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ resource_type: options.resource_type, folder: options.folder }, (error, result) => {
        if (error || !result) return reject(error ?? new Error('No result returned'));
        resolve({ secureUrl: result.secure_url, publicId: result.public_id, resourceType: options.resource_type });
      })
      .end(file.buffer);
  });
};
