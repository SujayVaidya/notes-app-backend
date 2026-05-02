import mongoose from 'mongoose';
import { env } from '../config/env';

const RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 3000;

mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

export const connectDB = async (): Promise<void> => {
  if (!env.MONGODB_URI) {
    console.warn('MONGODB_URI not set — database unavailable');
    return;
  }

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI);
      console.log('MongoDB connected');
      return;
    } catch (error) {
      const isLast = attempt === RETRY_ATTEMPTS;
      if (isLast) {
        console.error('MongoDB failed after all retries — server running without database:', error);
        return;
      }
      console.warn(`MongoDB attempt ${attempt}/${RETRY_ATTEMPTS} failed, retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};
