import { BreadcrumbUI } from '@/components/local-ui/breadcrumb';
import { AuthenticationCard } from '@/components/AuthenticationCard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { parseFlightSearchParams } from '@/app/lib/utils';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getUserDetails } from '@/app/lib/services/user';
import SessionTimeoutCountdown from '@/components/local-ui/SessionTimeoutCountdown';
import { getOneDoc, getManyDocs } from '@/app/lib/db/getOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import BookingSteps from '@/components/pages/flights.book/BookingSteps';
import { getAvailableSeats } from '@/app/lib/services/flights';
import InfoPage from '@/components/InfoPage';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export default async function FlightBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ flightNumber: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { flightNumber } = await params;
  const { tab } = (await searchParams) || {};
  const session = await getServerSession(authOptions);
  const loggedIn = !!session?.user?.id;
  const cookieStore = await cookies();
  const searchStateCookie = cookieStore.get('flightSearchState')?.value || '{}';
  const parsedSearchState = parseFlightSearchParams(searchStateCookie);
  const timeZone = cookieStore.get('timeZone')?.value || 'UTC';
  const flightClass = parsedSearchState.class;
  const metaData = {
    timeZone,
    flightClass,
    isBookmarked: false,
    userEmail: session?.user?.email,
  };

  if (!loggedIn) {
    return (
      <main className="mx-auto my-10 w-[90%] text-secondary">
        <AuthenticationCard className="mt-4" />
      </main>
    );
  }

  const p = flightNumber.split('_');
  const flightCode = p[0];
  const date = !isNaN(+p[1]) ? +p[1] : p[1];
  const flightDate = new Date(date);

  let flight: any;
  if (dbType === 'postgres') {
    // Fetch flight itinerary
    const rows = await sql`
      SELECT * FROM flight_itineraries
      WHERE flight_code = ${flightCode} AND date::date = ${flightDate.toISOString().split('T')[0]}
    `;
    if (rows.length === 0) notFound();
    flight = rows[0];
    flight.flightCode = flight.flight_code;   // ← map camelCase for UI
    // Fetch segments
    const segmentRows = await sql`
      SELECT * FROM flight_segments
      WHERE id = ANY(${flight.segment_ids}::uuid[])
    `;
    flight.segmentIds = segmentRows.map((seg: any) => {
      // parse fare_details if string
      let fare = seg.fare_details;
      if (typeof fare === 'string') {
        try { fare = JSON.parse(fare); } catch { fare = {}; }
      }
      const fareDetails = {
        basePrice: fare?.base_price ?? fare?.basePrice ?? {},
        taxes: fare?.taxes ?? {},
        serviceFee: fare?.service_fee ?? fare?.serviceFee ?? {},
        discount: fare?.discount ?? {},
      };
      return {
        _id: seg.id,
        id: seg.id,
        flightNumber: seg.flight_number,
        durationMinutes: seg.duration_minutes,
        fareDetails: fareDetails,                // normalized
        from: {
          airport: { iataCode: seg.from_airport, name: '', _id: seg.from_airport },
          scheduledDeparture: seg.scheduled_departure,
          terminal: seg.from_terminal,
          gate: seg.from_gate,
        },
        to: {
          airport: { iataCode: seg.to_airport, name: '', _id: seg.to_airport },
          scheduledArrival: seg.scheduled_arrival,
          terminal: seg.to_terminal,
          gate: seg.to_gate,
        },
        airlineId: { _id: seg.airline_id, iataCode: seg.airline_id, name: '' },
        airplaneId: { model: seg.airplane_model || 'N/A' },
      };
    });

    // parse layovers and baggage
    if (typeof flight.layovers === 'string') {
      try { flight.layovers = JSON.parse(flight.layovers); } catch { flight.layovers = []; }
    }
    if (typeof flight.baggage_allowance === 'string') {
      try {
        const parsed = JSON.parse(flight.baggage_allowance);
        flight.baggageAllowance = parsed;
      } catch { flight.baggageAllowance = {}; }
    }
  } else {
    await connectDB();
    flight = await getOneDoc(
      'FlightItinerary',
      { flightCode, date: flightDate },
      ['flight']
    );
    if (Object.keys(flight).length === 0) notFound();
  }

  let hasPendingBooking = false;
  let bookingId: string | null = null;

  if (loggedIn) {
    const userDetails = await getUserDetails(session.user.id);
    // Check bookmark only if userDetails exists
    if (userDetails) {
      const bookmarkedFlights = userDetails.flights?.bookmarked || [];
      metaData.isBookmarked = bookmarkedFlights.some((el: any) => {
        const flightIdStr = el.flightId?._id?.toString() || el.flightId?.toString();
        const currentFlightId = dbType === 'postgres' ? flight.id : flight._id.toString();
        return flightIdStr === currentFlightId;
      });
    }

    if (dbType === 'postgres') {
      const rows = await sql`
        SELECT id FROM flight_bookings
        WHERE flight_itinerary_id = ${flight.id}
          AND user_id = ${session.user.id}
          AND payment_status = 'pending'
      `;
      bookingId = rows[0]?.id || null;
      hasPendingBooking = rows.length > 0;
    } else {
      if (tab === 'payment') {
        const bookings = await getManyDocs(
          'FlightBooking',
          {
            flightItineraryId: strToObjectId(flight._id),
            userId: strToObjectId(session.user.id),
            paymentStatus: 'pending',
          },
          ['userFlightBooking'],
          0
        );
        bookingId = bookings[0]?._id?.toString() || null;
        hasPendingBooking = bookings.length > 0;
      } else {
        const booking = await getOneDoc(
          'FlightBooking',
          {
            flightItineraryId: strToObjectId(flight._id),
            userId: strToObjectId(session.user.id),
            paymentStatus: 'pending',
            ticketStatus: 'pending',
          },
          ['userFlightBooking'],
          0
        );
        bookingId = booking?._id?.toString() || null;
        hasPendingBooking = Object.keys(booking).length > 0;
      }
    }
  }

  const isFlightExpired = new Date(flight.expire_at || flight.expireAt) < new Date();
  let isSeatsAvailable = true;
  const segments = flight.segmentIds || [];
  for (const segment of segments) {
    const segmentId = dbType === 'postgres' ? segment.id : segment._id;
    const availableSeats = await getAvailableSeats(segmentId, flightClass);
    if (availableSeats.length === 0) {
      isSeatsAvailable = false;
      break;
    }
  }

  if (isFlightExpired && !hasPendingBooking) {
    return (
      <InfoPage
        whatHappened="Flight Expired"
        explanation="The flight you are trying to book has expired. Please try to book another flight."
        navigateTo={{ path: '/flights', title: 'Search Flights' }}
      />
    );
  }

  if (!isSeatsAvailable && !hasPendingBooking) {
    return (
      <InfoPage
        whatHappened="No Seats Available"
        explanation="There are no more seats available for this flight. Please try to book another flight."
        navigateTo={{ path: '/flights', title: 'Search Flights' }}
      />
    );
  }

  return (
    <main className="mx-auto my-10 w-[90%] text-secondary">
      <BreadcrumbUI />
      <SessionTimeoutCountdown
        redirectionLink="/flights"
        className="my-4 rounded-md"
      />
      {hasPendingBooking && bookingId && (
        <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm font-medium text-gray-800 shadow-md">
          You have a pending booking for this flight. Either cancel that or confirm it to book this flight again.
          <br />
          <Link
            target="_blank"
            className="font-bold text-yellow-800 underline"
            href={`/user/my_bookings/flights/${bookingId}`}
          >
            See that booking{' '}
            <ExternalLink width={12} height={12} className="inline stroke-[3px] align-middle" />
          </Link>
        </div>
      )}
      <BookingSteps
        flight={flight}
        metaData={metaData}
        searchStateObj={parsedSearchState}
      />
    </main>
  );
}