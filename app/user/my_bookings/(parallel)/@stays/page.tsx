// app/user/my_bookings/(parallel)/@stays/page.tsx

import React from 'react';
import HotelBookingDetailsCard from '@/components/pages/profile/ui/HotelBookingDetailsCard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getAllHotelBookings } from '@/app/lib/services/hotels';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { sql, dbType } from '@/app/lib/db/index';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import { differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

function toPlainObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Uint8Array || Buffer.isBuffer(obj)) return '';
    if (Array.isArray(obj)) return obj.map(toPlainObject);
    if (typeof obj === 'object' && !(obj instanceof Date)) {
        if (typeof obj.toString === 'function' && obj._bsontype === 'ObjectId') {
            return obj.toString();
        }
        const plain: any = {};
        for (const key of Object.keys(obj)) {
            plain[key] = toPlainObject(obj[key]);
        }
        return plain;
    }
    return obj;
}

export default async function StaysPage({
    searchParams,
}: {
    searchParams?: Promise<{ filter?: string }>;
}) {
    const { filter } = (await searchParams) || {};
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return <Empty />;

    const bookingData = await getAllHotelBookings(userId, filter as any);
    console.log('🔎 @stays fetched hotel bookings:', bookingData.length);
    if (bookingData.length === 0) return <Empty />;

    const bookingCards = await Promise.all(
        bookingData.map(async (rawBooking: any) => {
            // ---- Normalize booking fields to camelCase uniform ----
            const booking = {
                _id: rawBooking._id || rawBooking.id,
                id: rawBooking.id,
                bookingStatus: rawBooking.booking_status ?? rawBooking.bookingStatus,
                paymentStatus: rawBooking.payment_status ?? rawBooking.paymentStatus,
                paymentMethod: rawBooking.payment_method ?? rawBooking.paymentMethod,
                bookedAt: rawBooking.booked_at ?? rawBooking.bookedAt,
                hotelId: (rawBooking.hotel_id ?? rawBooking.hotelId)?.toString() ?? '',   // ← critical: ensure string
                checkInDate: rawBooking.check_in_date ?? rawBooking.checkInDate,
                checkOutDate: rawBooking.check_out_date ?? rawBooking.checkOutDate,
                rooms: rawBooking.rooms,
                guests: rawBooking.guests,
                totalPrice: rawBooking.total_price ?? rawBooking.totalPrice,
            };

            if (!booking.hotelId) return null;   // safety check

            let hotelDetails: any;
            if (dbType === 'postgres') {
                const rows = await sql`SELECT * FROM hotels WHERE id = ${booking.hotelId}`;
                if (rows.length === 0) return null;
                hotelDetails = rows[0];
                const roomRows = await sql`SELECT * FROM hotel_rooms WHERE hotel_id = ${booking.hotelId}`;
                hotelDetails.rooms = roomRows;
            } else {
                hotelDetails = await getOneDoc('Hotel', { _id: strToObjectId(booking.hotelId) }, ['hotel']);
                if (!hotelDetails || Object.keys(hotelDetails).length === 0) return null;
            }

            // Normalize room fields
            const hotelRooms = (hotelDetails.rooms || []).map((r: any) => ({
                ...r,
                roomNumber: r.room_number ?? r.roomNumber,
                roomType: r.room_type ?? r.roomType,
                bedOptions: r.bed_options ?? r.bedOptions,
                sleepsCount: r.sleeps_count ?? r.sleepsCount,
            }));

            // Parse booking.rooms if stored as string, and convert to strings for comparison
            let bookingRooms = booking.rooms;
            if (typeof bookingRooms === 'string') {
                try { bookingRooms = JSON.parse(bookingRooms); } catch { bookingRooms = []; }
            }
            if (!Array.isArray(bookingRooms)) bookingRooms = [];

            const rooms = bookingRooms.map((roomId: any) => {
                const idStr = roomId?.toString?.() ?? roomId;   // handle ObjectId or string
                const room = hotelRooms.find((r: any) =>
                    dbType === 'postgres' ? r.id === idStr : r._id.toString() === idStr
                );
                return room ? {
                    key: (room.id || room._id)?.toString(),
                    roomNumber: room.roomNumber,
                    floor: room.floor,
                    roomType: room.roomType,
                    bedOptions: room.bedOptions,
                    sleepsCount: room.sleepsCount,
                } : null;
            }).filter(Boolean);

            // Normalize guests
            let guestsArr = booking.guests;
            if (typeof guestsArr === 'string') {
                try { guestsArr = JSON.parse(guestsArr); } catch { guestsArr = []; }
            }
            if (!Array.isArray(guestsArr)) guestsArr = [];
            const guests = guestsArr.map((guest: any) => ({
                key: (guest.id || guest._id)?.toString(),
                guestType: guest.guest_type ?? guest.guestType,
                firstName: guest.first_name ?? guest.firstName,
                lastName: guest.last_name ?? guest.lastName,
                email: guest.email,
                phone: guest.phone,
            }));

            const data = {
                key: (booking.id || booking._id)?.toString() || '',           // ← safe fallback (PostgreSQL has 'id', MongoDB has '_id')
                bookingId: (booking.id || booking._id)?.toString() || '',
                bookingStatus: booking.bookingStatus,
                paymentStatus: booking.paymentStatus,
                paymentMethod: booking.paymentMethod,
                bookedAt: booking.bookedAt,
                hotelName: hotelDetails.name,
                hotelAddress: dbType === 'postgres'
                    ? Object.values(hotelDetails.address).join(', ')
                    : `${hotelDetails.address.streetAddress}, ${hotelDetails.address.city}, ${hotelDetails.address.country}`,
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                checkInTime: hotelDetails.policies?.checkIn,
                checkOutTime: hotelDetails.policies?.checkOut,
                cancellationPolicy: hotelDetails.policies?.cancellationPolicy,
                refundPolicy: hotelDetails.policies?.refundPolicy,
                nights: differenceInDays(new Date(booking.checkOutDate), new Date(booking.checkInDate)),
                rooms,
                guests,
                totalPrice: booking.totalPrice,
                hotelImage: hotelDetails.images?.[0],
            };

            const plainData = toPlainObject(data);
            return <HotelBookingDetailsCard key={plainData.key} className="" bookingData={plainData} />;
        })
    );

    return (
        <div>
            {bookingCards.filter(Boolean).map((card, idx) => (
                <React.Fragment key={card?.key ?? idx}>{card}</React.Fragment>
            ))}
        </div>
    );
}

function Empty() {
    return (
        <div className="flex h-[300px] items-center justify-center gap-4 rounded-xl border bg-gray-50 p-6 text-gray-700 shadow-inner dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <div>
                <div className="mb-3 text-center text-2xl font-semibold dark:text-white">No Hotel Bookings</div>
                <p className="max-w-md text-center text-base dark:text-gray-400">You haven&apos;t booked any hotel yet.</p>
            </div>
        </div>
    );
}