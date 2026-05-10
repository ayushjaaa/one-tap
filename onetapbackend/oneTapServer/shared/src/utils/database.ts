import mongoose from 'mongoose';
import { logger } from './logger';

export const connectDatabase = async (uri: string) => {
  try {
    await mongoose.connect(uri);
    logger.info('✅ DB connected — MongoDB is up and ready.');
  } catch (error) {
    logger.error('❌ DB is not connected — failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  logger.info('✅ DB connected — mongoose connection established.');
});

mongoose.connection.on('error', (err) => {
  logger.error('❌ DB is not connected — connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ DB is not connected — MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('✅ DB connected — mongoose reconnected after a disconnect.');
});
