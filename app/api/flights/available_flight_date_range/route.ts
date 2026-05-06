// import { NextResponse } from 'next/server';
// import { dbType, sql, connectDB } from '@/app/lib/db/index';
// import dataModels from '@/app/lib/db/models';

// export async function GET() {
//   try {
//     if (dbType === 'postgres') {
//       const result = await sql`
//         SELECT MIN(expire_at) as min_expire, MAX(expire_at) as max_expire
//         FROM flight_itineraries
//         WHERE expire_at > NOW()
//       `;
//       const from = result[0]?.min_expire ? new Date(result[0].min_expire).getTime() : Date.now();
//       const to = result[0]?.max_expire ? new Date(result[0].max_expire).getTime() : Date.now() + 365 * 24 * 60 * 60 * 1000;
//       return NextResponse.json({ success: true, data: { from, to } });
//     } else {
//       await connectDB();
//       const first = await dataModels.FlightItinerary.findOne({ expireAt: { $gte: new Date() } }).sort({ expireAt: 1 }).lean();
//       const last = await dataModels.FlightItinerary.findOne({ expireAt: { $gte: new Date() } }).sort({ expireAt: -1 }).lean();
//       const from = first ? first.expireAt.getTime() : Date.now();
//       const to = last ? last.expireAt.getTime() : Date.now() + 365 * 24 * 60 * 60 * 1000;
//       return NextResponse.json({ success: true, data: { from, to } });
//     }
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ success: false, message: 'Error' }, { status: 500 });
//   }
// }
import { NextResponse } from 'next/server';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';

export async function GET() {
  try {
    if (dbType === 'postgres') {
      // PostgreSQL: get min and max expire_at of future itineraries
      const result = await sql<{ min_expire: Date | null; max_expire: Date | null }[]>`
        SELECT MIN(expire_at) AS min_expire, MAX(expire_at) AS max_expire
        FROM flight_itineraries
        WHERE expire_at > NOW()
      `;
      const row = result[0];
      const from = row?.min_expire ? row.min_expire.getTime() : Date.now();
      const to = row?.max_expire ? row.max_expire.getTime() : Date.now() + 365 * 24 * 60 * 60 * 1000;
      return NextResponse.json({ success: true, data: { from, to } });
    } else {
      // MongoDB
      await connectDB();
      const first = await dataModels.FlightItinerary.findOne({ expireAt: { $gte: new Date() } })
        .sort({ expireAt: 1 })
        .lean();
      const last = await dataModels.FlightItinerary.findOne({ expireAt: { $gte: new Date() } })
        .sort({ expireAt: -1 })
        .lean();
      const from = first ? first.expireAt.getTime() : Date.now();
      const to = last ? last.expireAt.getTime() : Date.now() + 365 * 24 * 60 * 60 * 1000;
      return NextResponse.json({ success: true, data: { from, to } });
    }
  } catch (error) {
    console.error('[available_flight_date_range] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch flight date range' },
      { status: 500 }
    );
  }
}