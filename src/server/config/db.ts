import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  try {
    if (uri && uri.trim() !== '') {
      console.log('Connecting to provided MongoDB URI...');
      await mongoose.connect(uri);
      console.log('Connected to MongoDB cluster.');
    } else {
      console.log('No external MONGODB_URI found. Initializing high-performance MongoDB instance...');
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'arambh_construction',
        },
      });
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Connected to dedicated MongoDB instance at ${memoryUri}`);
    }

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
}
