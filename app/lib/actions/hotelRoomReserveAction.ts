'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { cookies } from 'next/headers';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import { createOneDoc, createManyDocs } from '@/app/lib/db/createOperationDB';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import validateGuestForm from '@/app/lib/zodSchemas/hotelGuestsFormValidation';
import { isRoomAvailable } from '@/app/lib/services/hotels';
import { multiRoomCombinedFareBreakDown } from '@/app/lib/helpers/hotels/priceCalculation';
import mongoose from 'mongoose';
import { revalidateTag } from 'next/cache';
import { randomUUID } from 'crypto';
import { addMinutes } from 'date-fns';
import { validateAndApplyPromoCode, incrementPromoCodeUsage } from '@/app/lib/helpers/promoCode';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import dataModels from '@/app/lib/db/models';
type PgTransaction = {
  (strings: TemplateStringsArray, ...exprs: any[]): Promise<any>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
};

interface GuestInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone: { dialCode: string; number: string };
  guestType: 'adult' | 'child';
  age?: number;
  isPrimary: boolean;
}

interface RoomInput {
  _id: string;
  hotelId: string;
  [key: string]: any;
}

export default async function hotelRoomReserveAction(bookingData: {
  guests: GuestInput[];
  selectedRooms: RoomInput[];
  promoCode?: string;
  hotelId?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Please login first' };
  }

  const { guests, selectedRooms, promoCode = null } = bookingData;

  // Retrieve hotel search state from cookie
  const cookieStore = await cookies();
  const searchStateCookie = cookieStore.get('hotelSearchState')?.value;
  if (!searchStateCookie) {
    return { success: false, message: 'No search state found, please search again' };
  }
  const searchState = JSON.parse(searchStateCookie);

  // Validate guest forms
  const guestErrors: Record<number, any> = {};
  const validatedGuests: GuestInput[] = [];
  guests.forEach((guest, idx) => {
    const validation = validateGuestForm(guest);
    if (!validation.success) {
      guestErrors[idx] = validation.errors;
    } else {
      validatedGuests.push(validation.data as GuestInput);
    }
  });

  // Check if any rooms were selected
  let roomError: { message: string } | null = null;
  if (!selectedRooms.length) {
    roomError = { message: 'Please select a room' };
  }

  if (Object.keys(guestErrors).length > 0 || roomError) {
    return {
      success: false,
      errors: {
        guestInfo: guestErrors,
        ...(roomError && { roomInfo: roomError }),
      },
      message: 'Please fill in all the required fields',
    };
  }

  // Verify room availability (dual‑database)
  for (const room of selectedRooms) {
    const isAvailable = await isRoomAvailable(
      room._id,
      searchState.checkIn,
      searchState.checkOut
    );
    if (!isAvailable) {
      return {
        success: false,
        message: 'Some rooms have already been reserved by other users',
        reservedRooms: [room._id],
      };
    }
  }

  // Compute fare breakdown
  const priceBreakdown = multiRoomCombinedFareBreakDown(selectedRooms, guests.length);
  const hotelId = selectedRooms[0].hotelId;

  // Apply promo code
  let finalTotal = priceBreakdown.total;
  let appliedPromoCode: string | null = null;
  if (promoCode) {
    const promoResult = await validateAndApplyPromoCode(promoCode, priceBreakdown.total);
    if (promoResult.valid && promoResult.discountAmount != null) {
      finalTotal = Math.max(0, priceBreakdown.total - promoResult.discountAmount);
      appliedPromoCode = promoCode;
    } else {
      return { success: false, message: promoResult.message || 'Invalid promo code' };
    }
  }

  // ------------- MONGODB -------------
  if (dbType === 'mongodb') {
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    try {
      // Create HotelBooking
      const bookingObj = {
        userId: session.user.id,
        hotelId,
        rooms: selectedRooms.map((r) => r._id),
        checkInDate: new Date(searchState.checkIn),
        checkOutDate: new Date(searchState.checkOut),
        // guests: guestIds,
        guests: [],                    // ← insert empty, update later
        fareBreakdown: priceBreakdown.fareBreakdowns,
        totalPrice: finalTotal,
        bookingStatus: 'pending',
        paymentStatus: 'pending',
        guaranteedReservationUntil: addMinutes(new Date(), 10),
        promoCode: appliedPromoCode,                // <-- added
      };
      const booking = await createOneDoc('HotelBooking', bookingObj, { session: mongoSession });
      const bookingId = booking._id;
      // Create HotelGuest documents
      // Step 2: now create guests with the booking ID
      const guestDocs = validatedGuests.map((guest) => ({
        userId: session.user.id,
        hotelBookingId: bookingId,
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.isPrimary ? guest.email : null,
        phone: guest.isPrimary ? guest.phone.dialCode + guest.phone.number : null,
        guestType: guest.guestType,
        age: guest.age,
        isPrimary: guest.isPrimary,
      }));
      const createdGuests = await createManyDocs('HotelGuest', guestDocs, { session: mongoSession });
      const guestIds = createdGuests.map((id: any) => id.toString());
      //await createOneDoc('HotelBooking', bookingObj, { session: mongoSession });
      // await dataModels.HotelGuest.updateMany(
      //   { _id: { $in: guestIds.map((id: any) => strToObjectId(id)) } },
      //   { $set: { hotelBookingId: bookingId } },
      //   { session: mongoSession }
      // );
      // Step 3: update the booking with the guest IDs
      await dataModels.HotelBooking.updateOne(
        { _id: bookingId },
        { $set: { guests: guestIds } },
        { session: mongoSession }
      );
      await mongoSession.commitTransaction();
      revalidateTag('hotelBookings',{});
      if (appliedPromoCode) await incrementPromoCodeUsage(appliedPromoCode);
      return { success: true, message: 'Booking created successfully' };
    } catch (error) {
      if (mongoSession.inTransaction()) await mongoSession.abortTransaction();
      console.error('MongoDB booking error:', error);
      return { success: false, message: 'Error creating booking' };
    } finally {
      mongoSession.endSession();
    }
  }

  // ------------- POSTGRESQL -------------
  try {
    // Safety: ensure hotelId and room IDs are defined
    // let hotelId = selectedRooms[0]?.hotelId || selectedRooms[0]?.hotel_id || (selectedRooms[0] as any)?.hotelId;
    // if (!hotelId) {
    //   // Last resort: extract from search state cookie
    //   hotelId = searchState?.hotelId || null;
    // }
    const hotelId = bookingData.hotelId!;
    if (!hotelId) throw new Error('Hotel ID missing');
    // if (!hotelId) {
    //   throw new Error('Hotel ID missing from selected rooms and search state');
    // }
    const roomIds = selectedRooms.map((r: any) => r._id || r.id).filter(Boolean);
    if (!roomIds.length) {
      throw new Error('No valid room IDs');
    }
    const safePromoCode = appliedPromoCode ?? null;   // avoid undefined
    await sql.begin(async (trx: PgTransaction) => {
      // Insert guests
      const guestIds: string[] = [];
      for (const guest of validatedGuests) {
        const result = await trx`
          INSERT INTO hotel_guests (
            user_id, first_name, last_name, email, phone, guest_type, age, is_primary
          ) VALUES (
            ${session.user.id}, ${guest.firstName}, ${guest.lastName},
            ${guest.isPrimary ? guest.email : null},
            ${guest.isPrimary ? guest.phone.dialCode + guest.phone.number : null},
            ${guest.guestType}, ${guest.age ? Number(guest.age) : null}, ${guest.isPrimary}
          )
          RETURNING id
        `;
        guestIds.push(result[0].id);
      }

      // Create booking – using safe variables only
      await trx`
        INSERT INTO hotel_bookings (
          user_id, hotel_id, rooms, check_in_date, check_out_date,
          guests, fare_breakdown, total_price, booking_status, payment_status,
          guaranteed_reservation_until, booked_at, promo_code
        ) VALUES (
          ${session.user.id}, ${hotelId}, ${roomIds}::uuid[],
          ${new Date(searchState.checkIn)}, ${new Date(searchState.checkOut)},
          ${guestIds}::uuid[],
          ${JSON.stringify(priceBreakdown.fareBreakdowns)}::jsonb,
          ${finalTotal}, 'pending', 'pending',
          ${addMinutes(new Date(), 10)},
          NOW(),
          ${safePromoCode}
        )
      `;
    });
    revalidateTag('hotelBookings', {});
    if (appliedPromoCode) await incrementPromoCodeUsage(appliedPromoCode);
    return { success: true, message: 'Booking created successfully' };
  } catch (error) {
    console.error('PostgreSQL booking error:', error);
    return { success: false, message: 'Error creating booking' };
  }
}