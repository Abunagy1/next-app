// scripts/seed-postgres.ts
import dotenv from 'dotenv';
dotenv.config();
import { seedPostgres } from '@/app/seed/seed-postgres';
import { sql } from '@/app/lib/db/db-core';
async function run() {
  console.log('🌱 Seeding PostgreSQL...');
  try {
    await seedPostgres();
    console.log('✅ Seeding complete.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}
run();