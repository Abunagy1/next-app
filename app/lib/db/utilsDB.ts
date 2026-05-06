import 'server-only';
import { Types } from 'mongoose';
import dataModels from './models';
import { connectDB, mongoose } from './db-core';   // ✅ 
// app/lib/db/utilsDB.ts
import { dbType } from './db-core';   // assumes db-core exports dbType
export async function connectToDB() {
  await connectDB();
}
export async function countDocs(
  modelName: keyof typeof dataModels,
  filter: Record<string, any> = {}
): Promise<number> {
  await connectDB();
  const model = dataModels[modelName];
  if (!model) throw new Error(`Model "${modelName}" not found`);
  return model.countDocuments(filter as any);
}
export function stringifyObjectIdFromObj(object: any): any {
  if (object === null || typeof object !== 'object') return object;
  if (mongoose.Types.ObjectId.isValid(object)) return object.toString();
  if (Array.isArray(object)) return object.map((el) => stringifyObjectIdFromObj(el));
  for (const [key, value] of Object.entries(object)) {
    if (mongoose.Types.ObjectId.isValid(value as any)) {
      object[key] = (value as any).toString();
    } else if (typeof value === 'object' && value !== null) {
      object[key] = stringifyObjectIdFromObj(value);
    }
  }
  return object;
}
export function strToObjectId(str: string): Types.ObjectId | null {
  try {
    return new Types.ObjectId(str);
  } catch {
    return null;
  }
}