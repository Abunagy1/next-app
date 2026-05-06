import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import initStripe, { createUniqueCustomer } from '@/app/lib/paymentIntegration/stripe';
import { usdToCents } from '@/app/lib/utils';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import { Types } from 'mongoose';
import { cancelHotelBooking, isRoomTakenByElse } from '@/app/lib/services/hotels';
const requestSchema = z.object({
  paymentMethodId: z.string().optional(),
  slug: z.string(),
  checkInDate: z.union([z.string(), z.number()]),
  checkOutDate: z.union([z.string(), z.number()]),
  shouldSavePaymentMethod: z.boolean().optional(),
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
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  const validation = requestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ success: false, message: 'Invalid request parameters' }, { status: 400 });
  }
  const { paymentMethodId, slug, checkInDate, checkOutDate, shouldSavePaymentMethod } = validation.data;
  const checkIn = typeof checkInDate === 'string' ? new Date(checkInDate) : new Date(checkInDate);
  const checkOut = typeof checkOutDate === 'string' ? new Date(checkOutDate) : new Date(checkOutDate);
  try {
    // 1. Get user details and Stripe customer ID
    let user: any;
    let customerId: string | null = null;
    if (dbType === 'postgres') {
      const users = await sql<{ id: string; first_name: string; last_name: string; email: string; customer_id: string | null }[]>`
        SELECT id, first_name, last_name, email, customer_id FROM users WHERE id = ${session.user.id}
      `;
      if (users.length === 0) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      user = users[0];
      customerId = user.customer_id;
    } else {
      await connectDB();
      user = await dataModels.User.findById(session.user.id).lean();
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      customerId = user.customerId;
    }
    const stripe = initStripe();
    // 2. Create or retrieve Stripe customer (exactly as original)
    if (!customerId) {
      const customer = await createUniqueCustomer(
        { name: `${user.first_name} ${user.last_name}`, email: user.email },
        undefined, ['email'] // options (null is fine)
      );
      customerId = customer.id;
      if (dbType === 'postgres') {
        await sql`UPDATE users SET customer_id = ${customerId} WHERE id = ${session.user.id}`;
      } else {
        await dataModels.User.updateOne({ _id: session.user.id }, { $set: { customerId } });
      }
      revalidateTag('userDetails', {});
    }
    // 3. Get hotel by slug
    let hotel: any;
    if (dbType === 'postgres') {
      const rows = await sql`SELECT * FROM hotels WHERE slug = ${slug}`;
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
    // 4. Get pending booking for this user and hotel/dates (matching original query)
    let booking: any;
    if (dbType === 'postgres') {
      // const bookings = await sql`
      //   SELECT * FROM hotel_bookings
      //   WHERE hotel_id = ${hotel.id}
      //     AND user_id = ${session.user.id}
      //     AND check_in_date::date = ${checkIn.toISOString().split('T')[0]}
      //     AND check_out_date::date = ${checkOut.toISOString().split('T')[0]}
      //     AND booking_status IN ('pending', 'confirmed')
      //     AND payment_status = 'pending'
      //   ORDER BY created_at DESC
      //   LIMIT 1
      // `;
      const bookings = await sql`
        SELECT * FROM hotel_bookings
        WHERE hotel_id = ${hotel.id}
          AND user_id = ${session.user.id}
          AND check_in_date::date = ${checkIn.toISOString().split('T')[0]}
          AND check_out_date::date = ${checkOut.toISOString().split('T')[0]}
          AND (
            (booking_status = 'pending' AND payment_status = 'pending')
            OR (booking_status = 'confirmed' AND payment_status = 'pending' AND payment_method = 'cash')
          )
        ORDER BY created_at DESC
        LIMIT 1
      `;
      if (bookings.length === 0) {
        return NextResponse.json({ success: false, message: 'No pending hotel booking found' }, { status: 404 });
      }
      booking = bookings[0];
    } else {
      await connectDB();
      booking = await dataModels.HotelBooking.findOne({
        hotelId: hotel._id,
        userId: strToObjectId(session.user.id) as Types.ObjectId,
        checkInDate: { $gte: new Date(checkIn.setHours(0,0,0,0)), $lte: new Date(checkIn.setHours(23,59,59,999)) },
        checkOutDate: { $gte: new Date(checkOut.setHours(0,0,0,0)), $lte: new Date(checkOut.setHours(23,59,59,999)) },
        $or: [
          { bookingStatus: 'pending', paymentStatus: 'pending' },
          { bookingStatus: 'confirmed', paymentStatus: 'pending', paymentMethod: 'cash' },
        ],
      }).sort({ createdAt: -1 }).lean();
      if (!booking) {
        return NextResponse.json({ success: false, message: 'No pending hotel booking found' }, { status: 404 });
      }
    }

    // . Check if rooms are still available (optional – implement if needed)
    // 5. Check if any room is taken by another user (dual-database)
    // let isTaken = false;
    // const roomIds = booking.rooms || [];
    // if (dbType === 'postgres') {
    //   if (booking.rooms && booking.rooms.length) {
    //     // const roomIds = booking.rooms;
    //     const taken = await sql`
    //       SELECT 1 FROM hotel_bookings
    //       WHERE rooms && ${roomIds}::uuid[]
    //         AND check_in_date < ${checkOut}
    //         AND check_out_date > ${checkIn}
    //         AND user_id != ${session.user.id}
    //         AND ( (booking_status = 'pending' AND guaranteed_reservation_until > NOW())
    //               OR booking_status = 'confirmed' )
    //       LIMIT 1
    //     `;
    //     isTaken = taken.length > 0;
    //   }
    // } else {
    //   const { isRoomTakenByElse } = await import('@/app/lib/services/hotels');
    //   const roomIds = booking.rooms || [];
    //   const promises = roomIds.map((roomId: string) =>
    //     isRoomTakenByElse(roomId, checkIn, checkOut, session.user.id)
    //   );
    //   isTaken = (await Promise.all(promises)).some(Boolean);
    // }
    // 5. Check if any room is taken by another user (using the dual‑database service)
    let isTaken = false;
    const roomIds = booking.rooms || [];
    for (const roomId of roomIds) {
      const taken = await isRoomTakenByElse(roomId, checkIn, checkOut, session.user.id);
      if (taken) {
        isTaken = true;
        break;
      }
    }
    if (isTaken) {
      const { cancelHotelBooking } = await import('@/app/lib/services/hotels');
      await cancelHotelBooking(booking.id || booking._id.toString(), session.user.id);
      return NextResponse.json({
        success: false,
        message: 'Room is already taken by another person, thus booking is cancelled',
      }, { status: 400 });
    }
    // 6. Create Stripe PaymentIntent (original fields, no shouldSavePaymentMethod)
    const priceInCents = usdToCents(booking.total_price || booking.totalPrice);
    const idempotencyKey = booking.id || booking._id.toString();

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: priceInCents,
        currency: booking.currency || 'usd',
        payment_method: paymentMethodId || undefined,
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        receipt_email: user.email,
        metadata: {
          type: 'hotelBooking',
          hotelId: hotel.id || hotel._id.toString(),
          hotelBookingId: booking.id || booking._id.toString(),
          userId: session.user.id,
          userEmail: user.email,
        },
      },
      { idempotencyKey }
    );

    const retrieved = await stripe.paymentIntents.retrieve(paymentIntent.id);

    return NextResponse.json({
      success: true,
      message: 'Success',
      data: {
        paymentIntents: paymentIntent,
        paymentStatus: retrieved.status,
      },
    });
  } catch (error: any) {
    console.error('Hotel payment intent error:', error);
    const message = error.type === 'StripeConnectionError' ? 'Unable to connect to payment service' : 'Something went wrong';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}