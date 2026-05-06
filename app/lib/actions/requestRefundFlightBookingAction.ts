// 'use server';

// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/auth';
// import { dbType, sql, connectDB } from '@/app/lib/db/index';
// import { FlightBooking } from '@/app/lib/db/models';
// import { getOneDoc } from '@/app/lib/db/getOperationDB';
// import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
// import { revalidateTag } from 'next/cache';
// import { strToObjectId } from '@/app/lib/db/utilsDB';
// import { requestRefund } from '@/app/lib/paymentIntegration/stripe';

// export default async function requestRefundFlightBookingAction(pnrCode: string) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

//   try {
//     let chargeId: string | null = null;
//     let bookingId: string;

//     if (dbType === 'postgres') {
//       const booking = await sql`
//         SELECT fb.id, fb.payment_id, fp.stripe_charge_id
//         FROM flight_bookings fb
//         LEFT JOIN flight_payments fp ON fb.payment_id = fp.id
//         WHERE fb.pnr_code = ${pnrCode} AND fb.user_id = ${session.user.id}
//       `;
//       if (!booking.length) return { success: false, message: 'Booking not found' };
//       const { id, stripe_charge_id } = booking[0];
//       if (!stripe_charge_id) return { success: false, message: 'No payment found for this booking' };
//       chargeId = stripe_charge_id;
//       bookingId = id;
//     } else {
//       await connectDB();
//       const booking = await FlightBooking.findOne({ pnrCode, userId: strToObjectId(session.user.id) })
//         .populate('paymentId')
//         .lean();
//       if (!booking) return { success: false, message: 'Booking not found' };
//       if (!booking.paymentId?.stripe_chargeId) return { success: false, message: 'No payment found' };
//       chargeId = booking.paymentId.stripe_chargeId;
//       bookingId = booking._id.toString();
//     }

//     // Check if already refunded
//     // (We'll rely on Stripe to tell us)
//     const refund = await requestRefund({
//       charge: chargeId,
//       reason: 'requested_by_customer',
//       metadata: { type: 'flightBooking', flightBookingId: bookingId },
//     });

//     // Update booking status
//     if (dbType === 'postgres') {
//       await sql`
//         UPDATE flight_bookings
//         SET payment_status = 'refunded', ticket_status = 'cancelled', refund_info = ${JSON.stringify({
//           stripeRefundId: refund.id,
//           status: 'refunded',
//           reason: refund.reason,
//           amount: refund.amount / 100,
//           refundedAt: new Date(),
//         })}
//         WHERE id = ${bookingId}
//       `;
//     } else {
//       await updateOneDoc(
//         'FlightBooking',
//         { _id: strToObjectId(bookingId) },
//         {
//           paymentStatus: 'refunded',
//           ticketStatus: 'cancelled',
//           refundInfo: {
//             stripeRefundId: refund.id,
//             status: 'refunded',
//             reason: refund.reason,
//             amount: refund.amount / 100,
//             refundedAt: new Date(),
//           },
//         }
//       );
//     }
//     revalidateTag('userFlightBooking');
//     return { success: true, message: 'Refund requested successfully' };
//   } catch (error: any) {
//     console.error(error);
//     if (error.raw?.code === 'charge_already_refunded') {
//       return { success: false, message: 'This booking has already been refunded' };
//     }
//     return { success: false, message: 'Failed to request refund' };
//   }
// }

'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { revalidateTag } from 'next/cache';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import initStripe from '@/app/lib/paymentIntegration/stripe';

// ===================== Helper: getBookingStatusWithCancellationPolicy =====================
async function getBookingStatusWithCancellationPolicy(pnrCode: string, userId: string) {
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT
        fb.payment_status,
        fb.ticket_status,
        fi.date AS departure_date,
        a.airline_policy->'cancellationPolicy' AS cancellation_policy,
        fb.created_at
      FROM flight_bookings fb
      JOIN flight_itineraries fi ON fb.flight_itinerary_id = fi.id
      JOIN airlines a ON fi.carrier_in_charge = a.iata_code
      WHERE fb.pnr_code = ${pnrCode} AND fb.user_id = ${userId}
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      paymentStatus: row.payment_status,
      ticketStatus: row.ticket_status,
      departureDate: row.departure_date,
      cancellationPolicy: row.cancellation_policy,
      createdAt: row.created_at,
    };
  } else {
    const booking = await getOneDoc(
      'FlightBooking',
      { pnrCode, userId: strToObjectId(userId) },
      ['userFlightBooking'],
      0
    );
    if (!booking || Object.keys(booking).length === 0) return null;
    const itinerary = await getOneDoc('FlightItinerary', { _id: booking.flightItineraryId }, ['flight'], 0);
    const airline = await getOneDoc('Airline', { _id: itinerary.carrierInCharge }, ['airline'], 0);
    return {
      paymentStatus: booking.paymentStatus,
      ticketStatus: booking.ticketStatus,
      departureDate: itinerary.date,
      cancellationPolicy: airline.airlinePolicy?.cancellationPolicy,
      createdAt: booking.createdAt,
    };
  }
}

// ===================== Helper: isFlightRefundable (pure logic) =====================
function isFlightRefundable(
  booking: {
    paymentStatus: string;
    ticketStatus: string;
    departureTime: Date;
    fareType: string;
    createdAt?: Date;
  },
  cancellationPolicy: any
): boolean {
  const now = new Date();
  if (
    now >= new Date(booking.departureTime) ||
    (booking.paymentStatus !== 'paid' && booking.ticketStatus !== 'confirmed')
  ) {
    return false;
  }
  const policy = cancellationPolicy;
  const fareRule = policy.fareRules?.[booking.fareType];
  if (!fareRule || !fareRule.cancellable) {
    const hoursSinceBooking =
      (now.getTime() - (booking.createdAt?.getTime() || now.getTime())) / (1000 * 60 * 60);
    if (policy.gracePeriodHours && hoursSinceBooking <= policy.gracePeriodHours) {
      return true;
    }
    return false;
  }
  if (fareRule.refundType === 'full' || fareRule.refundType === 'partial') {
    return true;
  }
  if (fareRule.refundType === 'voucher' && policy.allowVoucherInsteadOfRefund) {
    return true;
  }
  return false;
}

// ===================== Helper: refundPaymentFlightBooking =====================
async function refundPaymentFlightBooking(pnrCode: string, userId: string) {
  const stripe = initStripe();
  let bookingId: string;
  let chargeId: string;

  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT fb.id, fp.stripe_charge_id
      FROM flight_bookings fb
      LEFT JOIN flight_payments fp ON fb.payment_id = fp.id
      WHERE fb.pnr_code = ${pnrCode} AND fb.user_id = ${userId}
      LIMIT 1
    `;
    if (rows.length === 0) throw new Error('Booking not found');
    bookingId = rows[0].id;
    chargeId = rows[0].stripe_charge_id;
    if (!chargeId) throw new Error('No charge ID found for this booking');

    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: 'requested_by_customer',
      metadata: { type: 'flightBooking', flightBookingId: bookingId, pnrCode, userId },
    });

    await sql`
      UPDATE flight_bookings
      SET
        payment_status = 'refunded',
        ticket_status = 'cancelled',
        refund_info = ${JSON.stringify({
          stripeRefundId: refund.id,
          status: 'refunded',
          reason: refund.reason,
          currency: refund.currency,
          amount: refund.amount / 100,
          refundedAt: new Date(refund.created * 1000),
        })}::jsonb
      WHERE id = ${bookingId}
    `;
  } else {
    await connectDB();
    const booking = await getOneDoc(
      'FlightBooking',
      { pnrCode, userId: strToObjectId(userId) },
      ['userFlightBooking'],
      0
    );
    if (!booking) throw new Error('Booking not found');
    bookingId = booking._id.toString();
    chargeId = booking.paymentId?.stripe_chargeId;
    if (!chargeId) throw new Error('No charge ID found for this booking');

    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: 'requested_by_customer',
      metadata: { type: 'flightBooking', flightBookingId: bookingId, pnrCode, userId },
    });

    await updateOneDoc('FlightBooking', { _id: booking._id }, {
      paymentStatus: 'refunded',
      ticketStatus: 'cancelled',
      refundInfo: {
        stripeRefundId: refund.id,
        status: 'refunded',
        reason: refund.reason,
        currency: refund.currency,
        amount: refund.amount / 100,
        refundedAt: new Date(refund.created * 1000),
      },
    });
  }
  revalidateTag('userFlightBooking', {});
}

// ===================== Main Action =====================
export default async function requestRefundFlightBookingAction(pnrCode: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthenticated' };
  }
  const userId = session.user.id;

  try {
    const bookingStatuses = await getBookingStatusWithCancellationPolicy(pnrCode, userId);
    if (!bookingStatuses) {
      return { success: false, message: 'Flight booking not found' };
    }

    const { paymentStatus, ticketStatus, departureDate, cancellationPolicy, createdAt } = bookingStatuses;

    const isRefundable = isFlightRefundable(
      {
        paymentStatus,
        ticketStatus,
        departureTime: departureDate,
        fareType: 'refundable',
        createdAt,
      },
      cancellationPolicy
    );

    if (!isRefundable) {
      return { success: false, message: 'This booking is not refundable' };
    }

    await refundPaymentFlightBooking(pnrCode, userId);
    return { success: true, message: 'Refund request sent successfully' };
  } catch (error: any) {
    console.error(error);
    if (error.raw?.code === 'charge_already_refunded') {
      return { success: false, message: 'This booking has already been refunded' };
    }
    return { success: false, message: 'Something went wrong' };
  }
}

