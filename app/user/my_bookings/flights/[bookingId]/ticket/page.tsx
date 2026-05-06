// app/user/my_bookings/flights/[bookingId]/ticket/page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import routes from '@/data/routes.json';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { sql, dbType } from '@/app/lib/db/index';   // connectDB is imported dynamically below
import { generateHMACSignature } from '@/app/lib/utils.server';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import FlightTicket from '@/components/pages/user.my_bookings.flights.[bookingId].ticket/Ticket';

export const dynamic = 'force-dynamic';

export default async function FlightTicketPage({ params }: { params: Promise<{ bookingId: string }> }) {
    const { bookingId } = await params;

    const session = await getServerSession(authOptions);
    const loggedIn = !!session?.user?.id;
    if (!loggedIn) {
        return redirect(
            routes.login.path +
            '?callbackPath=' +
            encodeURIComponent(`/user/my_bookings/flights/${bookingId}/ticket`)
        );
    }

    // ---------- 1. Fetch booking & flight itinerary ----------
    let rawBooking: any;
    let rawFlight: any;

    if (dbType === 'postgres') {
        // Booking
        const bookingRows = await sql`
            SELECT *
            FROM flight_bookings
            WHERE id = ${bookingId}
              AND user_id = ${session.user.id}
              AND ticket_status = 'confirmed'
              AND payment_status = 'paid'
        `;
        if (bookingRows.length === 0) notFound();
        rawBooking = bookingRows[0];

        // Flight itinerary
        const flightRows = await sql`
            SELECT *
            FROM flight_itineraries
            WHERE id = ${rawBooking.flight_itinerary_id}
        `;
        if (flightRows.length === 0) notFound();
        rawFlight = flightRows[0];
    } else {
        // MongoDB
        const { connectDB } = await import('@/app/lib/db/mongodb');
        await connectDB();

        rawBooking = await getOneDoc(
            'FlightBooking',
            {
                _id: strToObjectId(bookingId),
                userId: strToObjectId(session.user.id),
                ticketStatus: 'confirmed',
                paymentStatus: 'paid',
            },
            ['userFlightBooking']
        );
        if (!rawBooking || Object.keys(rawBooking).length === 0) notFound();

        rawFlight = await getOneDoc(
            'FlightItinerary',
            { _id: strToObjectId(rawBooking.flightItineraryId) },
            ['flight']
        );
        if (!rawFlight || Object.keys(rawFlight).length === 0) notFound();
    }

    // ---------- 2. Build segments with all related data ----------
    let segmentDetails: any[] = [];

    if (dbType === 'postgres') {
        const segments = await sql`
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

        segmentDetails = segments.map((s: any) => ({
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
    } else {
        // MongoDB – segmentIds are auto‑populated, use nested properties
        segmentDetails = rawFlight.segmentIds.map((seg: any) => ({
            id: seg._id,
            flightNumber: seg.flightNumber,
            durationMinutes: seg.durationMinutes,
            // nested from/to with scheduled dates
            scheduledDeparture: seg.from?.scheduledDeparture ?? seg.scheduled_departure,
            scheduledArrival: seg.to?.scheduledArrival ?? seg.scheduled_arrival,
            fromAirport: seg.from?.airport?.iataCode ?? seg.from_airport,
            toAirport: seg.to?.airport?.iataCode ?? seg.to_airport,
            fromGate: seg.from?.gate ?? seg.from_gate,
            toGate: seg.to?.gate ?? seg.to_gate,
            fromTerminal: seg.from?.terminal ?? seg.from_terminal,
            toTerminal: seg.to?.terminal ?? seg.to_terminal,
            airplaneModel: seg.airplaneId?.model ?? seg.airplane_id?.model,
            airlineName: seg.airlineId?.name ?? seg.airline_id?.name,
            airlineIataCode: seg.airlineId?.iata_code ?? seg.airline_id?.iata_code,
            departureAirportName: seg.from?.airport?.name ?? seg.from_airport_name,
            arrivalAirportName: seg.to?.airport?.name ?? seg.to_airport_name,
        }));
    }

    // ---------- 3. Parse passengers & selected seats ----------
    let passengers: any[] = [];
    if (rawBooking.passengers) {
        if (typeof rawBooking.passengers === 'string') {
            try { passengers = JSON.parse(rawBooking.passengers); } catch { passengers = []; }
        } else {
            passengers = rawBooking.passengers;
        }
    }

    let selectedSeats: any[] = [];
    if (rawBooking.selected_seats) {
        if (typeof rawBooking.selected_seats === 'string') {
            try { selectedSeats = JSON.parse(rawBooking.selected_seats); } catch { selectedSeats = []; }
        } else {
            selectedSeats = rawBooking.selected_seats;
        }
    }

    // For Postgres we need to fetch actual seats; MongoDB already has them populated
    let seatMap: Record<string, { seatNumber: string; class: string }> = {};
    if (dbType === 'postgres' && selectedSeats.length > 0) {
        const seatIds = selectedSeats.map((s: any) => s.seatId).filter(Boolean);
        if (seatIds.length > 0) {
            const seatRows = await sql`
                SELECT id, seat_number, class
                FROM flight_seats
                WHERE id = ANY(${seatIds}::uuid[])
            `;
            seatMap = Object.fromEntries(
                seatRows.map((row: any) => [row.id, { seatNumber: row.seat_number, class: row.class }])
            );
        }
    }

    // ---------- 5. Build normalized ticketData ----------
    const ticketData = {
        key: bookingId,
        qrCodeStr: `${bookingId}|${generateHMACSignature(bookingId, process.env.AUTH_SECRET!)}`,
        bookingStatus: rawBooking.ticket_status ?? rawBooking.ticketStatus,
        paymentStatus: rawBooking.payment_status ?? rawBooking.paymentStatus,
        itineraryFlightNumber: rawFlight.flight_code ?? rawFlight.flightCode,
        totalFare: rawBooking.total_fare ?? rawBooking.totalFare,
        pnrCode: rawBooking.pnr_code ?? rawBooking.pnrCode,
        passengers: passengers.map((p: any, idx: number) => {
            const seatRef = selectedSeats.find(
                (s: any) => s.passenger_id === p.id || s.passengerId === p._id
            );
            const seatId = seatRef?.seat_id ?? seatRef?.seatId;
            let seatNumber = '—';
            let seatClass = 'Economy';
            if (dbType === 'postgres' && seatId && seatMap[seatId]) {
                seatNumber = seatMap[seatId].seatNumber;
                seatClass = seatMap[seatId].class;
            } else if (seatRef?.seatId?.seatNumber) {
                // MongoDB auto‑populated
                seatNumber = seatRef.seatId.seatNumber;
                seatClass = seatRef.seatId.class || 'Economy';
            }
            return {
                key: p.id || p._id || `p-${idx}`,
                fullName: `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim() || 'Passenger',
                passengerType: p.passenger_type || p.passengerType,
                seatNumber,
                seatClass,
            };
        }),
        segments: segmentDetails.map((s: any) => ({
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
        })),
    };

    return <FlightTicket ticketData={ticketData} />;
}