import dataModels from './models';
import { capitalize } from '@/app/lib/utils';
import { connectDB, dbType, sql } from './index';
import mongoose from 'mongoose';

await connectDB();

export async function deleteOneDoc(
  modelName: string,
  filter: Record<string, any>,
  options: mongoose.QueryOptions & { session?: mongoose.ClientSession } = {}
) {
  if (dbType === 'postgres') {
    const tableName = modelName.toLowerCase() + 's';
    const whereClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(filter)) {
      whereClauses.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    const whereStr = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    await sql.unsafe(`DELETE FROM ${tableName} ${whereStr}`, values);
    return { acknowledged: true, deletedCount: 1 };
  } else {
    return await (dataModels as any)[modelName].deleteOne(filter, options);
  }
}

export async function deleteManyDocs(
  modelName: string,
  filter: Record<string, any> = {},
  options: mongoose.QueryOptions & { session?: mongoose.ClientSession } = {}
) {
  modelName = capitalize(modelName.trim());
  if (dbType === 'postgres') {
    const tableName = modelName.toLowerCase() + 's';
    const whereClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(filter)) {
      whereClauses.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    const whereStr = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const result = await sql.unsafe(`DELETE FROM ${tableName} ${whereStr}`, values);
    return { acknowledged: true, deletedCount: result.rowCount };
  } else {
    return await (dataModels as any)[modelName].bulkWrite(
      [{ deleteMany: { filter } }],
      options
    );
  }
}