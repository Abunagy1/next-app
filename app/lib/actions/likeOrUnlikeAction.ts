// 'use server';

// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/auth';
// import { dbType, sql, connectDB } from '@/app/lib/db/index';
// import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
// import { revalidateTag } from 'next/cache';
// import { strToObjectId } from '@/app/lib/db/utilsDB';
// import { redirect } from 'next/navigation';
// import routes from '@/data/routes.json';

// export default async function likeOrUnlikeAction({ keys, flightOrHotel, callbackPath }: any) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     redirect(`${routes.login.path}?callbackPath=${encodeURIComponent(callbackPath)}`);
//   }

//   const userId = session.user.id;
//   try {
//     if (flightOrHotel === 'flight') {
//       const flightId = keys.flightId;
//       const searchState = keys.searchState;
//       // Check if already liked
//       let liked = false;
//       if (dbType === 'postgres') {
//         const result = await sql`
//           SELECT EXISTS (
//             SELECT 1 FROM user_flight_bookmarks
//             WHERE user_id = ${userId} AND flight_id = ${flightId}
//           ) as liked
//         `;
//         liked = result[0].liked;
//       } else {
//         // We'll need a separate collection for bookmarks in MongoDB
//         // For now, we'll use the embedded array in User model
//         await connectDB();
//         const user = await getOneDoc('User', { _id: strToObjectId(userId) });
//         liked = user?.flights?.bookmarked?.some((b: any) => b.flightId.toString() === flightId);
//       }

//       if (liked) {
//         // Remove bookmark
//         if (dbType === 'postgres') {
//           await sql`
//             DELETE FROM user_flight_bookmarks
//             WHERE user_id = ${userId} AND flight_id = ${flightId}
//           `;
//         } else {
//           await updateOneDoc('User', { _id: strToObjectId(userId) }, {
//             $pull: { 'flights.bookmarked': { flightId: strToObjectId(flightId) } }
//           });
//         }
//       } else {
//         // Add bookmark
//         if (dbType === 'postgres') {
//           await sql`
//             INSERT INTO user_flight_bookmarks (user_id, flight_id, search_state)
//             VALUES (${userId}, ${flightId}, ${searchState})
//           `;
//         } else {
//           await updateOneDoc('User', { _id: strToObjectId(userId) }, {
//             $push: { 'flights.bookmarked': { flightId: strToObjectId(flightId), searchState } }
//           });
//         }
//       }
//     } else if (flightOrHotel === 'hotel') {
//       const hotelId = keys.hotelId;
//       let liked = false;
//       if (dbType === 'postgres') {
//         const result = await sql`
//           SELECT EXISTS (
//             SELECT 1 FROM user_hotel_bookmarks
//             WHERE user_id = ${userId} AND hotel_id = ${hotelId}
//           ) as liked
//         `;
//         liked = result[0].liked;
//       } else {
//         await connectDB();
//         const user = await getOneDoc('User', { _id: strToObjectId(userId) });
//         liked = user?.hotels?.bookmarked?.includes(hotelId);
//       }

//       if (liked) {
//         if (dbType === 'postgres') {
//           await sql`
//             DELETE FROM user_hotel_bookmarks
//             WHERE user_id = ${userId} AND hotel_id = ${hotelId}
//           `;
//         } else {
//           await updateOneDoc('User', { _id: strToObjectId(userId) }, {
//             $pull: { 'hotels.bookmarked': strToObjectId(hotelId) }
//           });
//         }
//       } else {
//         if (dbType === 'postgres') {
//           await sql`
//             INSERT INTO user_hotel_bookmarks (user_id, hotel_id)
//             VALUES (${userId}, ${hotelId})
//           `;
//         } else {
//           await updateOneDoc('User', { _id: strToObjectId(userId) }, {
//             $push: { 'hotels.bookmarked': strToObjectId(hotelId) }
//           });
//         }
//       }
//     }
//     revalidateTag('userDetails');
//     return { success: true, message: 'Success' };
//   } catch (error) {
//     console.error(error);
//     return { success: false, message: 'Something went wrong' };
//   }
// }

'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { revalidateTag } from 'next/cache';
import routes from '@/data/routes.json';

interface LikeOrUnlikeParams {
  keys: {
    flightId?: string;
    hotelId?: string;
    searchState?: any;
  };
  flightOrHotel: 'flight' | 'hotel';
  callbackPath: string;
}

export default async function likeOrUnlikeAction({
  keys,
  flightOrHotel,
  callbackPath,
}: LikeOrUnlikeParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`${routes.login.path}?callbackPath=${encodeURIComponent(callbackPath)}`);
  }

  const userId = session.user.id;

  if (flightOrHotel === 'flight') {
    const flightId = keys.flightId!;
    const searchState = keys.searchState || {};

    if (dbType === 'postgres') {
      // Check if already bookmarked
      const existing = await sql`
        SELECT 1 FROM user_flight_bookmarks
        WHERE user_id = ${userId} AND flight_id = ${flightId}
      `;
      if (existing.length > 0) {
        // Unlike: delete
        await sql`
          DELETE FROM user_flight_bookmarks
          WHERE user_id = ${userId} AND flight_id = ${flightId}
        `;
      } else {
        // Like: insert
        await sql`
          INSERT INTO user_flight_bookmarks (user_id, flight_id, search_state)
          VALUES (${userId}, ${flightId}, ${JSON.stringify(searchState)}::jsonb)
        `;
      }
    } else {
      await connectDB();
      const user = await dataModels.User.findById(userId).lean();
      const isBookmarked = user?.flights?.bookmarked?.some(
        (item: any) => item.flightId?.toString() === flightId
      );
      if (isBookmarked) {
        await updateOneDoc('User', { _id: userId }, {
          $pull: { 'flights.bookmarked': { flightId } },
        });
      } else {
        await updateOneDoc('User', { _id: userId }, {
          $push: { 'flights.bookmarked': { flightId, searchState } },
        });
      }
    }
  } else if (flightOrHotel === 'hotel') {
    const hotelId = keys.hotelId!;

    if (dbType === 'postgres') {
      const existing = await sql`
        SELECT 1 FROM user_hotel_bookmarks
        WHERE user_id = ${userId} AND hotel_id = ${hotelId}
      `;
      if (existing.length > 0) {
        await sql`
          DELETE FROM user_hotel_bookmarks
          WHERE user_id = ${userId} AND hotel_id = ${hotelId}
        `;
      } else {
        await sql`
          INSERT INTO user_hotel_bookmarks (user_id, hotel_id)
          VALUES (${userId}, ${hotelId})
        `;
      }
    } else {
      await connectDB();
      const user = await dataModels.User.findById(userId).lean();
      const isBookmarked = user?.hotels?.bookmarked?.some(
        (id: any) => id.toString() === hotelId
      );
      if (isBookmarked) {
        await updateOneDoc('User', { _id: userId }, {
          $pull: { 'hotels.bookmarked': hotelId },
        });
      } else {
        await updateOneDoc('User', { _id: userId }, {
          $push: { 'hotels.bookmarked': hotelId },
        });
      }
    }
  }

  revalidateTag('userDetails',{});
  return { success: true, message: 'Successful' };
}