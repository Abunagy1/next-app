// import { NextRequest, NextResponse } from 'next/server';
// import { sql, dbType, connectDB } from '@/app/lib/db/index';
// import dataModels from '@/app/lib/db/models';
// export async function GET(req: NextRequest) {
//   const searchParams = req.nextUrl.searchParams;
//   const flightCode = searchParams.get('flightCode');
//   const dateStr = searchParams.get('date');
//   if (!flightCode || !dateStr) {
//     return NextResponse.json({ success: false, message: 'Missing flightCode or date' }, { status: 400 });
//   }
//   const date = new Date(dateStr);
//   if (isNaN(date.getTime())) {
//     return NextResponse.json({ success: false, message: 'Invalid date' }, { status: 400 });
//   }
//   try {
//     let flight;
//     if (dbType === 'postgres') {
//       const rows = await sql`
//         SELECT * FROM flight_itineraries
//         WHERE flight_code = ${flightCode} AND date::date = ${date.toISOString().split('T')[0]}
//       `;
//       flight = rows[0] || null;
//     } else {
//       await connectDB();
//       flight = await dataModels.FlightItinerary.findOne({
//         flightCode,
//         date: { $gte: new Date(date.setHours(0, 0, 0, 0)), $lte: new Date(date.setHours(23, 59, 59, 999)) },
//       }).lean();
//     }

//     if (!flight) {
//       return NextResponse.json({ success: false, message: 'Flight not found' }, { status: 404 });
//     }
//     return NextResponse.json({ success: true, data: flight });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
//   }
// }
import { NextRequest, NextResponse } from 'next/server';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const flightCode = searchParams.get('flightCode');
  const dateStr = searchParams.get('date');
  if (!flightCode || !dateStr) {
    return NextResponse.json(
      { success: false, message: 'Missing flightCode or date' },
      { status: 400 }
    );
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return NextResponse.json(
      { success: false, message: 'Invalid date' },
      { status: 400 }
    );
  }
  try {
    if (dbType === 'postgres') {
      const rows = await sql`
        SELECT * FROM flight_itineraries
        WHERE flight_code = ${flightCode}
          AND date::date = ${date.toISOString().split('T')[0]}
      `;
      if (rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Flight not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: rows[0] });
    } else {
      await connectDB();
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      const flight = await dataModels.FlightItinerary.findOne({
        flightCode,
        date: { $gte: start, $lte: end },
      }).lean();
      if (!flight) {
        return NextResponse.json({ success: false, message: 'Flight not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: flight });
    }
  } catch (error) {
    console.error('[get_flight] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}