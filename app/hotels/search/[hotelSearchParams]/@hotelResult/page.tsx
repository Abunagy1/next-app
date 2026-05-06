import { HotelResultCard } from "@/components/pages/hotels.search/ui/HotelResultCard";
import { getManyDocs } from "@/app/lib/db/getOperationDB";
import { RATING_SCALE } from "@/app/lib/constants";
import { getUserDetails } from "@/app/lib/services/user";
import validateHotelSearchParams from "@/app/lib/zodSchemas/hotelSearchParams";
import SetHotelFormState from "@/components/helpers/SetHotelFormState";
import { getHotels } from "@/app/lib/services/hotels";
import Jumper from "@/components/local-ui/Jumper";
import extractFiltersObjFromSearchParams from "@/app/lib/helpers/hotels/extractFiltersObjFromSearchParams";
import validateHotelSearchFilter from "@/app/lib/zodSchemas/hotelSearchFilterValidation";
import { singleRoomFareBreakdown } from "@/app/lib/helpers/hotels/priceCalculation";
import { EmptyResult } from "@/components/EmptyResult";
import { cookies } from "next/headers";
import SetCookies from "@/components/helpers/SetCookies";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql, dbType, connectDB } from '@/app/lib/db/index';
interface HotelResultPageProps {
  params: {
    hotelSearchParams: string;
  };
}
interface HotelSearchState {
  city: string;
  country: string;
  checkIn: number;
  checkOut: number;
  rooms: number;
  guests: number;
}
export default async function HotelResultPage({ params }: HotelResultPageProps) {
  const { hotelSearchParams } = await params; // ← AWAIT HERE
  const decodedSp = decodeURIComponent(hotelSearchParams);
  // const spObj = Object.fromEntries(new URLSearchParams(decodedSp));
  // Replace '+' with space because URLSearchParams encodes spaces as '+'
  const spObj = Object.fromEntries(new URLSearchParams(decodedSp.replace(/\+/g, ' ')));
  const filters = extractFiltersObjFromSearchParams(spObj);
  //console.log('Extracted filters:', filters);
  const validatedFilters = validateHotelSearchFilter(filters);
  const session = await getServerSession(authOptions);
  const validate = validateHotelSearchParams(spObj);
  const formStateError: any = {
    ...spObj,
    checkIn: new Date(spObj.checkIn)?.toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    checkOut: new Date(spObj.checkOut)?.toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    destination: { city: spObj.city, country: spObj.country },
    errors: validate.errors,
  };
  delete formStateError.city;
  delete formStateError.country;
  if (!validate.success) {
    return <SetHotelFormState obj={formStateError} />;
  }
  // After validation, construct a properly typed filters object
  const filtersForService = validatedFilters?.data ? {
    rates: validatedFilters.data.rates,
    features: validatedFilters.data.features,
    amenities: validatedFilters.data.amenities,
    priceRange: validatedFilters.data.priceRange && validatedFilters.data.priceRange.length === 2
      ? [validatedFilters.data.priceRange[0], validatedFilters.data.priceRange[1]] as [number, number]
      : undefined,
  } : undefined;
  let hotels = await getHotels(validate.data as HotelSearchState, {
    filters: filtersForService,
  });
  //console.log('hotelResultsForCard: hotels array length =', hotels.length);
  if (session?.user?.id) {
    const userDetails = await getUserDetails(session.user.id);
    hotels = hotels.map((hotel: any) => {
      const liked = userDetails?.hotels?.bookmarked?.includes(hotel._id);
      return { ...hotel, liked };
    });
  }
  //console.log(`hotels type: ${Array.isArray(hotels)}, length: ${hotels.length}`);
  const hotelResultsForCard = (
    await Promise.all(
      hotels.map(async (hotel: any, idx: number) => {
        //console.log(`[${idx}] Processing hotel: ${hotel.name}, rooms: ${hotel.rooms?.length}`);

        if (!hotel.rooms || hotel.rooms.length === 0) {
          //console.log(`[${idx}] No rooms, skipping`);
          return null;
        }

        let reviews: any[] = [];
        if (dbType === 'postgres') {
          reviews = await sql`
            SELECT * FROM hotel_reviews
            WHERE hotel_id = ${hotel.id} AND slug = ${hotel.slug}
          `;
        } else {
          reviews = await getManyDocs(
            'HotelReview',
            { hotelId: hotel._id, slug: hotel.slug },
            [hotel.slug + '_review', 'hotelReviews']
          );
        }

        const totalRatingsSum = reviews.reduce((acc: number, review: any) => acc + +review.rating, 0);
        const totalReviewsCount = reviews.length;
        const rating = totalReviewsCount > 0 ? totalRatingsSum / totalReviewsCount : 0;
        const ratingScale = rating > 0 ? RATING_SCALE[Math.floor(rating) as keyof typeof RATING_SCALE] : "N/A";

        const filterRates = validatedFilters?.data?.rates || [];
        if (filterRates.length) {
          const ratingFilter = filterRates.includes(`${Math.floor(rating)}`);
          if (!ratingFilter) {
            //console.log(`[${idx}] Filtered out by rating (rating=${rating})`);
            return null;
          }
        }
        hotel.rooms.forEach((room: any, i: number) => {
          const p = singleRoomFareBreakdown(room, 1).total;
          //console.log(`  Room ${i} price: ${p}, base: ${room.price?.base}`);
        });
        // ★ DEBUG: Loop through rooms and log prices
        //console.log(`[${idx}] Looping through ${hotel.rooms.length} rooms:`);
        hotel.rooms.forEach((room: any, i: number) => {
          const p = singleRoomFareBreakdown(room, 1).total;
          //console.log(`  Room ${i}: total price = ${p}, base = ${room.price?.base}`);
        });
        // Find cheapest room safely
        const sortedRooms = [...hotel.rooms].sort((a: any, b: any) => {
          const aPrice = singleRoomFareBreakdown(a, 1).total;
          const bPrice = singleRoomFareBreakdown(b, 1).total;
          return aPrice - bPrice;
        });
        const cheapestRoom = sortedRooms[0];
        if (!cheapestRoom) {
          //console.log(`[${idx}] No cheapest room found`);
          return null;
        }
        //console.log(`[${idx}] Cheapest room price: ${singleRoomFareBreakdown(cheapestRoom, 1).total}`);
        const roomPrice = singleRoomFareBreakdown(cheapestRoom, 1).total;
        //console.log(`[${idx}] Cheapest room price: ${roomPrice}`);
        // Price range filter
        if (validatedFilters?.data?.priceRange) {
          const [minPrice, maxPrice] = validatedFilters.data.priceRange;
          if (roomPrice < minPrice || roomPrice > maxPrice) {
            //console.log(`[${idx}] Filtered out by price (${roomPrice} not in [${minPrice},${maxPrice}])`);
            return null;
          }
        }

        //console.log(`[${idx}] PASSED all filters`);

        return {
          _id: hotel._id,
          slug: hotel.slug,
          name: hotel.name,
          address: Object.values(hotel.address).join(", "),
          amenities: hotel.amenities?.slice(0, 5) || [],
          price: cheapestRoom.price,
          availableRoomsCount: hotel.rooms.length,
          rating,
          totalReviews: totalReviewsCount,
          ratingScale,
          image: hotel.images?.[0] || '',
          liked: hotel.liked || false,
        };
      })
    )
  ).filter(Boolean);
  const sParams = JSON.stringify(validate.data);
  const cookieStore = await cookies();
  const searchStateCookie = cookieStore.get("hotelSearchState")?.value;
  const isNewSearch = searchStateCookie !== sParams;
  // eslint-disable-next-line react-hooks/purity
  const expiresDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  return (
    <div className="w-full">
      {isNewSearch && (
        <SetCookies
          cookies={[
            {
              name: "hotelSearchState",
              value: sParams,
              expires: expiresDate,
            },
          ]}
        />
      )}
      <div className="mb-10">
        <Jumper id="hotelResults" />
      </div>
      {!hotelResultsForCard?.length ? (
        <EmptyResult
          className="h-full w-full"
          message="No Hotels Found"
          description="Try adjusting your search criteria or selecting different dates."
        />
      ) : (
        <div className="space-y-4">
          {hotelResultsForCard.map((hotel: any) => (
            <HotelResultCard
              key={hotel.slug}
              hotel={hotel}
              _searchState={validate.data}
            />
          ))}
        </div>
      )}
    </div>
  );
}