// import { NextRequest, NextResponse } from 'next/server';
// import { sql, dbType, connectDB } from '@/app/lib/db/index';
// import dataModels from '@/app/lib/db/models';
// import { subDays } from 'date-fns';
// export async function GET(req: NextRequest) {
//   const start = performance.now();
//   // // Check authorization
//   // const authHeader = req.headers.get('Authorization');
//   // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//   //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   //   //return new Response('Unauthorized', { status: 401 });
//   // }
//   if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
//     return new Response('Unauthorized', { status: 401 });
//   }
//   try {
//     if (dbType === 'postgres') {
//       const twoDaysAgo = subDays(new Date(), 2);
//       // PostgreSQL cleanup
//       // await sql.begin(async (trx) => {
//       //   // Delete seats belonging to itineraries that are old and not booked
//       //   await trx`
//       //     DELETE FROM flight_seats
//       //     WHERE segment_id IN (
//       //       SELECT id FROM flight_segments
//       //       WHERE itinerary_id IN (
//       //         SELECT id FROM flight_itineraries
//       //         WHERE date < ${twoDaysAgo}
//       //           AND id NOT IN (SELECT DISTINCT flight_itinerary_id FROM flight_bookings)
//       //       )
//       //     )
//       //   `;
//       //   // Delete segments
//       //   await trx`
//       //     DELETE FROM flight_segments
//       //     WHERE itinerary_id IN (
//       //       SELECT id FROM flight_itineraries
//       //       WHERE date < ${twoDaysAgo}
//       //         AND id NOT IN (SELECT DISTINCT flight_itinerary_id FROM flight_bookings)
//       //     )
//       //   `;
//       //   // Delete itineraries
//       //   await trx`
//       //     DELETE FROM flight_itineraries
//       //     WHERE date < ${twoDaysAgo}
//       //       AND id NOT IN (SELECT DISTINCT flight_itinerary_id FROM flight_bookings)
//       //   `;
//       // });
//       // await sql`DELETE FROM flight_itineraries WHERE id NOT IN (SELECT flight_itinerary_id FROM flight_bookings) AND date < NOW() - INTERVAL '2 days'`;
//       // await sql`DELETE FROM flight_segments WHERE id NOT IN (SELECT segment_id FROM flight_itinerary_segments)`;
//       // await sql`DELETE FROM flight_seats WHERE id NOT IN (SELECT seat_id FROM flight_segment_seats)`;
//       // 1. Find itineraries not referenced in any booking and older than 2 days
//       const itinerariesToDelete = await sql<{ id: string; segment_ids: string[] }[]>`
//         SELECT id, segment_ids FROM flight_itineraries
//         WHERE date < ${twoDaysAgo}
//           AND id NOT IN (SELECT DISTINCT flight_itinerary_id FROM flight_bookings)
//         LIMIT 1000
//       `;
//       if (itinerariesToDelete.length === 0) {
//         return NextResponse.json({ success: true, message: 'Nothing to delete' });
//       }
//       const itineraryIds = itinerariesToDelete.map((i: { id: string }) => i.id);
//       const segmentIds = itinerariesToDelete.flatMap((i: { segment_ids: string[] }) => i.segment_ids || []);
//       let seatIds: string[] = [];
//       if (segmentIds.length > 0) {
//         const seats = await sql<{ id: string }[]>`
//           SELECT id FROM flight_seats WHERE segment_id = ANY(${segmentIds})
//         `;
//         seatIds = seats.map((s: { id: string }) => s.id);
//       }
//       console.log(`[cleanup_db] Itineraries: ${itineraryIds.length}, Segments: ${segmentIds.length}, Seats: ${seatIds.length}`);
//       // Delete in order: seats → segments → itineraries
//       if (seatIds.length > 0) {
//         await sql`DELETE FROM flight_seats WHERE id = ANY(${seatIds})`;
//       }
//       if (segmentIds.length > 0) {
//         await sql`DELETE FROM flight_segments WHERE id = ANY(${segmentIds})`;
//       }
//       if (itineraryIds.length > 0) {
//         await sql`DELETE FROM flight_itineraries WHERE id = ANY(${itineraryIds})`;
//       }
//     } else {
//       // MongoDB version
//       await connectDB();
//       const bookedFlightIds = await dataModels.FlightBooking.distinct('flightItineraryId');
//       // const itinerariesToDelete = await dataModels.FlightItinerary.find({
//       //   _id: { $nin: bookedFlightIds },
//       //   date: { $lt: twoDaysAgo }, 
//       // }).limit(1000).lean();
//       const itinerariesToDelete = await dataModels.FlightItinerary.find({
//         _id: { $nin: bookedFlightIds },
//         date: { $lt: subDays(new Date(), 2) } // Subtract the specified number of days from the given date
//       })
//         .limit(1000)
//         .lean();
//       // flatMap --> Calls a defined callback function on each element of an array.
//       // Then, flattens the result into a new array.
//       // This is identical to a map followed by flat with depth 1.
//       if (itinerariesToDelete.length === 0) {
//         return NextResponse.json({ success: true, message: 'Nothing to delete' });
//       }
//       // const itineraryIdsToDelete = itinerariesToDelete.map(i => i._id);
//       // const segmentIdsToDelete = itinerariesToDelete.flatMap(i => i.segmentIds);
//       // const seatIdsToDelete = itinerariesToDelete.flatMap(i => i.segmentIds.flatMap((s: any) => s.seats));
//       // await Promise.all([
//       //   dataModels.FlightItinerary.deleteMany({ _id: { $in: itineraryIdsToDelete } }),
//       //   dataModels.FlightSegment.deleteMany({ _id: { $in: segmentIdsToDelete } }),
//       //   dataModels.FlightSeat.deleteMany({ _id: { $in: seatIdsToDelete } }),
//       // ]);
//       // await dataModels.FlightSegment.deleteMany({ _id: { $in: segmentIdsToDelete.map(s => s._id) } });
//       const segmentIds = itinerariesToDelete.flatMap(i => i.segmentIds || []);
//       const itineraryIds = itinerariesToDelete.map(i => i._id);
//       // const segmentIdsToDelete = segmentIds.map(segment => segment._id);
//       const seatIds = segmentIds.flatMap((seg: any) => seg.seats || []);
//       console.log(`[cleanup_db] Itineraries: ${itineraryIds.length}, Segments: ${segmentIds.length}, Seats: ${seatIds.length}`);
//       await dataModels.FlightSeat.deleteMany({ _id: { $in: seatIds } });
//       await dataModels.FlightSegment.deleteMany({ _id: { $in: segmentIds } });
//       await dataModels.FlightItinerary.deleteMany({ _id: { $in: itineraryIds } });
//     }
//     const duration = performance.now() - start;
//     console.log(`[cleanup_db] Completed in ${duration.toFixed(2)} ms`);
//     return NextResponse.json({ success: true, message: 'Cleanup completed' });
//   } catch (error: any) {
//     console.error('[cleanup_db] Error:', error);
//     return NextResponse.json(
//       { success: false, message: error.message || 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { subDays } from "date-fns";
import { dbType, connectDB, sql } from "@/app/lib/db/index";
import dataModels from "@/app/lib/db/models";

export async function GET(req: NextRequest) {
  const pre = performance.now();
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("401", { status: 401 });
  }

  try {
    await connectDB();
    if (dbType === "mongodb") {
      await cleanupFlightsMongo();
    } else {
      await cleanupFlightsPostgres();
    }
    const post = performance.now();
    console.log(`cleanupFlights done in ${post - pre} ms`);
    return new NextResponse("OK");
  } catch (e: any) {
    console.error(e);
    return new NextResponse(e.message, { status: 500 });
  }
}

async function cleanupFlightsMongo() {
  const { FlightBooking, FlightItinerary, FlightSegment, FlightSeat } = dataModels;

  // Get IDs of all booked flight itineraries
  const bookedFlightItineraryIds = await FlightBooking.distinct("flightItineraryId");

  // Find expired itineraries not booked
  const itinerariesToDelete = await FlightItinerary.find({
    _id: { $nin: bookedFlightItineraryIds },
    date: { $lt: subDays(new Date(), 2) },
  }).limit(1000).lean();

  if (!itinerariesToDelete.length) {
    console.log("No expired flights to delete (MongoDB)");
    return;
  }

  const itineraryIdsToDelete = itinerariesToDelete.map((i: any) => i._id);
  const segmentsToDelete = itinerariesToDelete.flatMap((i: any) => i.segmentIds || []);
  const segmentIdsToDelete = segmentsToDelete.map((s: any) => s._id);
  const seatIdsToDelete = segmentsToDelete.flatMap((s: any) => s.seats || []);

  console.log("MongoDB cleanup counts:", {
    itineraries: itineraryIdsToDelete.length,
    segments: segmentIdsToDelete.length,
    seats: seatIdsToDelete.length,
  });

  const itinerariesResult = await FlightItinerary.deleteMany({ _id: { $in: itineraryIdsToDelete } });
  const segmentsResult = await FlightSegment.deleteMany({ _id: { $in: segmentIdsToDelete } });
  const seatsResult = await FlightSeat.deleteMany({ _id: { $in: seatIdsToDelete } });

  console.log("Deleted:", {
    itineraries: itinerariesResult.deletedCount,
    segments: segmentsResult.deletedCount,
    seats: seatsResult.deletedCount,
  });
}

async function cleanupFlightsPostgres() {
  // Use raw SQL with the sql template tag
  const cutoffDate = subDays(new Date(), 2);

  // 1. Find flight_itineraries that are older than cutoff and not referenced in flight_bookings
  const expiredItineraries = await sql`
    SELECT fi.id, fi.segment_ids
    FROM flight_itineraries fi
    WHERE fi.date < ${cutoffDate}
      AND NOT EXISTS (
        SELECT 1 FROM flight_bookings fb WHERE fb.flight_itinerary_id = fi.id
      )
    LIMIT 1000
  `;

  if (expiredItineraries.rowCount === 0) {
    console.log("No expired flights to delete (PostgreSQL)");
    return;
  }

  // Collect all segment IDs and seat IDs to delete
  const itineraryIds: string[] = [];
  const segmentIds: string[] = [];
  const seatIds: string[] = [];

  for (const row of expiredItineraries.rows) {
    itineraryIds.push(row.id);
    const segIds = row.segment_ids || [];
    segmentIds.push(...segIds);
  }

  if (segmentIds.length > 0) {
    // Get seat IDs from flight_segments
    const seatsResult = await sql`
      SELECT fs.id as seat_id
      FROM flight_seats fs
      WHERE fs.segment_id = ANY(${segmentIds})
    `;
    seatIds.push(...seatsResult.rows.map((r: any) => r.seat_id));
  }

  console.log("PostgreSQL cleanup counts:", {
    itineraries: itineraryIds.length,
    segments: segmentIds.length,
    seats: seatIds.length,
  });

  // Delete in order: seats, segments, itineraries (respect foreign keys)
  if (seatIds.length > 0) {
    await sql`DELETE FROM flight_seats WHERE id = ANY(${seatIds})`;
  }
  if (segmentIds.length > 0) {
    await sql`DELETE FROM flight_segments WHERE id = ANY(${segmentIds})`;
  }
  if (itineraryIds.length > 0) {
    await sql`DELETE FROM flight_itineraries WHERE id = ANY(${itineraryIds})`;
  }

  console.log("PostgreSQL cleanup completed");
}