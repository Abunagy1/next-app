import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { cancelBooking, isSeatTakenByElse } from '@/app/lib/services/flights';
import { z } from 'zod';
import { strToObjectId } from "@/app/lib/db/utilsDB";
const requestSchema = z.object({
  flightNumber: z.string(),
  flightDateTimestamp: z.union([z.string(), z.number()]),
});
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid parameters' }, { status: 400 });
  }
  const { flightNumber, flightDateTimestamp } = parsed.data;
  const flightDate = new Date(flightDateTimestamp);
  try {
    // 1. Get flight itinerary
    let flightItinerary: any;
    if (dbType === 'postgres') {
      const rows = await sql`
        SELECT id, flight_code, date, expire_at FROM flight_itineraries
        WHERE flight_code = ${flightNumber} AND date::date = ${flightDate.toISOString().split('T')[0]}
      `;
      if (rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Flight not found' }, { status: 404 });
      }
      flightItinerary = rows[0];
    } else {
      await connectDB();
      flightItinerary = await dataModels.FlightItinerary.findOne({
        flightCode: flightNumber,
        date: { $gte: new Date(flightDate.setHours(0,0,0,0)), $lte: new Date(flightDate.setHours(23,59,59,999)) },
      }).lean();
      if (!flightItinerary) {
        return NextResponse.json({ success: false, message: 'Flight not found' }, { status: 404 });
      }
    }
    // 📝 Debug log
    console.log(`🔎 Looking for booking: flightItinerary=${flightItinerary._id}, userId=${session.user.id}`);
    // 2. Get pending booking
    let booking: any;
    if (dbType === 'postgres') {
      const bookings = await sql`
        SELECT id, pnr_code, total_fare, selected_seats, payment_status, ticket_status
        FROM flight_bookings
        WHERE flight_itinerary_id = ${flightItinerary.id}
          AND user_id = ${session.user.id}
          AND payment_status = 'pending'
          AND ticket_status = 'pending'
        LIMIT 1
      `;
      if (bookings.length === 0) {
        return NextResponse.json({ success: false, message: 'No reserved flight booking found' }, { status: 404 });
      }
      booking = bookings[0];
      booking.selected_seats = booking.selected_seats || [];
    } else {
      booking = await dataModels.FlightBooking.findOne({
        flightItineraryId: flightItinerary._id,
        userId: strToObjectId(session.user.id),
        paymentStatus: 'pending',
        ticketStatus: 'pending',
      }).lean();
      console.log(`🔎 Found booking:`, booking);
      if (!booking) {
        return NextResponse.json({ success: false, message: 'No reserved flight booking found' }, { status: 404 });
      }
    }
    // 3. Check flight expiration
    if (new Date(flightItinerary.date) < new Date()) {
      await cancelBooking(booking.pnr_code || booking.pnrCode, {
        reason: 'Flight expired',
        canceledAt: new Date(),
        canceledBy: 'system',
      });
      return NextResponse.json({
        success: false,
        message: 'Flight booking has expired as the flight date has passed',
      });
    }
    // 4. Check if any seat is taken by another passenger (full dual‑db)
    let isTaken = false;
    if (dbType === 'postgres') {
      let selectedSeats = booking.selected_seats;
      if (typeof selectedSeats === 'string') {
        try { selectedSeats = JSON.parse(selectedSeats); } catch { selectedSeats = []; }
      }
      if (selectedSeats && Array.isArray(selectedSeats) && selectedSeats.length) {
        const seatIds = selectedSeats.map((s: any) => s.seatId);
        const taken = await sql`
          SELECT 1 FROM flight_seats
          WHERE id = ANY(${seatIds}::uuid[])
            AND reservation->>'for' != ${session.user.id}
            AND reservation->>'type' IN ('permanent', 'temporary')
            AND (reservation->>'expiresAt' IS NULL OR (reservation->>'expiresAt')::bigint > ${Date.now()})
          LIMIT 1
        `;
        isTaken = taken.length > 0;
      }
    } else {
      const selectedSeats = booking.selected_seats || [];
      const promises = selectedSeats.map((s: any) =>
        isSeatTakenByElse(s.seatId._id || s.seatId, s.passengerId)
      );
      isTaken = (await Promise.all(promises)).some(Boolean);
    }
    if (isTaken) {
      await cancelBooking(booking.pnr_code || booking.pnrCode, {
        reason: 'Seat taken by another passenger due to expired reservation',
        canceledAt: new Date(),
        canceledBy: 'system',
      });
      return NextResponse.json({
        success: false,
        message: 'Seat is already taken by another passenger, thus the booking has been canceled',
      });
    }
    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('[get_reserved_flight] Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}