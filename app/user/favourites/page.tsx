import { FavouritesFlightAndPlacesTab } from '@/components/pages/favourites/ui/FavouritsTab';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { RATING_SCALE } from '@/app/lib/constants';
import routes from '@/data/routes.json';
import { cookies } from 'next/headers';
import { flightRatingCalculation } from '@/app/lib/helpers/flights/flightRatingCalculation';
import { isObject } from '@/app/lib/utils';
import { getAvailableSeats } from '@/app/lib/services/flights';
import { getUserDetails } from '@/app/lib/services/user';
import { hotelPriceCalculation } from '@/app/lib/helpers/hotels/priceCalculation';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { getOneDoc, getManyDocs } from '@/app/lib/db/getOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';

export const dynamic = 'force-dynamic';

// Types
type FlightBookmark = {
  flightId: any;
  searchState: any;
};

type FlightDetails = any;
type HotelDetails = any;

export default async function FavouritesPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.id;

  if (!isLoggedIn) {
    return redirect(
      routes.login.path + '?callbackPath=' + encodeURIComponent(routes.favourites.path)
    );
  }

  const userDetails = await getUserDetails(session.user.id);
  if (!userDetails) {
    return redirect(routes.login.path);
  }

  const timeZone = (await cookies()).get('timeZone')?.value || 'UTC';

  let favouriteFlights: any[] = [];
  let favouriteHotels: any[] = [];

  // ---------- Favourite Flights ----------
  if (userDetails.flights?.bookmarked?.length > 0) {
    favouriteFlights = await Promise.all(
      userDetails.flights.bookmarked.map(async (flight: FlightBookmark) => {
        const flightId = flight.flightId;
        if (!flightId || (isObject(flightId) && Object.keys(flightId).length === 0)) return null;

        let flightDetails: any;

        if (dbType === 'postgres') {
          const rows = await sql`
            SELECT * FROM flight_itineraries WHERE id = ${flightId}
          `;
          if (rows.length === 0) return null;
          flightDetails = rows[0];

          // Fetch segments
          const segmentRows = await sql`
            SELECT * FROM flight_segments WHERE id = ANY(${flightDetails.segment_ids}::uuid[])
          `;
          flightDetails.segmentIds = segmentRows;

          // Fetch airline
          const airlineRows = await sql`
            SELECT * FROM airlines WHERE iata_code = ${flightDetails.carrier_in_charge}
          `;
          if (airlineRows.length) flightDetails.carrierInCharge = airlineRows[0];
        } else {
          flightDetails = await getOneDoc('FlightItinerary', { _id: strToObjectId(flightId) }, ['flight']);
          if (Object.keys(flightDetails).length === 0) return null;
        }

        // Get reviews for rating
        let flightReviews: any[] = [];
        if (dbType === 'postgres') {
          const reviewRows = await sql`
            SELECT * FROM flight_reviews
            WHERE airline_id = ${flightDetails.carrier_in_charge}
              AND departure_airport_id = ${flightDetails.departure_airport_id}
              AND arrival_airport_id = ${flightDetails.arrival_airport_id}
              AND airplane_model_name = ${flightDetails.segmentIds[0]?.airplane_id?.model || 'Unknown'}
          `;
          flightReviews = reviewRows;
        } else {
          flightReviews = await getManyDocs(
            'FlightReview',
            {
              airlineId: flightDetails.carrierInCharge?._id || flightDetails.carrier_in_charge,
              departureAirportId: flightDetails.departureAirportId || flightDetails.departure_airport_id,
              arrivalAirportId: flightDetails.arrivalAirportId || flightDetails.arrival_airport_id,
              airplaneModelName: flightDetails.segmentIds[0]?.airplaneId?.model || 'Unknown',
            },
            ['flightReviews']
          );
        }

        const rating = flightRatingCalculation(flightReviews);
        const ratingReviews = {
          totalReviews: flightReviews.length,
          rating,
        };

        const isExpired = new Date(flightDetails.expire_at || flightDetails.expireAt) < new Date();

        // Seat availability per segment
        const availableSeats = await Promise.all(
          flightDetails.segmentIds.map(async (segment: any) => {
            const segmentId = dbType === 'postgres' ? segment.id : segment._id;
            const seats = await getAvailableSeats(segmentId, flight.searchState.class, 0);
            return {
              segmentId,
              availableSeats: seats.length,
            };
          })
        );

        return {
          ...flightDetails,
          ratingReviews,
          metaData: {
            flightClass: flight.searchState.class,
            timeZone,
            isBookmarked: true,
            isExpired,
          },
          searchState: flight.searchState,
          availableSeatsCount: availableSeats,
        };
      })
    );

    favouriteFlights = favouriteFlights.filter(Boolean);
  }

  // ---------- Favourite Hotels ----------
  if (userDetails.hotels?.bookmarked?.length > 0) {
    favouriteHotels = await Promise.all(
      userDetails.hotels.bookmarked.map(async (hotelId: string) => {
        let hotelDetails: any;

        if (dbType === 'postgres') {
          const rows = await sql`SELECT * FROM hotels WHERE id = ${hotelId}`;
          if (rows.length === 0) return null;
          hotelDetails = rows[0];

          const roomRows = await sql`SELECT * FROM hotel_rooms WHERE hotel_id = ${hotelId}`;
          hotelDetails.rooms = roomRows;
        } else {
          hotelDetails = await getOneDoc('Hotel', { _id: strToObjectId(hotelId) }, ['hotel']);
          if (Object.keys(hotelDetails).length === 0) return null;
        }

        // Get reviews
        let hotelReviews: any[] = [];
        if (dbType === 'postgres') {
          const reviewRows = await sql`
            SELECT * FROM hotel_reviews WHERE hotel_id = ${hotelId}
          `;
          hotelReviews = reviewRows;
        } else {
          hotelReviews = await getManyDocs('HotelReview', { hotelId: strToObjectId(hotelId) }, [
            hotelId + '_review',
            'hotelReviews',
          ]);
        }

        const totalReviewsCount = hotelReviews.length;
        const rating = hotelReviews.reduce((acc, rev) => acc + rev.rating, 0) / (totalReviewsCount || 1);
        const ratingScale = RATING_SCALE[Math.floor(rating) as keyof typeof RATING_SCALE] || 'N/A';
        // const ratingScale = RATING_SCALE[Math.floor(rating) as 1 | 2 | 3 | 4 | 5] || 'N/A';

        // Find cheapest room
        const roomsSorted = [...hotelDetails.rooms].sort((a: any, b: any) => {
          const aPrice = hotelPriceCalculation(a.price, 1).total;
          const bPrice = hotelPriceCalculation(b.price, 1).total;
          return aPrice - bPrice;
        });

        const cheapestRoom = roomsSorted[0];
        if (!cheapestRoom) return null;

        return {
          _id: hotelDetails._id || hotelDetails.id,
          slug: hotelDetails.slug,
          name: hotelDetails.name,
          address: dbType === 'postgres'
            ? Object.values(hotelDetails.address).join(', ')
            : `${hotelDetails.address.streetAddress}, ${hotelDetails.address.city}, ${hotelDetails.address.country}`,
          amenities: hotelDetails.amenities?.slice(0, 5) || [],
          price: cheapestRoom.price,
          availableRoomsCount: hotelDetails.rooms.length,
          rating,
          totalReviews: totalReviewsCount,
          ratingScale: ratingScale || 'N/A',
          image: hotelDetails.images?.[0] || '',
          liked: true,
        };
      })
    );

    favouriteHotels = favouriteHotels.filter(Boolean);
  }

  return (
    <main className="mx-auto mb-[90px] w-[95%] sm:w-[90%]">
      <h1 className="my-10 text-[2rem] font-bold">Favourites</h1>
      <FavouritesFlightAndPlacesTab
        favouriteFlights={favouriteFlights}
        favouriteHotels={favouriteHotels}
      />
    </main>
  );
}