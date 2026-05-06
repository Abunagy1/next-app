// 'use server';

// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/auth';
// import { dbType, sql, connectDB } from '@/app/lib/db/index';
// import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
// import { revalidateTag } from 'next/cache';
// import { strToObjectId } from '@/app/lib/db/utilsDB';

// export default async function flagReviewAction(pathname: string, reviewId: string, userId: string) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return { success: false, message: 'You are not logged in' };
//   }

//   // Determine if it's a flight or hotel review
//   const isFlight = pathname.includes('/flights/');
//   const table = isFlight ? 'flight_reviews' : 'hotel_reviews';
//   const idColumn = isFlight ? 'id' : 'id'; // both have id

//   try {
//     if (dbType === 'postgres') {
//       // Check if already flagged
//       const flagged = await sql`
//         SELECT flagged FROM ${sql(table)} WHERE id = ${reviewId}
//       `;
//       if (!flagged.length) return { success: false, message: 'Review not found' };
//       const flaggedArray = flagged[0].flagged || [];
//       const alreadyFlagged = flaggedArray.includes(session.user.id);

//       if (alreadyFlagged) {
//         // Remove flag
//         await sql`
//           UPDATE ${sql(table)}
//           SET flagged = array_remove(flagged, ${session.user.id})
//           WHERE id = ${reviewId}
//         `;
//       } else {
//         // Add flag
//         await sql`
//           UPDATE ${sql(table)}
//           SET flagged = array_append(COALESCE(flagged, '{}'), ${session.user.id})
//           WHERE id = ${reviewId}
//         `;
//       }
//     } else {
//       await connectDB();
//       const model = isFlight ? 'FlightReview' : 'HotelReview';
//       const filter = { _id: strToObjectId(reviewId) };
//       const review = await getOneDoc(model, filter);
//       if (!review) return { success: false, message: 'Review not found' };
//       const flaggedArray = review.flagged || [];
//       const alreadyFlagged = flaggedArray.includes(session.user.id);

//       if (alreadyFlagged) {
//         await updateOneDoc(model, filter, { $pull: { flagged: session.user.id } });
//       } else {
//         await updateOneDoc(model, filter, { $push: { flagged: session.user.id } });
//       }
//     }
//     revalidateTag(isFlight ? 'flightReviews' : 'hotelReviews');
//     return { success: true, message: 'Review flagged/unflagged successfully' };
//   } catch (error) {
//     console.error(error);
//     return { success: false, message: 'Failed to flag review' };
//   }
// }
'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { revalidateTag } from 'next/cache';
import { strToObjectId } from '@/app/lib/db/utilsDB';

type FlagResult = 'ADDED' | 'REMOVED' | { success: false; message: string };

export default async function flagReviewAction(
  pathname: string | FormData,
  reviewId: string,
  userId: string
): Promise<FlagResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'You are not logged in' };
  }

  let actualPathname: string;
  if (pathname instanceof FormData) {
    actualPathname = pathname.get('pathname') as string;
  } else {
    actualPathname = pathname;
  }

  const pathParts = actualPathname.split('/');
  const route = pathParts[1];

  if (route === 'flights') {
    let alreadyFlagged: boolean;
    if (dbType === 'postgres') {
      const rows = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM flight_reviews
          WHERE id = ${reviewId} AND ${userId} = ANY(flagged)
        ) AS exists
      `;
      alreadyFlagged = rows[0]?.exists || false;
    } else {
      const review = await getOneDoc(
        'FlightReview',
        { _id: strToObjectId(reviewId), flagged: { $in: [userId] } },
        ['userDetails', 'flightReviews'],
        false
      );
      alreadyFlagged = review && Object.keys(review).length > 0;
    }

    const operation = alreadyFlagged ? 'REMOVE' : 'ADD';

    try {
      if (dbType === 'postgres') {
        if (operation === 'ADD') {
          await sql`
            UPDATE flight_reviews
            SET flagged = array_append(flagged, ${userId})
            WHERE id = ${reviewId}
          `;
        } else {
          await sql`
            UPDATE flight_reviews
            SET flagged = array_remove(flagged, ${userId})
            WHERE id = ${reviewId}
          `;
        }
      } else {
        await connectDB();
        const update = operation === 'ADD'
          ? { $push: { flagged: userId } }
          : { $pull: { flagged: userId } };
        await updateOneDoc('FlightReview', { _id: strToObjectId(reviewId) }, update);
      }
      revalidateTag(pathParts[pathParts.length - 1] + '_review',{});
      return operation === 'ADD' ? 'ADDED' : 'REMOVED';
    } catch (error: any) {
      console.error(error);
      return { success: false, message: error.message };
    }
  }

  if (route === 'hotels') {
    let alreadyFlagged: boolean;
    if (dbType === 'postgres') {
      const rows = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM hotel_reviews
          WHERE id = ${reviewId} AND ${userId} = ANY(flagged)
        ) AS exists
      `;
      alreadyFlagged = rows[0]?.exists || false;
    } else {
      const review = await getOneDoc(
        'HotelReview',
        { _id: strToObjectId(reviewId), flagged: { $in: [userId] } },
        ['userDetails'],
        false
      );
      alreadyFlagged = review && Object.keys(review).length > 0;
    }

    const operation = alreadyFlagged ? 'REMOVE' : 'ADD';

    try {
      if (dbType === 'postgres') {
        if (operation === 'ADD') {
          await sql`
            UPDATE hotel_reviews
            SET flagged = array_append(flagged, ${userId})
            WHERE id = ${reviewId}
          `;
        } else {
          await sql`
            UPDATE hotel_reviews
            SET flagged = array_remove(flagged, ${userId})
            WHERE id = ${reviewId}
          `;
        }
      } else {
        await connectDB();
        const update = operation === 'ADD'
          ? { $push: { flagged: userId } }
          : { $pull: { flagged: userId } };
        await updateOneDoc('HotelReview', { _id: strToObjectId(reviewId) }, update);
      }
      revalidateTag(pathParts[pathParts.length - 1] + '_review', {});
      return operation === 'ADD' ? 'ADDED' : 'REMOVED';
    } catch (error: any) {
      console.error(error);
      return { success: false, message: error.message };
    }
  }

  return { success: false, message: 'Invalid review type' };
}