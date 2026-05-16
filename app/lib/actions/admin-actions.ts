'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { dbType, sql, connectDB, mongoose } from '@/app/lib/db/index';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { deleteOneDoc, deleteManyDocs } from '@/app/lib/db/deleteOperationDB';
import { revalidatePath } from 'next/cache';
import dataModels from '@/app/lib/db/models';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { strToObjectId } from '@/app/lib/db/utilsDB';
// Update user role (admin only)
export async function updateUserRole(prevState: string | undefined, formData: FormData): Promise<string | undefined> {
  import('server-only');
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    //return { success: false, message: 'Forbidden: Admin only' };
    return 'Forbidden: Admin only';
  }
  const userId = formData.get('userId') as string;
  const role = formData.get('role') as string;
  if (!userId || !role) //return { success: false, message: 'Missing data' };
  return 'Missing data';
  try {
    if (dbType === 'postgres') {
      await sql`UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${userId}`;
    } else {
      await connectDB();
      //await updateOneDoc('User', { _id: strToObjectId(userId) }, { role });
      await dataModels.User.updateOne({ _id: userId }, { $set: { role } });
    }
    revalidatePath('/dashboard/admin');
    return undefined;
    //return { success: true, message: 'Role updated' };
  } catch (error) {
    console.error(error);
    //return { success: false, message: 'Failed to update role' };
    return 'Failed to update role';
  }
}
// Delete user (admin only)
export async function deleteUser(prevState: string | undefined, formData: FormData): Promise<string | undefined> {
  import('server-only');
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    //return { success: false, message: 'Forbidden: Admin only' };
    return 'Forbidden: Admin only';
  }
  const userId = formData.get('userId') as string;
  if (!userId) //return { success: false, message: 'Missing user id' };
  return 'Missing user id';
  if (userId === session.user.id) //return 'You cannot delete yourself';
  return 'You cannot delete yourself';
  try {
    if (dbType === 'postgres') {
      // Delete related data (CASCADE should handle, but explicit for safety)
      await sql`DELETE FROM user_flight_bookmarks WHERE user_id = ${userId}`;
      await sql`DELETE FROM user_hotel_bookmarks WHERE user_id = ${userId}`;
      await sql`DELETE FROM flight_reviews WHERE reviewer_id = ${userId}`;
      await sql`DELETE FROM hotel_reviews WHERE reviewer_id = ${userId}`;
      await sql`DELETE FROM flight_bookings WHERE user_id = ${userId}`;
      await sql`DELETE FROM hotel_bookings WHERE user_id = ${userId}`;
      await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
      await sql`DELETE FROM accounts WHERE user_id = ${userId}`;
      // Delete all user‑owned data from base tables
      await sql`DELETE FROM posts WHERE user_id = ${session.user.id}`;
      await sql`DELETE FROM comments WHERE user_id = ${session.user.id}`;
      await sql`DELETE FROM comment_reactions WHERE user_id = ${session.user.id}`;
      await sql`DELETE FROM post_reactions WHERE user_id = ${session.user.id}`;
      await sql`DELETE FROM customers WHERE user_id = ${session.user.id}`; // cascades to invoices if foreign key set
      await sql`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`;
      await sql`DELETE FROM verification_tokens WHERE identifier = ${userId}`;
      await sql`DELETE FROM users WHERE id = ${userId}`;
    } else {
      await connectDB();
      const userIdObj = strToObjectId(userId); if (!userIdObj) return 'Invalid user ID';
      await deleteManyDocs('FlightBooking', { userId: userIdObj });
      await deleteManyDocs('HotelBooking', { userId: userIdObj });
      await deleteManyDocs('FlightReview', { reviewer: userIdObj });
      await deleteManyDocs('HotelReview', { reviewer: userIdObj });
      await deleteManyDocs('Passenger', { userId: userIdObj });
      await deleteManyDocs('SearchHistory', { userId: userIdObj });
      await deleteManyDocs('Verification_Token', { identifier: userId }); // unified Verification_Token collection
      await deleteManyDocs('PasswordResetToken', { userId: userIdObj });
      await deleteManyDocs('Session', { userId: userIdObj });
      await deleteManyDocs('Account', { userId: userIdObj });
      // Invoices are embedded in customers, so no separate deletion needed
      await deleteManyDocs('Post', { userId: userIdObj },);
      await deleteManyDocs('Comment', { userId: userIdObj }, );
      await deleteManyDocs('PostReaction', { userId: userIdObj }, );
      await deleteManyDocs('CommentReaction', { userId: userIdObj }, );
      await deleteManyDocs('Customer', { userId: userIdObj }, );
      await deleteManyDocs('PasswordResetToken', { userId: userIdObj }, );
      await deleteManyDocs('Verification_Token', { userId: userIdObj }, );
      await deleteManyDocs('User', { _id: userIdObj });
    }
    revalidatePath('/dashboard/admin');
    return undefined; // success
    //return { success: true, message: 'User deleted' };
  } catch (error) {
    console.error(error);
    //return { success: false, message: 'Failed to delete user' };
    return 'Failed to delete user';
  }
}
// old functions that was deleted in favor of the new ones above
// they were in actions.ts but I moved them here to avoid bloating that file and because they are admin‑specific actions
// ---------- Update User Role (Admin) ----------
// export async function updateUserRole(prevState: string | undefined, formData: FormData) {
//   import('server-only');
//   const session = await getServerSession(authOptions);
//   if (session?.user?.role !== 'admin') return 'Forbidden';
//   const userId = formData.get('userId') as string;
//   const role = formData.get('role') as string;
//   if (!userId || !role) return 'Missing data';
//   if (dbType === 'postgres') {
//     try {
//       await sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
//     } catch (error) {
//       console.error(error);
//       return 'Failed to update role';
//     }
//   } else {
//     try {
//       await connectDB();
//       await dataModels.User.updateOne({ _id: userId }, { $set: { role } });
//     } catch (error) {
//       console.error(error);
//       return 'Failed to update role';
//     }
//   }
//   revalidatePath('/dashboard/admin');
//   return undefined;
// }
// ---------- Delete User (Admin) ----------
// export async function deleteUser(prevState: string | undefined, formData: FormData) {
//   import('server-only');
//   const session = await getServerSession(authOptions);
//   if (session?.user?.role !== 'admin') return 'Forbidden';
//   const userId = formData.get('userId') as string;
//   if (!userId) return 'Missing user id';
//   if (userId === session.user.id) return 'You cannot delete yourself';
//   if (dbType === 'postgres') {
//     try {
//       await sql`DELETE FROM users WHERE id = ${userId}`;
//     } catch (error) {
//       console.error(error);
//       return 'Failed to delete user';
//     }
//   } else {
//     try {
//       await connectDB();
//       const userIdObj = new mongoose.Types.ObjectId(userId);
//       // Delete all user‑owned data
//       await dataModels.Post.deleteMany({ user_id: userIdObj });
//       await dataModels.Comment.deleteMany({ user_id: userIdObj });
//       await dataModels.PostReaction.deleteMany({ user_id: userIdObj });
//       await dataModels.CommentReaction.deleteMany({ user_id: userIdObj });
//       await dataModels.User.deleteOne({ _id: userIdObj });
//     } catch (error) {
//       console.error(error);
//       return 'Failed to delete user';
//     }
//   }
//   revalidatePath('/dashboard/admin');
//   return undefined;
// }
export async function addFlightAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return { success: false, message: 'Forbidden' };

  const airline = formData.get('airline') as string;
  const depAirport = formData.get('depAirport') as string;
  const arrAirport = formData.get('arrAirport') as string;
  const airplaneId = formData.get('airplaneId') as string;
  const flightCode = formData.get('flightCode') as string;
  const departureDate = formData.get('departureDate') as string;
  const departureTime = formData.get('departureTime') as string;

  if (!airline || !depAirport || !arrAirport || !airplaneId || !flightCode || !departureDate || !departureTime) {
    return { success: false, message: 'Missing fields' };
  }

  // Parse departure datetime
  const depDateTime = new Date(`${departureDate}T${departureTime}:00.000Z`);
  // For simplicity, set arrival = departure + 2 hours (you can add arrival time input later)
  const arrDateTime = new Date(depDateTime.getTime() + 2 * 60 * 60 * 1000);
  const durationMinutes = 120; // 2 hours

  try {
    if (dbType === 'postgres') {
      // Fetch airplane seats from JSONB
      const [airplane] = await sql`SELECT seats FROM airplanes WHERE id = ${airplaneId}`;
      if (!airplane) return { success: false, message: 'Airplane not found' };
      const seats = airplane.seats || [];
      
      // Insert itinerary
      const itineraryId = randomUUID();
      await sql`
        INSERT INTO flight_itineraries (id, flight_code, date, carrier_in_charge, departure_airport_id, arrival_airport_id, segment_ids, total_duration_minutes, status, expire_at)
        VALUES (${itineraryId}, ${flightCode}, ${depDateTime}, ${airline}, ${depAirport}, ${arrAirport}, '{}', ${durationMinutes}, 'scheduled', ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)})
      `;

      // Insert segment
      const segmentId = randomUUID();
      await sql`
        INSERT INTO flight_segments (id, flight_number, date, airline_id, airplane_id, from_airport, scheduled_departure, to_airport, scheduled_arrival, duration_minutes, fare_details, baggage_allowance, seats, status, expire_at)
        VALUES (${segmentId}, ${flightCode}, ${depDateTime}, ${airline}, ${airplaneId}, ${depAirport}, ${depDateTime}, ${arrAirport}, ${arrDateTime}, ${durationMinutes}, '{}', '{}', '{}', 'scheduled', ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)})
      `;

      // Insert seats for the segment
      for (const seat of seats) {
        await sql`
          INSERT INTO flight_seats (id, seat_number, airplane_id, segment_id, class, reservation, expire_at)
          VALUES (${randomUUID()}, ${seat.seatNumber}, ${airplaneId}, ${segmentId}, ${seat.class}, '{}', ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)})
        `;
      }

      // Update itinerary segment_ids
      await sql`UPDATE flight_itineraries SET segment_ids = ARRAY[${segmentId}::uuid] WHERE id = ${itineraryId}`;

    } else {
      await connectDB();
      const airplane = await dataModels.Airplane.findById(airplaneId).lean();
      if (!airplane) return { success: false, message: 'Airplane not found' };
      const seats = airplane.seats || [];

      // Create itinerary
      const itinerary = new dataModels.FlightItinerary({
        flightCode,
        date: depDateTime,
        carrierInCharge: airline,
        departureAirportId: depAirport,
        arrivalAirportId: arrAirport,
        segmentIds: [],
        totalDurationMinutes: durationMinutes,
        layovers: [],
        baggageAllowance: {},
        status: 'scheduled',
        expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await itinerary.save();

      // Create segment
      const segment = new dataModels.FlightSegment({
        flightNumber: flightCode,
        date: depDateTime,
        airlineId: airline,
        airplaneId,
        from: { airport: depAirport, scheduledDeparture: depDateTime },
        to: { airport: arrAirport, scheduledArrival: arrDateTime },
        durationMinutes,
        fareDetails: {},
        baggageAllowance: {},
        seats: [],
        status: 'scheduled',
        expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await segment.save();

      // Create seats
      const seatDocs = seats.map((seat: any) => ({
        seatNumber: seat.seatNumber,
        airplaneId,
        segmentId: segment._id,
        class: seat.class,
        reservation: {},
        expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }));
      await dataModels.FlightSeat.insertMany(seatDocs);

      // Update itinerary
      itinerary.segmentIds = [segment._id];
      itinerary.save();
    }

    return { success: true, message: 'Flight added' };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || 'Failed to add flight' };
  }
}

export async function addHotelAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return { success: false, message: 'Forbidden' };

  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const streetAddress = formData.get('streetAddress') as string;
  const city = formData.get('city') as string;
  const country = formData.get('country') as string;
  const coordinatesStr = formData.get('coordinates') as string;
  const amenitiesStr = formData.get('amenities') as string;
  const featuresStr = formData.get('features') as string;
  const imagesStr = formData.get('images') as string;
  const roomsStr = formData.get('rooms') as string;

  if (!name || !slug || !city || !country) return { success: false, message: 'Missing required fields' };

  const coordinates = JSON.parse(coordinatesStr);
  const amenities = amenitiesStr.split(',').map(s => s.trim()).filter(Boolean);
  const features = featuresStr.split(',').map(s => s.trim()).filter(Boolean);
  const images = imagesStr.split(',').map(s => s.trim()).filter(Boolean);
  const rooms = JSON.parse(roomsStr) as Array<{
    roomNumber: string;
    roomType: string;
    bedOptions: string;
    sleepsCount: number;
    price: number;
    floor: number;
    smokingAllowed: boolean;
  }>;

  try {
    if (dbType === 'postgres') {
      const hotelId = randomUUID();
      const address = JSON.stringify({ streetAddress, city, country });
      await sql`
        INSERT INTO hotels (id, slug, name, description, category, address, coordinates, amenities, features, images, policies, total_rooms, status)
        VALUES (${hotelId}, ${slug}, ${name}, ${description}, ${category}, ${address}, ${coordinates}, ${amenities}, ${features}, ${images}, '{}', ${rooms.length}, 'Opened')
      `;

      for (const room of rooms) {
        await sql`
          INSERT INTO hotel_rooms (id, hotel_id, room_number, room_type, bed_options, sleeps_count, floor, price, smoking_allowed)
          VALUES (${randomUUID()}, ${hotelId}, ${room.roomNumber}, ${room.roomType}, ${room.bedOptions}, ${room.sleepsCount}, ${room.floor}, ${JSON.stringify({ base: room.price, tax: 0, discount: { amount: 0, type: 'percentage' }, serviceFee: 0, currency: 'USD' })}, ${room.smokingAllowed})
        `;
      }
    } else {
      await connectDB();
      const hotel = new dataModels.Hotel({
        slug,
        name,
        description,
        category,
        address: { streetAddress, city, country },
        coordinates: { lat: coordinates.lat, lon: coordinates.lon },
        amenities,
        features,
        images,
        policies: {},
        status: 'Opened',
        totalRooms: rooms.length,
        rooms: [],
      });

      const roomDocs = rooms.map(room => ({
        hotelId: hotel._id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        bedOptions: room.bedOptions,
        sleepsCount: room.sleepsCount,
        floor: room.floor,
        smokingAllowed: room.smokingAllowed,
        price: { base: room.price, tax: 0, discount: { amount: 0, type: 'percentage' }, serviceFee: 0, currency: 'USD' },
      }));
      const createdRooms = await dataModels.HotelRoom.insertMany(roomDocs);
      hotel.rooms = createdRooms.map(r => r._id);
      await hotel.save();
    }

    return { success: true, message: 'Hotel added successfully' };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || 'Failed to add hotel' };
  }
}


export async function addAirportAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return { success: false, message: 'Forbidden' };

  const iata = formData.get('iata') as string;
  const name = formData.get('name') as string;
  const city = formData.get('city') as string;
  const country = formData.get('country') as string;
  const latitude = parseFloat(formData.get('latitude') as string) || null;
  const longitude = parseFloat(formData.get('longitude') as string) || null;
  const timezone = (formData.get('timezone') as string) || null;

  if (!iata || !name || !city || !country) return { success: false, message: 'Missing fields' };

  try {
    if (dbType === 'postgres') {
      await sql`
        INSERT INTO airports (iata_code, name, city, country, latitude, longitude, timezone)
        VALUES (${iata}, ${name}, ${city}, ${country}, ${latitude}, ${longitude}, ${timezone})
      `;
    } else {
      await connectDB();
      await dataModels.Airport.create({ iataCode: iata, name, city, country, latitude, longitude, timezone });
    }
    return { success: true, message: 'Airport added' };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || 'Failed' };
  }
}