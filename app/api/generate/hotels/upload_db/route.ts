import { NextRequest, NextResponse } from 'next/server';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import { generateHotelsDB } from '@/app/lib/db/generateForDB/hotels/generateHotels';
import dataModels from '@/app/lib/db/models';
import { createManyDocs } from '@/app/lib/db/createOperationDB';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.API_SECRET_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { hotel: hotels, hotelRoom: rooms } = await generateHotelsDB();

    if (dbType === 'postgres') {
      // PostgreSQL: clear tables
      await sql`TRUNCATE TABLE hotel_bookings CASCADE`;
      await sql`TRUNCATE TABLE hotel_guests CASCADE`;
      await sql`TRUNCATE TABLE hotel_reviews CASCADE`;
      await sql`TRUNCATE TABLE hotel_rooms CASCADE`;
      await sql`TRUNCATE TABLE hotels CASCADE`;

      // Insert hotels
      for (const hotel of hotels) {
        const hotelId = randomUUID();
        await sql`
          INSERT INTO hotels (id, slug, name, description, category, parking_included, last_renovation_date, is_deleted, address, coordinates, amenities, features, images, tags, policies, total_rooms, status)
          VALUES (${hotelId}, ${hotel.slug}, ${hotel.name}, ${hotel.description}, ${hotel.category}, ${hotel.parkingIncluded}, ${hotel.lastRenovationDate || null}, ${hotel.isDeleted || false}, ${JSON.stringify(hotel.address)}::jsonb, ${JSON.stringify(hotel.coordinates)}::jsonb, ${hotel.amenities}, ${hotel.features}, ${hotel.images}, ${hotel.tags}, ${JSON.stringify(hotel.policies)}::jsonb, ${hotel.rooms.length}, ${hotel.status})
        `;
        // Insert rooms for this hotel (map hotelId)
        for (const room of rooms.filter(r => r.hotelId === hotel._id)) {
          await sql`
            INSERT INTO hotel_rooms (id, hotel_id, room_number, description, room_type, bed_options, sleeps_count, floor, total_beds, smoking_allowed, max_adults, max_children, extra_bed_allowed, tags, price, images, amenities, features)
            VALUES (${randomUUID()}, ${hotelId}, ${room.roomNumber}, ${room.description}, ${room.roomType}, ${room.bedOptions}, ${room.sleepsCount}, ${room.floor}, ${room.totalBeds}, ${room.smokingAllowed}, ${room.maxAdults}, ${room.maxChildren}, ${room.extraBedAllowed}, ${room.tags}, ${JSON.stringify(room.price)}::jsonb, ${room.images}, ${room.amenities}, ${room.features})
          `;
        }
      }
    } else {
      // MongoDB
      await connectDB();
      await dataModels.Hotel.deleteMany({});
      await dataModels.HotelRoom.deleteMany({});
      await createManyDocs('Hotel', hotels);
      await createManyDocs('HotelRoom', rooms);
    }

    return NextResponse.json({ success: true, message: 'Hotels uploaded successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Failed to upload hotels' }, { status: 500 });
  }
}