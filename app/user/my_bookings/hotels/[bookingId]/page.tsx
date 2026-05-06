import Image from 'next/image';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatCurrency } from '@/app/lib/utils';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import routes from '@/data/routes.json';
import { redirect } from 'next/navigation';
import { TruncatedBadgeList } from '@/components/pages/hotels.[bookingId]/TruncateBadgeList';
import Link from 'next/link';
import {
    CancelHotelBookingButton,
    ConfirmNowPayAtHotelButton,
    RequestRefundHotelBookingButton,
} from '@/components/pages/hotels.[bookingId]/ActionsButtons';
import NotFound from '@/app/not-found';
import {
    BOOKING_STATUS_TEXT_COL_TW_CLASS,
    PAYMENT_STATUS_TEXT_COL_TW_CLASS,
} from '@/app/lib/constants';
import { allowedHotelBookingActionBtns } from '@/app/lib/helpers/hotels/allowedHotelBookingActionBtns';
import { ChevronLeft } from 'lucide-react';
import { parseHotelCheckInOutPolicy } from '@/app/lib/helpers/hotels';
import dataModels from '@/app/lib/db/models';

export default async function HotelBookingDetailsPage({
    params,
}: {
    params: Promise<{ bookingId: string }>;
}) {
    const { bookingId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return redirect(
            routes.login.path +
            '?callbackPath=' +
            encodeURIComponent(`/user/my_bookings/hotels/${bookingId}`)
        );
    }

    // ---------- Fetch booking (dual‑database) ----------
    let rawBooking: any;
    if (dbType === 'postgres') {
        const rows = await sql`SELECT * FROM hotel_bookings WHERE id = ${bookingId} AND user_id = ${session.user.id}`;
        if (rows.length === 0) return <NotFound />;
        rawBooking = rows[0];
    } else {
        await connectDB();
        const bookingObjId = strToObjectId(bookingId);
        const userObjId = strToObjectId(session.user.id);
        rawBooking = await dataModels.HotelBooking.findOne({
            _id: bookingObjId,
            userId: userObjId,
        }).lean();
        if (!rawBooking) return <NotFound />;
    }

    // ---------- Normalize booking to unified camelCase ----------
    const booking = {
        // id
        _id: rawBooking._id || rawBooking.id,
        id: rawBooking.id,
        // statuses
        bookingStatus: rawBooking.booking_status ?? rawBooking.bookingStatus,
        paymentStatus: rawBooking.payment_status ?? rawBooking.paymentStatus,
        paymentMethod: rawBooking.payment_method ?? rawBooking.paymentMethod,
        // dates
        checkInDate: rawBooking.check_in_date ?? rawBooking.checkInDate,
        checkOutDate: rawBooking.check_out_date ?? rawBooking.checkOutDate,
        bookedAt: rawBooking.booked_at ?? rawBooking.bookedAt,
        // hotel
        hotelId: rawBooking.hotel_id ?? rawBooking.hotelId, // ← critical
 
        // rooms & guests (keep raw, parsed later if string)
        rooms: typeof rawBooking.rooms === 'string' ? JSON.parse(rawBooking.rooms) : (rawBooking.rooms || []),
        guests: typeof rawBooking.guests === 'string' ? JSON.parse(rawBooking.guests) : (rawBooking.guests || []),
        // price
        totalPrice: rawBooking.total_price ?? rawBooking.totalPrice,
    };

    // ---------- Fetch hotel (dual‑database) ----------
    let hotel: any;
    if (dbType === 'postgres') {
        const hotelRows = await sql`SELECT * FROM hotels WHERE id = ${booking.hotelId}`;
        if (hotelRows.length === 0) return <NotFound />;
        hotel = hotelRows[0];

        // fetch rooms for this hotel
        const roomRows = await sql`SELECT * FROM hotel_rooms WHERE hotel_id = ${booking.hotelId}`;
        hotel.rooms = roomRows.map((r: any) => ({
            id: r.id,
            roomType: r.room_type ?? r.roomType,
            bedOptions: r.bed_options ?? r.bedOptions,
            sleepsCount: r.sleeps_count ?? r.sleepsCount,
            roomNumber: r.room_number ?? r.roomNumber,
            floor: r.floor,
            amenities: r.amenities,
            features: r.features,
            price: typeof r.price === 'string' ? JSON.parse(r.price) : r.price,
        }));
    } else {
        hotel = await getOneDoc('Hotel', { _id: strToObjectId(booking.hotelId) }, ['hotel']);
        if (!hotel || Object.keys(hotel).length === 0) return <NotFound />;
    }

    // ---------- Map room IDs to actual room details ----------
    const rooms = hotel.rooms.filter((room: any) =>
        (booking.rooms || []).includes(room.id || room._id)
    );

    // ---------- Check‑in/out times ----------
    const checkInTime = parseHotelCheckInOutPolicy(hotel.policies?.checkIn);
    const checkIn = new Date(booking.checkInDate);
    checkIn.setHours(checkInTime.hour, checkInTime.minute, 0, 0);

    // ---------- Determine allowed actions ----------
    const { canConfirm, canCancel, canRefund, canDownload, canPay } =
        allowedHotelBookingActionBtns(
            booking.bookingStatus,
            booking.paymentStatus,
            hotel.policies?.cancellationPolicy,
            hotel.policies?.refundPolicy,
            checkIn
        );

    return (
        <main className="mx-auto my-4 w-[90%] max-w-[1440px] space-y-6">
            <Button className="p-0" variant="link" asChild>
                <Link href="/user/my_bookings?tab=hotels">
                    <ChevronLeft />
                    <span className="ml-2">Back to My Bookings</span>
                </Link>
            </Button>

            <div className="flex flex-wrap gap-3">
                {canConfirm && <ConfirmNowPayAtHotelButton bookingId={bookingId} />}
                {canDownload && (
                    <Button asChild>
                        <Link href={`/user/my_bookings/hotels/${bookingId}/invoice`}>Download Invoice</Link>
                    </Button>
                )}
                {canPay && (
                    <Button asChild>
                        <Link href={`/user/my_bookings/hotels/${bookingId}/payment`}>Pay and Confirm Now</Link>
                    </Button>
                )}
                {canCancel && <CancelHotelBookingButton bookingId={bookingId} />}
                {canRefund && <RequestRefundHotelBookingButton bookingId={bookingId} />}
            </div>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="space-y-4 p-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <Detail label="Check-In" value={format(checkIn, 'PP')} />
                        <Detail label="Check-Out" value={format(new Date(booking.checkOutDate), 'PP')} />
                        <Detail label="Booked At" value={booking.bookedAt ? format(new Date(booking.bookedAt), 'PPp') : '-'} />
                        <Detail label="Total Price" value={formatCurrency(booking.totalPrice)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <Detail label="Booking Status" value={booking.bookingStatus} highlight />
                        <Detail label="Payment Status" value={(booking.paymentStatus === 'pending' ? 'pay at property' : booking.paymentStatus)} highlight />
                        <Detail label="Payment Method" value={booking.paymentMethod || '-'} />
                    </div>
                </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-4">
                    <div className="sm:flex sm:gap-6">
                        <div className="w-full sm:w-1/3">
                            <Image src={hotel.images?.[0] || '/hotel-placeholder.jpg'} alt={hotel.name} width={400} height={300} className="mx-auto rounded-lg object-cover" />
                        </div>
                        <div className="mt-4 flex-1 space-y-2 sm:mt-0">
                            <h3 className="text-xl font-bold dark:text-white">{hotel.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {hotel.address?.streetAddress}, {hotel.address?.city}, {hotel.address?.country}
                            </p>
                        </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <TruncatedBadgeList label="Tags" items={hotel.tags} />
                    </div>
                </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="space-y-2 p-4">
                    <h3 className="text-lg font-semibold dark:text-white">Guests</h3>
                    {(booking.guests || []).map((guest: any, index: number) => (
                        <div key={guest.id || guest._id || index} className="flex flex-col rounded-md border bg-white dark:bg-gray-800 dark:border-gray-700 p-3 sm:flex-row sm:justify-between">
                            <div>
                                <p className="font-medium dark:text-white">{guest.first_name || guest.firstName} {guest.last_name || guest.lastName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Type: {guest.guest_type || guest.guestType}</p>
                                {guest.age && <p className="text-sm text-gray-600 dark:text-gray-400">Age: {guest.age}</p>}
                            </div>
                            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                                {guest.email && <p>Email: {guest.email}</p>}
                                {guest.phone && <p>Phone: {guest.phone}</p>}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="space-y-4 p-4">
                    <div>
                        <h3 className="text-lg font-semibold dark:text-white">Rooms</h3>
                        <p className="text-sm font-semibold text-muted-foreground dark:text-gray-400">
                            {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
                        </p>
                    </div>
                    {rooms.map((room: any, index: number) => (
                        <div key={room.id || room._id || index} className="space-y-2 rounded-lg border bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-4">
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <div className="w-full sm:w-1/3">
                                    <Image src={room.images?.[0] || '/room-placeholder.jpg'} alt="Room" width={300} height={200} className="h-[300px] w-full rounded-lg object-cover sm:aspect-square" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="font-semibold dark:text-white">{room.roomType}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{room.description}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-semibold">Sleeps:</span> {room.sleepsCount}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-semibold">Floor:</span> {room.floor}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-semibold">Room Number:</span> {room.roomNumber}
                                    </p>
                                    <TruncatedBadgeList label="Amenities" items={room.amenities} />
                                    <TruncatedBadgeList label="Features" items={room.features} />
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </main>
    );
}

function Detail({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className={cn('text-sm font-medium capitalize dark:text-white', highlight && BOOKING_STATUS_TEXT_COL_TW_CLASS[value as keyof typeof BOOKING_STATUS_TEXT_COL_TW_CLASS], highlight && PAYMENT_STATUS_TEXT_COL_TW_CLASS[value as keyof typeof PAYMENT_STATUS_TEXT_COL_TW_CLASS])}>
                {value}
            </p>
        </div>
    );
}