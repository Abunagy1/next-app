export type DbType = 'postgres' | 'mongodb';
const dbType = (process.env.DB_TYPE || 'postgres') as DbType;
let sql: any;                 // for PostgreSQL
let mongoose: any;            // for MongoDB
let connectDB: () => Promise<void>;
if (dbType === 'postgres') {
  // Load PostgreSQL client
  const postgresModule = await import('./postgres');
  sql = postgresModule.default;
  connectDB = async () => {}; // no‑op for PostgreSQL
} else {
  // Load MongoDB connection and models
  const mongoModule = await import('./mongodb');
  mongoose = mongoModule.mongoose;
  // 🔥 Set MONGODB_URI for the old project's code
  process.env.MONGODB_URI = mongoModule.getMongoURI();
  connectDB = mongoModule.connectDB;
  // Register all models so they are available
  await import('./models');
}
export { sql, mongoose, connectDB, dbType };