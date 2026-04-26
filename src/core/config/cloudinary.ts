import { v2 as cloudinary } from 'cloudinary';
import { settings } from './application';

cloudinary.config({
  cloud_name: settings.cloudinaryCloudName,
  api_key: settings.cloudinaryApiKey,
  api_secret: settings.cloudinaryApiSecret
});

export { cloudinary };
