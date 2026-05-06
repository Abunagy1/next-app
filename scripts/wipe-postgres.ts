// scripts/wipe-postgres.ts
import dotenv from 'dotenv';
dotenv.config();
import { sql } from '@/app/lib/db/db-core';
/**
 * Truncate a table if it exists in the database (empties the tables (TRUNCATE) but does not drop them).
 * if you want to drop or delete the table change TRUNCATE with DROP or DELETE FROM
 */
async function truncateIfExists(tableName: string) {
  const exists = await sql`SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = ${tableName}
  )`;
  if (exists[0].exists) {
    await sql.unsafe(`TRUNCATE TABLE ${tableName} CASCADE;`);
  }
}
async function wipe() {
    console.log('🧹 Wiping PostgreSQL database (clearing all data, keeping schema)...');
    try {
        // List all tables in correct order to avoid foreign key violations
        // Disable foreign key checks temporarily to avoid ordering issues
        await sql`SET session_replication_role = 'replica';`;
        // List of all tables that might be present (order not important due to CASCADE)
        const tables = [
            'user_flight_bookmarks',
            'user_hotel_bookmarks',
            'favourites',
            'search_history',
            'website_reviews',
            'user_emails',
            'subscriptions',
            'accounts',
            'sessions',
            'anonymous_users',
            'promo_codes',
            'website_config',
            'analytics',
            'flight_payments',
            'flight_reviews',
            'flight_bookings',
            'flight_seats',
            'flight_segments',
            'flight_itineraries',
            'airline_flight_prices',
            'airplanes',
            'airports',
            'airlines',
            'hotel_payments',
            'hotel_reviews',
            'hotel_bookings',
            'hotel_guests',
            'hotel_rooms',
            'hotels',
            'reservations',
            'passengers',
            'comment_reactions',
            'post_reactions',
            'comments',
            'posts',
            'products',
            'invoices',
            'customers',
            'revenue',
            'verification_tokens',
            'verification_codes',
            'password_reset_tokens',
            'users'
        ];
    for (const table of tables) {
        await truncateIfExists(table);
    }
    // if you don't want to use function
    // for (const table of tables) {
    //     await sql.unsafe(`TRUNCATE TABLE ${table} CASCADE;`);
    // }
    // Re-enable foreign key checks
    await sql`SET session_replication_role = 'origin';`;
      console.log('✅ Database cleared.');
  } catch (error) {
    console.error('❌ Wipe failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}
wipe();