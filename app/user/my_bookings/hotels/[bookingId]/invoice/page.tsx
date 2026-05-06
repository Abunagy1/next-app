import { Card, CardContent } from '@/components/ui/card';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import { notFound, redirect } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getUserDetails } from '@/app/lib/services/user';
import HotelBookingInvoice from '@/components/pages/user.my_bookings.hotels.[bookingId].invoice/HotelBookingInvoice';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import routes from '@/data/routes.json';

export default async function HotelBookingInvoicePage({ params }: { params: Promise<{ bookingId: string }> }) {
    const { bookingId } = await params;

    // --- improved validation ---
    if (!bookingId || bookingId === 'undefined' || typeof bookingId !== 'string' || bookingId.trim().length === 0) {
        notFound();
    }

    if (dbType === 'postgres') {
        // PostgreSQL uses UUIDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(bookingId)) notFound();
    } else {
        // MongoDB uses 24-hex-character ObjectIds
        const objectIdRegex = /^[0-9a-f]{24}$/i;
        if (!objectIdRegex.test(bookingId)) notFound();
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return redirect(
            routes.login.path +
            '?callbackPath=' +
            encodeURIComponent(routes.profile.path)
        );
    }
    const userId = session.user.id;

    let hotelBooking: any;
    if (dbType === 'postgres') {
        const rows = await sql`
            SELECT * FROM hotel_bookings WHERE id = ${bookingId} AND user_id = ${userId}
        `;
        if (rows.length === 0) notFound();
        hotelBooking = rows[0];
        // Parse fare breakdown JSONB/string into an object
        let rawFare = hotelBooking.fare_breakdown || hotelBooking.fareBreakdown;
        if (typeof rawFare === 'string') {
            try { rawFare = JSON.parse(rawFare); } catch { rawFare = {}; }
        }
        if (!rawFare || typeof rawFare !== 'object') {
            rawFare = {};
        }
        hotelBooking.fareBreakdown = rawFare;
        hotelBooking.bookedAt = hotelBooking.booked_at || hotelBooking.bookedAt || null;
        hotelBooking.totalPrice = Number(hotelBooking.total_price) || Number(hotelBooking.totalPrice) || 0;
        // Parse rooms and guests if they are still strings
        if (typeof hotelBooking.rooms === 'string') {
            try { hotelBooking.rooms = JSON.parse(hotelBooking.rooms); } catch { hotelBooking.rooms = []; }
        }
        if (typeof hotelBooking.guests === 'string') {
            try { hotelBooking.guests = JSON.parse(hotelBooking.guests); } catch { hotelBooking.guests = []; }
        }
    } else {
        await connectDB();
        hotelBooking = await getOneDoc(
            'HotelBooking',
            { _id: strToObjectId(bookingId), userId: strToObjectId(userId) },
            ['hotelBooking']
        );
        if (!hotelBooking || Object.keys(hotelBooking).length === 0) notFound();
    }

    const paymentStatus = hotelBooking.payment_status || hotelBooking.paymentStatus;
    if (paymentStatus !== 'paid') {
        return (
            <main className="mx-auto my-12 w-[95%] text-secondary">
                <Card className="mx-auto max-w-md border border-yellow-300 bg-yellow-50 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center space-y-4 py-10 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-200 text-yellow-800">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-semibold text-yellow-800">Invoice Not Available Yet</h2>
                        <p className="text-sm text-yellow-700">Your invoice will be generated after a successful payment. Please complete your payment to proceed.</p>
                        <Button variant="default" className="bg-yellow-600 text-white hover:bg-yellow-700" asChild>
                            <Link href={`/user/my_bookings/hotels/${bookingId}/payment`}>Pay Now</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    const userDetails = await getUserDetails(userId);
    let hotelDetails: any;
    if (dbType === 'postgres') {
        const rows = await sql`SELECT * FROM hotels WHERE id = ${hotelBooking.hotel_id}`;
        if (rows.length === 0) notFound();
        hotelDetails = rows[0];
    } else {
        hotelDetails = await getOneDoc('Hotel', { _id: strToObjectId(hotelBooking.hotel_id) }, ['hotel']);
        if (!hotelDetails || Object.keys(hotelDetails).length === 0) notFound();
    }
    return (
        <main className="mx-auto my-12 w-[95%] text-secondary">
            <HotelBookingInvoice
                bookingDetails={hotelBooking}
                hotelDetails={hotelDetails}
                userDetails={userDetails}
            />
        </main>
    );
}