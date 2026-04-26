import mongoose from 'mongoose';
import { settings } from './application';
import { logger } from '../helpers/logger';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(settings.mongoUri);
    logger.info('database_connected');
  } catch (error) {
    logger.error('database_connection_failed', { error });
    throw error;
  }
};
