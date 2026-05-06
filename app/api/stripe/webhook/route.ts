import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { dbType, sql } from "@/app/lib/db/index";
import dataModels from "@/app/lib/db/models";
import { revalidateTag } from "next/cache";
import sendEmail from "@/app/lib/email/sendEmail";
import { flightBookingConfirmedEmailTemplate } from "@/app/lib/email/templates";
import emailDefaultData from "@/data/emailDefaultData";
import { assignSeatsToFlightBooking } from "@/app/lib/services/flights";
import { strToObjectId } from "@/app/lib/db/utilsDB";
import mongoose from "mongoose";
// ⚡ Register Handlebars helpers BEFORE any template is used
import { ensureHelpersRegistered } from '@/app/lib/email/initHelpers';
ensureHelpersRegistered();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf);
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    console.error("Error verifying webhook signature:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
  switch (event.type) {
    case "charge.succeeded":
    case "charge.updated":
      await handleChargeUpdated(event.data.object as Stripe.Charge);
      break;
    case "charge.refund.updated":
      await handleRefundUpdated(event.data.object as Stripe.Refund);
      break;
    case "payment_intent.created":
      break;
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      if (pi.latest_charge && typeof pi.latest_charge !== 'string') {
        await handleChargeUpdated(pi.latest_charge as Stripe.Charge);
      } else if (pi.latest_charge && typeof pi.latest_charge === 'string') {
        const chargeData = await stripe.charges.retrieve(pi.latest_charge);
        await handleChargeUpdated(chargeData);
      }
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  return NextResponse.json({ success: true, message: "Success" });
}

async function handleChargeUpdated(charge: Stripe.Charge) {
  const methodType = charge.payment_method_details?.type;
  if (!methodType) return;

  if (charge.metadata?.type === "flightBooking") {
    await handleFlightBookingPayment(charge, methodType);
  } else if (charge.metadata?.type === "hotelBooking") {
    await handleHotelBookingPayment(charge, methodType);
  }
}
// -------------------- FLIGHT PAYMENT --------------------
async function handleFlightBookingPayment(charge: Stripe.Charge, methodType: string) {
  if (dbType === "postgres") {
    await handleFlightBookingPaymentPostgres(charge, methodType);
  } else {
    await handleFlightBookingPaymentMongo(charge, methodType);
  }
}
// app/api/stripe/webhook/route.ts – replace the PostgreSQL handler
async function handleFlightBookingPaymentPostgres(charge: Stripe.Charge, methodType: string) {
  const metadata = charge.metadata;
  if (!metadata?.flightBookingId) return;

  // Fetch booking before starting the transaction
  const bookingRows = await sql`
    SELECT * FROM flight_bookings WHERE id = ${metadata.flightBookingId}
  `;
  if (!bookingRows.length) throw new Error('Booking not found');
  const booking = bookingRows[0];

  // Parse JSONB columns
  let passengers = booking.passengers;
  if (typeof passengers === 'string') {
    try { passengers = JSON.parse(passengers); } catch { passengers = []; }
  }
  let segmentIds = booking.segment_ids || booking.segmentIds || [];
  if (typeof segmentIds === 'string') {
    try { segmentIds = JSON.parse(segmentIds); } catch { segmentIds = []; }
  }
  if (Array.isArray(segmentIds) && segmentIds.length > 0 && typeof segmentIds[0] === 'string') {
    segmentIds = segmentIds.map((sid: string) => ({ id: sid }));
  }
  if (Array.isArray(passengers) && passengers.length > 0 && typeof passengers[0] === 'string') {
    passengers = passengers.map((pid: string) => ({ id: pid }));
  }
  // Build booking object expected by assignSeatsToFlightBooking
  const bookingObj = {
    ...booking,
    pnrCode: booking.pnr_code || booking.pnrCode,
    passengers,
    segmentIds,
    seatClass: passengers?.[0]?.seat_class || passengers?.[0]?.seatClass || 'economy',
  };
  // Use sql.begin callback to manage the transaction
  await sql.begin(async (trx: any) => {
    // Insert payment record
    const flightPaymentId = generateUUID();
    await trx`
      INSERT INTO flight_payments (
        id, booking_id, transaction_id, stripe_payment_intent_id, stripe_charge_id,
        payment_method, amount, payment_date, receipt_url, created_at, updated_at
      ) VALUES (
        ${flightPaymentId}, ${metadata.flightBookingId}, ${charge.balance_transaction},
        ${charge.payment_intent}, ${charge.id},
        ${JSON.stringify({
          id: charge.payment_method,
          methodType,
          brand: (charge.payment_method_details as any)[methodType]?.brand,
          last4: (charge.payment_method_details as any)[methodType]?.last4,
        })},
        ${Number(charge.amount) / 100}, ${charge.created}, ${charge.receipt_url}, NOW(), NOW()
      )
    `;
    // Update booking status
    await trx`
      UPDATE flight_bookings
      SET ticket_status = 'confirmed',
          payment_status = 'paid',
          payment_id = ${flightPaymentId},
          booked_at = ${new Date(charge.created * 1000).toISOString()}
      WHERE id = ${metadata.flightBookingId}
    `;
    // Assign seats permanently using the transaction
    await assignSeatsToFlightBooking(bookingObj, 'permanent', 0, trx);
  });

  // Send confirmation email after transaction commits
  const flightResult = await sql`
    SELECT fi.* FROM flight_itineraries fi
    JOIN flight_bookings fb ON fb.flight_itinerary_id = fi.id
    WHERE fb.id = ${metadata.flightBookingId}
  `;
  const updatedBooking = await sql`
    SELECT * FROM flight_bookings WHERE id = ${metadata.flightBookingId}
  `;
  const flight = flightResult[0];
  const { emailFlightDetails, emailBookingDetails } = processFlightBookingDataForEmail(flight, updatedBooking);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const htmlEmail = flightBookingConfirmedEmailTemplate({
    ...emailDefaultData,
    main: {
      manageBookingUrl: `${baseUrl}/user/my_bookings/flights/${updatedBooking.id}`,
      downloadTicketUrl: `${baseUrl}/user/my_bookings/flights/${updatedBooking.id}/ticket`,
      flightDetails: emailFlightDetails,
      bookingDetails: emailBookingDetails,
    },
  });
  await sendEmail([{ Email: metadata.userEmail }], "Thank you for booking flight with golobe", htmlEmail);
  revalidateTag('userFlightBooking', {});
}

async function handleFlightBookingPaymentMongo(charge: Stripe.Charge, methodType: string) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const flightPayment = {
        bookingId: charge.metadata!.flightBookingId,
        transactionId: charge.balance_transaction || 'missing',
        stripe_paymentIntentId: charge.payment_intent,
        stripe_chargeId: charge.id,
        paymentDate: charge.created,
        paymentMethod: {
          id: charge.payment_method,
          methodType,
          brand: (charge.payment_method_details as any)[methodType]?.brand,
          last4: (charge.payment_method_details as any)[methodType]?.last4,
        },
        amount: Number(charge.amount) / 100,
        receiptUrl: charge.receipt_url,
      };
      const { FlightBooking, FlightItinerary, FlightPayment } = dataModels;
      const booking = await FlightBooking.findOne({
        _id: strToObjectId(charge.metadata!.flightBookingId),
      }).session(session);
      if (!booking) throw new Error("Booking not found");
      // Create payment record
      const paymentInfo = await FlightPayment.create([flightPayment], { session });
      // Update booking status
      await FlightBooking.updateOne(
        { _id: booking._id },
        {
          ticketStatus: "confirmed",
          paymentStatus: "paid",
          paymentId: paymentInfo[0]._id,
          bookedAt: new Date(charge.created * 1000),
        },
        { session }
      );
      // Assign seats permanently (if needed)
      await assignSeatsToFlightBooking(booking, "permanent", 0, session);
      await session.commitTransaction();
      session.endSession();

      // Send email
      const flight = await FlightItinerary.findById(booking.flightItineraryId).lean();
      const updatedBooking = await FlightBooking.findById(booking._id).lean();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
      const { emailFlightDetails, emailBookingDetails } = processFlightBookingDataForEmail(flight, updatedBooking);
      const htmlEmail = flightBookingConfirmedEmailTemplate({
        ...emailDefaultData,
        main: {
          manageBookingUrl: `${baseUrl}/user/my_bookings/flights/${updatedBooking._id}`,
          downloadTicketUrl: `${baseUrl}/user/my_bookings/flights/${updatedBooking._id}/ticket`,
          flightDetails: emailFlightDetails,
          bookingDetails: emailBookingDetails,
        },
      });
      await sendEmail([{ Email: charge.metadata!.userEmail }], "Thank you for booking flight with golobe", htmlEmail);
      revalidateTag("userFlightBooking", {});
      return;   // success – exit retry loop
    } catch (error: any) {
      if (session.inTransaction()) await session.abortTransaction();
      session.endSession();
      // If it's a transient error, retry
      if (
        error?.code === 112 ||                               // WriteConflict
        error?.errorLabels?.includes('TransientTransactionError')
      ) {
        attempts++;
        console.warn(`Write conflict on flight payment, retry ${attempts}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 200));  // wait 200ms
        continue;
      }
      // Non‑retryable error – throw
      //throw error;
      // If we exhausted retries, throw a final error
      throw error;
    }
    // no finally block
  }
  throw new Error('Flight payment failed after multiple retries');
}
// -------------------- HOTEL PAYMENT --------------------
async function handleHotelBookingPayment(charge: Stripe.Charge, methodType: string) {
  if (dbType === "postgres") {
    await handleHotelBookingPaymentPostgres(charge, methodType);
  } else {
    await handleHotelBookingPaymentMongo(charge, methodType);
  }
}
async function handleHotelBookingPaymentPostgres(charge: Stripe.Charge, methodType: string) {
  // Extract metadata
  const metadata = charge.metadata;
  if (!metadata?.hotelBookingId) return;

  await sql.begin(async (trx: any) => {
    // Insert payment record
    const hotelPaymentId = generateUUID();
    await trx`
      INSERT INTO hotel_payments (
        id, booking_id, transaction_id, stripe_payment_intent_id, stripe_charge_id,
        payment_method, amount, payment_date, receipt_url, created_at, updated_at
      ) VALUES (
        ${hotelPaymentId}, ${metadata.hotelBookingId}, ${charge.balance_transaction},
        ${charge.payment_intent}, ${charge.id},
        ${JSON.stringify({
          id: charge.payment_method,
          methodType,
          brand: (charge.payment_method_details as any)[methodType]?.brand,
          last4: (charge.payment_method_details as any)[methodType]?.last4,
        })},
        ${Number(charge.amount) / 100}, ${charge.created}, ${charge.receipt_url}, NOW(), NOW()
      )
    `;
    // Update booking status
    await trx`
      UPDATE hotel_bookings
      SET booking_status = 'confirmed',
          payment_status = 'paid',
          payment_method = 'card',
          payment_id = ${hotelPaymentId},
          booked_at = ${new Date(charge.created * 1000).toISOString()}
      WHERE id = ${metadata.hotelBookingId}
    `;
  });
  // Send hotel confirmation email (simple)
  try {
    if (metadata?.userEmail) {
      await sendEmail(
        [{ Email: metadata.userEmail }],
        "Your hotel booking is confirmed",
        `<p>Thank you. Booking ID: <strong>${metadata.hotelBookingId}</strong></p>`
      );
    }
  } catch (emailErr) {
    console.error('Hotel booking email failed:', emailErr);
  }
  revalidateTag('hotelBookings', {});
}

async function handleHotelBookingPaymentMongo(charge: Stripe.Charge, methodType: string) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { HotelBooking, HotelPayment } = dataModels;
      const paymentInfo = await HotelPayment.create([{
        bookingId: charge.metadata!.hotelBookingId,
        transactionId: charge.balance_transaction || 'missing',
        stripe_paymentIntentId: charge.payment_intent,
        stripe_chargeId: charge.id,
        paymentDate: charge.created,
        paymentMethod: {
          id: charge.payment_method,
          methodType,
          brand: (charge.payment_method_details as any)[methodType]?.brand,
          last4: (charge.payment_method_details as any)[methodType]?.last4,
        },
        amount: Number(charge.amount) / 100,
        receiptUrl: charge.receipt_url,
      }], { session });

      await HotelBooking.updateOne(
        { _id: strToObjectId(charge.metadata!.hotelBookingId) },
        {
          bookingStatus: "confirmed",
          paymentStatus: "paid",
          paymentMethod: "card",
          paymentId: paymentInfo[0]._id,
          bookedAt: new Date(charge.created * 1000),
        },
        { session }
      );
      await session.commitTransaction();
      session.endSession();
      // Send hotel confirmation email (simple)
      try {
        if (charge.metadata?.userEmail) {
          await sendEmail(
            [{ Email: charge.metadata.userEmail }],
            "Your hotel booking is confirmed",
            `<p>Thank you for your hotel booking. Your booking ID is <strong>${charge.metadata.hotelBookingId}</strong>. You can view the details in your account.</p>`
          );
        }
      } catch (emailErr) {
        console.error('Hotel booking email failed:', emailErr);
      }
      revalidateTag("hotelBookings", {});
      return; // success
    } catch (err: any) {
      if (session.inTransaction()) await session.abortTransaction();
      session.endSession();
      if (
        err?.code === 112 ||
        err?.errorLabels?.includes('TransientTransactionError')
      ) {
        attempts++;
        console.warn(`Write conflict on hotel payment, retry ${attempts}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Hotel payment failed after multiple retries');
}

async function handleRefundUpdated(refund: Stripe.Refund) {
  const metadata = refund.metadata;
  const chargeId = refund.charge as string;

  if (metadata?.type === "flightBooking") {
    if (dbType === "mongodb") {
      const { FlightBooking } = dataModels;
      await FlightBooking.updateOne(
        { _id: strToObjectId(metadata.flightBookingId) },
        {
          ticketStatus: "cancelled",
          paymentStatus: "refunded",
          refundInfo: {
            stripeRefundId: refund.id,
            status: "refunded",
            reason: refund.reason,
            currency: refund.currency,
            amount: Number(refund.amount) / 100,
            refundedAt: new Date(refund.created * 1000),
          },
        }
      );
    } else {
      await sql`
        UPDATE flight_bookings
        SET ticket_status = 'cancelled',
            payment_status = 'refunded',
            refund_info = ${JSON.stringify({
              stripeRefundId: refund.id,
              status: "refunded",
              reason: refund.reason,
              currency: refund.currency,
              amount: Number(refund.amount) / 100,
              refundedAt: new Date(refund.created * 1000),
            })}
        WHERE id = ${metadata.flightBookingId}
      `;
    }
    revalidateTag("userFlightBooking", {});
  } else if (metadata?.type === "hotelBooking") {
    if (dbType === "mongodb") {
      const { HotelBooking } = dataModels;
      await HotelBooking.updateOne(
        { _id: strToObjectId(metadata.hotelBookingId) },
        {
          bookingStatus: "cancelled",
          paymentStatus: "refunded",
          refundInfo: {
            stripeRefundId: refund.id,
            status: "refunded",
            reason: refund.reason,
            currency: refund.currency,
            amount: Number(refund.amount) / 100,
            refundedAt: new Date(refund.created * 1000),
          },
        }
      );
    } else {
      await sql`
        UPDATE hotel_bookings
        SET booking_status = 'cancelled',
            payment_status = 'refunded',
            refund_info = ${JSON.stringify({
              stripeRefundId: refund.id,
              status: "refunded",
              reason: refund.reason,
              currency: refund.currency,
              amount: Number(refund.amount) / 100,
              refundedAt: new Date(refund.created * 1000),
            })}
        WHERE id = ${metadata.hotelBookingId}
      `;
    }
    revalidateTag("hotelBookings",{});
  }
}

function processFlightBookingDataForEmail(dbFlightData: any, dbBookingData: any) {
  // Keep existing logic, works with both DB types if data shape is consistent
  return {
    emailFlightDetails: {
      itineraryFlightNumber: dbFlightData.flightCode || dbFlightData.flight_code,
      segments: (dbFlightData.segmentIds || dbFlightData.segment_ids || []).map((s: any) => ({
        flightNumber: s.flightNumber || s.flight_number,
        airlineName: s.airlineId?.name || s.airline_name,
        departureDateTime: s.from?.scheduledDeparture || s.from_scheduled_departure || new Date(0),
        departureAirportName: s.from?.airport?.name || s.departure_airport_name,
        departureAirportIataCode: s.from?.airport?.iataCode || s.departure_airport_iata,
        arrivalDateTime: s.to?.scheduledArrival || s.to_scheduled_arrival || new Date(0),
        arrivalAirportName: s.to?.airport?.name || s.arrival_airport_name,
        arrivalAirportIataCode: s.to?.airport?.iataCode || s.arrival_airport_iata,
        totalDurationMinutes: s.durationMinutes || s.duration_minutes,
        airplaneModelName: s.airplaneId?.model || s.airplane_model,
      })),
    },
    emailBookingDetails: {
      pnrCode: dbBookingData.pnrCode || dbBookingData.pnr_code,
      userTimeZone: dbBookingData.userTimeZone || dbBookingData.user_time_zone,
      totalfare: dbBookingData.totalFare || dbBookingData.total_fare,
      currency: dbBookingData.currency || "USD",
      bookedAt: dbBookingData.bookedAt || dbBookingData.booked_at || dbBookingData.createdAt,
      ticketType: "refundable",
      fareClass: "",
      paymentMethod: {
        brand: dbBookingData.paymentId?.paymentMethod?.brand || dbBookingData.payment_method_brand,
        last4: dbBookingData.paymentId?.paymentMethod?.last4 || dbBookingData.payment_method_last4,
        receiptUrl: dbBookingData.paymentId?.receiptUrl || dbBookingData.receipt_url,
      },
      passengers: (dbBookingData.passengers || []).map((p: any) => {
        const seat = (dbBookingData.selectedSeats || []).find((s: any) => s.passengerId === p._id);
        return {
          firstName: p.firstName,
          lastName: p.lastName,
          seatNumber: seat?.seatId?.seatNumber || seat?.seat_number,
          seatClass: seat?.seatId?.class || seat?.seat_class,
          passengerType: p.passengerType || p.passenger_type,
        };
      }),
    },
  };
}

// function processFlightBookingDataForEmailPostgres(dbFlightData: any, dbBookingData: any) {
//   // Similar but with snake_case fields
//   return processFlightBookingDataForEmail(dbFlightData, dbBookingData);
// }

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
