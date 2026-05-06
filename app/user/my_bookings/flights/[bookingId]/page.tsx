// app/user/my_bookings/flights/[bookingId]/page.tsx
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import airlinesLogos from '@/data/airlinesLogos';
import calender from '@/public/travel/icons/calender-mint.svg';
import gate from '@/public/travel/icons/door-closed-mint.svg';
import timer from '@/public/travel/icons/timer-mint.svg';
import airplaneIcon from '@/public/travel/icons/airplane-filled-mint.svg';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import { cn, minutesToHMFormat } from '@/app/lib/utils';
import routes from '@/data/routes.json';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import Link from 'next/link';
import NoSSR from '@/components/helpers/NoSSR';
import ShowTimeInClientSide from '@/components/helpers/ShowTimeInClientSide';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import {
    BOOKING_STATUS_BG_COL_TW_CLASS,
    BOOKING_STATUS_TEXT_COL_TW_CLASS,
    PAYMENT_STATUS_BG_TW_CLASS,
    PAYMENT_STATUS_TEXT_COL_TW_CLASS,
} from '@/app/lib/constants';
import RequestRefundFlightBtn from '@/components/pages/profile/ui/RequestRefundFlightBtn';
import CancelFlightBtn from '@/components/pages/profile/ui/CancelFlightBtn';
import { allowedFlightBookingActionBtns } from '@/app/lib/helpers/flights/allowedFlightBookingActionBtns';

export const dynamic = 'force-dynamic';

export default async function FlightBookingDetailsPage({
    params,
}: {
    params: Promise<{ bookingId: string }>;
}) {
    const { bookingId } = await params;
    const session = await getServerSession(authOptions);
    const loggedIn = !!session?.user?.id;
    if (!loggedIn) {
        return redirect(routes.login.path + '?callbackPath=' + encodeURIComponent(`/user/my_bookings/flights/${bookingId}`));
    }

    // ---------- Fetch booking and flight (dual‑database) ----------
    let rawBooking: any;
    let rawFlight: any;
    if (dbType === 'postgres') {
        // Booking
        const bookingRows = await sql` SELECT * FROM flight_bookings WHERE id = ${bookingId} AND user_id = ${session.user.id}`;
        if (bookingRows.length === 0) notFound();
        rawBooking = bookingRows[0];
        // Flight itinerary
        const flightRows = await sql` SELECT * FROM flight_itineraries WHERE id = ${rawBooking.flight_itinerary_id}`;
        if (flightRows.length === 0) notFound();
        rawFlight = flightRows[0];
        // Segments
        const segmentRows = await sql` SELECT * FROM flight_segments WHERE id = ANY(${rawFlight.segment_ids}::uuid[])`;
        rawFlight.segmentIds = segmentRows;
        // Airline
        const airlineRows = await sql` SELECT * FROM airlines WHERE iata_code = ${rawFlight.carrier_in_charge}`;
        if (airlineRows.length) rawFlight.carrierInCharge = airlineRows[0];
    } else {
        await connectDB();
        rawBooking = await getOneDoc('FlightBooking', { _id: strToObjectId(bookingId), userId: strToObjectId(session.user.id) }, ['userFlightBooking']);
        if (!rawBooking || Object.keys(rawBooking).length === 0) notFound();
        rawFlight = await getOneDoc('FlightItinerary', { _id: strToObjectId(rawBooking.flightItineraryId) }, ['flight']);
    }

    // ---------- Normalize to camelCase ----------
    const booking = {
        _id: rawBooking._id || rawBooking.id,
        pnrCode: rawBooking.pnr_code ?? rawBooking.pnrCode,
        ticketStatus: rawBooking.ticket_status ?? rawBooking.ticketStatus,
        paymentStatus: rawBooking.payment_status ?? rawBooking.paymentStatus,
        itineraryFlightNumber: rawFlight.flightCode ?? rawFlight.flight_code,
        passengers: (typeof rawBooking.passengers === 'string' ? JSON.parse(rawBooking.passengers) : rawBooking.passengers) || [],
        selectedSeats: (typeof rawBooking.selected_seats === 'string' ? JSON.parse(rawBooking.selected_seats) : rawBooking.selected_seats) || [],
        segments: (rawFlight.segmentIds || []).map((s: any) => ({
            key: s.id || s._id,
            flightNumber: s.flight_number ?? s.flightNumber,
            airplaneModelName: s.airplane_id?.model ?? s.airplaneId?.model,
            airlineName: s.airline_id?.name ?? s.airlineId?.name,
            airlineIataCode: s.airline_id?.iata_code ?? s.airlineId?.iataCode,
            departureDateTime: s.scheduled_departure,
            departureAirportIataCode: s.from_airport ?? s.from?.airport?.iataCode,
            departureAirportName: s.from_airport_name ?? s.from?.airport?.name,
            arrivalDateTime: s.scheduled_arrival,
            arrivalAirportIataCode: s.to_airport ?? s.to?.airport?.iataCode,
            arrivalAirportName: s.to_airport_name ?? s.to?.airport?.name,
            flightDurationMinutes: s.duration_minutes ?? s.durationMinutes,
            gate: s.from_gate ?? s.from?.gate,
            terminal: s.from_terminal ?? s.from?.terminal,
        })),
    };

    // ---------- Passengers with seat info ----------
    const passengersWithSeats = booking.passengers.map((p: any) => {
        const seat = booking.selectedSeats.find((s: any) => s.passenger_id === p.id || s.passengerId === p._id);
        return {
            key: p.id || p._id,
            fullName: `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim() || 'Passenger',
            passengerType: p.passenger_type || p.passengerType || 'Adult',
            seatNumber: seat?.seat_id?.seat_number || seat?.seatId?.seatNumber || '—',
            seatClass: seat?.seat_id?.class || seat?.seatId?.class || 'Economy',
        };
    });

    // ---------- Cancellation policy ----------
    const cancellationPolicy = rawFlight.carrierInCharge?.airlinePolicy?.cancellationPolicy || {};
    const { canCancel, canRefund, canDownload, canPay } = allowedFlightBookingActionBtns(
        booking.ticketStatus,
        booking.paymentStatus,
        cancellationPolicy,
        booking.segments[0]?.departureDateTime
    );

    return (
        <main className="container mx-auto max-w-6xl px-6 py-12">
            {/* Status Cards */}
            <section className="mb-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <InfoCard title="Flight Number" value={booking.itineraryFlightNumber} />
                    <InfoCard title="PNR" value={booking.pnrCode} />
                    <InfoCard title="Status" value={booking.ticketStatus} status />
                    <InfoCard title="Payment Status" value={booking.paymentStatus} status />
                </div>
            </section>

            {/* Flight Segments */}
            <section>
                <h2 className="mb-4 text-lg font-semibold dark:text-white">Flight Details</h2>
                {booking.segments.map((s: any) => (
                    <div key={s.key} className="mb-6 rounded-md border bg-white p-4 dark:bg-gray-800 dark:border-gray-700">
                        <div className="mb-6 flex flex-wrap justify-between gap-2">
                            <div className="mb-3 flex gap-4">
                                <Image src={airlinesLogos[s.airlineIataCode as keyof typeof airlinesLogos] || airlinesLogos.EK} alt="Airline Logo" width={64} height={64} className="h-16 w-16 rounded-lg border border-primary object-contain p-2" />
                                <div>
                                    <h1 className="text-2xl font-bold dark:text-white">{s.airlineName}</h1>
                                    <p className="text-muted-foreground dark:text-gray-400">{s.airlineIataCode}</p>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold dark:text-white">{s.flightNumber}</h1>
                                <p className="text-muted-foreground dark:text-gray-400">{s.airplaneModelName}</p>
                            </div>
                        </div>
                        <div className="mb-6 flex flex-col justify-between gap-10 md:flex-row">
                            <FlightTimeDetails label="Departure" time={s.departureDateTime} airportName={s.departureAirportName} airportIataCode={s.departureAirportIataCode} />
                            <FlightTimeDetails label="Arrival" time={s.arrivalDateTime} airportName={s.arrivalAirportName} airportIataCode={s.arrivalAirportIataCode} />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                            <IconDataCard icon={calender} label="Date" value={<NoSSR><ShowTimeInClientSide date={s.departureDateTime} formatStr="d MMM yyyy" /></NoSSR>} />
                            <IconDataCard icon={timer} label="Duration" value={minutesToHMFormat(s.flightDurationMinutes)} />
                            <IconDataCard icon={gate} label="Gate" value={s.gate} />
                            <IconDataCard icon={airplaneIcon} label="Terminal" value={s.terminal} />
                        </div>
                    </div>
                ))}
            </section>

            {/* Passengers */}
            <section className="mb-10">
                <h2 className="mb-4 text-lg font-semibold dark:text-white">Passenger Information</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {passengersWithSeats.map((p: any) => (
                        <div key={p.key} className="rounded border bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                            <p className="font-medium dark:text-white">{p.fullName}</p>
                            <p className="text-sm capitalize text-muted-foreground dark:text-gray-400">Type: {p.passengerType}</p>
                            <p className="text-sm capitalize text-muted-foreground dark:text-gray-400">Seat class: {p.seatClass}</p>
                            {p.seatNumber && <p className="text-sm dark:text-gray-300">Seat: {p.seatNumber}</p>}
                        </div>
                    ))}
                </div>
            </section>

            {/* Action Buttons */}
            <section className="flex flex-wrap justify-start gap-4">
                {canPay && (
                    <Button asChild>
                        <Link href={`/user/my_bookings/flights/${bookingId}/payment`}>Pay</Link>
                    </Button>
                )}
                {canDownload && (
                    <Button asChild>
                        <Link href={`/user/my_bookings/flights/${bookingId}/ticket`}>Download Ticket</Link>
                    </Button>
                )}
                {canCancel && <CancelFlightBtn pnrCode={booking.pnrCode} />}
                {canRefund && <RequestRefundFlightBtn pnrCode={booking.pnrCode} />}
            </section>
        </main>
    );
}

// (Keep the helper components InfoCard, FlightTimeDetails, IconDataCard unchanged)

// ---------- Helper Components (with dark mode) ----------
function InfoCard({ title, value, status = false }: { title: string; value: string; status?: boolean }) {
  return (
    <div
      className={cn(
        'rounded border bg-white p-4 dark:bg-gray-800 dark:border-gray-700',
        status && BOOKING_STATUS_BG_COL_TW_CLASS[value as keyof typeof BOOKING_STATUS_BG_COL_TW_CLASS],
        status && BOOKING_STATUS_TEXT_COL_TW_CLASS[value as keyof typeof BOOKING_STATUS_TEXT_COL_TW_CLASS],
        status && PAYMENT_STATUS_BG_TW_CLASS[value as keyof typeof PAYMENT_STATUS_BG_TW_CLASS],
        status && PAYMENT_STATUS_TEXT_COL_TW_CLASS[value as keyof typeof PAYMENT_STATUS_TEXT_COL_TW_CLASS]
      )}
    >
      <p className="text-xs uppercase text-muted-foreground dark:text-gray-400">{title}</p>
      <p className="mt-1 text-sm font-medium capitalize dark:text-white">{value}</p>
    </div>
  );
}

function FlightTimeDetails({ label, time, airportName, airportIataCode }: { label: string; time: Date; airportName: string; airportIataCode: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-semibold text-muted-foreground dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold dark:text-white">
        <NoSSR><ShowTimeInClientSide date={time} formatStr="hh:mm aaa" /></NoSSR>
      </p>
      <p className="text-sm dark:text-gray-300">
        <NoSSR><ShowTimeInClientSide date={time} formatStr="d MMM yyyy" /></NoSSR>
      </p>
      <p className="text-xs text-muted-foreground dark:text-gray-500">
        {airportName} ({airportIataCode})
      </p>
    </div>
  );
}

function IconDataCard({ icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded border bg-white p-4 dark:bg-gray-800 dark:border-gray-700">
      <Image src={icon} width={32} height={32} alt={`${label} icon`} />
      <div>
        <p className="text-sm text-muted-foreground dark:text-gray-400">{label}</p>
        <p className="font-medium dark:text-white">{value}</p>
      </div>
    </div>
  );
}