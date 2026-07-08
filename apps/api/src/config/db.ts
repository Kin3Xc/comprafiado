import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

export async function connectDB(): Promise<void> {
  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'Error de conexión a MongoDB');
  });

  await mongoose.connect(env.MONGODB_URI);
  logger.info('Conectado a MongoDB Atlas');
}
