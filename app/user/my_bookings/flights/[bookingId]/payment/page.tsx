// app/user/my_bookings/flights/[bookingId]/payment/page.tsx

import BookingPayment from '@/components/pages/flights.book/sections/BookingPayment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import routes from '@/data/routes.json';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { sql, dbType } from '@/app/lib/db/index';
import { strToObjectId } from '@/app/lib/db/utilsDB';

export const dynamic = 'force-dynamic';

export default async function PaymentPage({ params }: { params: Promise<{ bookingId: string }> }) {
    const { bookingId } = await params;
    const session = await getServerSession(authOptions);
    const loggedIn = !!session?.user?.id;
    if (!loggedIn) {
        return redirect(routes.login.path + '?callbackPath=' + encodeURIComponent(`/user/my_bookings/flights/${bookingId}`));
    }

    let rawBooking: any;

    if (dbType === 'postgres') {
        const rows = await sql`
            SELECT * FROM flight_bookings WHERE id = ${bookingId} AND user_id = ${session.user.id}
        `;
        if (rows.length === 0) notFound();
        rawBooking = rows[0];
    } else {
        await import('@/app/lib/db/index').then(({ connectDB }) => connectDB());
        rawBooking = await getOneDoc(
            'FlightBooking',
            { _id: strToObjectId(bookingId), userId: strToObjectId(session.user.id) },
            ['userFlightBooking']
        );
        if (!rawBooking || Object.keys(rawBooking).length === 0) notFound();
    }

    // ---------- Normalize booking ----------
    const booking = {
        _id: rawBooking._id || rawBooking.id,
        flightItineraryId: rawBooking.flight_itinerary_id ?? rawBooking.flightItineraryId,
    };

    // Fetch the flight itinerary to get flight number and date
    let flightData: any;
    if (dbType === 'postgres') {
        const rows = await sql`
            SELECT flight_code, date FROM flight_itineraries WHERE id = ${booking.flightItineraryId}
        `;
        if (rows.length === 0) notFound();
        flightData = rows[0];
    } else {
        flightData = await getOneDoc(
            'FlightItinerary',
            { _id: strToObjectId(booking.flightItineraryId) },
            ['flight']
        );
        if (!flightData || Object.keys(flightData).length === 0) notFound();
    }

    const flightNumber = flightData.flight_code ?? flightData.flightCode;
    const flightDateTimestamp = new Date(flightData.date).getTime();

    return (
        <main className="mx-auto mb-[80px] mt-7 w-[90%] text-secondary">
            <BookingPayment flightNumber={flightNumber} flightDateTimestamp={flightDateTimestamp} />
        </main>
    );
}