'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import { revalidateTag } from 'next/cache';
import { revalidatePath } from 'next/cache';
import isFlightCancellable from '@/app/lib/helpers/flights/isFlightCancellable';
// ===================== Helper: isFlightCancellable (pure logic) =====================

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
    // Fetch flight itinerary and airline
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

// ===================== Helper: cancelBooking =====================
async function cancelBooking(pnrCode: string, cancellationData: any) {
  if (dbType === 'postgres') {
    await sql`
      UPDATE flight_bookings
      SET
        ticket_status = 'cancelled',
        cancellation_info = ${JSON.stringify(cancellationData)}::jsonb
      WHERE pnr_code = ${pnrCode}
    `;
  } else {
    await updateOneDoc('FlightBooking', { pnrCode }, {
      ticketStatus: 'cancelled',
      cancellationInfo: cancellationData,
    });
  }
}

// ===================== Main Action =====================
export default async function cancelFlightBookingAction(pnrCode: string) {
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
    // const isCancellable = isFlightCancellable(
    //   {
    //     paymentStatus,
    //     ticketStatus,
    //     departureTime: departureDate,
    //     fareType: 'refundable',
    //     createdAt,
    //   },
    //   cancellationPolicy
    // );
    const isCancellable = isFlightCancellable(
        { paymentStatus, bookingStatus: ticketStatus, departureTime: departureDate, fareType: 'refundable', createdAt },
        cancellationPolicy
      );
    if (!isCancellable) {
      return { success: false, message: 'Flight booking is not cancellable' };
    }
    const cancellationData = {
      canceledBy: 'user',
      canceledAt: new Date(),
      reason: 'other',
    };
    await cancelBooking(pnrCode, cancellationData);
    // ... after await cancelBooking(pnrCode, cancellationData);
    revalidateTag('userFlightBooking', {});
    revalidatePath('/user/my_bookings');
    revalidatePath('/user/profile');
    return { success: true, message: 'Flight booking cancelled successfully' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Something went wrong' };
  }
}