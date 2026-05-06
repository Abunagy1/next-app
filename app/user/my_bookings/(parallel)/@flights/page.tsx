// app/user/my_bookings/(parallel)/@flights/page.tsx

import React from 'react';
import { FlightBookingDetailsCard } from '@/components/pages/profile/ui/FlightBookingDetailsCard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getAllFlightBookings } from '@/app/lib/services/flights';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { sql, dbType } from '@/app/lib/db/index';
import { strToObjectId } from '@/app/lib/db/utilsDB';

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

export default async function FlightBookingDetailsPage({ searchParams }: { searchParams?: Promise<{ filter?: string }> }) {
    const { filter } = (await searchParams) || {};
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return <Empty />;

    const flightBookings = await getAllFlightBookings(userId, filter as any);
    if (flightBookings.length === 0) return <Empty />;

    const bookingCards = await Promise.all(
        flightBookings.map(async (rawBooking: any) => {
            try {
                // ---- Normalise booking fields (snake_case -> camelCase) ----
                const booking = {
                    _id: rawBooking._id || rawBooking.id,
                    id: rawBooking.id,
                    ticketStatus: rawBooking.ticket_status ?? rawBooking.ticketStatus,
                    paymentStatus: rawBooking.payment_status ?? rawBooking.paymentStatus,
                    createdAt: rawBooking.created_at ?? rawBooking.createdAt,
                    flightItineraryId: rawBooking.flight_itinerary_id ?? rawBooking.flightItineraryId,
                    pnrCode: rawBooking.pnr_code ?? rawBooking.pnrCode,
                    passengers: rawBooking.passengers, // keep as-is, may be string
                    selectedSeats: rawBooking.selected_seats ?? rawBooking.selectedSeats,
                };

                if (!booking.flightItineraryId) return null;

                // ---- Fetch flight itinerary (dual‑db) ----
                let rawFlight: any;
                if (dbType === 'postgres') {
                    const rows = await sql`
                        SELECT * FROM flight_itineraries WHERE id = ${booking.flightItineraryId}
                    `;
                    if (rows.length === 0) return null;
                    rawFlight = rows[0];

                    // Segments with related data
                    const segmentRows = await sql`
                        SELECT
                            fs.id,
                            fs.flight_number,
                            fs.duration_minutes,
                            fs.scheduled_departure,
                            fs.scheduled_arrival,
                            fs.from_airport,
                            fs.to_airport,
                            fs.from_gate,
                            fs.to_gate,
                            fs.from_terminal,
                            fs.to_terminal,
                            a.model AS airplane_model,
                            al.name AS airline_name,
                            al.iata_code AS airline_iata_code,
                            dep.name AS departure_airport_name,
                            arr.name AS arrival_airport_name
                        FROM flight_segments fs
                        LEFT JOIN airplanes a ON fs.airplane_id = a.id
                        LEFT JOIN airlines al ON fs.airline_id = al.iata_code
                        LEFT JOIN airports dep ON fs.from_airport = dep.iata_code
                        LEFT JOIN airports arr ON fs.to_airport = arr.iata_code
                        WHERE fs.id = ANY(${rawFlight.segment_ids}::uuid[])
                    `;

                    rawFlight.segmentDetails = segmentRows.map((s: any) => ({
                        id: s.id,
                        flightNumber: s.flight_number,
                        durationMinutes: s.duration_minutes,
                        scheduledDeparture: s.scheduled_departure,
                        scheduledArrival: s.scheduled_arrival,
                        fromAirport: s.from_airport,
                        toAirport: s.to_airport,
                        fromGate: s.from_gate,
                        toGate: s.to_gate,
                        fromTerminal: s.from_terminal,
                        toTerminal: s.to_terminal,
                        airplaneModel: s.airplane_model,
                        airlineName: s.airline_name,
                        airlineIataCode: s.airline_iata_code,
                        departureAirportName: s.departure_airport_name,
                        arrivalAirportName: s.arrival_airport_name,
                    }));

                    // Airline
                    const airlineRows = await sql`
                        SELECT * FROM airlines WHERE iata_code = ${rawFlight.carrier_in_charge}
                    `;
                    if (airlineRows.length) {
                        rawFlight.carrierInCharge = airlineRows[0];
                    }
                } else {
                    // MongoDB
                    rawFlight = await getOneDoc(
                        'FlightItinerary',
                        { _id: strToObjectId(booking.flightItineraryId) },
                        ['flight']
                    );
                    if (!rawFlight || Object.keys(rawFlight).length === 0) return null;

                    // segments already populated
                    rawFlight.segmentDetails = rawFlight.segmentIds.map((seg: any) => ({
                        id: seg._id,
                        flightNumber: seg.flightNumber,
                        durationMinutes: seg.durationMinutes,
                        scheduledDeparture: seg.from?.scheduledDeparture ?? seg.scheduled_departure,
                        scheduledArrival: seg.to?.scheduledArrival ?? seg.scheduled_arrival,
                        fromAirport: seg.from?.airport?.iataCode ?? seg.from_airport,
                        toAirport: seg.to?.airport?.iataCode ?? seg.to_airport,
                        fromGate: seg.from?.gate ?? seg.from_gate,
                        toGate: seg.to?.gate ?? seg.to_gate,
                        fromTerminal: seg.from?.terminal ?? seg.from_terminal,
                        toTerminal: seg.to?.terminal ?? seg.to_terminal,
                        airplaneModel: seg.airplaneId?.model,
                        airlineName: seg.airlineId?.name,
                        airlineIataCode: seg.airlineId?.iata_code,
                        departureAirportName: seg.from?.airport?.name,
                        arrivalAirportName: seg.to?.airport?.name,
                    }));
                }

                // Normalise passengers and selected seats
                let passengersArr = booking.passengers;
                if (typeof passengersArr === 'string') {
                    try { passengersArr = JSON.parse(passengersArr); } catch { passengersArr = []; }
                }
                if (!Array.isArray(passengersArr)) passengersArr = [];

                let selectedSeatsArr = booking.selectedSeats;
                if (typeof selectedSeatsArr === 'string') {
                    try { selectedSeatsArr = JSON.parse(selectedSeatsArr); } catch { selectedSeatsArr = []; }
                }
                if (!Array.isArray(selectedSeatsArr)) selectedSeatsArr = [];

                // Build segments array for the card
                const segments = (rawFlight.segmentDetails || []).map((s: any) => ({
                    key: s.id,
                    flightNumber: s.flightNumber,
                    airplaneModelName: s.airplaneModel,
                    airlineName: s.airlineName,
                    airlineIataCode: s.airlineIataCode,
                    departureDateTime: s.scheduledDeparture,
                    departureAirportIataCode: s.fromAirport,
                    departureAirportName: s.departureAirportName,
                    arrivalDateTime: s.scheduledArrival,
                    arrivalAirportIataCode: s.toAirport,
                    arrivalAirportName: s.arrivalAirportName,
                    flightDurationMinutes: s.durationMinutes,
                    gate: s.fromGate,
                    terminal: s.fromTerminal,
                }));

                const bookingDetails = {
                    key: (booking._id || booking.id)?.toString() || '',
                    bookingStatus: booking.ticketStatus,
                    paymentStatus: booking.paymentStatus,
                    cancellationPolicy:
                        rawFlight.carrierInCharge?.airlinePolicy?.cancellationPolicy || {},
                    bookedAt: booking.createdAt,
                    itineraryFlightNumber:
                        rawFlight.flight_code ?? rawFlight.flightCode,
                    pnrCode: booking.pnrCode,
                    passengers: passengersArr.map((p: any, idx: number) => {
                        const seat = selectedSeatsArr.find(
                            (s: any) =>
                                s.passenger_id === p.id || s.passengerId === p._id
                        );
                        return {
                            key: p.id || p._id || `p-${idx}`,
                            fullName:
                                `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim() ||
                                'Passenger',
                            passengerType:
                                p.passenger_type || p.passengerType || 'Adult',
                            seatNumber:
                                seat?.seat_id?.seat_number ||
                                seat?.seatId?.seatNumber ||
                                '—',
                            seatClass:
                                seat?.seat_id?.class ||
                                seat?.seatId?.class ||
                                'Economy',
                        };
                    }),
                    segments,
                };

                const plainBookingDetails = toPlainObject(bookingDetails);
                return (
                    <FlightBookingDetailsCard
                        key={plainBookingDetails.key}
                        className=""
                        bookingData={plainBookingDetails}
                    />
                );
            } catch (error) {
                console.error('Failed to build booking card:', error);
                return null;
            }
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
                <div className="mb-3 text-center text-2xl font-semibold dark:text-white">
                    No Flight Bookings
                </div>
                <p className="max-w-md text-center text-base dark:text-gray-400">
                    You haven&apos;t booked any flight yet.
                </p>
            </div>
        </div>
    );
}