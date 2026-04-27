const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'LOGTAIL_SOURCE_TOKEN'
] as const;

const validateConfig = (): void => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

interface AppConfig {
  mongoUri: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  port: string;
  nodeEnv: string;
  maxFileSize: number;
  logtailToken: string;
}

const getConfig = (): AppConfig => {
  validateConfig();
  return {
    mongoUri: process.env.MONGODB_URI!,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY!,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET!,
    port: process.env.PORT ?? '3000',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    maxFileSize: Number(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024,
    logtailToken: process.env.LOGTAIL_SOURCE_TOKEN!
  };
};

export const settings = getConfig();
