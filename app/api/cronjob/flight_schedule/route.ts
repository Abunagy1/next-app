import { NextRequest, NextResponse } from 'next/server';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { getManyDocs } from '@/app/lib/db/getOperationDB';
import { createManyDocs } from '@/app/lib/db/createOperationDB';
import generateOneDayFlight from '@/app/lib/db/generateForDB/flights/generateOneDayFlight';
import { randomUUID } from 'crypto';
export const dynamic = 'force-dynamic';
type Airline = any;
type AirlineFlightPrice = any;
type Airport = any;
type Airplane = any;

export async function GET(req: NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const start = performance.now();

  try {
    if (dbType === 'postgres') {
      // --- PostgreSQL: Full insertion with transaction ---
      const [airports, airlines, airplanes, airlineFlightPrices] = await Promise.all([
        sql<Airport[]>`SELECT * FROM airports`,
        sql<Airline[]>`SELECT * FROM airlines`,
        sql<Airplane[]>`SELECT * FROM airplanes`,
        sql<AirlineFlightPrice[]>`SELECT * FROM airline_flight_prices`
      ]);

      const lastFlight = await sql<{ date: Date }[]>`
        SELECT date FROM flight_itineraries ORDER BY date DESC LIMIT 1
      `;
      const lastFlightDate = lastFlight.length ? new Date(lastFlight[0].date) : new Date();

      const flights = generateOneDayFlight(
        airlines,
        airlineFlightPrices,
        airports,
        airplanes,
        lastFlightDate
      );

      await sql.begin(async (trx: any) => {
        // 1. Insert segments first, mapping generated IDs → real UUIDs
        const segmentIdMap = new Map<string, string>(); // generated ID (string) → real UUID

        for (const segment of flights.flightSegments) {
          const genId = String(segment._id); // ensure string
          const realId = randomUUID();
          segmentIdMap.set(genId, realId);

          await trx`
            INSERT INTO flight_segments (
              id, flight_number, date, airline_id, airplane_id,
              from_airport, scheduled_departure, from_terminal, from_gate,
              to_airport, scheduled_arrival, to_terminal, to_gate,
              duration_minutes, fare_details, baggage_allowance, seats,
              status, expire_at
            ) VALUES (
              ${realId}, ${segment.flightNumber}, ${segment.date}, ${segment.airlineId},
              ${segment.airplaneId}, ${segment.from.airport}, ${segment.from.scheduledDeparture},
              ${segment.from.terminal}, ${segment.from.gate}, ${segment.to.airport},
              ${segment.to.scheduledArrival}, ${segment.to.terminal}, ${segment.to.gate},
              ${segment.durationMinutes},
              ${JSON.stringify(segment.fareDetails)}::jsonb,
              ${JSON.stringify(segment.baggageAllowance)}::jsonb,
              ${[]}::uuid[], ${segment.status}, ${segment.expireAt}
            )
          `;
        }

        // 2. Insert itineraries, mapping their segment IDs to real UUIDs
        const itineraryIdMap = new Map<string, string>(); // generated ID → real UUID

        for (const itinerary of flights.flightItinerary) {
          const genId = String(itinerary._id);
          const realId = randomUUID();
          itineraryIdMap.set(genId, realId);

          // Map the itinerary's segmentIds (generated IDs) to real UUIDs
          const realSegmentIds = itinerary.segmentIds.map((segId: any) => {
            const mapped = segmentIdMap.get(String(segId));
            if (!mapped) throw new Error(`Missing segment mapping for ${segId}`);
            return mapped;
          });

          await trx`
            INSERT INTO flight_itineraries (
              id, flight_code, date, carrier_in_charge,
              departure_airport_id, arrival_airport_id, segment_ids,
              total_duration_minutes, layovers, baggage_allowance,
              status, expire_at
            ) VALUES (
              ${realId}, ${itinerary.flightCode}, ${itinerary.date}, ${itinerary.carrierInCharge},
              ${itinerary.departureAirportId}, ${itinerary.arrivalAirportId},
              ${realSegmentIds}::uuid[], ${itinerary.totalDurationMinutes},
              ${JSON.stringify(itinerary.layovers)}::jsonb,
              ${JSON.stringify(itinerary.baggageAllowance)}::jsonb,
              ${itinerary.status}, ${itinerary.expireAt}
            )
          `;
        }

        // 3. Insert seats, linking to the real segment UUIDs
        for (const seat of flights.flightSeats) {
          const realSegmentId = segmentIdMap.get(String(seat.segmentId));
          if (!realSegmentId) throw new Error(`Missing segment mapping for seat ${seat._id}`);

          await trx`
            INSERT INTO flight_seats (
              id, seat_number, airplane_id, segment_id, class, reservation, expire_at
            ) VALUES (
              ${randomUUID()}, ${seat.seatNumber}, ${seat.airplaneId}, ${realSegmentId},
              ${seat.class}, ${JSON.stringify(seat.reservation)}::jsonb, ${seat.expireAt}
            )
          `;
        }

        // 4. Update segments with the real seat UUIDs (optional, but maintains the seats array)
        for (const segment of flights.flightSegments) {
          const realSegmentId = segmentIdMap.get(String(segment._id));
          if (!realSegmentId) continue;

          const seatRealIds = segment.seats.map((seatId: any) => {
            const seat = flights.flightSeats.find((s: any) => String(s._id) === String(seatId));
            if (!seat) return null;
            // For simplicity, we are not storing seat UUIDs in the segment's seats array,
            // because we already have a foreign key from seat to segment.
            // This step is optional; you can skip it.
            return null;
          }).filter(Boolean);

          if (seatRealIds.length === 0) continue;

          await trx`
            UPDATE flight_segments
            SET seats = ${seatRealIds}::uuid[]
            WHERE id = ${realSegmentId}
          `;
        }
      });
    } else {
      // --- MongoDB version (unchanged) ---
      await connectDB();

      const [airports, airlines, airplanes, airlineFlightPrices] = await Promise.all([
        getManyDocs('Airport', {}, [], false) as Promise<Airport[]>,
        getManyDocs('Airline', {}, [], false) as Promise<Airline[]>,
        getManyDocs('Airplane', {}, [], false) as Promise<Airplane[]>,
        getManyDocs('AirlineFlightPrice', {}, [], false) as Promise<AirlineFlightPrice[]>
      ]);

      const lastFlight = await dataModels.FlightItinerary.findOne({})
        .sort({ date: -1 })
        .lean();
      const lastFlightDate = new Date(lastFlight?.date || new Date());

      const flights = generateOneDayFlight(
        airlines,
        airlineFlightPrices,
        airports,
        airplanes,
        lastFlightDate
      );

      const data = {
        FlightItinerary: flights.flightItinerary,
        FlightSegment: flights.flightSegments,
        FlightSeat: flights.flightSeats,
      };

      await Promise.all(
        Object.entries(data).map(([key, value]) =>
          createManyDocs(key as any, value, { ordered: false })
        )
      );
    }

    const duration = performance.now() - start;
    console.log(`[flight_schedule] Generated flights in ${duration.toFixed(2)} ms`);
    return NextResponse.json({ success: true, message: 'Flights generated' });
  } catch (error: any) {
    console.error('[flight_schedule] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
// import { NextRequest, NextResponse } from "next/server";
// import { dbType, connectDB, sql } from "@/app/lib/db/index";
// import dataModels from "@/app/lib/db/models";
// import generateOneDayFlight from "@/app/lib/db/generateForDB/flights/generateOneDayFlight";
// import { getManyDocs } from "@/app/lib/db/getOperationDB";
// import { createManyDocs } from "@/app/lib/db/createOperationDB";
// interface FlightItineraryRow {
//   id: string;
//   date: Date | string;
// }
// export async function GET(req: NextRequest) {
//   const authHeader = req.headers.get("Authorization");
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return new NextResponse("401", { status: 401 });
//   }
//   const pre = performance.now();
//   try {
//     await connectDB();
//     const [airports, airlines, airplanes, airlineFlightPrices] = await Promise.all([
//       getManyDocs("Airport", {}),
//       getManyDocs("Airline", {}),
//       getManyDocs("Airplane", {}),
//       getManyDocs("AirlineFlightPrice", {}),
//     ]);
//     let lastFlightDate: Date;
//     if (dbType === "mongodb") {
//       const lastFlight = await dataModels.FlightItinerary.findOne({}).sort({ date: -1 }).lean();
//       lastFlightDate = new Date(lastFlight?.date || new Date());
//     } else {
//       const result = await sql<FlightItineraryRow>`
//         SELECT date FROM flight_itineraries ORDER BY date DESC LIMIT 1
//       `;
//       lastFlightDate = new Date(result.rows[0]?.date || new Date());
//     }
//     console.log("generating flight for the day after:", lastFlightDate);
//     const flights = generateOneDayFlight(
//       airlines,
//       airlineFlightPrices,
//       airports,
//       airplanes,
//       lastFlightDate
//     );
//     if (dbType === "mongodb") {
//       await saveFlightsMongo(flights);
//     } else {
//       await saveFlightsPostgres(flights);
//     }
//     const post = performance.now();
//     console.log(`Execution time: ${post - pre} ms`);
//     return NextResponse.json({ success: true, message: "Success" });
//   } catch (error: any) {
//     console.error(error);
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }
// async function saveFlightsMongo(flights: any) {
//   await Promise.all([
//     createManyDocs("FlightItinerary", flights.flightItinerary, { ordered: false }),
//     createManyDocs("FlightSegment", flights.flightSegments, { ordered: false }),
//     createManyDocs("FlightSeat", flights.flightSeats, { ordered: false }),
//   ]);
// }
// async function saveFlightsPostgres(flights: any) {
//   // Insert FlightItineraries
//   for (const itinerary of flights.flightItinerary) {
//     await sql`
//       INSERT INTO flight_itineraries (
//         id, flight_code, date, carrier_in_charge, departure_airport_id,
//         arrival_airport_id, segment_ids, total_duration_minutes, layovers,
//         baggage_allowance, status, expire_at, created_at, updated_at
//       ) VALUES (
//         ${itinerary._id || generateUUID()}, ${itinerary.flightCode}, ${itinerary.date},
//         ${itinerary.carrierInCharge}, ${itinerary.departureAirportId}, ${itinerary.arrivalAirportId},
//         ${JSON.stringify(itinerary.segmentIds)}, ${itinerary.totalDurationMinutes},
//         ${JSON.stringify(itinerary.layovers || [])}, ${JSON.stringify(itinerary.baggageAllowance)},
//         ${itinerary.status}, ${itinerary.expireAt}, NOW(), NOW()
//       )
//     `;
//   }
//   // Insert FlightSegments
//   for (const segment of flights.flightSegments) {
//     await sql`
//       INSERT INTO flight_segments (
//         id, flight_number, date, airline_id, airplane_id,
//         from_airport, from_scheduled_departure, from_terminal, from_gate,
//         to_airport, to_scheduled_arrival, to_terminal, to_gate,
//         duration_minutes, seats, fare_details, baggage_allowance, status, expire_at,
//         created_at, updated_at
//       ) VALUES (
//         ${segment._id || generateUUID()}, ${segment.flightNumber}, ${segment.date},
//         ${segment.airlineId}, ${segment.airplaneId},
//         ${segment.from.airport}, ${segment.from.scheduledDeparture},
//         ${segment.from.terminal}, ${segment.from.gate},
//         ${segment.to.airport}, ${segment.to.scheduledArrival},
//         ${segment.to.terminal}, ${segment.to.gate},
//         ${segment.durationMinutes}, ${JSON.stringify(segment.seats)},
//         ${JSON.stringify(segment.fareDetails)}, ${JSON.stringify(segment.baggageAllowance)},
//         ${segment.status}, ${segment.expireAt}, NOW(), NOW()
//       )
//     `;
//   }
//   // Insert FlightSeats
//   for (const seat of flights.flightSeats) {
//     await sql`
//       INSERT INTO flight_seats (
//         id, seat_number, airplane_id, class, reservation, expire_at, segment_id,
//         created_at, updated_at
//       ) VALUES (
//         ${seat._id || generateUUID()}, ${seat.seatNumber}, ${seat.airplaneId},
//         ${seat.class}, ${JSON.stringify(seat.reservation || {})}, ${seat.expireAt},
//         ${seat.segmentId}, NOW(), NOW()
//       )
//     `;
//   }
//   console.log("PostgreSQL flight data inserted");
// }
// function generateUUID(): string {
//   return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
//     const r = (Math.random() * 16) | 0;
//     const v = c === "x" ? r : (r & 0x3) | 0x8;
//     return v.toString(16);
//   });
// }