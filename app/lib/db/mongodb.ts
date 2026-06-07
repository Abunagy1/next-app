import mongoose from 'mongoose';

const env = process.env.ENV || process.env.NODE_ENV || 'development';

export function getMongoURI(): string {
  switch (env) {
    case 'development':
    case 'dev':
      return process.env.DEV_MONGO_URI!;
    case 'test':
      return process.env.TEST_MONGO_URI!;
    case 'production':
    case 'prod':
      return process.env.PROD_MONGO_URI!;
    default:
      throw new Error(`Unknown environment: ${env}`);
  }
}

// Add a cached variable


const globalForMongoose = global as typeof globalThis & {
  _mongooseConn?: Promise<typeof mongoose>;
};
let isConnecting = false;
export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (isConnecting) return;
  isConnecting = true;
  try {
    if (!globalForMongoose._mongooseConn) {
      const uri = getMongoURI();
      console.log(`[mongodb] Connecting to ${env} database`);
      globalForMongoose._mongooseConn = mongoose.connect(uri);
    }
    await globalForMongoose._mongooseConn;
  } finally {
    isConnecting = false;
  }
};

export { mongoose };