'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { revalidateTag } from 'next/cache';
import { revalidatePath } from 'next/cache';
import { strToObjectId } from '@/app/lib/db/utilsDB';

export async function deleteHotelBookingAction(bookingId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthenticated' };

  try {
    if (dbType === 'postgres') {
      const booking = await sql`
        SELECT id, booking_status FROM hotel_bookings
        WHERE id = ${bookingId} AND user_id = ${session.user.id}
      `;
      if (!booking.length) return { success: false, message: 'Booking not found' };
      if (booking[0].booking_status !== 'cancelled')
        return { success: false, message: 'Only cancelled bookings can be deleted' };
      await sql`DELETE FROM hotel_payments WHERE booking_id = ${bookingId}`;
      await sql`DELETE FROM hotel_bookings WHERE id = ${bookingId}`;
    } else {
      await connectDB();
      const booking = await dataModels.HotelBooking.findOne({
        _id: strToObjectId(bookingId),
        userId: session.user.id,
        bookingStatus: 'cancelled',
      }).lean();
      if (!booking) return { success: false, message: 'Booking not found or not cancelled' };
      await dataModels.HotelPayment.deleteMany({ bookingId: strToObjectId(bookingId) });
      await dataModels.HotelBooking.deleteOne({ _id: strToObjectId(bookingId) });
    }

    revalidateTag('hotelBookings', {});
    revalidatePath('/user/my_bookings');
    return { success: true, message: 'Booking deleted' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Something went wrong' };
  }
}