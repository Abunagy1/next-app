import 'server-only';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';

/**
 * Ensures an analytics record exists (single row/document).
 * If none exists, it creates one with default values.
 */
export async function createAnalytics(): Promise<void> {
  if (dbType === 'postgres') {
    // Check if the analytics row exists (id = 1)
    const rows = await sql<{ id: number }[]>`
      SELECT id FROM analytics WHERE id = 1
    `;
    if (rows.length === 0) {
      await sql`
        INSERT INTO analytics (id, total_users_signed_up, total_accounts_deleted, updated_at)
        VALUES (1, 0, 0, NOW())
      `;
    }
  } else {
    await connectDB();
    const exists = await dataModels.Analytic.exists({ _id: 'analytics' });
    if (!exists) {
      await dataModels.Analytic.create({
        _id: 'analytics',
        totalUsersSignedUp: 0,
        totalAccountsDeleted: 0,
      });
    }
  }
}

/**
 * Increments or decrements analytics counters.
 * @param data - Object with keys to increment (e.g., { totalUsersSignedUp: 1, totalAccountsDeleted: 1 })
 */
export async function incOrDecrementAnalytics(data: {
  totalUsersSignedUp?: number;
  totalAccountsDeleted?: number;
}): Promise<void> {
  if (dbType === 'postgres') {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (data.totalUsersSignedUp !== undefined) {
      updates.push(`total_users_signed_up = total_users_signed_up + $${idx++}`);
      values.push(data.totalUsersSignedUp);
    }
    if (data.totalAccountsDeleted !== undefined) {
      updates.push(`total_accounts_deleted = total_accounts_deleted + $${idx++}`);
      values.push(data.totalAccountsDeleted);
    }
    if (updates.length === 0) return;
    updates.push(`updated_at = NOW()`);
    await sql`
      UPDATE analytics
      SET ${sql.unsafe(updates.join(', '))}
      WHERE id = 1
    `;
  } else {
    await connectDB();
    const updateFields: Record<string, number> = {};
    if (data.totalUsersSignedUp !== undefined) {
      updateFields.totalUsersSignedUp = data.totalUsersSignedUp;
    }
    if (data.totalAccountsDeleted !== undefined) {
      updateFields.totalAccountsDeleted = data.totalAccountsDeleted;
    }
    if (Object.keys(updateFields).length === 0) return;
    await dataModels.Analytic.updateOne(
      { _id: 'analytics' },
      { $inc: updateFields, $set: { updatedAt: new Date() } }
    );
  }
}