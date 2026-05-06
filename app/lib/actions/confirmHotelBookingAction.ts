// 'use server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/auth';
// import { dbType, sql, connectDB } from '@/app/lib/db/index';
// import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
// import { revalidateTag } from 'next/cache';
// import { strToObjectId } from '@/app/lib/db/utilsDB';
// export async function confirmHotelBookingCashAction(bookingId: string) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
//   try {
//     if (dbType === 'postgres') {
//       const result = await sql`
//         UPDATE hotel_bookings
//         SET booking_status = 'confirmed', payment_status = 'pending', payment_method = 'cash', booked_at = NOW()
//         WHERE id = ${bookingId} AND user_id = ${session.user.id}
//         RETURNING id
//       `;
//       if (!result.length) return { success: false, message: 'Booking not found' };
//     } else {
//       await connectDB();
//       await updateOneDoc(
//         'HotelBooking',
//         { _id: strToObjectId(bookingId), userId: strToObjectId(session.user.id) },
//         { bookingStatus: 'confirmed', paymentStatus: 'pending', paymentMethod: 'cash', bookedAt: new Date() }
//       );
//     }
//     revalidateTag('hotelBookings');
//     return { success: true, message: 'Booking confirmed. Pay at property.' };
//   } catch (error) {
//     console.error(error);
//     return { success: false, message: 'Failed to confirm booking' };
//   }
// }

'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { revalidateTag } from 'next/cache';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';

export async function confirmHotelBookingCashAction(bookingId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthenticated' };
  }
  const userId = session.user.id;

  // Verify booking exists and belongs to user
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT id FROM hotel_bookings
      WHERE id = ${bookingId} AND user_id = ${userId}
      LIMIT 1
    `;
    if (rows.length === 0) {
      return { success: false, message: 'Booking not found' };
    }

    // Update booking
    await sql`
      UPDATE hotel_bookings
      SET
        booking_status = 'confirmed',
        payment_status = 'pending',
        payment_method = 'cash',
        booked_at = NOW()
      WHERE id = ${bookingId} AND user_id = ${userId}
    `;
  } else {
    await connectDB();
    const booking = await dataModels.HotelBooking.findOne({
      _id: strToObjectId(bookingId),
      userId: strToObjectId(userId),
    }).lean();
    if (!booking) {
      return { success: false, message: 'Booking not found' };
    }

    await updateOneDoc('HotelBooking', { _id: strToObjectId(bookingId), userId: strToObjectId(userId) }, {
      bookingStatus: 'confirmed',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      bookedAt: new Date(),
    });
  }

  revalidateTag('hotelBookings', {});
  return { success: true, message: 'Hotel booking confirmed successfully' };
}