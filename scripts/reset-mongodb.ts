// scripts/reset-mongodb.ts
import dotenv from 'dotenv';
dotenv.config();
import { connectDB, mongoose } from '@/app/lib/db/db-core';
import { seedMongoDB } from '@/app/seed/seed-mongodb';
async function reset() {
  console.log('🔄 Resetting MongoDB database...');
  try {
    await connectDB();
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB.', error);
    console.error('   Make sure MongoDB is running.');
    console.error('   You can start it with: nohup mongod --dbpath ~/data/db --logpath ~/data/log/mongodb/mongo.log >/dev/null 2>&1 &');
    process.exit(1);
  }
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.dropCollection(collection.name);
    }
    console.log('✅ Database cleared.');
    const noSeed = process.env.NO_SEED === '1';
    if (!noSeed) {
      await seedMongoDB();
      console.log('✅ Reset and seeding complete.');
    } else {
      console.log('⏭️ Skipping seed (NO_SEED=1).');
    }
    console.log('✅ Reset complete (data cleared, no seed).');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}
reset();