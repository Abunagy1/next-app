import 'server-only';
import { unstable_cache } from 'next/cache';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { getManyDocs } from '@/app/lib/db/getOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import { bucketizeNumber } from '@/app/lib/utils';

// ---------- Re-export from other service files ----------
export * from './analytics';
export * from './flights';
export * from './hotels';
export * from './user';
// you can make an alias for any field to iferent name than the ctual db field nme Ex: u.image as profile_image
// ---------- Website Reviews ----------
export async function getWebsiteReviews(limit = 10) {
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT wr.id, wr.rating, wr.comment, wr.created_at,
             u.first_name, u.image as image
      FROM website_reviews wr
      JOIN users u ON wr.user_id = u.id
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;
    return rows.map((row: any) => ({
      id: row.id,
      reviewer: row.first_name || 'GoBye User',
      image: row.image || '',
      rate: row.rating,
      comment: row.comment,
    }));
  } else {
    await connectDB();
    const docs = await dataModels.WebsiteReview.aggregate([{ $sample: { size: limit } }]);
    const mapped = await Promise.all(
      docs.map(async (doc: any) => {
        const user = await dataModels.User.findById(doc.userId).lean();
        return {
          id: doc._id.toString(),
          reviewer: user?.firstName || 'GoBye User',
          image: user?.image || '',
          rate: doc.rating,
          comment: doc.comment,
        };
      })
    );
    return mapped;
  }
}

export async function getWebsiteReviewsStats() {
  if (dbType === 'postgres') {
    const result = await sql`
      SELECT
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating,
        COUNT(*) FILTER (WHERE rating = 5) as five_star,
        COUNT(*) FILTER (WHERE rating >= 4) as satisfied
      FROM website_reviews
    `;
    const row = result[0];
    const totalReviews = Number(row.total_reviews);
    const averageRating = totalReviews ? Number(row.avg_rating).toFixed(1) : 'N/A';
    const fiveStarReviews = bucketizeNumber(Number(row.five_star || 0)) + '+';
    const satisfiedReviews = bucketizeNumber(Number(row.satisfied || 0)) + '+';
    const satisfactionRate = totalReviews
      ? Math.round((Number(row.satisfied) / totalReviews) * 100) + '%'
      : 'N/A';
    return {
      satisfiedReviews,
      totalReviews: bucketizeNumber(totalReviews) + '+',
      averageRating,
      fiveStarReviews,
      satisfactionRate,
    };
  } else {
    const stats = await unstable_cache(
      async () => {
        const result = await dataModels.WebsiteReview.aggregate([
          {
            $group: {
              _id: null,
              totalReviews: { $sum: 1 },
              averageRating: { $avg: '$rating' },
              fiveStarReviews: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
              satisfiedReviews: { $sum: { $cond: [{ $in: ['$rating', [4, 5]] }, 1, 0] } },
            },
          },
          {
            $project: {
              _id: 0,
              totalReviews: 1,
              averageRating: { $round: ['$averageRating', 2] },
              fiveStarReviews: 1,
              satisfiedReviews: 1,
              satisfactionRate: {
                $cond: [
                  { $eq: ['$totalReviews', 0] },
                  0,
                  { $round: [{ $multiply: [{ $divide: ['$satisfiedReviews', '$totalReviews'] }, 100] }, 0] },
                ],
              },
            },
          },
        ]);
        const data = result[0] || {};
        return {
          satisfiedReviews: bucketizeNumber(data.satisfiedReviews || 0) + '+',
          totalReviews: bucketizeNumber(data.totalReviews || 0) + '+',
          averageRating: (data.averageRating || 0).toFixed(1),
          fiveStarReviews: bucketizeNumber(data.fiveStarReviews || 0) + '+',
          satisfactionRate: (data.satisfactionRate || 0) + '%',
        };
      },
      ['websiteReviewsStats'],
      { revalidate: Number.MAX_SAFE_INTEGER, tags: ['websiteReviewsStats'] }
    )();
    return stats;
  }
}

// ---------- Recent Searches ----------
export async function getRecentSearches(userId: string, type: 'flight' | 'hotel', limit = 10) {
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT * FROM search_history
      WHERE user_id = ${userId} AND type = ${type}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return rows;
  } else {
    return getManyDocs(
      'SearchHistory',
      { userId: strToObjectId(userId), type },
      [`${userId}_${type}_searchHistory`],
      Number.MAX_SAFE_INTEGER,
      { sort: { createdAt: -1 }, limit }
    );
  }
}