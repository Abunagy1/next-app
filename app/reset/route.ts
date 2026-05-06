// app/reset/route.ts
import { NextResponse } from 'next/server';
import { sql, mongoose, dbType, connectDB } from '@/app/lib/db/index';
import { seedPostgres } from '@/app/seed/seed-postgres';
import { seedMongoDB } from '@/app/seed/seed-mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin' && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot reset production database via script.');
    return NextResponse.json({ error: 'Cannot reset production database via script.' }, { status: 403 });
    //process.exit(1);
  }
  try {
    if (dbType === 'postgres') {
      // Drop all data from PostgreSQL tables (order matters – foreign keys)
      // Start with tables that have foreign keys to others
      await sql`DELETE FROM user_flight_bookmarks`;
      await sql`DELETE FROM user_hotel_bookmarks`;
      await sql`DELETE FROM favourites`;
      await sql`DELETE FROM search_history`;
      await sql`DELETE FROM website_reviews`;
      await sql`DELETE FROM user_emails`;
      await sql`DELETE FROM subscriptions`;
      await sql`DELETE FROM accounts`;
      await sql`DELETE FROM sessions`;
      await sql`DELETE FROM anonymous_users`;
      await sql`DELETE FROM promo_codes`;
      await sql`DELETE FROM website_config`;
      await sql`DELETE FROM analytics`;
      await sql`DELETE FROM flight_payments`;
      await sql`DELETE FROM flight_reviews`;
      await sql`DELETE FROM flight_bookings`;
      await sql`DELETE FROM flight_seats`;
      await sql`DELETE FROM flight_segments`;
      await sql`DELETE FROM flight_itineraries`;
      await sql`DELETE FROM airline_flight_prices`;
      await sql`DELETE FROM airplanes`;
      await sql`DELETE FROM airports`;
      await sql`DELETE FROM airlines`;
      await sql`DELETE FROM hotel_payments`;
      await sql`DELETE FROM hotel_reviews`;
      await sql`DELETE FROM hotel_bookings`;
      await sql`DELETE FROM hotel_guests`;
      await sql`DELETE FROM hotel_rooms`;
      await sql`DELETE FROM hotels`;
      await sql`DELETE FROM reservations`;
      await sql`DELETE FROM passengers`;
      await sql`DELETE FROM comment_reactions`;
      await sql`DELETE FROM post_reactions`;
      await sql`DELETE FROM comments`;
      await sql`DELETE FROM posts`;
      await sql`DELETE FROM products`;
      await sql`DELETE FROM invoices`;
      await sql`DELETE FROM customers`;
      await sql`DELETE FROM revenue`;
      await sql`DELETE FROM verification_tokens`;
      await sql`DELETE FROM password_reset_tokens`;
      await sql`DELETE FROM users`;
      await seedPostgres();
    } else {
      await connectDB();
      // const collections = [
      //   // Core content (8)
      //   'comments',
      //   'commentreactions',
      //   'postreactions',
      //   'posts',
      //   'products',
      //   'invoices',
      //   'customers',
      //   'revenues',
      //   // Verification & auth (8)
      //   'verification_tokens',     // old project Verification_Token
      //   'passwordresettokens',
      //   'users',
      //   'subscriptions',
      //   'anonymoususers',          // corresponds to PostgreSQL anonymous_users
      //   'accounts',
      //   'sessions',
      //   // Flight related (10)
      //   'flightitineraries',
      //   'flightsegments',
      //   'flightseats',
      //   'flightbookings',
      //   'flightreviews',
      //   'flightpayments',
      //   'airlineflightprices',
      //   'airplanes',
      //   'airports',
      //   'airlines',
      //   // Hotel related (7)
      //   'hotelbookings',
      //   'hotelrooms',
      //   'hotelguests',
      //   'hotels',
      //   'hotelpayments',
      //   'hotelreviews',
      //   'passengers',
      //   // Other (6)
      //   'seats',
      //   'promocodes',
      //   'searchhistories',        // SearchHistory model
      //   'websitereviews',
      //   'websiteconfigs',
      //   'analytics',
      //   // Not Used (6) cn be removed if not used in MongoDB version, but included here for completeness based on PostgreSQL schema
      //   'reservations', // has a model but no schema, corresponds to PostgreSQL reservations, but if stored as a separate collection, (alredy merged with hotels collection in MongoDB version)
      //   'favourites', // has a model but no schema, corresponds to PostgreSQL favourites, but if stored as a separate collection, (alredy merged with users collection in MongoDB version)
      //   'useremails', // corresponds to PostgreSQL user_emails , but if stored as a separate collection, (alredy merged with users collection in MongoDB version)
      //   'website_config', // corresponds to PostgreSQL website_config, but if stored as a separate collection, (alredy merged with analytics collection in MongoDB version)
      //   'user_flight_bookmarks',   // if stored as a separate collection, user_flight_bookmarks and user_hotel_bookmarks can be stored as separate collections or embedded in the User document. Adjust based on your actual schema design.
      //   'user_hotel_bookmarks',    // if stored as a separate collection, user_flight_bookmarks and user_hotel_bookmarks can be stored as separate collections or embedded in the User document. Adjust based on your actual schema design.
      //   // Add any other collections that exist in your MongoDB schema
      // ];
      // Get all collection names and delete all documents
      const collections = await mongoose.connection.db.listCollections().toArray();
      for (const coll of collections) {
        try {
          await mongoose.connection.db.collection(coll).deleteMany({});
        } catch (err) {
          console.warn(`Collection ${coll} not found, skipping.`, err);
        }
      }
      await seedMongoDB();
    }
    // return NextResponse.json({ message: 'Database reset and seeded successfully.' });
    return NextResponse.json({ message: `Database (${dbType}) reset and seeded successfully.` });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 });
  }
}