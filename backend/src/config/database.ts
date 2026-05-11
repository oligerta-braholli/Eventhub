import mongoose from 'mongoose';
import { config } from './env';

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
}
