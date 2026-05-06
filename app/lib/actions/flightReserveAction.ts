'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { cookies } from 'next/headers';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import { createOneDoc, createManyDocs } from '@/app/lib/db/createOperationDB';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import { nanoid, parseFlightSearchParams } from '@/app/lib/utils';
import validatePassengerDetails from '@/app/lib/zodSchemas/passengerDetailsValidation';
import validatePassengerPreferences from '@/app/lib/zodSchemas/passengersPreferencesValidation';
// this multiSegmentCombinedFareBreakDown function has been moved to app/lib/helpers/flights/fareBreakdown.ts to avoid circular dependencies with priceCalculations.ts which is used in FareCard component and also needs to use the same fare breakdown logic for multi-segment flights
//import { multiSegmentCombinedFareBreakDown } from '@/app/lib/db/schema/flightItineraries';
// it will be imported from fareBreakdown.ts instead which itself imports the singleSegmentFareBreakdown function from priceCalculations.ts without causing circular dependency issues since priceCalculations.ts does not import anything from fareBreakdown.ts
import { multiSegmentCombinedFareBreakDown } from '@/app/lib/helpers/flights/fareBreakdown';
import mongoose from 'mongoose';
import { revalidateTag } from 'next/cache';
// *** PROMO: import helper ***
import { validateAndApplyPromoCode, incrementPromoCodeUsage } from "@/app/lib/helpers/promoCode";

type PgTransaction = {
  (strings: TemplateStringsArray, ...exprs: any[]): Promise<any>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
};
// Helper for PostgreSQL: assign seats to a booking (mirrors MongoDB assignSeatsToFlightBooking)
async function assignSeatsPostgreSQL(
  trx: PgTransaction,
  bookingId: string,
  pnrCode: string,
  passengerIds: string[],
  flightItinerary: any,
  seatClass: string,
  reservationExpiresAt: Date
) {
  const selectedSeats: any[] = [];

  for (const segment of flightItinerary.segmentIds) {
    const segmentId = segment.id;
    // Get available seats for this segment (not permanently taken, and not temporarily taken by non‑expired reservations)
    const availableSeats = await trx`
      SELECT id, seat_number, class, reservation
      FROM flight_seats
      WHERE segment_id = ${segmentId}
        AND class = ${seatClass}
        AND (
          reservation IS NULL
          OR reservation->>'type' IS NULL
          OR (
            reservation->>'type' = 'temporary'
            AND (reservation->>'expiresAt')::bigint < ${Date.now()}
          )
        )
      LIMIT ${passengerIds.length}
    `;
    if (availableSeats.length < passengerIds.length) {
      throw new Error(`Not enough available seats for segment ${segmentId}`);
    }

    // For each passenger, reserve a seat
    for (let i = 0; i < passengerIds.length; i++) {
      const seat = availableSeats[i];
      const passengerId = passengerIds[i];

      // If this seat was temporarily held by another booking, cancel that booking
      if (seat.reservation && seat.reservation.pnrCode && seat.reservation.type === 'temporary') {
        const otherPnr = seat.reservation.pnrCode;
        await trx`
          UPDATE flight_bookings
          SET ticket_status = 'cancelled',
              cancellation_info = ${JSON.stringify({
                reason: 'Seat taken by another passenger due to expired reservation',
                canceledAt: new Date(),
                canceledBy: 'system',
              })}::jsonb
          WHERE pnr_code = ${otherPnr}
        `;
      }

      // Update seat reservation
      await trx`
        UPDATE flight_seats
        SET reservation = ${JSON.stringify({
          pnrCode,
          for: passengerId,
          type: 'temporary',
          expiresAt: reservationExpiresAt.getTime(),
        })}::jsonb
        WHERE id = ${seat.id}
      `;
      selectedSeats.push({
        passengerId,
        seatId: seat.id,
      });
    }
  }

  // Update booking with selected seats
  if (selectedSeats.length > 0) {
    await trx`
      UPDATE flight_bookings
      SET selected_seats = ${JSON.stringify(selectedSeats)}::jsonb
      WHERE id = ${bookingId}
    `;
  }

  return selectedSeats;
}

export async function flightReserveAction(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Please login first' };
  }
  // Parse form data
  const data = Object.fromEntries(formData);
  const passengersDetails = JSON.parse(data.passengersDetails as string);
  const passengersPreferences = JSON.parse(data.passengersPreferences as string);
  const metaData = JSON.parse(data.metaData as string);
  // *** PROMO: extract promo code ***
  const promoCode = (data.promoCode as string) || null;
  //const promoCode = (formData.get('promoCode') as string) || null;
  // 1. Fetch flight itinerary (dual‑database)
  let flightItinerary: any;
  if (dbType === 'postgres') {
    const result = await sql`
      SELECT 
        fi.id, fi.flight_code, fi.date, fi.carrier_in_charge, fi.departure_airport_id, fi.arrival_airport_id,
        fi.segment_ids, fi.total_duration_minutes, fi.layovers, fi.baggage_allowance, fi.status, fi.expire_at,
        jsonb_agg(
          jsonb_build_object(
            'id', fs.id,
            'flight_number', fs.flight_number,
            'date', fs.date,
            'airline_id', fs.airline_id,
            'airplane_id', fs.airplane_id,
            'from', jsonb_build_object('airport', fs.from_airport, 'scheduled_departure', fs.scheduled_departure, 'terminal', fs.from_terminal, 'gate', fs.from_gate),
            'to', jsonb_build_object('airport', fs.to_airport, 'scheduled_arrival', fs.scheduled_arrival, 'terminal', fs.to_terminal, 'gate', fs.to_gate),
            'duration_minutes', fs.duration_minutes,
            'fare_details', fs.fare_details,
            'baggage_allowance', fs.baggage_allowance
          )
        ) AS segments
      FROM flight_itineraries fi
      LEFT JOIN flight_segments fs ON fs.id = ANY(fi.segment_ids)
      WHERE fi.flight_code = ${metaData.flightNumber} AND fi.date = ${new Date(metaData.date)}
      GROUP BY fi.id
    `;
    if (result.length === 0) return { success: false, message: 'Flight not found' };
    flightItinerary = result[0];
    //flightItinerary.segmentIds = flightItinerary.segments; // rename for compatibility with fare function
    // Normalize fare details for PostgreSQL snake_case
    // PostgreSQL branch – after fetching flightItinerary and its segments
    flightItinerary.segmentIds = flightItinerary.segments.map((seg: any) => {
      // Ensure fare_details is an object
      let fare = seg.fare_details;
      if (typeof fare === 'string') {
        try { fare = JSON.parse(fare); } catch { fare = {}; }
      }
      return {
        ...seg,
        fareDetails: fare || {},   // rename to camelCase key expected by fare calc
      };
    });
  } else {
    await connectDB();
    flightItinerary = await getOneDoc('FlightItinerary', {
      flightCode: metaData.flightNumber,
      date: new Date(metaData.date),
    }, ['flight'], 0);
    if (Object.keys(flightItinerary).length === 0) return { success: false, message: 'Flight not found' };
  }

  // 2. Check existing pending booking
  let existingBooking: any = null;
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT id FROM flight_bookings
      WHERE flight_itinerary_id = ${flightItinerary.id}
        AND user_id = ${session.user.id}
        AND payment_status = 'pending'
        AND ticket_status = 'pending'
      LIMIT 1
    `;
    if (rows.length) existingBooking = rows[0];
  } else {
    existingBooking = await getOneDoc('FlightBooking', {
      flightItineraryId: flightItinerary._id,
      userId: session.user.id,
      paymentStatus: 'pending',
      ticketStatus: 'pending',
    }, ['userFlightBooking'], 0);
  }
  if (existingBooking && Object.keys(existingBooking).length > 0) {
    return {
      success: false,
      message: 'You have already reserved a flight of this flight number. Please cancel it or confirm it first to book another flight',
    };
  }

  // 3. Validate passenger details and preferences
  const passengerDetailsErrors: Record<string, any> = {};
  const validatedDetails: Record<string, any> = {};
  for (const p of passengersDetails) {
    const validation = validatePassengerDetails(p);
    if (!validation.success) {
      passengerDetailsErrors[p.key] = validation.errors;
    } else {
      validatedDetails[p.key] = validation.data;
    }
  }
  const passengerPreferencesErrors: Record<string, any> = {};
  const validatedPreferences: Record<string, any> = {};
  for (const pref of passengersPreferences) {
    const validation = validatePassengerPreferences(pref);
    if (!validation.success) {
      passengerPreferencesErrors[pref.key] = validation.errors;
    } else {
      validatedPreferences[pref.key] = validation.data;
    }
  }
  if (Object.keys(passengerDetailsErrors).length > 0 || Object.keys(passengerPreferencesErrors).length > 0) {
    return {
      success: false,
      errors: {
        passengersDetails: passengerDetailsErrors,
        passengersPreferences: passengerPreferencesErrors,
      },
    };
  }

  // 4. Get search state from cookie
  const cookieStore = await cookies();
  const searchStateCookie = cookieStore.get('flightSearchState')?.value || '{}';
  const searchState = parseFlightSearchParams(searchStateCookie);
  const { passengers: passengersCountObj, class: seatClass } = searchState;
  if (Object.keys(searchState).length === 0) {
    return { success: false, message: 'No search state found, please search again' };
  }

  // Prepare passenger objects for creation
  const passengersArr = Object.entries(validatedDetails).map(([key, p]: [string, any]) => {
    const pref = validatedPreferences[key];
    const preferencesObj = {
      seatPreferences: {
        position: pref.seating.position,
        location: pref.seating.location,
        legroom: pref.seating.legroom,
        quietZone: pref.seating.quietZone,
      },
      baggagePreferences: {
        type: pref.baggage.type,
        extraAllowance: pref.baggage.extraAllowance,
      },
      mealPreferences: {
        type: pref.meal.type,
        specialMealType: pref.meal.specialMealType,
      },
      specialAssistance: {
        wheelChair: pref.specialAssistance.wheelchair,
        boarding: pref.specialAssistance.boarding,
        elderlyInfant: pref.specialAssistance.elderlyInfant,
        medicalEquipment: pref.specialAssistance.medicalEquipment,
      },
      other: {
        entertainment: pref.other.entertainment,
        wifi: pref.other.wifi,
        powerOutlet: pref.other.powerOutlet,
      },
    };
    return {
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: new Date(p.dateOfBirth),
      gender: p.gender,
      passengerType: p.passengerType.toLowerCase(),
      email: p.email,
      phoneNumber: {
        dialCode: p.phoneNumber.dialCode,
        number: p.phoneNumber.number,
      },
      passportNumber: p.passportNumber,
      passportExpiryDate: new Date(p.passportExpiryDate),
      country: p.country,
      seatClass: seatClass,
      frequentFlyerNumber: p.frequentFlyerNumber || null,
      frequentFlyerAirline: p.frequentFlyerAirline || null,
      preferences: preferencesObj,
      isPrimary: p.isPrimary,
    };
  });

  const pnrCode = (nanoid() + Date.now().toString(36)).toUpperCase();
  const reservationExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  const passengerCounts = {
    adult: passengersCountObj.adults,
    child: passengersCountObj.children,
    infant: passengersCountObj.infants,
  };
  // total without a discount 
  // const { fareBreakdowns, total } = multiSegmentCombinedFareBreakDown(
  //   flightItinerary.segmentIds,
  //   passengerCounts,
  //   seatClass
  // );

  // *** PROMO: compute discount ***
  const { fareBreakdowns, total: totalBeforeDiscount } = multiSegmentCombinedFareBreakDown(
    flightItinerary.segmentIds,
    passengerCounts,
    seatClass
  );
  // const { fareBreakdowns, total: totalBeforeDiscount } = multiSegmentCombinedFareBreakDown(
  //   flightItinerary.segmentIds,
  //   { adult: passengersCountObj.adults, child: passengersCountObj.children, infant: passengersCountObj.infants },
  //   seatClass
  // );
  let finalTotal = totalBeforeDiscount;
  let appliedPromoCode: string | null = null;
  let discountAmount = 0;
  if (promoCode) {
    const promoResult = await validateAndApplyPromoCode(promoCode, totalBeforeDiscount);
    if (promoResult.valid && promoResult.discountAmount != null) {
      finalTotal = Math.max(0, totalBeforeDiscount - (promoResult.discountAmount || 0));
      discountAmount = promoResult.discountAmount || 0;
      appliedPromoCode = promoCode;
    } else {
      // If the code is invalid, return an error to the user
      return { success: false, message: promoResult.message || 'Invalid promo code' };
    }
  }
  // *** end PROMO ***

  let bookingId: string;
  let passengerIds: string[] = [];

  if (dbType === 'postgres') {
    await sql.begin(async (trx: PgTransaction) => {
      // Insert passengers and collect IDs
      const passengerIdsArray: string[] = [];
      for (const p of passengersArr) {
        const inserted = await trx`
          INSERT INTO passengers (
            first_name, last_name, date_of_birth, gender, passenger_type, email,
            phone_number, passport_number, passport_expiry_date, country,
            seat_class, frequent_flyer_number, frequent_flyer_airline, preferences, is_primary
          )
          VALUES (
            ${p.firstName}, ${p.lastName}, ${p.dateOfBirth}, ${p.gender}, ${p.passengerType}, ${p.email},
            ${JSON.stringify(p.phoneNumber)}::jsonb, ${p.passportNumber}, ${p.passportExpiryDate}, ${p.country},
            ${p.seatClass}, ${p.frequentFlyerNumber}, ${p.frequentFlyerAirline},
            ${JSON.stringify(p.preferences)}::jsonb, ${p.isPrimary}
          )
          RETURNING id
        `;
        passengerIdsArray.push(inserted[0].id);
      }
      passengerIds = passengerIdsArray;
      // Get segment IDs
      const segmentIdsArray = flightItinerary.segmentIds.map((s: any) => s.id);
      // *** PROMO: use finalTotal and appliedPromoCode ***
      const bookingInsert = await trx`
        INSERT INTO flight_bookings (
          pnr_code, user_id, flight_itinerary_id, segment_ids, passengers,
          fare_breakdown, total_fare, payment_status, ticket_status,
          guaranteed_reservation_until, user_time_zone, source, promo_code
        )
        VALUES (
          ${pnrCode}, ${session.user.id}, ${flightItinerary.id},
          ${segmentIdsArray}::uuid[],
          ${passengerIdsArray}::uuid[],
          ${JSON.stringify(fareBreakdowns)}::jsonb, ${finalTotal}, 'pending', 'pending',
          ${reservationExpiresAt}, ${metaData.timeZone}, 'web', ${appliedPromoCode}
        )
        RETURNING id
      `;
      const bookingId = bookingInsert[0].id;
      
      for (const segmentId of segmentIdsArray) {
        const availableSeats = await trx`
          SELECT id FROM flight_seats
          WHERE segment_id = ${segmentId}
          AND class = ${seatClass}
          AND (reservation IS NULL OR reservation->>'type' IS NULL OR (reservation->>'type' = 'temporary' AND (reservation->>'expiresAt')::bigint < ${Date.now()}))
          LIMIT ${passengerIds.length}
        `;
        const bookingId = bookingInsert[0].id;
        // Assign seats
        await assignSeatsPostgreSQL(
          trx,
          bookingId,
          pnrCode,
          passengerIds,
          flightItinerary,
          seatClass,
          reservationExpiresAt
        );
      }
    });
  } else {
    // MongoDB version
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    try {
      // Create passengers
      const passengers = await createManyDocs('Passenger', passengersArr, { session: mongoSession });
      passengerIds = passengers.map((id: any) => id.toString());
      // Create booking
      const bookingObj = {
        pnrCode,
        userId: session.user.id,
        flightItineraryId: flightItinerary._id,
        segmentIds: flightItinerary.segmentIds.map((s: any) => s._id),
        passengers: passengerIds,
        selectedSeats: [],
        fareBreakdown: fareBreakdowns,
        totalFare: finalTotal,          // *** PROMO: finalTotal ***
        paymentStatus: 'pending',
        ticketStatus: 'pending',
        guaranteedReservationUntil: reservationExpiresAt,
        userTimeZone: metaData.timeZone,
        source: 'web',
        promoCode: appliedPromoCode,    // *** PROMO: save code ***
      };
      const booking = await createOneDoc('FlightBooking', bookingObj, { session: mongoSession });
      bookingId = booking._id.toString();
      
      // Assign seats temporarily (using existing service function)
      const { assignSeatsToFlightBooking } = await import('@/app/lib/services/flights');
      await assignSeatsToFlightBooking(booking, 'temporary', reservationExpiresAt.getTime(), mongoSession);
      await mongoSession.commitTransaction();
    } catch (error) {
      if (mongoSession.inTransaction()) await mongoSession.abortTransaction();
      throw error;
    } finally {
      await mongoSession.endSession();
    }
  }
  // *** PROMO: increment usage ***
  if (appliedPromoCode) {
    await incrementPromoCodeUsage(appliedPromoCode);
  }
  revalidateTag('userFlightBooking',{ });
  revalidateTag('flightSeat',{});
  return { success: true, message: 'Reservation created successfully' };
}