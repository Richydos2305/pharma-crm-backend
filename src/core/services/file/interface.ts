export type CloudinaryResourceType = 'image' | 'video' | 'raw';

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  resourceType: CloudinaryResourceType;
}
