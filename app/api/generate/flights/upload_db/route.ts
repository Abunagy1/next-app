
// import { NextRequest, NextResponse } from 'next/server';
// import { dbType, sql, connectDB } from '@/app/lib/db/index';
// import dataModels from '@/app/lib/db/models';
// import { getManyDocs } from '@/app/lib/db/getOperationDB';
// import { createManyDocs } from '@/app/lib/db/createOperationDB';
// import generateOneDayFlight from '@/app/lib/db/generateForDB/flights/generateOneDayFlight';
// import primaryAirportData from '@/app/lib/db/generateForDB/primaryData/airportsData.json';
// import primaryAirplaneData from '@/app/lib/db/generateForDB/primaryData/airplaneData.json';
// import primaryAirlineData from '@/app/lib/db/generateForDB/primaryData/airlinesData.json';
// import {
//   generateAirlineFlightPricesDB,
//   generateAirlinesDB,
//   generateAirplanesDB,
//   generateAirportsDB,
// } from '@/app/lib/db/generateForDB/flights/generateFlights';
// export async function POST(req: NextRequest) {
//   const authHeader = req.headers.get('Authorization');
//   if (authHeader !== `Bearer ${process.env.API_SECRET_TOKEN}`) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }
//   try {
//     // Generate all static data (airports, airlines, airplanes, prices)
//     const airports = await generateAirportsDB(primaryAirportData);
//     const { airplaneData: airplanes, seatData: seats } = await generateAirplanesDB(primaryAirplaneData);
//     const airlines = await generateAirlinesDB(primaryAirlineData);
//     const airlineFlightPrices: any[] = await generateAirlineFlightPricesDB(primaryAirlineData);
//     // Generate 10 days of flights (starting from tomorrow)
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() + 1);
//     const allFlights: any[] = [];
//     for (let i = 0; i < 10; i++) {
//       const currentDate = new Date(startDate);
//       currentDate.setDate(startDate.getDate() + i);
//       const oneDayFlights = generateOneDayFlight(
//         airlines,
//         airlineFlightPrices,
//         airports,
//         airplanes,
//         currentDate
//       );
//       allFlights.push(oneDayFlights);
//     }
//     // Flatten the arrays
//     const flightItineraries = allFlights.flatMap(f => f.flightItinerary);
//     const flightSegments = allFlights.flatMap(f => f.flightSegments);
//     const flightSeats = allFlights.flatMap(f => f.flightSeats);
//     if (dbType === 'postgres') {
//       // PostgreSQL: clear existing data (order matters due to foreign keys)
//       await sql`TRUNCATE TABLE flight_seats CASCADE`;
//       await sql`TRUNCATE TABLE flight_segments CASCADE`;
//       await sql`TRUNCATE TABLE flight_itineraries CASCADE`;
//       await sql`TRUNCATE TABLE airports CASCADE`;
//       await sql`TRUNCATE TABLE airlines CASCADE`;
//       await sql`TRUNCATE TABLE airplanes CASCADE`;
//       await sql`TRUNCATE TABLE airline_flight_prices CASCADE`;

//       // Insert static data
//       for (const airport of airports) {
//         await sql`
//           INSERT INTO airports (iata_code, name, city, country, latitude, longitude, timezone)
//           VALUES (${airport.iataCode}, ${airport.name}, ${airport.city}, ${airport.country}, ${airport.latitude}, ${airport.longitude}, ${airport.timezone})
//         `;
//       }
//       for (const airline of airlines) {
//         await sql`
//           INSERT INTO airlines (iata_code, name, logo, contact, airline_policy)
//           VALUES (${airline.iataCode}, ${airline.name}, ${airline.logo}, ${JSON.stringify(airline.contact)}, ${JSON.stringify(airline.airlinePolicy)})
//         `;
//       }
//       for (const airplane of airplanes) {
//         await sql`
//           INSERT INTO airplanes (id, airline_id, model, cruise_speed, classes, total_seats, seats, images)
//           VALUES (${airplane._id}, ${airplane.airlineId}, ${airplane.model}, ${JSON.stringify(airplane.cruiseSpeed)}, ${airplane.classes}, ${airplane.totalSeats}, ${JSON.stringify(airplane.seats)}, ${airplane.images})
//         `;
//       }
//       for (const price of airlineFlightPrices) {
//         await sql`
//           INSERT INTO airline_flight_prices (airline_code, departure_airport_code, arrival_airport_code, distance, base_price, discount, service_fee, taxes)
//           VALUES (${price.airlineCode}, ${price.departureAirportCode}, ${price.arrivalAirportCode}, ${JSON.stringify(price.distance)}, ${JSON.stringify(price.basePrice)}, ${JSON.stringify(price.discount)}, ${JSON.stringify(price.serviceFee)}, ${JSON.stringify(price.taxes)})
//         `;
//       }
//       // Insert flight data
//       for (const itinerary of flightItineraries) {
//         await sql`
//           INSERT INTO flight_itineraries (flight_code, date, carrier_in_charge, departure_airport_id, arrival_airport_id, segment_ids, total_duration_minutes, layovers, baggage_allowance, status, expire_at)
//           VALUES (${itinerary.flightCode}, ${itinerary.date}, ${itinerary.carrierInCharge}, ${itinerary.departureAirportId}, ${itinerary.arrivalAirportId}, ${JSON.stringify(itinerary.segmentIds)}, ${itinerary.totalDurationMinutes}, ${JSON.stringify(itinerary.layovers)}, ${JSON.stringify(itinerary.baggageAllowance)}, ${itinerary.status}, ${itinerary.expireAt})
//         `;
//       }
//       for (const segment of flightSegments) {
//         await sql`
//           INSERT INTO flight_segments (id, flight_number, date, airline_id, airplane_id, from_airport, scheduled_departure, from_terminal, from_gate, to_airport, scheduled_arrival, to_terminal, to_gate, duration_minutes, seats, fare_details, baggage_allowance, status, expire_at)
//           VALUES (${segment._id}, ${segment.flightNumber}, ${segment.date}, ${segment.airlineId}, ${segment.airplaneId}, ${segment.from.airport}, ${segment.from.scheduledDeparture}, ${segment.from.terminal}, ${segment.from.gate}, ${segment.to.airport}, ${segment.to.scheduledArrival}, ${segment.to.terminal}, ${segment.to.gate}, ${segment.durationMinutes}, ${JSON.stringify(segment.seats)}, ${JSON.stringify(segment.fareDetails)}, ${JSON.stringify(segment.baggageAllowance)}, ${segment.status}, ${segment.expireAt})
//         `;
//       }
//       for (const seat of flightSeats) {
//         await sql`
//           INSERT INTO flight_seats (id, seat_number, airplane_id, segment_id, class, reservation, expire_at)
//           VALUES (${seat._id}, ${seat.seatNumber}, ${seat.airplaneId}, ${seat.segmentId}, ${seat.class}, ${JSON.stringify(seat.reservation)}, ${seat.expireAt})
//         `;
//       }
//     } else {
//       // MongoDB: clear existing collections
//       await connectDB();
//       await dataModels.Airport.deleteMany({});
//       await dataModels.Airline.deleteMany({});
//       await dataModels.Airplane.deleteMany({});
//       await dataModels.AirlineFlightPrice.deleteMany({});
//       await dataModels.FlightItinerary.deleteMany({});
//       await dataModels.FlightSegment.deleteMany({});
//       await dataModels.FlightSeat.deleteMany({});
//       // Insert static data
//       await createManyDocs('Airport', airports);
//       await createManyDocs('Airline', airlines);
//       await createManyDocs('Airplane', airplanes);
//       await createManyDocs('AirlineFlightPrice', airlineFlightPrices);
//       // Insert flight data
//       await createManyDocs('FlightItinerary', flightItineraries);
//       await createManyDocs('FlightSegment', flightSegments);
//       await createManyDocs('FlightSeat', flightSeats);
//     }
//     return NextResponse.json({ success: true, message: 'Flights DB uploaded successfully' });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ success: false, message: 'Error uploading flights DB' }, { status: 500 });
//   }
// }


import { NextRequest, NextResponse } from 'next/server';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { createManyDocs } from '@/app/lib/db/createOperationDB';
import { randomUUID } from 'crypto';
import primaryAirportData from '@/app/lib/db/generateForDB/primaryData/airportsData.json';
import primaryAirplaneData from '@/app/lib/db/generateForDB/primaryData/airplaneData.json';
import primaryAirlineData from '@/app/lib/db/generateForDB/primaryData/airlinesData.json';
import {
  generateAirlineFlightPricesDB,
  generateAirlinesDB,
  generateAirplanesDB,
  generateAirportsDB,
  generateFlightsDB,
} from '@/app/lib/db/generateForDB/flights/generateFlights';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.API_SECRET_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Generate static data
    const airports = await generateAirportsDB(primaryAirportData);
    const { airplaneData: airplanes, seatData: seats } = await generateAirplanesDB(primaryAirplaneData);
    const airlines = await generateAirlinesDB(primaryAirlineData);
    const airlineFlightPrices: any[] = await generateAirlineFlightPricesDB(primaryAirlineData);

    // Generate 10 days of flights - returns an array of day objects with flightItinerary, flightSegments, flightSeats
    const allFlights: any[] = await generateFlightsDB(10, airports, airplanes, airlines, airlineFlightPrices);
    const flightItineraries: any[] = allFlights.flatMap(f => f.flightItinerary || []);
    const flightSegments: any[] = allFlights.flatMap(f => f.flightSegments || []);
    const flightSeats: any[] = allFlights.flatMap(f => f.flightSeats || []);

    if (dbType === 'postgres') {
      // PostgreSQL: clear tables in correct order (child first)
      await sql`TRUNCATE TABLE flight_seats CASCADE`;
      await sql`TRUNCATE TABLE flight_segments CASCADE`;
      await sql`TRUNCATE TABLE flight_itineraries CASCADE`;
      await sql`TRUNCATE TABLE airline_flight_prices CASCADE`;
      await sql`TRUNCATE TABLE airplanes CASCADE`;
      await sql`TRUNCATE TABLE airlines CASCADE`;
      await sql`TRUNCATE TABLE airports CASCADE`;

      // Insert airports
      for (const airport of airports) {
        await sql`
          INSERT INTO airports (iata_code, name, city, state, country, latitude, longitude, timezone, facilities, image)
          VALUES (${airport.iataCode}, ${airport.name}, ${airport.city}, ${airport.state || null}, ${airport.country}, ${airport.latitude}, ${airport.longitude}, ${airport.timezone}, ${airport.facilities || []}, ${airport.image || null})
        `;
      }

      // Insert airlines
      for (const airline of airlines) {
        await sql`
          INSERT INTO airlines (iata_code, name, logo, contact, airline_policy)
          VALUES (${airline.iataCode}, ${airline.name}, ${airline.logo || null}, ${JSON.stringify(airline.contact || {})}::jsonb, ${JSON.stringify(airline.airlinePolicy || {})}::jsonb)
        `;
      }

      // Insert airplanes (generate real UUIDs for id)
      for (const airplane of airplanes) {
        const realId = randomUUID();
        await sql`
          INSERT INTO airplanes (id, airline_id, model, cruise_speed, classes, total_seats, seats, images)
          VALUES (${realId}, ${airplane.airlineId}, ${airplane.model}, ${JSON.stringify(airplane.cruiseSpeed)}::jsonb, ${airplane.classes}, ${airplane.totalSeats}, ${JSON.stringify(airplane.seats)}::jsonb, ${airplane.images || []})
        `;
      }

      // Insert airline flight prices
      for (const price of airlineFlightPrices) {
        await sql`
          INSERT INTO airline_flight_prices (airline_code, departure_airport_code, arrival_airport_code, distance, base_price, discount, service_fee, taxes)
          VALUES (${price.airlineCode}, ${price.departureAirportCode}, ${price.arrivalAirportCode}, ${JSON.stringify(price.distance)}::jsonb, ${JSON.stringify(price.basePrice)}::jsonb, ${JSON.stringify(price.discount)}::jsonb, ${JSON.stringify(price.serviceFee)}::jsonb, ${JSON.stringify(price.taxes)}::jsonb)
        `;
      }

      // Insert flight itineraries (with real UUIDs)
      const itineraryIdMap = new Map<string, string>();
      for (const itinerary of flightItineraries) {
        const realId = randomUUID();
        itineraryIdMap.set(itinerary._id, realId);
        await sql`
          INSERT INTO flight_itineraries (id, flight_code, date, carrier_in_charge, departure_airport_id, arrival_airport_id, segment_ids, total_duration_minutes, layovers, baggage_allowance, status, expire_at)
          VALUES (${realId}, ${itinerary.flightCode}, ${itinerary.date}, ${itinerary.carrierInCharge}, ${itinerary.departureAirportId}, ${itinerary.arrivalAirportId}, ${[]}::uuid[], ${itinerary.totalDurationMinutes}, ${JSON.stringify(itinerary.layovers)}::jsonb, ${JSON.stringify(itinerary.baggageAllowance)}::jsonb, ${itinerary.status}, ${itinerary.expireAt})
        `;
      }

      // Insert flight segments (map old IDs to new UUIDs)
      const segmentIdMap = new Map<string, string>();
      for (const segment of flightSegments) {
        const realId = randomUUID();
        segmentIdMap.set(segment._id, realId);
        await sql`
          INSERT INTO flight_segments (id, flight_number, date, airline_id, airplane_id, from_airport, scheduled_departure, from_terminal, from_gate, to_airport, scheduled_arrival, to_terminal, to_gate, duration_minutes, fare_details, baggage_allowance, seats, status, expire_at)
          VALUES (${realId}, ${segment.flightNumber}, ${segment.date}, ${segment.airlineId}, ${segment.airplaneId}, ${segment.from.airport}, ${segment.from.scheduledDeparture}, ${segment.from.terminal || null}, ${segment.from.gate || null}, ${segment.to.airport}, ${segment.to.scheduledArrival}, ${segment.to.terminal || null}, ${segment.to.gate || null}, ${segment.durationMinutes}, ${JSON.stringify(segment.fareDetails)}::jsonb, ${JSON.stringify(segment.baggageAllowance)}::jsonb, ${[]}::uuid[], ${segment.status}, ${segment.expireAt})
        `;
      }

      // Insert flight seats
      for (const seat of flightSeats) {
        const realSegmentId = segmentIdMap.get(seat.segmentId);
        if (!realSegmentId) throw new Error(`Segment mapping missing for seat ${seat._id}`);
        await sql`
          INSERT INTO flight_seats (id, seat_number, airplane_id, segment_id, class, reservation, expire_at)
          VALUES (${randomUUID()}, ${seat.seatNumber}, ${seat.airplaneId}, ${realSegmentId}, ${seat.class}, ${JSON.stringify(seat.reservation)}::jsonb, ${seat.expireAt})
        `;
      }

      // Update itineraries with correct segment_ids (array of real UUIDs)
      for (const itinerary of flightItineraries) {
        const realSegmentIds = itinerary.segmentIds.map((sid: string) => segmentIdMap.get(sid)).filter(Boolean);
        if (realSegmentIds.length === 0) continue;
        const realItineraryId = itineraryIdMap.get(itinerary._id);
        if (realItineraryId) {
          await sql`
            UPDATE flight_itineraries
            SET segment_ids = ${realSegmentIds}::uuid[]
            WHERE id = ${realItineraryId}
          `;
        }
      }
    } else {
      // MongoDB
      await connectDB();
      // Clear existing collections
      await dataModels.Airport.deleteMany({});
      await dataModels.Airline.deleteMany({});
      await dataModels.Airplane.deleteMany({});
      await dataModels.AirlineFlightPrice.deleteMany({});
      await dataModels.FlightItinerary.deleteMany({});
      await dataModels.FlightSegment.deleteMany({});
      await dataModels.FlightSeat.deleteMany({});

      // Insert static data
      await createManyDocs('Airport', airports);
      await createManyDocs('Airline', airlines);
      await createManyDocs('Airplane', airplanes);
      await createManyDocs('AirlineFlightPrice', airlineFlightPrices);

      // Insert flight data
      await createManyDocs('FlightItinerary', flightItineraries);
      await createManyDocs('FlightSegment', flightSegments);
      await createManyDocs('FlightSeat', flightSeats);
    }

    return NextResponse.json({ success: true, message: 'Flights DB uploaded successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error uploading flights DB' }, { status: 500 });
  }
}