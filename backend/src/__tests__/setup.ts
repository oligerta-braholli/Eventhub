import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';

export function setupDB(): void {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDatabase();
    }
  });

  beforeEach(async () => {
    const { collections } = mongoose.connection;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });
}
