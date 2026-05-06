'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { revalidateTag } from 'next/cache';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { createOneDoc } from '@/app/lib/db/createOperationDB';

export default async function addToSearchHistoryAction(
  type: 'flight' | 'hotel',
  searchState: any
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthenticated' };
  }
  const userId = session.user.id;

  try {
    if (dbType === 'postgres') {
      await sql`
        INSERT INTO search_history (user_id, type, search_state, created_at)
        VALUES (${userId}, ${type}, ${JSON.stringify(searchState)}::jsonb, NOW())
      `;
    } else {
      await connectDB();
      await createOneDoc('SearchHistory', { userId, type, searchState });
    }
    return { success: true, message: 'Search history added successfully' };
  } catch (error) {
    console.error('Failed to add search history:', error);
    return { success: false, message: 'Something went wrong' };
  } finally {
    revalidateTag(`${userId}_${type}_searchHistory`, {});
  }
}