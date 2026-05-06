// 'use server';

// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/auth';
// import { dbType, sql, connectDB } from '@/app/lib/db/index';
// import { HotelBooking } from '@/app/lib/db/models';
// import { getOneDoc } from '@/app/lib/db/getOperationDB';
// import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
// import { revalidateTag } from 'next/cache';
// import { strToObjectId } from '@/app/lib/db/utilsDB';
// import { requestRefund } from '@/app/lib/paymentIntegration/stripe';
// export default async function requestRefundHotelBookingAction(bookingId: string) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
//   try {
//     let chargeId: string | null = null;
//     let id: string;
//     if (dbType === 'postgres') {
//       const booking = await sql`
//         SELECT hb.id, hp.stripe_charge_id
//         FROM hotel_bookings hb
//         LEFT JOIN hotel_payments hp ON hb.payment_id = hp.id
//         WHERE hb.id = ${bookingId} AND hb.user_id = ${session.user.id}
//       `;
//       if (!booking.length) return { success: false, message: 'Booking not found' };
//       const { id: bid, stripe_charge_id } = booking[0];
//       if (!stripe_charge_id) return { success: false, message: 'No payment found for this booking' };
//       chargeId = stripe_charge_id;
//       id = bid;
//     } else {
//       await connectDB();
//       const booking = await HotelBooking.findOne({ _id: strToObjectId(bookingId), userId: strToObjectId(session.user.id) })
//         .populate('paymentId')
//         .lean();
//       if (!booking) return { success: false, message: 'Booking not found' };
//       if (!booking.paymentId?.stripe_chargeId) return { success: false, message: 'No payment found' };
//       chargeId = booking.paymentId.stripe_chargeId;
//       id = booking._id.toString();
//     }
//     const refund = await requestRefund({
//       charge: chargeId,
//       reason: 'requested_by_customer',
//       metadata: { type: 'hotelBooking', hotelBookingId: id },
//     });
//     if (dbType === 'postgres') {
//       await sql`
//         UPDATE hotel_bookings
//         SET payment_status = 'refunded', booking_status = 'cancelled', refund_info = ${JSON.stringify({
//           stripeRefundId: refund.id,
//           status: 'refunded',
//           reason: refund.reason,
//           amount: refund.amount / 100,
//           refundedAt: new Date(),
//         })}
//         WHERE id = ${id}
//       `;
//     } else {
//       await updateOneDoc(
//         'HotelBooking',
//         { _id: strToObjectId(id) },
//         {
//           paymentStatus: 'refunded',
//           bookingStatus: 'cancelled',
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
//     revalidateTag('hotelBookings');
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

// ===================== Helper: getBookingStatusesWithHotelPolicies =====================
async function getBookingStatusesWithHotelPolicies(bookingId: string, userId: string) {
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT
        hb.booking_status,
        hb.payment_status,
        hb.check_in_date,
        h.policies->'refundPolicy' AS refund_policy,
        h.policies->'cancellationPolicy' AS cancellation_policy
      FROM hotel_bookings hb
      JOIN hotels h ON hb.hotel_id = h.id
      WHERE hb.id = ${bookingId} AND hb.user_id = ${userId}
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      bookingStatus: row.booking_status,
      paymentStatus: row.payment_status,
      checkInDate: row.check_in_date,
      refundPolicy: row.refund_policy,
      cancellationPolicy: row.cancellation_policy,
    };
  } else {
    const booking = await getOneDoc(
      'HotelBooking',
      { _id: strToObjectId(bookingId), userId: strToObjectId(userId) },
      ['hotelBookings'],
      0
    );
    if (!booking || Object.keys(booking).length === 0) return null;
    const hotel = await getOneDoc('Hotel', { _id: booking.hotelId }, ['hotel'], 0);
    return {
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      checkInDate: booking.checkInDate,
      refundPolicy: hotel.policies?.refundPolicy,
      cancellationPolicy: hotel.policies?.cancellationPolicy,
    };
  }
}

// ===================== Helper: isHotelRefundable (pure logic) =====================
interface RefundPolicy {
  refundable: boolean;
  refundFee?: number;
}

function isHotelRefundable(
  refundPolicy: RefundPolicy,
  bookingStatus: string,
  paymentStatus: string
): boolean {
  if (!refundPolicy.refundable) return false;
  if (bookingStatus !== 'cancelled' && bookingStatus !== 'confirmed') return false;
  if (paymentStatus !== 'paid') return false;
  return true;
}

// ===================== Helper: refundPaymentHotelBooking =====================
async function refundPaymentHotelBooking(bookingId: string, userId: string) {
  const stripe = initStripe();
  let chargeId: string;

  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT hp.stripe_charge_id
      FROM hotel_bookings hb
      LEFT JOIN hotel_payments hp ON hb.payment_id = hp.id
      WHERE hb.id = ${bookingId} AND hb.user_id = ${userId}
      LIMIT 1
    `;
    if (rows.length === 0) throw new Error('Booking or payment not found');
    chargeId = rows[0].stripe_charge_id;
    if (!chargeId) throw new Error('No charge ID found for this booking');

    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: 'requested_by_customer',
      metadata: { type: 'hotelBooking', hotelBookingId: bookingId, userId },
    });

    await sql`
      UPDATE hotel_bookings
      SET
        payment_status = 'refunded',
        booking_status = 'cancelled',
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
      'HotelBooking',
      { _id: strToObjectId(bookingId), userId: strToObjectId(userId) },
      ['hotelBookings'],
      0
    );
    if (!booking) throw new Error('Booking not found');
    chargeId = booking.paymentId?.stripe_chargeId;
    if (!chargeId) throw new Error('No charge ID found for this booking');

    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: 'requested_by_customer',
      metadata: { type: 'hotelBooking', hotelBookingId: bookingId, userId },
    });

    await updateOneDoc('HotelBooking', { _id: booking._id }, {
      paymentStatus: 'refunded',
      bookingStatus: 'cancelled',
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
  revalidateTag('hotelBookings', {});
}

// ===================== Main Action =====================
export default async function requestRefundHotelBookingAction(bookingId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthenticated' };
  }
  const userId = session.user.id;

  try {
    const bookingInfo = await getBookingStatusesWithHotelPolicies(bookingId, userId);
    if (!bookingInfo) {
      return { success: false, message: 'Booking not found' };
    }

    const { bookingStatus, paymentStatus, refundPolicy } = bookingInfo;

    const isRefundable = isHotelRefundable(refundPolicy, bookingStatus, paymentStatus);
    if (!isRefundable) {
      return { success: false, message: 'This booking is not refundable' };
    }

    await refundPaymentHotelBooking(bookingId, userId);
    return { success: true, message: 'Refund request sent successfully' };
  } catch (error: any) {
    console.error(error);
    if (error.raw?.code === 'charge_already_refunded') {
      return { success: false, message: 'This booking has already been refunded' };
    }
    return { success: false, message: 'Something went wrong' };
  }
}