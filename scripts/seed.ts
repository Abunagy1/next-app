import dotenv from 'dotenv';
dotenv.config(); // Load .env first
const dbType = process.env.DB_TYPE || 'postgres';
if (dbType === 'postgres') {
  await import('../app/seed/seed-postgres');
} else {
  await import('../app/seed/seed-mongodb');
}