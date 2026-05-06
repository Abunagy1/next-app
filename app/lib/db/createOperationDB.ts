import { capitalize, findOnlyUniqueElements } from '../utils';
import dataModels from './models';
import { connectToDB } from './utilsDB';
import { ClientSession } from 'mongoose';
import { sql, dbType } from './db-core';
import { randomUUID } from 'crypto';

// Lazy MongoDB connection
let mongoConnected = false;
async function ensureMongoConnection() {
  if (!mongoConnected) {
    await connectToDB();
    mongoConnected = true;
  }
}

type ModelName = keyof typeof dataModels;

// Helper to get MongoDB model safely
function getModel(modelName: ModelName) {
  const model = dataModels[modelName];
  if (!model) throw new Error(`"${modelName}" is not a valid model`);
  return model;
}

// ==================== PostgreSQL Insert Logic ====================
// Map model names to PostgreSQL table names (customize as needed)
const pgTableMap: Record<ModelName, string> = {
  Subscription: 'subscriptions',
  User: 'users',
  AnonymousUser: 'anonymous_users',
  FlightItinerary: 'flight_itineraries',
  FlightSegment: 'flight_segments',
  FlightSeat: 'flight_seats',
  Account: 'accounts',
  Airline: 'airlines',
  AirlineFlightPrice: 'airline_flight_prices',
  Airport: 'airports',
  FlightBooking: 'flight_bookings',
  FlightReview: 'flight_reviews',
  FlightPayment: 'flight_payments',
  HotelBooking: 'hotel_bookings',
  HotelRoom: 'hotel_rooms',
  HotelGuest: 'hotel_guests',
  Hotel: 'hotels',
  HotelPayment: 'hotel_payments',
  Passenger: 'passengers',
  HotelReview: 'hotel_reviews',
  Verification_Token: 'verification_tokens',
  Session: 'sessions',
  Seat: 'flight_seats', // or dedicated seats table? adjust
  Airplane: 'airplanes',
  PromoCode: 'promo_codes',
  SearchHistory: 'search_history',
  WebsiteReview: 'website_reviews',
  WebsiteConfig: 'website_config',
  Analytic: 'analytics',
  Post: 'posts',
  Comment: 'comments',
  CommentReaction: 'comment_reactions',
  PostReaction: 'post_reactions',
  Customer: 'customers',
  Invoice: 'invoices',
  Revenue: 'revenue',
  Product: 'products',
  PasswordResetToken: 'password_reset_tokens',
};

async function createOneDocPostgres(modelName: ModelName, data: Record<string, any>): Promise<any> {
  const tableName = pgTableMap[modelName];
  if (!tableName) throw new Error(`No PostgreSQL table mapping for model "${modelName}"`);

  const keys = Object.keys(data);
  const values = keys.map(k => data[k]);
  const id = randomUUID();
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  
  const query = `
    INSERT INTO ${tableName} (id, ${keys.join(', ')})
    VALUES ($${values.length + 1}, ${placeholders})
    RETURNING *
  `;
  // Use sql.unsafe with parameterized values for safety
  const result = await sql.unsafe(query, [...values, id]);
  return result[0];
}

async function createManyDocsPostgres(modelName: ModelName, dataArr: Record<string, any>[]): Promise<string[]> {
  const tableName = pgTableMap[modelName];
  if (!tableName) throw new Error(`No PostgreSQL table mapping for model "${modelName}"`);
  const insertedIds: string[] = [];

  for (const data of dataArr) {
    const keys = Object.keys(data);
    const values = keys.map(k => data[k]);
    const id = randomUUID();
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
      INSERT INTO ${tableName} (id, ${keys.join(', ')})
      VALUES ($${values.length + 1}, ${placeholders})
      RETURNING id
    `;
    const result = await sql.unsafe(query, [...values, id]);
    insertedIds.push(result[0].id);
  }
  return insertedIds;
}

// ==================== Exported Functions ====================
export async function createOneDoc(
  modelName: ModelName,
  data: Record<string, any>,
  options: { session?: ClientSession } = {}
): Promise<any> {
  if (dbType === 'postgres') {
    return await createOneDocPostgres(modelName, data);
  } else {
    await ensureMongoConnection();
    const result = await validatorOneDoc(modelName, data);
    if (result instanceof Error) throw result;
    const model = getModel(modelName);
    const doc = new model(data);
    return await doc.save(options);
  }
}

async function validatorOneDoc(
  modelName: ModelName,
  data: Record<string, any>
): Promise<{ modelName: ModelName; data: Record<string, any> } | Error> {
  const processedModelName = modelName; // Already validated as keyof dataModels
  const model = getModel(processedModelName);
  
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return new Error(`Data must be an object, got ${typeof data}`);
  }

  const modelSchemaKeys = Object.keys(model.schema.obj);
  const dataKeys = Object.keys(data);
  const extraKeys = findOnlyUniqueElements(
    dataKeys,
    [...modelSchemaKeys, '_id'],
    [...modelSchemaKeys, '_id']
  );
  if (extraKeys.length > 0) {
    return new Error(
      `The following keys are not allowed: ${extraKeys.join(', ')},\n Only ${modelSchemaKeys.join(', ')} are allowed`
    );
  }

  try {
    await model.validate(data, modelSchemaKeys);
    return { modelName: processedModelName, data };
  } catch (error) {
    return error as Error;
  }
}

export async function createManyDocs(
  modelName: ModelName,
  dataArr: Record<string, any>[],
  options: { ordered?: boolean; session?: ClientSession } = {}
): Promise<string[]> {
  if (dbType === 'postgres') {
    return await createManyDocsPostgres(modelName, dataArr);
  } else {
    await ensureMongoConnection();
    const model = getModel(modelName);
    const result = await model.bulkWrite(
      dataArr.map((doc) => ({ insertOne: { document: doc } })),
      options
    );
    const insertedIds = result.insertedIds as Record<number, any>;
    return Object.values(insertedIds).map((id) => id.toString());
  }
}