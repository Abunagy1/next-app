'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import { revalidateTag , revalidatePath } from 'next/cache';
import { isHotelCancellable } from '@/app/lib/helpers/hotels/isHotelCancellable';

// Helper: fetch booking statuses, cancellation policy, check‑in date
async function getBookingStatusesWithHotelPolicies(bookingId: string, userId: string) {
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT
        hb.booking_status,
        hb.payment_status,
        hb.check_in_date,
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
      cancellationPolicy: hotel.policies?.cancellationPolicy,
    };
  }
}

// Helper: cancel the booking in DB
async function cancelHotelBooking(bookingId: string, userId: string) {
  if (dbType === 'postgres') {
    await sql`
      UPDATE hotel_bookings
      SET booking_status = 'cancelled'
      WHERE id = ${bookingId} AND user_id = ${userId}
    `;
  } else {
    await updateOneDoc('HotelBooking', { _id: strToObjectId(bookingId), userId: strToObjectId(userId) }, {
      bookingStatus: 'cancelled',
    });
  }
}

export default async function cancelHotelBookingAction(bookingId: string) {
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

    const { bookingStatus, paymentStatus, checkInDate, cancellationPolicy } = bookingInfo;

    // Pending bookings can always be cancelled (no payment yet)
    let cancellable = false;
    if (bookingStatus === 'pending') {
      cancellable = true;
    } else if (bookingStatus === 'confirmed') {
      cancellable = isHotelCancellable(cancellationPolicy, new Date(checkInDate), bookingStatus);
    }

    if (!cancellable) {
      return { success: false, message: 'Booking is not cancellable' };
    }

    await cancelHotelBooking(bookingId, userId);

    revalidateTag('hotelBookings', {});
    revalidatePath('/user/my_bookings');

    return { success: true, message: 'Hotel booking cancelled successfully' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Something went wrong' };
  }
}