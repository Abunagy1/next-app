// app/lib/services/hotels.ts
import 'server-only';
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { getManyDocs, getOneDoc } from '@/app/lib/db/getOperationDB';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import initStripe from '@/app/lib/paymentIntegration/stripe';
import { singleRoomFareBreakdown, hotelPriceCalculation } from '@/app/lib/helpers/hotels/priceCalculation';

// ---------- Types ----------
export interface HotelSearchState {
  city: string;
  country: string;
  checkIn: string | number;
  checkOut: string | number;
  rooms: number;
  guests: number;
}

export interface HotelFilters {
  priceRange?: [number, number];
  rates?: string[];
  features?: string[];
  amenities?: string[];
}

// ---------- Main Search ----------
export async function getHotels(
  searchState: HotelSearchState,
  options: { filters?: HotelFilters } = {}
) {
  const { city, country, checkIn, checkOut, rooms, guests } = searchState;
  const filters = options.filters ?? {};
  const filtersPriceRange = filters.priceRange ?? [-Infinity, Infinity];
  const filtersRates = filters.rates ?? [];
  const filtersFeatures = filters.features ?? [];
  const filtersAmenities = filters.amenities ?? [];

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  let hotels: any[] = [];
  //console.log('Searching for city:', city, 'country:', country);
  // 1. Fetch hotels matching location
  if (dbType === 'postgres') {
    let query = sql`
      SELECT * FROM hotels
      WHERE address->>'city' ILIKE ${`%${city}%`}
      AND address->>'country' ILIKE ${`%${country}%`}
    `;
    
    if (filtersFeatures.length) {
      query = sql`${query} AND features && ${filtersFeatures}::text[]`;
    }
    if (filtersAmenities.length) {
      query = sql`${query} AND amenities && ${filtersAmenities}::text[]`;
    }
    const rows = await query;
    hotels = rows.map((row: any) => ({
      ...row,
      _id: row.id,   // ← ADD THIS LINE for consistent ID across DBs
      address: {
        streetAddress: row.address?.streetAddress,
        city: row.address?.city,
        country: row.address?.country,
      },
      rooms: [],
    }));
  } else {
    await connectDB();
    const filter: any = {
      'address.city': { $regex: city, $options: 'i' },
      'address.country': { $regex: country, $options: 'i' },
    };
    if (filtersFeatures.length) filter.features = { $all: filtersFeatures };
    if (filtersAmenities.length) filter.amenities = { $all: filtersAmenities };
    hotels = await getManyDocs('Hotel', filter, ['hotels']);
  }

  // 2. Get overlapping bookings to determine reserved rooms
  let overlappingBookings: any[] = [];
  if (dbType === 'postgres') {
    overlappingBookings = await sql`
      SELECT id, rooms, booking_status, guaranteed_reservation_until, check_in_date, check_out_date
      FROM hotel_bookings
      WHERE check_in_date < ${checkOutDate}
      AND check_out_date > ${checkInDate}
      AND (
        (booking_status = 'pending' AND guaranteed_reservation_until > NOW())
        OR booking_status = 'confirmed'
      )
    `;
  } else {
    overlappingBookings = await getManyDocs('HotelBooking', {
      checkInDate: { $lt: checkOutDate },
      checkOutDate: { $gt: checkInDate },
      $or: [
        { bookingStatus: 'pending', guaranteedReservationUntil: { $gt: new Date() } },
        { bookingStatus: 'confirmed' },
      ],
    }, ['hotelBookings']);
  }

  const reservedRoomIds = overlappingBookings.flatMap((b: any) =>
    dbType === 'postgres' ? b.rooms : b.rooms.map((r: any) => r.toString())
  );
  //console.log(`Found ${hotels.length} hotels matching location`);
  // 3. Process each hotel: fetch rooms, filter by price/rating/capacity
  const results = await Promise.all(
    hotels.map(async (hotel: any) => {
      // Fetch rooms for this hotel
      let availableRooms: any[];
      if (dbType === 'postgres') {
        const roomsData = await sql`SELECT * FROM hotel_rooms WHERE hotel_id = ${hotel.id}`;
        availableRooms = roomsData
          .filter((r: any) => !reservedRoomIds.includes(r.id))
          .map((r: any) => {
            // Normalize price: if it's a string, parse to object
            let price = r.price;
            if (typeof price === 'string') {
              try {
                price = JSON.parse(price);
              } catch {
                price = {};
              }
            }
            return {
              // ...r,
              id: r.id,
              _id: r.id, // consistent with MongoDB
              hotelId: hotel.id,          // <-- ADD for getHotels too
              roomType: r.room_type ?? r.roomType ?? 'Unknown',
              bedOptions: r.bed_options ?? r.bedOptions ?? 'Double',
              sleepsCount: r.sleeps_count ?? r.sleepsCount ?? 2,
              floor: r.floor,
              roomNumber: r.room_number ?? r.roomNumber,
              totalBeds: r.total_beds ?? r.totalBeds ?? 1,
              smokingAllowed: r.smoking_allowed ?? r.smokingAllowed ?? false,
              maxAdults: r.max_adults ?? r.maxAdults,
              maxChildren: r.max_children ?? r.maxChildren,
              extraBedAllowed: r.extra_bed_allowed ?? r.extraBedAllowed,
              tags: r.tags ?? [],
              price,                    // already parsed
              images: r.images ?? [],
              amenities: r.amenities ?? [],
              features: r.features ?? [],
            };
          });
        
        
      } else {
        availableRooms = hotel.rooms.filter(
          (room: any) => !reservedRoomIds.includes(room._id.toString())
        );
      }
      //console.log(`Hotel ${hotel.name} available rooms: ${availableRooms.length}`);
      // Filter rooms by price range
      const hasRoomInPriceRange = availableRooms.some((room: any) => {
        const price = singleRoomFareBreakdown(room, 1).total;
        return price >= filtersPriceRange[0] && price <= filtersPriceRange[1];
      });
      if (!hasRoomInPriceRange) {
        //console.log(`Hotel ${hotel.name} filtered out: no room in price range`);
        return null
      };

      // Capacity check
      const totalCapacity = availableRooms.reduce((sum, room) => sum + (room.sleepsCount || 0), 0);
      if (totalCapacity < guests) {
        //console.log(`Hotel ${hotel.name} filtered out: insufficient capacity (${totalCapacity} < ${guests})`);
        return null;
      }
      // console.log(`Hotel ${hotel.name} availableRooms sample:`, availableRooms[0]);
      // Get reviews and rating
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
      const avgRating = reviews.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      //console.log(`Hotel ${hotel.name} availableRooms sample:`, availableRooms[0]);
      // Rating filter
      if (filtersRates.length && !filtersRates.includes(String(Math.floor(avgRating)))) {
        //console.log(`Hotel ${hotel.name} filtered out: rating ${avgRating} not in [${filtersRates}]`);
        return null;
      }
      
      // console.log(`Hotel ${hotel.name} available rooms: ${availableRooms.length}`);
      // console.log(`Hotel ${hotel.name} availableRooms sample:`, availableRooms[0]);
      return {
        ...hotel,
        rooms: availableRooms,
        rating: avgRating,
        totalReviews: reviews.length,
      };
    })
  );
  // console.log('results before filter:', results.map(r => r?.name));
  // console.log('results before filter (raw):', results);
  return results.filter(Boolean);
}

// ---------- Get Single Hotel by Slug ----------
export async function getHotel(slug: string, searchState: HotelSearchState) {
  const { checkIn, checkOut } = searchState;
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  let hotel: any;
  if (dbType === 'postgres') {
    const rows = await sql`SELECT * FROM hotels WHERE slug = ${slug}`;
    if (rows.length === 0) return null;
    hotel = rows[0];
    const rooms = await sql`SELECT * FROM hotel_rooms WHERE hotel_id = ${hotel.id}`;
    hotel.rooms = rooms.map((r: any) => {
      let price = r.price;
      if (typeof price === 'string') {
        try { price = JSON.parse(price); } catch { price = {}; }
      }
      return {
        // ...r,
        id: r.id,
        _id: r.id, // consistent identifier
        hotelId: hotel.id,
        roomType: r.room_type ?? r.roomType ?? 'Unknown',
        bedOptions: r.bed_options ?? r.bedOptions ?? 'Double',
        sleepsCount: r.sleeps_count ?? r.sleepsCount ?? 2,
        floor: r.floor,
        roomNumber: r.room_number ?? r.roomNumber,
        totalBeds: r.total_beds ?? r.totalBeds ?? 1,
        smokingAllowed: r.smoking_allowed ?? r.smokingAllowed ?? false,
        maxAdults: r.max_adults ?? r.maxAdults,
        maxChildren: r.max_children ?? r.maxChildren,
        extraBedAllowed: r.extra_bed_allowed ?? r.extraBedAllowed,
        tags: r.tags ?? [],
        price,                             // parsed object
        images: r.images ?? [],
        amenities: r.amenities ?? [],
        features: r.features ?? [],
      };
    });
  } else {
    await connectDB();
    hotel = await getOneDoc('Hotel', { slug }, ['hotel']);
    if (!hotel || Object.keys(hotel).length === 0) return null;
  }

  // Get overlapping bookings
  let overlappingBookings: any[] = [];
  if (dbType === 'postgres') {
    overlappingBookings = await sql`
      SELECT rooms FROM hotel_bookings
      WHERE check_in_date < ${checkOutDate}
        AND check_out_date > ${checkInDate}
        AND (
          (booking_status = 'pending' AND guaranteed_reservation_until > NOW())
          OR booking_status = 'confirmed'
        )
    `;
  } else {
    overlappingBookings = await getManyDocs('HotelBooking', {
      $or: [
        { bookingStatus: 'pending', guaranteedReservationUntil: { $gt: new Date() } },
        { bookingStatus: 'confirmed' },
      ],
      checkInDate: { $lt: checkOutDate },
      checkOutDate: { $gt: checkInDate },
    }, ['hotelBookings']);
  }

  const reservedRoomIds = overlappingBookings.flatMap((b: any) =>
    dbType === 'postgres' ? b.rooms : b.rooms.map((r: any) => r.toString())
  );

  const availableRooms = hotel.rooms.filter((room: any) => {
    const roomId = dbType === 'postgres' ? room.id : room._id.toString();
    return !reservedRoomIds.includes(roomId);
  });
  // console.log('availableRooms:', availableRooms.length)
  return { ...hotel, rooms: availableRooms };
}

// ---------- Default Filter Values (amenities, features, price range) ----------
export async function getHotelDefaultFilterValues() {
  if (dbType === 'postgres') {
    const amenitiesResult = await sql`
      SELECT DISTINCT unnest(amenities) as amenity FROM hotels ORDER BY amenity
    `;
    const featuresResult = await sql`
      SELECT DISTINCT unnest(features) as feature FROM hotels ORDER BY feature
    `;
    const priceResult = await sql`
      SELECT MIN((hr.price->>'base')::numeric) as min_price,
             MAX((hr.price->>'base')::numeric) as max_price
      FROM hotels h
      JOIN hotel_rooms hr ON h.id = hr.hotel_id
    `;
    return {
      amenities: amenitiesResult.map((r: any) => r.amenity),
      features: featuresResult.map((r: any) => r.feature),
      priceRange: [
        Math.floor(Number(priceResult[0]?.min_price) || 0),
        Math.ceil(Number(priceResult[0]?.max_price) || 2000),
      ],
    };
  } else {
    await connectDB();
    const amenitiesResult = await dataModels.Hotel.aggregate([
      { $unwind: '$amenities' },
      { $group: { _id: '$amenities' } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, amenity: '$_id' } },
    ]);
    const featuresResult = await dataModels.Hotel.aggregate([
      { $unwind: '$features' },
      { $group: { _id: '$features' } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, feature: '$_id' } },
    ]);
    const priceResult = await dataModels.Hotel.aggregate([
      { $unwind: '$rooms' },
      {
        $addFields: {
          calculatedPrice: {
            $add: [
              '$rooms.price.base',
              '$rooms.price.tax',
              {
                $subtract: [
                  {
                    $cond: {
                      if: { $eq: ['$rooms.price.discount.type', 'percentage'] },
                      then: { $multiply: ['$rooms.price.base', { $divide: ['$rooms.price.discount.amount', 100] }] },
                      else: {
                        $cond: {
                          if: { $eq: ['$rooms.price.discount.type', 'fixed'] },
                          then: '$rooms.price.discount.amount',
                          else: 0,
                        },
                      },
                    },
                  },
                  0,
                ],
              },
              '$rooms.price.serviceFee',
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$calculatedPrice' },
          maxPrice: { $max: '$calculatedPrice' },
        },
      },
    ]);
    return {
      amenities: amenitiesResult.map((item: any) => item.amenity),
      features: featuresResult.map((item: any) => item.feature),
      priceRange: priceResult.length
        ? [Math.floor(priceResult[0].minPrice), Math.ceil(priceResult[0].maxPrice)]
        : [0, 2000],
    };
  }
}

// ---------- All Hotel Bookings for a User ----------
// export async function getAllHotelBookings(userId: string, revalidate = 600) {
//   if (!userId) throw new Error('User id is required');
//   if (dbType === 'postgres') {
//     return await sql`SELECT * FROM hotel_bookings WHERE user_id = ${userId}`;
//   } else {
//     return getManyDocs('HotelBooking', { userId: strToObjectId(userId) }, ['hotelBookings'], revalidate);
//   }
// }
export async function getAllHotelBookings(
  userId: string,
  filter?: 'upcoming' | 'past' | 'cancelled'
): Promise<any[]> {
  if (!userId) throw new Error('User id is required');

  if (dbType === 'postgres') {
    let query = sql`SELECT * FROM hotel_bookings WHERE user_id = ${userId}`;
    if (filter === 'cancelled') {
      query = sql`${query} AND booking_status = 'cancelled'`;
    } else if (filter === 'upcoming') {
      query = sql`${query} AND check_in_date >= CURRENT_DATE`;
    } else if (filter === 'past') {
      query = sql`${query} AND check_out_date < CURRENT_DATE`;
    }
    return await query;
  } else {
    await connectDB();
    const findFilter: any = { userId: strToObjectId(userId) };
    if (filter === 'cancelled') findFilter.bookingStatus = 'cancelled';
    if (filter === 'upcoming') findFilter.checkInDate = { $gte: new Date() };
    if (filter === 'past') findFilter.checkOutDate = { $lt: new Date() };
    return dataModels.HotelBooking.find(findFilter).lean();
  }
}
// ---------- Room Availability Check ----------
export async function isRoomAvailable(roomId: string, checkInDate: Date, checkOutDate: Date): Promise<boolean> {
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT 1 FROM hotel_bookings
      WHERE rooms @> ARRAY[${roomId}]::uuid[]
        AND check_in_date < ${checkOutDate}
        AND check_out_date > ${checkInDate}
        AND (
          (booking_status = 'pending' AND guaranteed_reservation_until > NOW())
          OR booking_status = 'confirmed'
        )
      LIMIT 1
    `;
    return rows.length === 0;
  } else {
    const existing = await dataModels.HotelBooking.findOne({
      rooms: roomId,
      checkInDate: { $lt: checkOutDate },
      checkOutDate: { $gt: checkInDate },
      $or: [
        { bookingStatus: 'pending', guaranteedReservationUntil: { $gt: new Date() } },
        { bookingStatus: 'confirmed' },
      ],
    }).lean();
    return !existing;
  }
}

// ---------- Is Room Taken by Another User ----------
export async function isRoomTakenByElse(
  roomId: string,
  checkInDate: Date,
  checkOutDate: Date,
  currentUserId: string
): Promise<boolean> {
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT 1 FROM hotel_bookings
      WHERE rooms @> ARRAY[${roomId}]::uuid[]
        AND check_in_date < ${checkOutDate}
        AND check_out_date > ${checkInDate}
        AND user_id != ${currentUserId}
        AND (
          (booking_status = 'pending' AND guaranteed_reservation_until > NOW())
          OR booking_status = 'confirmed'
        )
      LIMIT 1
    `;
    return rows.length > 0;
  } else {
    const existing = await dataModels.HotelBooking.findOne({
      rooms: roomId,
      userId: { $ne: strToObjectId(currentUserId) },
      checkInDate: { $lt: checkOutDate },
      checkOutDate: { $gt: checkInDate },
      $or: [
        { bookingStatus: 'pending', guaranteedReservationUntil: { $gt: new Date() } },
        { bookingStatus: 'confirmed' },
      ],
    }).lean();
    return !!existing;
  }
}

// ---------- Confirm Hotel Booking (Pay Later / Cash) ----------
export async function confirmHotelBookingCash(bookingId: string, userId: string, options: any = {}) {
  if (dbType === 'postgres') {
    await sql`
      UPDATE hotel_bookings
      SET booking_status = 'confirmed',
          payment_status = 'pending',
          payment_method = 'cash',
          booked_at = NOW()
      WHERE id = ${bookingId} AND user_id = ${userId}
    `;
  } else {
    await updateOneDoc('HotelBooking', { _id: strToObjectId(bookingId), userId: strToObjectId(userId) }, {
      bookingStatus: 'confirmed',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      bookedAt: new Date(),
    }, options);
  }
  revalidateTag('hotelBookings', {});
}

// ---------- Cancel Hotel Booking ----------
export async function cancelHotelBooking(bookingId: string, userId: string, options: any = {}) {
  if (dbType === 'postgres') {
    await sql`
      UPDATE hotel_bookings
      SET booking_status = 'cancelled'
      WHERE id = ${bookingId} AND user_id = ${userId}
    `;
  } else {
    await updateOneDoc('HotelBooking', { _id: strToObjectId(bookingId), userId: strToObjectId(userId) }, {
      bookingStatus: 'cancelled',
    }, options);
  }
  revalidateTag('hotelBookings', {});
}

// ---------- Refund Hotel Booking (Stripe) ----------
export async function refundPaymentHotelBooking(bookingId: string, userId: string) {
  const stripe = initStripe();
  let chargeId: string;

  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT hp.stripe_charge_id
      FROM hotel_bookings hb
      LEFT JOIN hotel_payments hp ON hb.payment_id = hp.id
      WHERE hb.id = ${bookingId} AND hb.user_id = ${userId}
      LIMIT 1
    `;
    if (rows.length === 0) throw new Error('Booking or payment not found');
    chargeId = rows[0].stripe_charge_id;
    if (!chargeId) throw new Error('No charge ID found for this booking');

    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: 'requested_by_customer',
      metadata: { type: 'hotelBooking', hotelBookingId: bookingId, userId },
    });

    await sql`
      UPDATE hotel_bookings
      SET payment_status = 'refunded',
          booking_status = 'cancelled',
          refund_info = ${JSON.stringify({
            stripeRefundId: refund.id,
            status: 'refunded',
            reason: refund.reason,
            currency: refund.currency,
            amount: refund.amount / 100,
            refundedAt: new Date(refund.created * 1000),
          })}::jsonb
      WHERE id = ${bookingId}
    `;
  } else {
    const booking = await getOneDoc('HotelBooking', { _id: strToObjectId(bookingId), userId: strToObjectId(userId) }, ['hotelBookings']);
    if (!booking) throw new Error('Booking not found');
    chargeId = booking.paymentId?.stripe_chargeId;
    if (!chargeId) throw new Error('No charge ID found for this booking');

    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: 'requested_by_customer',
      metadata: { type: 'hotelBooking', hotelBookingId: bookingId, userId },
    });

    await updateOneDoc('HotelBooking', { _id: booking._id }, {
      paymentStatus: 'refunded',
      bookingStatus: 'cancelled',
      refundInfo: {
        stripeRefundId: refund.id,
        status: 'refunded',
        reason: refund.reason,
        currency: refund.currency,
        amount: refund.amount / 100,
        refundedAt: new Date(refund.created * 1000),
      },
    });
  }
  revalidateTag('hotelBookings', {});
}

// ---------- Get Booking Statuses with Hotel Policies ----------
export async function getBookingStatusesWithHotelPolicies(bookingId: string, userId: string) {
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT
        hb.booking_status,
        hb.payment_status,
        hb.check_in_date,
        h.policies
      FROM hotel_bookings hb
      JOIN hotels h ON hb.hotel_id = h.id
      WHERE hb.id = ${bookingId} AND hb.user_id = ${userId}
      LIMIT 1
    `;
    return rows[0] || null;
  } else {
    const result = await dataModels.HotelBooking.aggregate([
      { $match: { _id: strToObjectId(bookingId), userId: strToObjectId(userId) } },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotelInfo',
        },
      },
      { $unwind: '$hotelInfo' },
      {
        $project: {
          bookingStatus: 1,
          paymentStatus: 1,
          checkInDate: 1,
          policies: '$hotelInfo.policies',
        },
      },
    ]);
    return result[0] || null;
  }
}

// ---------- Popular Hotel Destinations (Random) ----------
export async function getPopularHotelDestination(limit = 10) {
    if (dbType === 'postgres') {
      const rows = await sql`
        SELECT
          id,
          COALESCE(address->>'city', '') as city,
          COALESCE(address->>'country', '') as country,
          images[1] as image,
          category
        FROM hotels
        WHERE is_deleted = false AND status = 'Opened'
          AND address IS NOT NULL
        ORDER BY RANDOM()
        LIMIT ${limit}
      `;
      return rows.map((row: any) => ({
        _id: row.id,
        address: { city: row.city, country: row.country },
        image: row.image || '/placeholder-hotel.jpg',
        category: row.category || 'Hotel',
      }));
    } else {
    await connectDB();
    const hotels = await dataModels.Hotel.aggregate([
      { $match: { isDeleted: { $ne: true }, status: 'Opened', 'address.city': { $exists: true }, 'address.country': { $exists: true } } },
      { $sample: { size: limit } },
      { $project: { _id: 1, 'address.city': 1, 'address.country': 1, image: { $arrayElemAt: ['$images', 0] }, category: 1 } }
    ]);
    return hotels.map((h: any) => ({
      _id: h._id.toString(),
      address: { city: h.address.city, country: h.address.country },
      image: h.image || '/placeholder-hotel.jpg',
      category: h.category || 'Hotel',
    }));
  }
}