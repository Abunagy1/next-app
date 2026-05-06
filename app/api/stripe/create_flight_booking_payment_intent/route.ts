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
import { isSeatTakenByElse, cancelBooking } from '@/app/lib/services/flights';
const requestSchema = z.object({
  paymentMethodId: z.string().optional(),
  flightNumber: z.string(),
  flightDateTimestamp: z.union([z.string(), z.number()]),
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
  const { paymentMethodId, flightNumber, flightDateTimestamp, shouldSavePaymentMethod } = validation.data;
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
    // 2. Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await createUniqueCustomer(
        { name: `${user.first_name} ${user.last_name}`, email: user.email },
        undefined, ['email'] // options (undefined is fine)
      );
      customerId = customer.id;
      if (dbType === 'postgres') {
        await sql`UPDATE users SET customer_id = ${customerId} WHERE id = ${session.user.id}`;
      } else {
        await dataModels.User.updateOne({ _id: session.user.id }, { $set: { customerId } });
      }
      revalidateTag('userDetails', {});
    }
    // 3. Get flight itinerary
    let flightItinerary: any;
    const flightDate = new Date(flightDateTimestamp);
    const dateStr = flightDate.toISOString().split('T')[0];
    if (dbType === 'postgres') {
      const rows = await sql`
        SELECT * FROM flight_itineraries
        WHERE flight_code = ${flightNumber} AND date::date = ${dateStr}
      `;
      if (rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Flight not found' }, { status: 404 });
      }
      flightItinerary = rows[0];
    } else {
      await connectDB();
      flightItinerary = await dataModels.FlightItinerary.findOne({
        flightCode: flightNumber,
        //date: { $gte: new Date(flightDate.setHours(0,0,0,0)), $lte: new Date(flightDate.setHours(23,59,59,999)) },
        date: { $gte: new Date(dateStr + 'T00:00:00.000Z'), $lte: new Date(dateStr + 'T23:59:59.999Z'), },
      }).lean();
      if (!flightItinerary) {
        return NextResponse.json({ success: false, message: 'Flight not found' }, { status: 404 });
      }
    }
    // 4. Get pending booking for this user and flight
    let booking: any;
    if (dbType === 'postgres') {
      const bookings = await sql`
        SELECT * FROM flight_bookings
        WHERE flight_itinerary_id = ${flightItinerary.id}
          AND user_id = ${session.user.id}
          AND payment_status = 'pending'
          AND ticket_status = 'pending'
        LIMIT 1
      `;
      if (bookings.length === 0) {
        return NextResponse.json({ success: false, message: 'No pending flight booking found' }, { status: 404 });
      }
      booking = bookings[0];
    } else {
      await connectDB();
      booking = await dataModels.FlightBooking.findOne({
        flightItineraryId: flightItinerary._id,
        userId: strToObjectId(session.user.id) as Types.ObjectId,
        paymentStatus: 'pending',
        ticketStatus: 'pending',
      }).lean();
      console.log(`🔎 Found booking for payment:`, booking);
      if (!booking) {
        return NextResponse.json({ success: false, message: 'No pending flight booking found' }, { status: 404 });
      }
    }

    // 5. Check if any seat is taken by another passenger
    let isTaken = false;
    let selectedSeats = booking.selected_seats || [];
    if (typeof selectedSeats === 'string') {
      try { selectedSeats = JSON.parse(selectedSeats); } catch { selectedSeats = []; }
    }
    if (selectedSeats && Array.isArray(selectedSeats)) {
      for (const seat of selectedSeats) {
        const seatId = dbType === 'postgres' ? seat.seatId : (seat.seatId._id || seat.seatId);
        const passengerId = seat.passengerId;
        if (!seatId) continue;                // guard against undefined
        const taken = await isSeatTakenByElse(String(seatId), passengerId);
        if (taken) {
          isTaken = true;
          break;
        }
      }
    }
    if (isTaken) {
      const cancellationData = {
        reason: 'Seat taken by another passenger due to expired reservation',
        canceledAt: new Date(),
        canceledBy: 'system',
      };
      const { cancelBooking } = await import('@/app/lib/services/flights');
      await cancelBooking(booking.pnr_code || booking.pnrCode, cancellationData);
      return NextResponse.json({
        success: false,
        message: 'Your seat is taken by someone else, thus we have canceled your booking',
      });
    }
    // 6. Create Stripe PaymentIntent (original fields, no shouldSavePaymentMethod)
    const priceInCents = usdToCents(booking.total_fare || booking.totalFare);
    const idempotencyKey = booking.pnr_code || booking.pnrCode;
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: priceInCents,
        currency: booking.currency || 'usd',
        payment_method: paymentMethodId || undefined,
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        receipt_email: user.email,
        metadata: {
          type: 'flightBooking',
          flightItineraryId: flightItinerary.id || flightItinerary._id.toString(),
          flightBookingId: booking.id || booking._id.toString(),
          pnrCode: booking.pnr_code || booking.pnrCode,
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
    console.error('Flight payment intent error:', error);
    const message = error.type === 'StripeConnectionError' ? 'Unable to connect to payment service' : 'Something went wrong';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}