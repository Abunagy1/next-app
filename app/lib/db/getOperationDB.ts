import { unstable_cache } from 'next/cache';
import dataModels from './models';
import { connectToDB, stringifyObjectIdFromObj } from './utilsDB';
import { capitalize } from '../utils';
import { strToObjectId } from './utilsDB';
import { dbType } from './db-core';   // if this import doesn't exist, add it
/**
 * When using MongoDB, convert known ID fields (e.g. userId, reviewer)
 * from a UUID string to a proper ObjectId. PostgreSQL stays untouched.
 */
function convertFilterIdsForMongo(filter: Record<string, any>) {
  if (dbType !== 'mongodb') return filter;
  
  // Fields that are likely to contain a user or document ID
  const idFields = ['userId', 'reviewer', 'user_id', 'reviewer_id', '_id', 'id'];
  
  const converted = { ...filter };
  for (const key of Object.keys(converted)) {
    if (idFields.includes(key) && typeof converted[key] === 'string') {
      const objId = strToObjectId(converted[key]);
      if (objId) converted[key] = objId;   // only replace if valid 24‑hex string
    }
  }
  return converted;
}
await connectToDB();

type ModelName = keyof typeof dataModels;

function getModel(modelName: ModelName): any {
  const model = dataModels[modelName];
  if (!model) throw new Error(`"${modelName}" is not a valid model`);
  return model;
}

export async function getOneDoc(
  modelName: ModelName,
  filter: Record<string, any> = {},
  tags: string[] = [],
  revalidationTime?: number | false,
  options?: Record<string, any>
): Promise<any> {
  const revalidate =
    revalidationTime !== undefined && revalidationTime !== false
      ? revalidationTime
      : process.env.NEXT_PUBLIC_REVALIDATION_TIME
        ? +process.env.NEXT_PUBLIC_REVALIDATION_TIME
        : 600;

  async function fetchData() {
    const model = getModel(modelName);
    const safeFilter = convertFilterIdsForMongo(filter);
    //const doc = await model.findOne(filter, options?.projection || null, options);
    const doc = await model.findOne(safeFilter, options?.projection || null, options);
    return stringifyObjectIdFromObj(doc?.toObject() || {});
  }

  if (process.env.NODE_ENV === 'production' && revalidationTime !== false) {
    return unstable_cache(
      fetchData,
      ['getOneDoc', modelName, JSON.stringify(filter), JSON.stringify(options)],
      {
        revalidate,
        tags: ['getOneDoc', ...tags],
      }
    )();
  } else {
    return fetchData();
  }
}

export async function getManyDocs(
  modelName: ModelName,
  filter: Record<string, any> = {},
  tags: string[] = [],
  revalidationTime?: number | false,
  options?: Record<string, any>
): Promise<any[]> {
  const revalidate =
    revalidationTime !== undefined && revalidationTime !== false
      ? revalidationTime
      : process.env.NEXT_PUBLIC_REVALIDATION_TIME
        ? +process.env.NEXT_PUBLIC_REVALIDATION_TIME
        : 600;

  async function fetchData() {
    const model = getModel(modelName);
    const safeFilter = convertFilterIdsForMongo(filter);
    //const docs = await model.find(filter, options?.projection || null, options).exec();
    const docs = await model.find(safeFilter, options?.projection || null, options).exec();
    return docs.map((doc: any) => stringifyObjectIdFromObj(doc.toObject()));
    // return (await dataModels[modelName]
    //   .find(filter, options?.projection || null, options)
    //   .exec())
    //   .map((doc: any) => stringifyObjectIdFromObj(doc.toObject()));
  }

  if (process.env.NODE_ENV === 'production' && revalidationTime !== false) {
    return unstable_cache(
      fetchData,
      ['getManyDocs', modelName, JSON.stringify(filter), JSON.stringify(options)],
      {
        revalidate,
        tags: ['getManyDocs', ...tags],
      }
    )();
  } else {
    return fetchData();
  }
}