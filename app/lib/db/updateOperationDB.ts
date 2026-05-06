import dataModels from './models';
import { connectDB, dbType, sql } from './index';
import mongoose from 'mongoose';

await connectDB();

async function updateOneDoc(
  modelName: string,
  filter: Record<string, any>,
  updateDataObj: Record<string, any>,
  options: mongoose.QueryOptions & { session?: mongoose.ClientSession } = {}
) {
  if (dbType === 'postgres') {
    const tableName = modelName.toLowerCase() + 's';
    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(updateDataObj)) {
      setClauses.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    const whereClauses: string[] = [];
    for (const [key, val] of Object.entries(filter)) {
      whereClauses.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    const setStr = setClauses.join(', ');
    const whereStr = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const result = await sql.unsafe(`UPDATE ${tableName} SET ${setStr} ${whereStr}`, values);
    return { acknowledged: true, modifiedCount: result.rowCount };
  } else {
    return await (dataModels as any)[modelName].updateOne(filter, updateDataObj, options);
  }
}

async function updateManyDocs(
  modelName: string,
  filter: Record<string, any>,
  updateDataObj: Record<string, any>,
  options: mongoose.QueryOptions & { session?: mongoose.ClientSession } = {}
) {
  if (dbType === 'postgres') {
    const tableName = modelName.toLowerCase() + 's';
    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(updateDataObj)) {
      setClauses.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    const whereClauses: string[] = [];
    for (const [key, val] of Object.entries(filter)) {
      whereClauses.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    const setStr = setClauses.join(', ');
    const whereStr = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const result = await sql.unsafe(`UPDATE ${tableName} SET ${setStr} ${whereStr}`, values);
    return { acknowledged: true, modifiedCount: result.rowCount };
  } else {
    return await (dataModels as any)[modelName].updateMany(filter, updateDataObj, options);
  }
}

export { updateOneDoc, updateManyDocs };