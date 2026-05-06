// app/(pages)/flights/[flightNumber]/page.tsx
import { BreadcrumbUI } from '@/components/local-ui/breadcrumb';
import { FlightData } from '@/components/pages/flights.[flightId]/sections/FlightData';
import { FlightDetails } from '@/components/pages/flights.[flightId]/sections/FlightsSchedule';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getUserDetails } from '@/app/lib/services/user';
import { parseFlightSearchParams } from '@/app/lib/utils';
import SessionTimeoutCountdown from '@/components/local-ui/SessionTimeoutCountdown';
import dynamic from 'next/dynamic';
import FlightOrHotelReviewsSectionSkeleton from '@/components/local-ui/skeleton/FlightOrHotelReviewsSectionSkeleton';
import { FareCard } from '@/components/FareCard';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAvailableSeats } from '@/app/lib/services/flights';

export default async function FlightDetailsPage({
  params,
}: {
  params: Promise<{ flightNumber: string }>;
}) {
  const { flightNumber } = await params;
  const session = await getServerSession(authOptions);
  const loggedIn = !!session?.user?.id;
  const cookieStore = await cookies();
  const timeZone = cookieStore.get('timeZone')?.value || 'UTC';
  const searchState = cookieStore.get('flightSearchState')?.value || '{}';
  const parsedSearchState = parseFlightSearchParams(searchState);
  const flightClass = parsedSearchState?.class || 'economy';

  const metaData: {
    timeZone: string;
    flightClass: string;
    isBookmarked: boolean;
    isFlightExpired?: boolean;
    isSeatsAvailable?: boolean;
  } = { timeZone, flightClass, isBookmarked: false };

  // Parse flight number and date from URL param
  const p = flightNumber.split('_');
  const flightCode = p[0];
  const date = !isNaN(+p[1]) ? +p[1] : p[1];
  const flightDate = new Date(date);
  const dateStr = flightDate.toISOString().split('T')[0];

  let flight: any;

  // ---------- Fetch flight itinerary (dual‑database) ----------
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT * FROM flight_itineraries
      WHERE flight_code = ${flightCode} AND date::date = ${dateStr}
    `;
    if (rows.length === 0) notFound();
    flight = rows[0];
    flight.flightCode = flight.flight_code; // ← map camelCase for UI
    flight._id = flight.id;   // Postgres uses "id", components expect "_id"
    if (typeof flight.baggage_allowance === 'string') {
      try { flight.baggage_allowance = JSON.parse(flight.baggage_allowance); } catch (e) {
        console.log(e)
      }
      flight.baggageAllowance = flight.baggage_allowance;
    }
    // ✅ Parse layovers (add this block)
    if (typeof flight.layovers === 'string') {
      try { flight.layovers = JSON.parse(flight.layovers); } catch (e) {
        console.log('Failed to parse layovers:', e);
        flight.layovers = [];           // fallback to empty array
      }
    }
    // Fetch segments using the segment_ids array
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
      // normalize to camelCase for the app
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
        fareDetails,
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
  } else {
    await connectDB();
    flight = await getOneDoc(
      'FlightItinerary',
      { flightCode, date: flightDate },
      ['flight']
    );
    if (Object.keys(flight).length === 0) notFound();
  }

  // ---------- Check flight expiry and seat availability ----------
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
  metaData.isFlightExpired = isFlightExpired;
  metaData.isSeatsAvailable = isSeatsAvailable;
  const bookingDisabled = isFlightExpired || !isSeatsAvailable;

  // ---------- Check for pending booking ----------
  let bookingId: string | null = null;
  if (loggedIn) {
    const userDetails = await getUserDetails(session.user.id);
    if (userDetails) {
      // Bookmark check
      const bookmarkedFlights = userDetails.flights?.bookmarked || [];
      const currentFlightId = dbType === 'postgres' ? flight.id : flight._id.toString();
      metaData.isBookmarked = bookmarkedFlights.some((el: any) => {
        const flightIdStr = el.flightId?._id?.toString() || el.flightId?.toString();
        return flightIdStr === currentFlightId;
      });
    }

    // Find pending booking
    if (dbType === 'postgres') {
      const rows = await sql`
        SELECT id FROM flight_bookings
        WHERE flight_itinerary_id = ${flight.id}
          AND user_id = ${session.user.id}
          AND ticket_status = 'pending'
      `;
      bookingId = rows[0]?.id || null;
    } else {
      await connectDB();
      const booking = await dataModels.FlightBooking.findOne({
        flightItineraryId: flight._id,
        userId: session.user.id,
        ticketStatus: 'pending',
      }).lean();
      bookingId = booking?._id?.toString() || null;
    }
  }

  // ---------- Dynamic import for reviews (client component) ----------
  const FlightOrHotelReview = dynamic(
    () => import('@/components/sections/FlightOrHotelReview'),
    {
      loading: () => <FlightOrHotelReviewsSectionSkeleton />,
    }
  );

  // ---------- Render ----------
  return (
    <main className="mx-auto mb-20 mt-[40px] w-[90%]">
      <div className="my-[40px] w-full">
        <BreadcrumbUI />
      </div>

      {bookingDisabled ? (
        <p className="mb-2 rounded-md bg-red-500 p-3 text-center font-bold text-white shadow-lg">
          {isFlightExpired && 'Flight is expired. '}
          {!isSeatsAvailable && 'No seats available.'}
        </p>
      ) : (
        <SessionTimeoutCountdown
          redirectionLink="/flights"
          className="mb-2 rounded-md shadow-lg"
        />
      )}

      <div className="flex flex-col gap-3">
        {bookingId && (
          <div className="flex items-center justify-between rounded-lg p-5 font-bold shadow-lg">
            <p>You have a pending booking for this flight</p>
            <Button asChild>
              <Link href={`/user/my_bookings/flights/${bookingId}`}>
                See this booking
              </Link>
            </Button>
          </div>
        )}

        <FlightData
          className="w-full"
          data={flight}
          searchState={{
            ...parsedSearchState,
            passengers: {
              adult: parsedSearchState?.passengers?.adults,
              child: parsedSearchState?.passengers?.children,
              infant: parsedSearchState?.passengers?.infants,
            },
          }}
          metaData={metaData}
        />

        <FlightDetails className="w-full rounded-md bg-white p-6 shadow-lg dark:bg-gray-800 dark:text-white" flight={flight} metaData={metaData} />

        <div className="w-full rounded-md bg-white p-6 shadow-lg dark:bg-gray-800 dark:text-white">
          <h3 className="mb-3 text-xl font-bold">Fare Details</h3>
          <FareCard
            className="shadow-none"
            segments={segments}
            passengersCountObj={{
              adult: parsedSearchState?.passengers?.adults || 0,
              child: parsedSearchState?.passengers?.children || 0,
              infant: parsedSearchState?.passengers?.infants || 0,
            }}
            flightClass={metaData.flightClass}
          />
        </div>

        <FlightOrHotelReview
          className="w-full"
          reviewType="flight"
          data={{
            flightNumber,
            segments,
          }}
        />
      </div>
    </main>
  );
}