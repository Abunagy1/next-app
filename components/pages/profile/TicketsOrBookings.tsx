// components/pages/profile/TicketsOrBookings.tsx

import React from 'react';
import { TabsContent, TabsList, TabsTrigger, Tabs } from "@/components/ui/tabs";
import Image from "next/image";
import { getAllFlightBookings } from "@/app/lib/services/flights";
import Link from "next/link";
import FlightBookingDetailsCardSmall from "./ui/FlightBookingDetailsCardSmall";
import { getOneDoc } from "@/app/lib/db/getOperationDB";
import { strToObjectId } from "@/app/lib/db/utilsDB";
import { getAllHotelBookings } from "@/app/lib/services/hotels";
import HotelBookingDetailsCardSmall from "./ui/HotelBookingDetailsCardSmall";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { dbType, connectDB, sql } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';

export const dynamic = "force-dynamic";

function toPlainObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Uint8Array || Buffer.isBuffer(obj)) return '';
  if (Array.isArray(obj)) return obj.map(toPlainObject);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    if (typeof obj.toString === 'function' && obj._bsontype === 'ObjectId') {
      return obj.toString();
    }
    const plain: any = {};
    for (const key of Object.keys(obj)) {
      plain[key] = toPlainObject(obj[key]);
    }
    return plain;
  }
  return obj;
}

export async function TicketsOrBookings() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return <NoBookingFound message="Please log in to view your bookings." />;
  }

  if (dbType === 'mongodb') {
    try {
      await connectDB();
    } catch (err) {
      console.error('Database connection failed:', err);
      return <NoBookingFound message="Unable to load bookings. Please try again later." />;
    }
  }

  let flightBookings: any[] = [];
  let hotelBookings: any[] = [];
  try {
    flightBookings = await getAllFlightBookings(userId);
  } catch (e) {
    console.error('Failed to fetch flight bookings:', e);
  }
  try {
    hotelBookings = await getAllHotelBookings(userId);
  } catch (e) {
    console.error('Failed to fetch hotel bookings:', e);
  }

  // ---- Flight booking cards (dual‑db) ----
  const flightBookingCards = await Promise.all(
    flightBookings.map(async (rawBooking: any) => {
      try {
        const booking = {
          _id: rawBooking._id || rawBooking.id,
          id: rawBooking.id,
          ticketStatus: rawBooking.ticket_status ?? rawBooking.ticketStatus,
          paymentStatus: rawBooking.payment_status ?? rawBooking.paymentStatus,
          createdAt: rawBooking.created_at ?? rawBooking.createdAt,
          flightItineraryId: rawBooking.flight_itinerary_id ?? rawBooking.flightItineraryId,
          pnrCode: rawBooking.pnr_code ?? rawBooking.pnrCode,
          passengers: rawBooking.passengers,
          selectedSeats: rawBooking.selected_seats ?? rawBooking.selectedSeats,
        };

        if (!booking.flightItineraryId) return null;

        let flightData: any;
        if (dbType === 'postgres') {
          const rows = await sql`
            SELECT * FROM flight_itineraries WHERE id = ${booking.flightItineraryId}
          `;
          if (rows.length === 0) return null;
          flightData = rows[0];

          const segmentRows = await sql`
            SELECT
              fs.id, fs.flight_number, fs.duration_minutes,
              fs.scheduled_departure, fs.scheduled_arrival,
              fs.from_airport, fs.to_airport, fs.from_gate, fs.to_gate,
              fs.from_terminal, fs.to_terminal,
              a.model AS airplane_model,
              al.name AS airline_name, al.iata_code AS airline_iata_code,
              dep.name AS departure_airport_name,
              arr.name AS arrival_airport_name
            FROM flight_segments fs
            LEFT JOIN airplanes a ON fs.airplane_id = a.id
            LEFT JOIN airlines al ON fs.airline_id = al.iata_code
            LEFT JOIN airports dep ON fs.from_airport = dep.iata_code
            LEFT JOIN airports arr ON fs.to_airport = arr.iata_code
            WHERE fs.id = ANY(${flightData.segment_ids}::uuid[])
          `;
          flightData.segmentDetails = segmentRows.map((s: any) => ({
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

          const airlineRows = await sql`
            SELECT * FROM airlines WHERE iata_code = ${flightData.carrier_in_charge}
          `;
          if (airlineRows.length) flightData.carrierInCharge = airlineRows[0];
        } else {
          flightData = await getOneDoc(
            "FlightItinerary",
            { _id: strToObjectId(booking.flightItineraryId) },
            ["flight"]
          );
          if (!flightData || Object.keys(flightData).length === 0) return null;

          flightData.segmentDetails = flightData.segmentIds.map((seg: any) => ({
            id: seg._id,
            flightNumber: seg.flightNumber,
            durationMinutes: seg.durationMinutes,
            scheduledDeparture: seg.from?.scheduledDeparture ?? seg.scheduled_departure,
            scheduledArrival: seg.to?.scheduledArrival ?? seg.scheduled_arrival,
            fromAirport: seg.from?.airport?.iataCode ?? seg.from_airport,
            toAirport: seg.to?.airport?.iataCode ?? seg.to_airport,
            fromGate: seg.from?.gate ?? seg.from_gate,
            toGate: seg.to?.gate ?? seg.to_gate,
            fromTerminal: seg.from?.terminal ?? seg.from_terminal,
            toTerminal: seg.to?.terminal ?? seg.to_terminal,
            airplaneModel: seg.airplaneId?.model,
            airlineName: seg.airlineId?.name,
            airlineIataCode: seg.airlineId?.iata_code,
            departureAirportName: seg.from?.airport?.name,
            arrivalAirportName: seg.to?.airport?.name,
          }));
        }

        let passengersArr = booking.passengers;
        if (typeof passengersArr === 'string') {
          try { passengersArr = JSON.parse(passengersArr); } catch { passengersArr = []; }
        }
        if (!Array.isArray(passengersArr)) passengersArr = [];

        let selectedSeatsArr = booking.selectedSeats;
        if (typeof selectedSeatsArr === 'string') {
          try { selectedSeatsArr = JSON.parse(selectedSeatsArr); } catch { selectedSeatsArr = []; }
        }
        if (!Array.isArray(selectedSeatsArr)) selectedSeatsArr = [];

        const segments = (flightData.segmentDetails || []).map((s: any) => ({
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
        }));

        const bookingDetails = {
          key: (booking._id || booking.id)?.toString() || '',
          bookingStatus: booking.ticketStatus,
          paymentStatus: booking.paymentStatus,
          cancellationPolicy: flightData.carrierInCharge?.airlinePolicy?.cancellationPolicy || {},
          bookedAt: booking.createdAt,
          itineraryFlightNumber: flightData.flight_code ?? flightData.flightCode,
          pnrCode: booking.pnrCode,
          passengers: passengersArr.map((p: any, idx: number) => {
            const seat = selectedSeatsArr.find(
              (s: any) => s.passenger_id === p.id || s.passengerId === p._id
            );
            return {
              key: p.id || p._id || `p-${idx}`,
              fullName: `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim() || 'Passenger',
              passengerType: p.passenger_type || p.passengerType || 'Adult',
              seatNumber: seat?.seat_id?.seatNumber || seat?.seatId?.seatNumber || '—',
              seatClass: seat?.seat_id?.class || seat?.seatId?.class || 'Economy',
            };
          }),
          segments,
        };

        return (
          <FlightBookingDetailsCardSmall
            key={bookingDetails.key}
            bookingDetails={toPlainObject(bookingDetails)}
            className="mx-auto"
          />
        );
      } catch (error) {
        console.error('Failed to build flight booking card:', error);
        return null;
      }
    })
  );

  // ---- Hotel booking cards (dual‑db) ----
  let hotelBookingCards: any[] = [];
  if (hotelBookings.length > 0) {
    // Collect hotelIds as strings
    const hotelIds = hotelBookings.map((b: any) => {
      const id = b.hotel_id ?? b.hotelId;
      return id?.toString() ?? '';
    }).filter(Boolean);

    const hotelsMap: Record<string, any> = {};

    if (dbType === 'postgres') {
      if (hotelIds.length > 0) {
        const rows = await sql`SELECT * FROM hotels WHERE id = ANY(${hotelIds}::uuid[])`;
        rows.forEach((row: any) => { hotelsMap[row.id] = row; });
      }
    } else {
      if (hotelIds.length > 0) {
        const docs = await dataModels.Hotel.find({
          _id: { $in: hotelIds.map((id: string) => strToObjectId(id)) }
        }).lean();
        docs.forEach((doc: any) => { hotelsMap[doc._id.toString()] = doc; });
      }
    }

    hotelBookingCards = hotelBookings
      .map((rawBooking: any) => {
        const hotelId = (rawBooking.hotel_id ?? rawBooking.hotelId)?.toString() ?? '';
        if (!hotelId || !hotelsMap[hotelId]) return null;
        const hotel = hotelsMap[hotelId];

        const normalizedBooking = {
          ...rawBooking,
          totalPrice: Number(rawBooking.total_price) || Number(rawBooking.totalPrice) || 0,
          checkInDate: rawBooking.check_in_date ?? rawBooking.checkInDate,
          checkOutDate: rawBooking.check_out_date ?? rawBooking.checkOutDate,
          bookingStatus: rawBooking.booking_status ?? rawBooking.bookingStatus,
          paymentStatus: rawBooking.payment_status ?? rawBooking.paymentStatus,
          rooms: rawBooking.rooms,
          guests: rawBooking.guests,
          _id: (rawBooking.id || rawBooking._id)?.toString(),
        };

        const plainHotel = toPlainObject(hotel);
        const plainBooking = toPlainObject(normalizedBooking);

        return (
          <HotelBookingDetailsCardSmall
            key={plainBooking._id}
            hotelDetails={plainHotel}
            bookingDetails={plainBooking}
            className="mx-auto"
          />
        );
      })
      .filter(Boolean);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="mb-[16px] text-[2rem] font-bold">Tickets/Bookings</h1>
        <select className="h-min bg-transparent p-0 text-[0.875rem] font-semibold">
          <option value="all">All</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
      </div>
      <div className="mb-[16px] flex items-center gap-[24px] rounded-[12px]">
        <Tabs defaultValue="flights" className="w-full">
          <TabsList className="mb-4 flex flex-row justify-start gap-1 bg-white p-0 shadow-md dark:bg-gray-800">
            <TabsTrigger value="flights" className="h-[48px] w-full grow gap-2 py-5 font-bold md:h-[60px] dark:text-white dark:data-[state=active]:bg-gray-700">
              <Image width={24} height={24} src="/travel/icons/airplane-filled.svg" alt="airplane_icon" />
              <span>Flights</span>
            </TabsTrigger>
            <TabsTrigger value="stays" className="h-[48px] w-full grow gap-2 py-5 font-bold md:h-[60px] dark:text-white dark:data-[state=active]:bg-gray-700">
              <Image width={24} height={24} src="/travel/icons/bed-filled.svg" alt="bed_icon" />
              <span>Stays</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent className="flex flex-col gap-3" value="flights">
            {!flightBookings.length && (
              <NoBookingFound message={<>You don&apos;t have any flight booking yet. Go to <Link href="/flights">flights</Link> to book a flight</>} />
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {flightBookingCards.filter(Boolean)}
            </div>
          </TabsContent>
          <TabsContent value="stays">
            {hotelBookings.length === 0 && (
              <NoBookingFound message={<>You don&apos;t have any hotel booking yet. Go to <Link href="/hotels">hotels</Link> to book a room</>} />
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {hotelBookingCards.filter(Boolean).map((card, idx) => (
                <React.Fragment key={card?.key ?? idx}>{card}</React.Fragment>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function NoBookingFound({ message }: { message: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-gray-50 p-6 text-gray-700 shadow-inner dark:bg-gray-800 dark:text-gray-300">
      <div className="text-2xl font-semibold dark:text-white">No Bookings yet</div>
      <div className="max-w-md text-center text-base dark:text-gray-400">{message}</div>
    </div>
  );
}