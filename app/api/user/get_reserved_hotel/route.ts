import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { cancelHotelBooking, isRoomTakenByElse } from '@/app/lib/services/hotels';
import { z } from 'zod';

const requestSchema = z.object({
  slug: z.string(),
  checkInDate: z.union([z.string(), z.number()]),
  checkOutDate: z.union([z.string(), z.number()]),
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

  const { slug, checkInDate, checkOutDate } = parsed.data;
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  try {
    // 1. Get hotel by slug
    let hotel: any;
    if (dbType === 'postgres') {
      const rows = await sql`SELECT id FROM hotels WHERE slug = ${slug}`;
      if (rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Hotel not found' }, { status: 404 });
      }
      hotel = rows[0];
    } else {
      await connectDB();
      hotel = await dataModels.Hotel.findOne({ slug }).lean();
      if (!hotel) {
        return NextResponse.json({ success: false, message: 'Hotel not found' }, { status: 404 });
      }
    }

    // 2. Find pending booking
    let booking: any;
    if (dbType === 'postgres') {
      const bookings = await sql`
        SELECT id, rooms, booking_status, payment_status, payment_method, total_price
        FROM hotel_bookings
        WHERE hotel_id = ${hotel.id}
          AND user_id = ${session.user.id}
          AND check_in_date::date = ${checkIn.toISOString().split('T')[0]}
          AND check_out_date::date = ${checkOut.toISOString().split('T')[0]}
          AND ( (booking_status = 'pending' AND payment_status = 'pending')
                OR (booking_status = 'confirmed' AND payment_status = 'pending' AND payment_method = 'cash') )
        ORDER BY created_at DESC
        LIMIT 1
      `;
      if (bookings.length === 0) {
        return NextResponse.json({ success: false, message: 'No reserved hotel booking found' }, { status: 404 });
      }
      booking = bookings[0];
      booking.rooms = booking.rooms || [];
      // ── Normalise: PostgreSQL returns "id", frontend expects "_id" ──
      if (!booking._id && booking.id) {
        booking._id = booking.id;
      }
    } else {
      booking = await dataModels.HotelBooking.findOne({
        hotelId: hotel._id,
        userId: session.user.id,
        checkInDate: { $gte: new Date(checkIn.setHours(0,0,0,0)), $lte: new Date(checkIn.setHours(23,59,59,999)) },
        checkOutDate: { $gte: new Date(checkOut.setHours(0,0,0,0)), $lte: new Date(checkOut.setHours(23,59,59,999)) },
        $or: [
          { bookingStatus: 'pending', paymentStatus: 'pending' },
          { bookingStatus: 'confirmed', paymentStatus: 'pending', paymentMethod: 'cash' },
        ],
      }).sort({ createdAt: -1 }).lean();
      if (!booking) {
        return NextResponse.json({ success: false, message: 'No reserved hotel booking found' }, { status: 404 });
      }
    }

    // 3. Check if any room is taken by another guest (full dual‑db)
    let isTaken = false;
    if (dbType === 'postgres') {
      const roomIds = booking.rooms;
      if (roomIds && roomIds.length) {
        const taken = await sql`
          SELECT 1 FROM hotel_bookings
          WHERE rooms && ${roomIds}::uuid[]
            AND check_in_date < ${checkOut}
            AND check_out_date > ${checkIn}
            AND user_id != ${session.user.id}
            AND ( (booking_status = 'pending' AND guaranteed_reservation_until > NOW())
                  OR booking_status = 'confirmed' )
          LIMIT 1
        `;
        isTaken = taken.length > 0;
      }
    } else {
      const roomIds = booking.rooms || [];
      const promises = roomIds.map((roomId: string) =>
        isRoomTakenByElse(roomId, checkIn, checkOut, session.user.id)
      );
      isTaken = (await Promise.all(promises)).some(Boolean);
    }

    if (isTaken) {
      await cancelHotelBooking(booking.id || booking._id.toString(), session.user.id);
      return NextResponse.json({
        success: false,
        message: 'Room is already taken by another person, thus booking is cancelled',
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('[get_reserved_hotel] Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}