import 'server-only';
import { unstable_cache } from 'next/cache';
import { startOfDay, endOfDay } from 'date-fns';
import { getTimezoneOffset } from 'date-fns-tz';
import { revalidateTag } from 'next/cache';
import { sql, dbType,  } from '@/app/lib/db/index'; // connectDB
import dataModels from '@/app/lib/db/models';
import { getManyDocs, getOneDoc } from '@/app/lib/db/getOperationDB';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';
// this multiSegmentCombinedFareBreakDown function has been moved to app/lib/helpers/flights/fareBreakdown.ts to avoid circular dependencies with priceCalculations.ts which is used in FareCard component and also needs to use the same fare breakdown logic for multi-segment flights
//import { multiSegmentCombinedFareBreakDown } from '@/app/lib/db/schema/flightItineraries';
// it will be imported from fareBreakdown.ts instead which itself imports the singleSegmentFareBreakdown function from priceCalculations.ts without causing circular dependency issues since priceCalculations.ts does not import anything from fareBreakdown.ts
import { multiSegmentCombinedFareBreakDown } from '@/app/lib/helpers/flights/fareBreakdown';
import { flightRatingCalculation } from '@/app/lib/helpers/flights/flightRatingCalculation';
import initStripe from '@/app/lib/paymentIntegration/stripe/index'; // ✅ default import
import mongoose from 'mongoose';
// ---------- Types ----------
interface FlightSearchParams {
  departureAirportCode: string;
  arrivalAirportCode: string;
  departureDate: Date;
  returnDate?: Date;
  tripType: 'one_way' | 'round_trip';
  flightClass: string;
  passengersObj: { adult: number; child: number; infant: number };
  filters?: {
    airlines?: string[];
    rates?: string[];
    priceRange?: [number, number];
    departureTime?: [number, number];
  };
}
interface BookmarkedFlights {
  flightId: any;
  searchState?: any;
}
// ---------- Helper: normalize fare_details from snake_case to camelCase ----------
// function normalizeFareDetails(raw: any) {
//   //console.log('normalizeFareDetails raw:', raw);
//   if (!raw) return {};
//   return {
//     basePrice: raw.base_price ?? raw.basePrice ?? {},
//     taxes: raw.taxes ?? {},
//     serviceFee: raw.service_fee ?? raw.serviceFee ?? {},
//     discount: raw.discount ?? {},
//   };
// }

// app/lib/services/flights.ts
// ... (existing imports and code above)

// app/lib/services/flights.ts – add this function (inside the file, after the existing imports)


// ---------- Get flights (main search) ----------
export async function getFlights(
  params: FlightSearchParams,
  bookmarkedFlights: BookmarkedFlights[] = [],
  metaData: { timeZone: string }
): Promise<any[]> {
  const {
    departureAirportCode,
    arrivalAirportCode,
    departureDate,
    flightClass,
    passengersObj,
    filters = {},
  } = params;
  const zoneOffset = getTimezoneOffset(metaData.timeZone, departureDate);
  const zoneOffsetMs = getTimezoneOffset(metaData.timeZone, departureDate) * 60 * 1000;

  const oneDayInMillis = 24 * 60 * 60 * 1000;
  const filterAirlines = filters?.airlines || [];
  const filterRatings = filters?.rates || [];
  const filterPriceRange = filters?.priceRange || [];
  const filterDepartureTime = filters?.departureTime || [];
  let seatCountMap: Map<string, number> | null = null;  // 👈 declared outside
  let flightResults: any[] = [];
  // ===================== POSTGRES =====================
  if (dbType === 'postgres') {
    let query = sql`
      SELECT 
        fi.id, fi.flight_code, fi.date, fi.carrier_in_charge, fi.segment_ids,
        fi.total_duration_minutes, fi.layovers, fi.baggage_allowance, fi.status, fi.expire_at,
        a.iata_code as airline_iata, a.name as airline_name, a.logo as airline_logo
      FROM flight_itineraries fi
      JOIN airlines a ON fi.carrier_in_charge = a.iata_code
      WHERE fi.departure_airport_id = ${departureAirportCode}
        AND fi.arrival_airport_id = ${arrivalAirportCode}
        AND fi.status = 'scheduled'
        AND fi.expire_at > NOW()
    `;
    // inside PostgreSQL branch, after building the initial query
    // const startTimestamp = startOfDay(departureDate).getTime() - zoneOffsetMs;
    // const endTimestamp = endOfDay(departureDate).getTime() - zoneOffsetMs;
    // const startSeconds = startTimestamp / 1000;
    // const endSeconds = endTimestamp / 1000;
    // query = sql`${query} AND fi.date BETWEEN to_timestamp(${startSeconds}) AND to_timestamp(${endSeconds})`;
    // Use UTC date range directly (departureDate is already UTC midnight)
    // const dateStr = departureDate.toISOString().split('T')[0];
    // const startDate = new Date(`${dateStr}T00:00:00.000Z`);
    // const endDate = new Date(`${dateStr}T23:59:59.999Z`);
    // const startSeconds = startDate.getTime() / 1000;
    // const endSeconds = endDate.getTime() / 1000;
    // query = sql`${query} AND fi.date BETWEEN to_timestamp(${startSeconds}) AND to_timestamp(${endSeconds})`;
    // Use UTC day range – matches MongoDB behavior exactly
    const startOfDayUTC = new Date(Date.UTC(departureDate.getUTCFullYear(), departureDate.getUTCMonth(), departureDate.getUTCDate(), 0, 0, 0));
    const endOfDayUTC = new Date(Date.UTC(departureDate.getUTCFullYear(), departureDate.getUTCMonth(), departureDate.getUTCDate(), 23, 59, 59, 999));
    const startSeconds = startOfDayUTC.getTime() / 1000;
    const endSeconds = endOfDayUTC.getTime() / 1000;
    query = sql`${query} AND fi.date BETWEEN to_timestamp(${startSeconds}) AND to_timestamp(${endSeconds})`;
    if (filterAirlines.length) {
      query = sql`${query} AND fi.carrier_in_charge = ANY(${filterAirlines})`;
    }
    if (filterDepartureTime.length) {
      const [minTime, maxTime] = filterDepartureTime;
      query = sql`${query} AND EXTRACT(EPOCH FROM fi.date::time) * 1000 BETWEEN ${minTime} AND ${maxTime}`;
    }
    const rows = await query;
    console.log(`Found ${rows.length} flights for ${departureAirportCode} -> ${arrivalAirportCode}`);
    if (rows.length > 0) {
      console.log('First flight:', rows[0].flight_code, rows[0].date);
    }
    flightResults = await Promise.all(
      rows.map(async (row: any) => {
        // fetch segments
        const segments = await sql`
          SELECT
            fs.id, fs.flight_number, fs.duration_minutes, fs.fare_details,
            fs.from_airport, fs.scheduled_departure, fs.from_terminal, fs.from_gate,
            fs.to_airport, fs.scheduled_arrival, fs.to_terminal, fs.to_gate,
            fs.airline_id, fs.airplane_id,
            a.model as airplane_model
          FROM flight_segments fs
          LEFT JOIN airplanes a ON fs.airplane_id = a.id
          WHERE fs.id = ANY(${row.segment_ids}::uuid[])
        `;
        const segmentIds = segments.map((seg: any) => {
          // Ensure fareDetails is an object
          let fareDetails = seg.fare_details;
          if (typeof fareDetails === 'string') {
            try { fareDetails = JSON.parse(fareDetails); } catch { fareDetails = {}; }
          }
          // Log the first one to confirm it’s correct
          // if (segments.indexOf(seg) === 0) {
          //   console.log('First segment fareDetails direct:', fareDetails);
          // }
          return {
            _id: seg.id,
            id: seg.id,
            flightNumber: seg.flight_number,
            durationMinutes: seg.duration_minutes,
            fareDetails,                     // ← direct assignment, no normalize
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
        // After segmentIds creation
        // if (flightResults.length > 0 && segmentIds.length > 0) {
        //   console.log('First segment fareDetails sample:', segmentIds[0].fareDetails);
        // }
        // parse JSONB columns if they are strings
        let baggage = row.baggage_allowance;
        if (typeof baggage === 'string') {
          try { baggage = JSON.parse(baggage); } catch { baggage = {}; }
        }
        let layovers = row.layovers;
        if (typeof layovers === 'string') {
          try { layovers = JSON.parse(layovers); } catch { layovers = []; }
        }
        return {
          ...row,
          flightCode: row.flight_code,                     // ← now works
          segmentIds,
          baggageAllowance: baggage,
          layovers,
          carrierInCharge: {
            _id: row.carrier_in_charge,
            iataCode: row.airline_iata,
            name: row.airline_name,
            logo: row.airline_logo,
          },
        };
      })
    );
  } else {
    const startOfDayUTC = startOfDay(departureDate);
    const endOfDayUTC = endOfDay(departureDate);
    const filter: any = {
      departureAirportId: departureAirportCode,
      arrivalAirportId: arrivalAirportCode,
      date: {
        $gte: startOfDayUTC.getTime() + zoneOffsetMs,
        $lte: endOfDayUTC.getTime() + zoneOffsetMs,
      },
      status: 'scheduled',
      expireAt: { $gte: new Date() },
    };
    if (filterAirlines.length) filter.carrierInCharge = { $in: filterAirlines };
    if (filterDepartureTime.length) {
      filter.date = {
        $gte: startOfDayUTC.getTime() + zoneOffsetMs + filterDepartureTime[0],
        $lte: startOfDayUTC.getTime() + zoneOffsetMs - (oneDayInMillis - filterDepartureTime[1]),
      };
    }

    flightResults = await dataModels.FlightItinerary.find(filter)
      .populate('segmentIds')
      .limit(100)
      .lean();

    // ---------- BATCH SEAT AVAILABILITY ----------
    const allSegmentIds: string[] = [];
    flightResults.forEach(flight => {
      flight.segmentIds?.forEach((seg: any) => {
        const segId = seg._id?.toString();
        if (segId) allSegmentIds.push(segId);
      });
    });
    if (allSegmentIds.length) {
      const seats = await dataModels.FlightSeat.aggregate([
        { $match: { segmentId: { $in: allSegmentIds.map(id => strToObjectId(id)) }, class: flightClass } },
        { $match: { $or: [{ 'reservation.type': null }, { 'reservation.type': 'temporary', 'reservation.expiresAt': { $lt: Date.now() } }] } },
        { $group: { _id: '$segmentId', availableSeats: { $sum: 1 } } }
      ]);
      seatCountMap = new Map(seats.map(s => [s._id.toString(), s.availableSeats]));
    } else {
      seatCountMap = new Map();
    }
  }

  // Post-process: filter by price, rating, seat availability
  const processedFlights: any[] = [];
  for (const flight of flightResults) {
    const fareBreakdown = multiSegmentCombinedFareBreakDown(
      flight.segmentIds,
      { adult: passengersObj.adult, child: passengersObj.child, infant: passengersObj.infant },
      flightClass
    );
    //console.log('Computed total for first flight:', fareBreakdown.total);
    // console.log('DEBUG first segment fareDetails:', flight.segmentIds[0]?.fareDetails, 'class:', flightClass, 'passengers:', passengersObj);
    // if (filterPriceRange[0] && filterPriceRange[1]) {
    //   if (fareBreakdown.total < filterPriceRange[0] || fareBreakdown.total > filterPriceRange[1]) continue;
    // }
    // console.log(
    //   'FARE for flight',
    //   flight.flightCode || flight.flight_code,
    //   '=',
    //   fareBreakdown.total,
    //   '(segments:', flight.segmentIds?.length, ')'
    // );
    // flight reviews
    let flightReviews: any[] = [];
    if (dbType === 'postgres') {
      const airlineId = flight.carrierInCharge?._id || flight.carrier_in_charge || '';
      const depAirportId = flight.departureAirportId || flight.departure_airport_id || '';
      const arrAirportId = flight.arrivalAirportId || flight.arrival_airport_id || '';
      const airplaneModel = flight.segmentIds?.[0]?.airplaneId?.model || 'Unknown';
      flightReviews = await sql`
        SELECT * FROM flight_reviews
        WHERE airline_id = ${airlineId}
          AND departure_airport_id = ${depAirportId}
          AND arrival_airport_id = ${arrAirportId}
          AND airplane_model_name = ${airplaneModel}
      `;
    } else {
      flightReviews = await getManyDocs('FlightReview', {
        airlineId: flight.carrierInCharge?._id,
        departureAirportId: flight.departureAirportId,
        arrivalAirportId: flight.arrivalAirportId,
        airplaneModelName: flight.segmentIds?.[0]?.airplaneId?.model || 'Unknown',
      }, ['flightReviews']);
    }

    const rating = flightRatingCalculation(flightReviews);
    if (filterRatings.length && !filterRatings.includes(String(Math.floor(rating)))) continue;
    if (!flight.segmentIds || flight.segmentIds.length === 0) continue;

    // seat availability
    // const availableSeatsCountArray: { segmentId: string; availableSeats: number }[] = [];
    // for (const segment of flight.segmentIds) {
    //   const segId = dbType === 'postgres' ? segment.id : segment._id;
    //   if (!segId) continue;
    //   const seats = await getAvailableSeats(segId, flightClass);
    //   availableSeatsCountArray.push({ segmentId: segId, availableSeats: seats.length });
    // }
    // if (availableSeatsCountArray.every(s => s.availableSeats === 0)) continue;
    // ---------- Seat availability (branch‑specific) ----------
    let availableSeatsCountArray: { segmentId: string; availableSeats: number }[];
    if (dbType === 'postgres') {
      availableSeatsCountArray = [];
      for (const segment of flight.segmentIds) {
        const segId = segment.id;
        if (!segId) continue;
        const seats = await getAvailableSeats(segId, flightClass);
        availableSeatsCountArray.push({ segmentId: segId, availableSeats: seats.length });
      }
    } else {
      // Use the pre‑computed map for MongoDB
      availableSeatsCountArray = flight.segmentIds.map((segment: any) => ({
        segmentId: segment._id.toString(),
        availableSeats: seatCountMap?.get(segment._id.toString()) || 0
      }));
    }
    if (availableSeatsCountArray.every(s => s.availableSeats === 0)) continue;
    const isBookmarked = bookmarkedFlights.some(
      (b) => b.flightId?._id?.toString() === (flight._id?.toString() || flight.id?.toString())
    );

    processedFlights.push({
      ...flight,
      ratingReviews: { rating, totalReviews: flightReviews.length },
      isBookmarked,
      fareBreakdowns: fareBreakdown,
      availableSeatsCount: availableSeatsCountArray,
    });
  }
  // At the end of getFlights, just before return
  // Serialize to plain objects (fixes the React serialization errors)
  return processedFlights.map(flight => JSON.parse(JSON.stringify(flight)));
}

// // ---------- Helper: Get flights (main search) ----------
// export async function getFlights(
//   params: FlightSearchParams,
//   bookmarkedFlights: BookmarkedFlights[] = [],
//   metaData: { timeZone: string }
// ): Promise<any[]> {
//   const {
//     departureAirportCode,
//     arrivalAirportCode,
//     departureDate,
//     tripType,
//     flightClass,
//     passengersObj,
//     filters = {},
//   } = params;
//   // console.log('getFlights called with:');
//   // console.log('  departureAirportCode:', departureAirportCode);
//   // console.log('  arrivalAirportCode:', arrivalAirportCode);
//   // console.log('  departureDate:', departureDate);
//   // console.log('  tripType:', tripType);
//   // console.log('  filters:', filters);
//   const zoneOffset = getTimezoneOffset(metaData.timeZone, departureDate);
//   const filterAirlines = filters?.airlines || [];
//   const filterRatings = filters?.rates || [];
//   const filterPriceRange = filters?.priceRange || [];
//   const filterDepartureTime = filters?.departureTime || [];
//   const oneDayInMillis = 24 * 60 * 60 * 1000;
//   // console.log('getFlights called with:');
//   // console.log('  departureAirportCode:', departureAirportCode);
//   // console.log('  arrivalAirportCode:', arrivalAirportCode);
//   // console.log('  departureDate:', departureDate);
//   // console.log('  tripType:', tripType);
//   // console.log('  filters:', filters);
//   let flightResults: any[] = [];

//   if (dbType === 'postgres') {
//     // Build base query
//     let query = sql`
//       SELECT 
//         fi.id, fi.flight_code, fi.date, fi.carrier_in_charge, fi.segment_ids,
//         fi.total_duration_minutes, fi.layovers, fi.baggage_allowance, fi.status, fi.expire_at,
//         a.iata_code as airline_iata, a.name as airline_name, a.logo as airline_logo
//       FROM flight_itineraries fi
//       JOIN airlines a ON fi.carrier_in_charge = a.iata_code
//       WHERE fi.departure_airport_id = ${departureAirportCode}
//         AND fi.arrival_airport_id = ${arrivalAirportCode}
//         AND fi.status = 'scheduled'
//         AND fi.expire_at > NOW()
//     `;

//     // Date range filter (departure date)
//     // const startTimestamp = startOfDay(departureDate).getTime() - zoneOffset;
//     // const endTimestamp = endOfDay(departureDate).getTime() - zoneOffset;
//     // query = sql`${query} AND fi.date BETWEEN to_timestamp(${startTimestamp} / 1000) AND to_timestamp(${endTimestamp} / 1000)`;
//     // query = sql`${query} AND fi.date BETWEEN to_timestamp((${startTimestamp} / 1000)::double precision) AND to_timestamp((${endTimestamp} / 1000)::double precision)`;
//     // Airlines filter
//     const startTimestamp = startOfDay(departureDate).getTime() - zoneOffset;
//     const endTimestamp = endOfDay(departureDate).getTime() - zoneOffset;
//     const startSeconds = startTimestamp / 1000;
//     const endSeconds = endTimestamp / 1000;
//     query = sql`${query} AND fi.date BETWEEN to_timestamp(${startSeconds}) AND to_timestamp(${endSeconds})`;
//     if (filterAirlines.length) {
//       query = sql`${query} AND fi.carrier_in_charge = ANY(${filterAirlines})`;
//     }
//     // Departure time filter
//     if (filterDepartureTime.length) {
//       const minTime = filterDepartureTime[0];
//       const maxTime = filterDepartureTime[1];
//       query = sql`${query} AND EXTRACT(EPOCH FROM fi.date::time) * 1000 BETWEEN ${minTime} AND ${maxTime}`;
//     }

//     const rows = await query;
//     // For each itinerary, fetch its segments
//     flightResults = await Promise.all(
//       rows.map(async (row: any) => {
//         const segments = await sql`
//           SELECT
//             fs.id,
//             fs.flight_number,
//             fs.duration_minutes,
//             fs.fare_details,
//             fs.from_airport,
//             fs.scheduled_departure,
//             fs.from_terminal,
//             fs.from_gate,
//             fs.to_airport,
//             fs.scheduled_arrival,
//             fs.to_terminal,
//             fs.to_gate,
//             fs.airline_id,
//             fs.airplane_id,
//             a.model as airplane_model
//           FROM flight_segments fs
//           LEFT JOIN airplanes a ON fs.airplane_id = a.id
//           WHERE fs.id = ANY(${row.segment_ids}::uuid[])
//         `;

//         const segmentIds = segments.map((seg: any) => ({
//           _id: seg.id,
//           id: seg.id,                             // ← required by the availability loop
//           flightNumber: seg.flight_number,
//           durationMinutes: seg.duration_minutes,
//           fareDetails: seg.fare_details || {},
//           from: {
//             airport: {
//               iataCode: seg.from_airport,        // column is from_airport, not from_airport_code
//               name: '',
//               _id: seg.from_airport,
//             },
//             scheduledDeparture: seg.scheduled_departure,
//             terminal: seg.from_terminal,
//             gate: seg.from_gate,
//           },
//           to: {
//             airport: {
//               iataCode: seg.to_airport,
//               name: '',
//               _id: seg.to_airport,
//             },
//             scheduledArrival: seg.scheduled_arrival,
//             terminal: seg.to_terminal,
//             gate: seg.to_gate,
//           },
//           airlineId: {
//             _id: seg.airline_id,
//             iataCode: seg.airline_id,
//             name: '',                             // will be replaced with full airline data later
//           },
//           airplaneId: { model: seg.airplane_model || 'N/A' },
//         }));
//         return {
//           ...row,
//           flightCode: row.flight_code,   // add this line
//           segmentIds,
//           carrierInCharge: { _id: row.carrier_in_charge, iataCode: row.airline_iata, name: row.airline_name, logo: row.airline_logo },
//         };
//       })
//     );
//   } else {
//     // MongoDB version
//     const filter: any = {
//       departureAirportId: departureAirportCode,
//       arrivalAirportId: arrivalAirportCode,
//       date: {
//         $gte: startOfDay(departureDate).getTime() - zoneOffset,
//         $lte: endOfDay(departureDate).getTime() - zoneOffset,
//       },
//       status: 'scheduled',
//       expireAt: { $gte: new Date() },
//     };
//     if (filterAirlines.length) filter.carrierInCharge = { $in: filterAirlines };
//     if (filterDepartureTime.length) {
//       filter.date = {
//         $gte: startOfDay(departureDate).getTime() - zoneOffset + filterDepartureTime[0],
//         $lte: startOfDay(departureDate).getTime() - zoneOffset - (oneDayInMillis - filterDepartureTime[1]),
//       };
//     }
//     flightResults = await getManyDocs('FlightItinerary', filter, ['flights']);
//   }
//   //console.log(`  Found ${flightResults.length} raw flights`);
//   // Post-process: filter by price range, rating, seat availability
//   const processedFlights: any[] = [];
//   for (const flight of flightResults) {
//     const fareBreakdown = multiSegmentCombinedFareBreakDown(
//       flight.segmentIds,
//       { adult: passengersObj.adult, child: passengersObj.child, infant: passengersObj.infant },
//       flightClass
//     );
//     if (filterPriceRange[0] && filterPriceRange[1]) {
//       if (fareBreakdown.total < filterPriceRange[0] || fareBreakdown.total > filterPriceRange[1]) continue;
//     }
//     //console.log(`  Found ${flightResults.length} raw flights`);
//     // Inside the loop over flightResults
//     let flightReviews: any[] = [];
//     if (dbType === 'postgres') {
//       // Pre‑compute values to avoid undefined being passed to the driver
//       const airlineId = flight.carrierInCharge?._id || flight.carrier_in_charge || '';
//       const depAirportId = flight.departureAirportId || flight.departure_airport_id || '';
//       const arrAirportId = flight.arrivalAirportId || flight.arrival_airport_id || '';
//       const airplaneModel = flight.segmentIds?.[0]?.airplaneId?.model || 'Unknown';

//       flightReviews = await sql`
//         SELECT * FROM flight_reviews
//         WHERE airline_id = ${airlineId}
//           AND departure_airport_id = ${depAirportId}
//           AND arrival_airport_id = ${arrAirportId}
//           AND airplane_model_name = ${airplaneModel}
//       `;
//     } else {
//       flightReviews = await getManyDocs(
//         'FlightReview',
//         {
//           airlineId: flight.carrierInCharge?._id || flight.carrier_in_charge,
//           departureAirportId: flight.departureAirportId || flight.departure_airport_id,
//           arrivalAirportId: flight.arrivalAirportId || flight.arrival_airport_id,
//           airplaneModelName: flight.segmentIds?.[0]?.airplaneId?.model || 'Unknown',
//         },
//         ['flightReviews']
//       );
//     }
//     const rating = flightRatingCalculation(flightReviews);
//     if (filterRatings.length && !filterRatings.includes(String(Math.floor(rating)))) continue;
//     if (!flight.segmentIds || flight.segmentIds.length === 0) continue;
//     const availableSeatsCountArray: { segmentId: string; availableSeats: number }[] = [];
//     for (const segment of flight.segmentIds) {
//       const segId = dbType === 'postgres' ? segment.id : segment._id;
//       if (!segId) continue;   // skip invalid segments
//       const seats = await getAvailableSeats(segId, flightClass);
//       availableSeatsCountArray.push({ segmentId: segId, availableSeats: seats.length });
//     }
//     // if no seat is available at all, skip the flight
//     if (availableSeatsCountArray.every(s => s.availableSeats === 0)) continue;

//     const isBookmarked = bookmarkedFlights.some(
//       (b) => b.flightId?._id?.toString() === (flight._id?.toString() || flight.id?.toString())
//     );
//     processedFlights.push({
//       ...flight,
//       ratingReviews: { rating, totalReviews: flightReviews.length },
//       isBookmarked,
//       fareBreakdowns: fareBreakdown,
//       availableSeatsCount: availableSeatsCountArray,
//     });
//   }
//   return processedFlights;
// }

// ---------- Get single flight by code and date ----------
export async function getFlight(flightCode: string, date: Date): Promise<any> {
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT * FROM flight_itineraries
      WHERE flight_code = ${flightCode} AND date::date = ${date.toISOString().split('T')[0]}
    `;
    return rows[0] || null;
  } else {
    return getOneDoc('FlightItinerary', { flightCode, date }, ['flight']);
  }
}

// ---------- Get available flight date range ----------
// export async function getAvailableFlightDateRange(): Promise<{ success: boolean; message: string; data?: { from: number; to: number } }> {
//   try {
//     if (dbType === 'postgres') {
//       const rows = await sql`
//         SELECT MIN(expire_at) as min_expire, MAX(expire_at) as max_expire
//         FROM flight_itineraries
//         WHERE expire_at > NOW()
//       `;
//       const from = rows[0]?.min_expire ? new Date(rows[0].min_expire).getTime() : Date.now();
//       const to = rows[0]?.max_expire ? new Date(rows[0].max_expire).getTime() : Date.now() + 365 * 24 * 60 * 60 * 1000;
//       return { success: true, message: 'Success', data: { from, to } };
//     } else {
//       const first = await dataModels.FlightItinerary.findOne({ expireAt: { $gte: new Date() } })
//         .sort({ expireAt: 1 })
//         .lean();
//       const last = await dataModels.FlightItinerary.findOne({ expireAt: { $gte: new Date() } })
//         .sort({ expireAt: -1 })
//         .lean();
//       const from = first ? first.expireAt.getTime() : Date.now();
//       const to = last ? last.expireAt.getTime() : Date.now() + 365 * 24 * 60 * 60 * 1000;
//       return { success: true, message: 'Success', data: { from, to } };
//     }
//   } catch (e) {
//     console.error(e);
//     return { success: false, message: 'Failed to get flight date range' };
//   }
// }
export async function getAvailableFlightDateRange(): Promise<{ success: boolean; message: string; data?: { from: number; to: number } }> {
  try {
    if (dbType === 'postgres') {
      const rows = await sql`
        SELECT MIN(date) AS min_date, MAX(date) AS max_date
        FROM flight_itineraries
        WHERE date > NOW()
      `;
      const row = rows[0];
      const from = row?.min_date ? new Date(row.min_date).getTime() : Date.now();
      const to = row?.max_date ? new Date(row.max_date).getTime() : Date.now();
      return { success: true, message: 'Success', data: { from, to } };
    } else {
      const first = await dataModels.FlightItinerary.findOne({ date: { $gte: new Date() } })
        .sort({ date: 1 })
        .lean();
      const last = await dataModels.FlightItinerary.findOne({ date: { $gte: new Date() } })
        .sort({ date: -1 })
        .lean();
      const from = first ? first.date.getTime() : Date.now();
      const to = last ? last.date.getTime() : Date.now();
      return { success: true, message: 'Success', data: { from, to } };
    }
  } catch (e) {
    console.error(e);
    return { success: false, message: 'Failed to get flight date range' };
  }
}
// ---------- Get all flight bookings for a user ----------
// export async function getAllFlightBookings(userId: string, revalidate = 600): Promise<any[]> {
//   if (!userId) throw new Error('User id is required');
//   if (dbType === 'postgres') {
//     return await sql`SELECT * FROM flight_bookings WHERE user_id = ${userId}`;
//   } else {
//     return getManyDocs('FlightBooking', { userId: strToObjectId(userId) }, ['userFlightBooking'], revalidate);
//   }
// }
export async function getAllFlightBookings(
  userId: string,
  filter?: 'upcoming' | 'past' | 'cancelled'
): Promise<any[]> {
  if (!userId) throw new Error('User id is required');

  if (dbType === 'postgres') {
    let query = sql`SELECT * FROM flight_bookings WHERE user_id = ${userId}`;

    if (filter === 'cancelled') {
      query = sql`${query} AND ticket_status = 'cancelled'`;
    } else if (filter === 'upcoming') {
      query = sql`
        ${query} AND id IN (
          SELECT fb.id FROM flight_bookings fb
          JOIN flight_itineraries fi ON fb.flight_itinerary_id = fi.id
          WHERE fb.user_id = ${userId} AND fi.date >= NOW()
        )
      `;
    } else if (filter === 'past') {
      query = sql`
        ${query} AND id IN (
          SELECT fb.id FROM flight_bookings fb
          JOIN flight_itineraries fi ON fb.flight_itinerary_id = fi.id
          WHERE fb.user_id = ${userId} AND fi.date < NOW()
        )
      `;
    }

    return await query;
  } else {
    //await connectDB();
    const findFilter: any = { userId: strToObjectId(userId) };
    if (filter === 'cancelled') {
      findFilter.ticketStatus = 'cancelled';
    } else if (filter === 'upcoming') {
      // We need to filter by departure date – fetch all and filter in memory (ok for moderate data)
      const bookings = await dataModels.FlightBooking.find(findFilter).lean();
      const filtered = [];
      for (const b of bookings) {
        const itinerary = await getOneDoc('FlightItinerary', { _id: b.flightItineraryId }, ['flight'], 0);
        if (itinerary && new Date(itinerary.date) >= new Date()) filtered.push(b);
      }
      return filtered;
    } else if (filter === 'past') {
      const bookings = await dataModels.FlightBooking.find(findFilter).lean();
      const filtered = [];
      for (const b of bookings) {
        const itinerary = await getOneDoc('FlightItinerary', { _id: b.flightItineraryId }, ['flight'], 0);
        if (itinerary && new Date(itinerary.date) < new Date()) filtered.push(b);
      }
      return filtered;
    }

    return dataModels.FlightBooking.find(findFilter).lean();
  }
}
// ---------- Get available (free) seats for a segment ----------
export async function getAvailableSeats(segmentId: string, seatClass?: string, revalidate = 600): Promise<any[]> {
  if (!segmentId) return [];
  if (dbType === 'postgres') {
    let query = sql`
      SELECT * FROM flight_seats
      WHERE segment_id = ${segmentId}
      
        AND (reservation IS NULL OR reservation->>'type' IS NULL
          OR (reservation->>'type' = 'temporary' AND (reservation->>'expiresAt')::bigint < ${Date.now()}))
    `;
    if (seatClass) query = sql`${query} AND class = ${seatClass}`;
    return await query;
  } else {
    const filter: any = { segmentId: strToObjectId(segmentId) };
    if (seatClass) filter.class = seatClass;
    filter.$or = [
      { 'reservation.type': null },
      { 'reservation.type': 'temporary', 'reservation.expiresAt': { $lt: Date.now() } },
    ];
    return getManyDocs('FlightSeat', filter, ['flightSeat'], revalidate);
  }
}

// ---------- Get reserved (taken) seats for a segment ----------
export async function getReservedSeats(segmentId: string, seatClass?: string, revalidate = 600): Promise<any[]> {
  if (dbType === 'postgres') {
    let query = sql`
      SELECT * FROM flight_seats
      WHERE segment_id = ${segmentId}
        AND (reservation->>'type' = 'permanent'
          OR (reservation->>'type' = 'temporary' AND (reservation->>'expiresAt')::bigint > ${Date.now()}))
    `;
    if (seatClass) query = sql`${query} AND class = ${seatClass}`;
    return await query;
  } else {
    const filter: any = { segmentId: strToObjectId(segmentId) };
    if (seatClass) filter.class = seatClass;
    filter.$or = [
      { 'reservation.type': 'permanent' },
      { 'reservation.type': 'temporary', 'reservation.expiresAt': { $gt: Date.now() } },
    ];
    return getManyDocs('FlightSeat', filter, ['flightSeat'], revalidate);
  }
}

// ---------- Get expired temporary reservations ----------
export async function getExpiredTemporarylyReservedSeats(segmentId: string, seatClass?: string, revalidate = 600): Promise<any[]> {
  if (dbType === 'postgres') {
    let query = sql`
      SELECT * FROM flight_seats
      WHERE segment_id = ${segmentId}
        AND reservation->>'type' = 'temporary'
        AND (reservation->>'expiresAt')::bigint < ${Date.now()}
    `;
    if (seatClass) query = sql`${query} AND class = ${seatClass}`;
    return await query;
  } else {
    const filter: any = { segmentId: strToObjectId(segmentId) };
    if (seatClass) filter.class = seatClass;
    filter['reservation.type'] = 'temporary';
    filter['reservation.expiresAt'] = { $lt: Date.now() };
    return getManyDocs('FlightSeat', filter, ['flightSeat'], revalidate);
  }
}

// ---------- Check if a seat is taken by another passenger ----------
export async function isSeatTakenByElse(seatId: string, currentPassengerId: string): Promise<boolean> {
  if (!seatId || seatId === 'undefined' || seatId === 'null') return false;
  if (dbType === 'postgres') {
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM flight_seats
        WHERE id = ${seatId}
          AND reservation->>'for' != ${currentPassengerId}
          AND reservation->>'type' IN ('permanent', 'temporary')
          AND (reservation->>'expiresAt' IS NULL OR (reservation->>'expiresAt')::bigint > ${Date.now()})
      ) as taken
    `;
    return result[0]?.taken || false;  // result.length > 0;
  } else {
    const seat = await getOneDoc('FlightSeat', { _id: strToObjectId(seatId) }, [], 0);
    if (!seat || !seat.reservation) return false;
    const isTaken =
      seat.reservation.for?.toString() !== currentPassengerId &&
      (seat.reservation.type === 'permanent' ||
        (seat.reservation.type === 'temporary' && seat.reservation.expiresAt > Date.now()));
    return isTaken;
  }
}

// ---------- Cancel a flight booking ----------
export async function cancelBooking(pnrCode: string, cancellationData: any, options: any = {}): Promise<void> {
  if (dbType === 'postgres') {
    await sql`
      UPDATE flight_bookings
      SET
        ticket_status = 'cancelled',
        cancellation_info = ${JSON.stringify(cancellationData)}::jsonb
      WHERE pnr_code = ${pnrCode}
    `;
  } else {
    await updateOneDoc('FlightBooking', { pnrCode }, {
      ticketStatus: 'cancelled',
      cancellationInfo: cancellationData,
    }, options);
  }
  revalidateTag('userFlightBooking',{});
}

// ---------- Assign seats to a flight booking (temporary or permanent) ----------
export async function assignSeatsToFlightBooking(
  booking: any,
  reservationType: 'temporary' | 'permanent',
  reservationExpiresAt: number | null = null,
  session?: mongoose.ClientSession
): Promise<any[]> {
  const pnrCode = booking.pnrCode;
  if (!booking) throw new Error('Flight booking not found');

  if (dbType === 'postgres') {
    // For PostgreSQL, the session is actually the transaction object from sql.begin.
    // We'll cast it to `any` to allow calling it as a tagged template.
    const trx = session as any;
    if (!trx) throw new Error('PostgreSQL seat assignment requires a transaction object');
    const selectedSeats: any[] = [];
    const bookingsToCancel: string[] = [];

    for (const segment of booking.segmentIds) {
      const segmentId = segment.id;
      const availableSeats = await trx`
        SELECT id, seat_number, class, reservation
        FROM flight_seats
        WHERE segment_id = ${segmentId}
          AND class = ${booking.seatClass}
          AND (
            reservation IS NULL
            OR reservation->>'type' IS NULL
            OR (reservation->>'type' = 'temporary' AND (reservation->>'expiresAt')::bigint < ${Date.now()})
          )
        LIMIT ${booking.passengers.length}
      `;
      if (availableSeats.length < booking.passengers.length) {
        throw new Error(`Not enough available seats for segment ${segmentId}`);
      }
      for (let i = 0; i < booking.passengers.length; i++) {
        const passengerId = booking.passengers[i].id;
        const seat = availableSeats[i];
        if (seat.reservation && seat.reservation.pnrCode && seat.reservation.type === 'temporary') {
          const otherPnr = seat.reservation.pnrCode;
          bookingsToCancel.push(otherPnr);
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
        await trx`
          UPDATE flight_seats
          SET reservation = ${JSON.stringify({
            pnrCode,
            for: passengerId,
            type: reservationType,
            expiresAt: reservationExpiresAt,
          })}::jsonb
          WHERE id = ${seat.id}
        `;
        selectedSeats.push({ passengerId, seatId: seat.id });
      }
    }
    if (selectedSeats.length) {
      await trx`
        UPDATE flight_bookings
        SET selected_seats = ${JSON.stringify(selectedSeats)}::jsonb
        WHERE pnr_code = ${pnrCode}
      `;
    }
    return selectedSeats.map(s => s.seatId);
  } else {
    // MongoDB version
    const passengers = booking.passengers;
    const segments = booking.segmentIds;
    const selectedSeats: any[] = [];
    const bookingsToCancel: string[] = [];

    for (const segment of segments) {
      const segmentId = segment._id;
      const availableSeats = await getAvailableSeats(segmentId, undefined, 0);
      if (!availableSeats.length) throw new Error('No available seats');
      const unreservedSeats = availableSeats.filter((seat: any) => seat.reservation.type === null);
      const expiredReservedSeats = availableSeats.filter(
        (seat: any) => seat.reservation.type === 'temporary' && +seat.reservation.expiresAt < Date.now()
      );
      for (const passenger of passengers.filter((p: any) => p.passengerType !== 'infant')) {
        const seat =
          unreservedSeats.find(
            (s: any) => s.class === passenger.seatClass && !selectedSeats.some(ss => ss.seatId === s._id)
          ) ??
          expiredReservedSeats.find(
            (s: any) => s.class === passenger.seatClass && !selectedSeats.some(ss => ss.seatId === s._id)
          );
        if (!seat) throw new Error('No available seats');
        if (seat.reservation.type === 'temporary') bookingsToCancel.push(seat.reservation.pnrCode);
        seat.reservation = {
          pnrCode: booking.pnrCode,
          for: passenger._id,
          type: reservationType,
          expiresAt: reservationExpiresAt,
        };
        selectedSeats.push(seat);
      }
    }

    const seatUpdates = selectedSeats.map((seat) => ({
      updateOne: {
        filter: { _id: seat._id },
        update: { $set: { reservation: seat.reservation } },
      },
    }));
    await dataModels.FlightSeat.bulkWrite(seatUpdates, { session });
    for (const pnr of bookingsToCancel) {
      await cancelBooking(pnr, {
        canceledBy: 'system',
        canceledAt: new Date(),
        reason: 'Temporary reservation expired, thus taken by other passenger',
      }, { session });
    }
    const flightBookingSelectedSeats = selectedSeats.map((s: any) => ({
      passengerId: s.reservation.for,
      seatId: s._id,
    }));
    await updateOneDoc('FlightBooking', { pnrCode }, {
      selectedSeats: flightBookingSelectedSeats,
      guaranteedReservationUntil: reservationExpiresAt ? new Date(reservationExpiresAt) : undefined,
    }, { session });
    return selectedSeats.map((s) => s._id);
  }
}

// ---------- Get booking status with cancellation policy ----------
export async function getBookingStatusWithCancellationPolicy(pnrCode: string, userId: string): Promise<any | null> {
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT
        fb.payment_status,
        fb.ticket_status,
        fi.date AS departure_date,
        a.airline_policy->'cancellationPolicy' AS cancellation_policy,
        fb.created_at
      FROM flight_bookings fb
      JOIN flight_itineraries fi ON fb.flight_itinerary_id = fi.id
      JOIN airlines a ON fi.carrier_in_charge = a.iata_code
      WHERE fb.pnr_code = ${pnrCode} AND fb.user_id = ${userId}
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    return rows[0];
  } else {
    const booking = await getOneDoc(
      'FlightBooking',
      { pnrCode, userId: strToObjectId(userId) },
      ['userFlightBooking'],
      0
    );
    if (!booking || Object.keys(booking).length === 0) return null;
    const itinerary = await getOneDoc('FlightItinerary', { _id: booking.flightItineraryId }, ['flight'], 0);
    const airline = await getOneDoc('Airline', { _id: itinerary.carrierInCharge }, ['airline'], 0);
    return {
      paymentStatus: booking.paymentStatus,
      ticketStatus: booking.ticketStatus,
      departureDate: itinerary.date,
      cancellationPolicy: airline.airlinePolicy?.cancellationPolicy,
      createdAt: booking.createdAt,
    };
  }
}

// ---------- Refund a flight booking (Stripe) ----------
export async function refundPaymentFlightBooking(pnrCode: string, userId: string): Promise<void> {
  const stripe = initStripe();
  let bookingId: string;
  let chargeId: string;

  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT fb.id, fp.stripe_charge_id
      FROM flight_bookings fb
      LEFT JOIN flight_payments fp ON fb.payment_id = fp.id
      WHERE fb.pnr_code = ${pnrCode} AND fb.user_id = ${userId}
      LIMIT 1
    `;
    if (rows.length === 0) throw new Error('Booking not found');
    bookingId = rows[0].id;
    chargeId = rows[0].stripe_charge_id;
    if (!chargeId) throw new Error('No charge ID found for this booking');
    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: 'requested_by_customer',
      metadata: { type: 'flightBooking', flightBookingId: bookingId, pnrCode, userId },
    });
    await sql`
      UPDATE flight_bookings
      SET
        payment_status = 'refunded',
        ticket_status = 'cancelled',
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
    const booking = await getOneDoc(
      'FlightBooking',
      { pnrCode, userId: strToObjectId(userId) },
      ['userFlightBooking'],
      0
    );
    if (!booking) throw new Error('Booking not found');
    bookingId = booking._id.toString();
    chargeId = booking.paymentId?.stripe_chargeId;
    if (!chargeId) throw new Error('No charge ID found for this booking');
    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: 'requested_by_customer',
      metadata: { type: 'flightBooking', flightBookingId: bookingId, pnrCode, userId },
    });
    await updateOneDoc('FlightBooking', { _id: booking._id }, {
      paymentStatus: 'refunded',
      ticketStatus: 'cancelled',
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
  revalidateTag('userFlightBooking', {});
}

// ---------- Get random airports for popular destinations ----------
export const getRandomAirports = unstable_cache(
  async (sampleFlightCount = 10) => {
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT iata_code, name, city, country, image
      FROM airports
      ORDER BY RANDOM()
      LIMIT ${sampleFlightCount}
    `;
    return rows.map((row: any) => ({
      _id: row.iata_code,            // used as React key
      iataCode: row.iata_code,
      name: row.name,
      city: row.city,
      country: row.country ?? '',
      image: row.image,
    }));
  } else {
      return await dataModels.Airport.aggregate([{ $sample: { size: sampleFlightCount } }]);
    }
  },
  ['popularFlightDestinations'],
  { revalidate: false, tags: ['popularFlightDestinations'] }
);

export async function getPopularFlightDestinations(flightsCount = 10): Promise<any[]> {
  return getRandomAirports(flightsCount);
}