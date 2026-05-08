// scripts/seed-mongodb.ts
// import dotenv from 'dotenv';
// dotenv.config();
import 'dotenv/config';
import { connectDB, mongoose } from '@/app/lib/db/db-core';
import { seedMongoDB } from '@/app/seed/seed-mongodb';
async function run() {
  console.log('🌱 Seeding MongoDB...');
  try {
    await connectDB();
    await seedMongoDB();
    console.log('✅ Seeding complete.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}
run();