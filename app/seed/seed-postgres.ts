// app/seed/seed-postgres.ts
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { invoices, customers, revenue, users, posts as placeholderPosts, products } from '../lib/placeholder-data';
import { sql } from '@/app/lib/db/db-core';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { randomUUID } from 'crypto';
// Import flight generation functions and primary data
import {
  generateFlightsDB,
  generateAirportsDB,
  generateAirplanesDB,
  generateAirlinesDB,
  generateAirlineFlightPricesDB,
} from '@/app/lib/db/generateForDB/flights/generateFlights';
import { generateHotelsDB } from '@/app/lib/db/generateForDB/hotels/generateHotels';
import primaryAirportData from '@/app/lib/db/generateForDB/primaryData/airportsData.json';
import primaryAirplaneData from '@/app/lib/db/generateForDB/primaryData/airplaneData.json';
import primaryAirlineData from '@/app/lib/db/generateForDB/primaryData/airlinesData.json';

export async function seedPostgres() {
  console.log('🌱 Seeding PostgreSQL...');
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
  // --- 🧹 CLEAR ALL EXISTING DATA (CASCADE handles foreign keys) ---
  // The global TRUNCATE covers all tables
  console.log('   Truncating all existing tables...');
  await sql`TRUNCATE TABLE 
    user_flight_bookmarks,
    user_hotel_bookmarks,
    favourites,
    search_history,
    website_reviews,
    user_emails,
    subscriptions,
    accounts,
    sessions,
    anonymous_users,
    promo_codes,
    website_config,
    analytics,
    flight_payments,
    flight_reviews,
    flight_bookings,
    flight_seats,
    flight_segments,
    flight_itineraries,
    airline_flight_prices,
    airplanes,
    airports,
    airlines,
    hotel_payments,
    hotel_reviews,
    hotel_bookings,
    hotel_guests,
    hotel_rooms,
    hotels,
    reservations,
    passengers,
    comment_reactions,
    post_reactions,
    comments,
    posts,
    products,
    invoices,
    customers,
    revenue,
    verification_tokens,
    password_reset_tokens,
    users
  CASCADE`;
  console.log('   Tables truncated.');

  // ---------- Users table Creation ----------
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;
  const userColumns = [
    { name: 'email_verified', type: 'BOOLEAN DEFAULT FALSE' },
    { name: 'email_verified_at', type: 'TIMESTAMP' },
    { name: 'image', type: 'TEXT' },
    { name: 'phone', type: 'TEXT' },
    { name: 'city', type: 'TEXT' },
    { name: 'about', type: 'TEXT' },
    { name: 'birth_date', type: 'DATE' },
    { name: 'role', type: 'VARCHAR(50) DEFAULT \'user\'' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'first_name', type: 'VARCHAR(255)' },
    { name: 'last_name', type: 'VARCHAR(255)' },
    { name: 'cover_image', type: 'TEXT' },
    { name: 'phone_numbers', type: 'JSONB DEFAULT \'[]\'' },
    { name: 'emails', type: 'JSONB DEFAULT \'[]\'' },
    { name: 'address', type: 'TEXT' },
    { name: 'customer_id', type: 'TEXT' },
    { name: 'flight_bookmarks', type: 'JSONB DEFAULT \'[]\'' },
    { name: 'hotel_bookmarks', type: 'JSONB DEFAULT \'[]\'' },
    { name: 'reward_points', type: 'JSONB DEFAULT \'{}\'' },
    { name: 'flights', type: 'JSONB DEFAULT \'{}\'' },
    { name: 'hotels', type: 'JSONB DEFAULT \'{}\'' },
    { name: 'reward_points', type: 'JSONB DEFAULT \'{}\'' },
  ];
  for (const col of userColumns) {
    try {
      await sql.unsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
    } catch (err) {
      console.error(`Failed to add column ${col.name}:`, err);
    }
  }
  // Users indexes Creation
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_emails ON users USING GIN(emails);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_phone_numbers ON users USING GIN(phone_numbers);`;

  // // Insert users Data from placeholder data with hashed passwords
  // for (const user of users) {
  //   const hashedPassword = await bcrypt.hash(user.password, 10);
  //   await sql`
  //     INSERT INTO users (
  //       id, name, email, password, email_verified, email_verified_at, image,
  //       phone, city, about, birth_date, role, created_at, updated_at
  //     ) VALUES (
  //       ${user.id}, ${user.name}, ${user.email}, ${hashedPassword},
  //       ${user.email_verified}, ${user.email_verified_at || null}, ${user.image || null},
  //       ${user.phone || null}, ${user.city || null}, ${user.about || null},
  //       ${user.birth_date || null}, ${user.role || 'user'}, NOW(), NOW()
  //     )
  //     ON CONFLICT (id) DO NOTHING;
  //   `;
  // }

  // Insert users
for (const user of users) {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  await sql`
    INSERT INTO users (
      id, name, email, password, email_verified, email_verified_at, image,
      phone, city, about, birth_date, role,
      first_name, last_name, cover_image, phone_numbers, emails,
      address, customer_id, flights, hotels, reward_points,
      created_at, updated_at
    ) VALUES (
      ${user.id}, ${user.name}, ${user.email}, ${hashedPassword},
      ${user.email_verified}, ${user.email_verified ? new Date() : null}, ${user.image || null},
      ${user.phone || null}, ${user.city || null}, ${user.about || null},
      ${user.birth_date || null}, ${user.role || 'user'},
      ${user.firstName || null}, ${user.lastName || null}, ${user.coverImage || null},
      ${JSON.stringify(user.phoneNumbers || [])}::jsonb,
      ${JSON.stringify(user.emails || [{ email: user.email, primary: true }])}::jsonb,
      ${user.address || null}, ${user.customerId || null},
      ${JSON.stringify(user.flights || {})}::jsonb, ${JSON.stringify(user.hotels || {})}::jsonb,
      ${JSON.stringify(user.rewardPoints || { totalPoints: 0, pointHistory: [] })}::jsonb,
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  `;
}
  // ---------- Customers table ----------
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='user_id') THEN
        ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);`;
  for (const customer of customers) {
    await sql`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  // ---------- Invoices ----------
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;
  const invoiceColumns = [
    'items JSONB',
    'shipping_info JSONB',
    'payment_intent_id TEXT',
    'payment_method TEXT',
    'payment_reference TEXT',
  ];
  for (const colDef of invoiceColumns) {
    const colName = colDef.split(' ')[0];
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='${colName}') THEN
          ALTER TABLE invoices ADD COLUMN ${colDef};
        END IF;
      END $$;
    `);
  }
  await sql`CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);`;
  for (const invoice of invoices) {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  // ---------- Revenue ----------
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;
  for (const rev of revenue) {
    await sql`
      INSERT INTO revenue (month, revenue)
      VALUES (${rev.month}, ${rev.revenue})
      ON CONFLICT (month) DO NOTHING;
    `;
  }
  // ---------- Posts ----------
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      slug TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );
  `;
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='images') THEN
        ALTER TABLE posts ADD COLUMN images TEXT[];
      END IF;
    END $$;
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);`;
  for (const post of placeholderPosts) {
    await sql`
      INSERT INTO posts (slug, user_id, title, content, created_at, updated_at, images)
      VALUES (${post.slug}, ${post.user_id}, ${post.title}, ${post.content}, ${post.created_at}, ${post.updated_at}, NULL)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        updated_at = EXCLUDED.updated_at;
    `;
  }
  const postsDir = path.join(process.cwd(), 'app/content/posts');
  if (fs.existsSync(postsDir)) {
    const fileNames = fs.readdirSync(postsDir);
    for (const fileName of fileNames) {
      if (!fileName.endsWith('.md')) continue;
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDir, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);
      const defaultUserId = users[0].id;
      await sql`
        INSERT INTO posts (slug, user_id, title, content, created_at, updated_at, images)
        VALUES (${slug}, ${defaultUserId}, ${data.title}, ${content}, ${data.date}, ${data.date}, NULL)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          updated_at = EXCLUDED.updated_at;
      `;
    }
  }
  // ---------- Products ----------
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      image VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);`;
  for (const product of products) {
    await sql`
      INSERT INTO products (name, price, image, type)
      VALUES (${product.name}, ${product.price}, ${product.image}, ${product.type})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
// ---------- Verification codes (generic: password reset, email confirmation) ----------
  // ---------- Verification tokens ----------
  await sql`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      identifier TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_verification_tokens_identifier ON verification_tokens(identifier);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON verification_tokens(expires);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);`;
  // ---------- Password reset tokens ----------
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires);`;
  // ---------- Comments ----------
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      post_slug TEXT NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments(post_slug);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);`;
  // ---------- Comment reactions ----------
  await sql`
    CREATE TABLE IF NOT EXISTS comment_reactions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (comment_id, user_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON comment_reactions(user_id);`;
  // ---------- Post reactions ----------
  await sql`
    CREATE TABLE IF NOT EXISTS post_reactions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      post_slug TEXT NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (post_slug, user_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_post_reactions_post_slug ON post_reactions(post_slug);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);`;
  // ---------- Airlines ----------
  await sql`
    CREATE TABLE IF NOT EXISTS airlines (
      iata_code VARCHAR(3) PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      contact JSONB,
      airline_policy JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // ---------- Airports ----------
  await sql`
    CREATE TABLE IF NOT EXISTS airports (
      iata_code VARCHAR(3) PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT,
      country TEXT NOT NULL,
      latitude DECIMAL,
      longitude DECIMAL,
      timezone TEXT,
      facilities TEXT[],
      image TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  // ---------- Airplanes ----------
  await sql`
    CREATE TABLE IF NOT EXISTS airplanes (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      airline_id VARCHAR(3) REFERENCES airlines(iata_code) ON DELETE CASCADE,
      model TEXT NOT NULL,
      cruise_speed JSONB,
      classes TEXT[],
      total_seats INT NOT NULL,
      seats JSONB,
      facilities TEXT[],
      images TEXT[],
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  // ---------- Airline flight prices ----------
  await sql`
    CREATE TABLE IF NOT EXISTS airline_flight_prices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      airline_code VARCHAR(3) REFERENCES airlines(iata_code) ON DELETE CASCADE,
      departure_airport_code VARCHAR(3) REFERENCES airports(iata_code),
      arrival_airport_code VARCHAR(3) REFERENCES airports(iata_code),
      distance JSONB,
      base_price JSONB,
      discount JSONB,
      service_fee JSONB,
      taxes JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  // ---------- Flight itineraries ----------
  await sql`
    CREATE TABLE IF NOT EXISTS flight_itineraries (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      flight_code TEXT NOT NULL,
      date TIMESTAMP NOT NULL,
      carrier_in_charge VARCHAR(3) REFERENCES airlines(iata_code),
      departure_airport_id VARCHAR(3) REFERENCES airports(iata_code),
      arrival_airport_id VARCHAR(3) REFERENCES airports(iata_code),
      segment_ids UUID[],
      total_duration_minutes INT,
      layovers JSONB,
      baggage_allowance JSONB,
      status TEXT DEFAULT 'scheduled',
      expire_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_itineraries_dep_airport ON flight_itineraries(departure_airport_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_itineraries_arr_airport ON flight_itineraries(arrival_airport_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_itineraries_date ON flight_itineraries(date);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_itineraries_status ON flight_itineraries(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_itineraries_carrier ON flight_itineraries(carrier_in_charge);`;
  // ---------- Flight segments ----------
  await sql`
    CREATE TABLE IF NOT EXISTS flight_segments (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      flight_number TEXT NOT NULL,
      date TIMESTAMP NOT NULL,
      airline_id VARCHAR(3) REFERENCES airlines(iata_code),
      airplane_id UUID REFERENCES airplanes(id),
      from_airport VARCHAR(3) REFERENCES airports(iata_code),
      scheduled_departure TIMESTAMP NOT NULL,
      from_terminal TEXT,
      from_gate TEXT,
      to_airport VARCHAR(3) REFERENCES airports(iata_code),
      scheduled_arrival TIMESTAMP NOT NULL,
      to_terminal TEXT,
      to_gate TEXT,
      duration_minutes INT,
      fare_details JSONB,
      baggage_allowance JSONB,
      seats UUID[],
      status TEXT DEFAULT 'scheduled',
      expire_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_segments_flight_number ON flight_segments(flight_number);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_segments_date ON flight_segments(date);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_segments_airline ON flight_segments(airline_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_segments_from_airport ON flight_segments(from_airport);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_segments_to_airport ON flight_segments(to_airport);`;
  // ---------- Flight seats ----------
  await sql`
    CREATE TABLE IF NOT EXISTS flight_seats (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      seat_number TEXT NOT NULL,
      airplane_id UUID REFERENCES airplanes(id),
      segment_id UUID REFERENCES flight_segments(id) ON DELETE CASCADE,
      class TEXT,
      reservation JSONB,
      expire_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_seats_segment ON flight_seats(segment_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_seats_class ON flight_seats(class);`;
  // ---------- Flight bookings ----------
  await sql`
    CREATE TABLE IF NOT EXISTS flight_bookings (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      pnr_code TEXT UNIQUE NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      flight_itinerary_id UUID REFERENCES flight_itineraries(id),
      segment_ids UUID[],
      passengers UUID[],
      selected_seats JSONB,
      fare_breakdown JSONB,
      total_fare DECIMAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      promo_code TEXT,
      payment_status TEXT DEFAULT 'pending',
      ticket_status TEXT DEFAULT 'pending',
      cancellation_info JSONB,
      refund_info JSONB,
      payment_id UUID,
      earned_miles INT DEFAULT 0,
      guaranteed_reservation_until TIMESTAMP,
      user_time_zone TEXT,
      source TEXT DEFAULT 'web',
      booked_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_bookings_user ON flight_bookings(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_bookings_itinerary ON flight_bookings(flight_itinerary_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_bookings_payment_status ON flight_bookings(payment_status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_bookings_ticket_status ON flight_bookings(ticket_status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_bookings_pnr ON flight_bookings(pnr_code);`;
  // ---------- Flight payments ----------
  await sql`
    CREATE TABLE IF NOT EXISTS flight_payments (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      booking_id UUID REFERENCES flight_bookings(id),
      transaction_id TEXT,
      stripe_payment_intent_id TEXT,
      stripe_charge_id TEXT,
      payment_method JSONB,
      amount DECIMAL,
      payment_date TIMESTAMP,
      receipt_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  // ---------- Flight reviews ----------
  await sql`
    CREATE TABLE IF NOT EXISTS flight_reviews (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      airline_id VARCHAR(3) REFERENCES airlines(iata_code),
      departure_airport_id VARCHAR(3) REFERENCES airports(iata_code),
      arrival_airport_id VARCHAR(3) REFERENCES airports(iata_code),
      airplane_model_name TEXT,
      reviewer_id UUID REFERENCES users(id),
      rating INT CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      flagged UUID[],
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_reviews_reviewer ON flight_reviews(reviewer_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_reviews_rating ON flight_reviews(rating);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flight_reviews_airline ON flight_reviews(airline_id);`;
  // ---------- Passengers ----------
  await sql`
    CREATE TABLE IF NOT EXISTS passengers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      first_name TEXT NOT NULL,
      middle_name TEXT,
      last_name TEXT NOT NULL,
      title TEXT,
      date_of_birth DATE NOT NULL,
      gender TEXT,
      address JSONB,
      passenger_type TEXT,
      email TEXT,
      phone_number JSONB,
      passport_number TEXT,
      passport_expiry_date DATE,
      country TEXT,
      visa_details JSONB,
      redress_number TEXT,
      known_traveler_number TEXT,
      frequent_flyer_number TEXT,
      frequent_flyer_airline TEXT,
      seat_class TEXT,
      is_primary BOOLEAN DEFAULT false,
      preferences JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_passengers_type ON passengers(passenger_type);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_passengers_email ON passengers(email);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_passengers_primary ON passengers(is_primary);`;
  // ---------- Hotels ----------
  await sql`
    CREATE TABLE IF NOT EXISTS hotels (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      parking_included BOOLEAN,
      last_renovation_date DATE,
      is_deleted BOOLEAN DEFAULT false,
      address JSONB,
      coordinates JSONB,
      amenities TEXT[],
      features TEXT[],
      images TEXT[],
      tags TEXT[],
      policies JSONB,
      total_rooms INT,
      status TEXT DEFAULT 'Opened',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotels_slug ON hotels(slug);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotels_name ON hotels(name);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotels_address_city ON hotels((address->>'city'));`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotels_address_country ON hotels((address->>'country'));`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotels_amenities ON hotels USING GIN(amenities);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotels_features ON hotels USING GIN(features);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotels_status ON hotels(status);`;
  // ---------- Hotel rooms ----------
  await sql`
    CREATE TABLE IF NOT EXISTS hotel_rooms (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
      room_number TEXT,
      description TEXT,
      room_type TEXT,
      bed_options TEXT,
      sleeps_count INT,
      floor INT,
      total_beds INT DEFAULT 1,
      smoking_allowed BOOLEAN,
      max_adults INT,
      max_children INT,
      extra_bed_allowed BOOLEAN,
      tags TEXT[],
      price JSONB,
      images TEXT[],
      amenities TEXT[],
      features TEXT[],
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotel_rooms_hotel ON hotel_rooms(hotel_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotel_rooms_type ON hotel_rooms(room_type);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotel_rooms_price ON hotel_rooms((price->>'base'));`;
  // ---------- Hotel guests ----------
  await sql`
    CREATE TABLE IF NOT EXISTS hotel_guests (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      hotel_booking_id UUID,
      first_name TEXT NOT NULL,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      guest_type TEXT,
      age INT,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  // ---------- Hotel bookings ----------
  await sql`
    CREATE TABLE IF NOT EXISTS hotel_bookings (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      hotel_id UUID REFERENCES hotels(id),
      rooms UUID[],
      check_in_date DATE NOT NULL,
      check_out_date DATE NOT NULL,
      guests UUID[],
      fare_breakdown JSONB,
      total_price DECIMAL,
      booking_status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'pending',
      payment_method TEXT,
      payment_id UUID,
      refund_info JSONB,
      guaranteed_reservation_until TIMESTAMP,
      source TEXT DEFAULT 'web',
      booked_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotel_bookings_user ON hotel_bookings(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotel_bookings_hotel ON hotel_bookings(hotel_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotel_bookings_dates ON hotel_bookings(check_in_date, check_out_date);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotel_bookings_status ON hotel_bookings(booking_status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotel_bookings_payment_status ON hotel_bookings(payment_status);`;
  // ---------- Hotel payments ----------
  await sql`
    CREATE TABLE IF NOT EXISTS hotel_payments (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      booking_id UUID REFERENCES hotel_bookings(id),
      transaction_id TEXT,
      stripe_payment_intent_id TEXT,
      stripe_charge_id TEXT,
      payment_method JSONB,
      amount DECIMAL,
      payment_date TIMESTAMP,
      receipt_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  // ---------- Hotel reviews ----------
  await sql`
    CREATE TABLE IF NOT EXISTS hotel_reviews (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      hotel_id UUID REFERENCES hotels(id),
      slug TEXT,
      reviewer_id UUID REFERENCES users(id),
      rating INT CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      flagged UUID[],
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotel_reviews_reviewer ON hotel_reviews(reviewer_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotel_reviews_rating ON hotel_reviews(rating);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hotel_reviews_hotel ON hotel_reviews(hotel_id);`;
  // ---------- Reservations ----------
  await sql`
    CREATE TABLE IF NOT EXISTS reservations (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      room_id UUID REFERENCES hotel_rooms(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      guests_count INT NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      payment_status VARCHAR(50) DEFAULT 'pending',
      payment_intent_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  // ---------- Search history ----------
  await sql`
    CREATE TABLE IF NOT EXISTS search_history (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      type TEXT CHECK (type IN ('flight', 'hotel')),
      search_state JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_search_history_type ON search_history(type);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at);`;
  // ---------- Favourites ----------
  await sql`
    CREATE TABLE IF NOT EXISTS favourites (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT CHECK (type IN ('flight', 'hotel')),
      item_id TEXT NOT NULL,
      search_state JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (user_id, type, item_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_favourites_search_state ON favourites USING GIN(search_state);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_favourites_user ON favourites(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_favourites_type ON favourites(type);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_favourites_item ON favourites(item_id);`;
  // ---------- User flight bookmarks ----------
  await sql`
    CREATE TABLE IF NOT EXISTS user_flight_bookmarks (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      flight_id UUID REFERENCES flight_itineraries(id) ON DELETE CASCADE,
      search_state JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (user_id, flight_id)
    );
  `;
  // ---------- User hotel bookmarks ----------
  await sql`
    CREATE TABLE IF NOT EXISTS user_hotel_bookmarks (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (user_id, hotel_id)
    );
  `;
  // ---------- Website config ----------
  await sql`
    CREATE TABLE IF NOT EXISTS website_config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      maintenance_mode JSONB,
      enable_flight_booking BOOLEAN DEFAULT true,
      enable_hotel_booking BOOLEAN DEFAULT true,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  // ---------- Analytics ----------
  await sql`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY DEFAULT 1,
      total_users_signed_up INT DEFAULT 0,
      total_accounts_deleted INT DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  // ---------- Website reviews ----------
  await sql`
    CREATE TABLE IF NOT EXISTS website_reviews (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      category VARCHAR(50) NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_website_reviews_category ON website_reviews(category);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_website_reviews_user ON website_reviews(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_website_reviews_rating ON website_reviews(rating);`;
  // ---------- Promo codes ----------
  await sql`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
      value DECIMAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      max_discount DECIMAL,
      applicable_to JSONB,
      conditions JSONB,
      usage_limit INT,
      usage_count INT DEFAULT 0,
      user_limit INT,
      is_active BOOLEAN DEFAULT true,
      valid_from TIMESTAMP,
      valid_until TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  // ---------- Subscriptions ----------
  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      email_verified TIMESTAMP,
      subscribed BOOLEAN DEFAULT true,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  // ---------- Anonymous users ----------
  await sql`
    CREATE TABLE IF NOT EXISTS anonymous_users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      session_id TEXT NOT NULL UNIQUE,
      flights JSONB DEFAULT '{}',
      hotels JSONB DEFAULT '{}',
      expire_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_anonymous_users_expire_at ON anonymous_users(expire_at);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_anonymous_users_session_id ON anonymous_users(session_id);`;
  // ---------- Accounts ----------
  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      type TEXT NOT NULL,
      password TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(provider, provider_account_id)
    );
  `;
  // ---------- Sessions ----------
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_token TEXT NOT NULL UNIQUE,
      expires TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  // ---------- User emails ----------
  await sql`
    CREATE TABLE IF NOT EXISTS user_emails (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      is_primary BOOLEAN DEFAULT false,
      email_verified BOOLEAN DEFAULT false,
      in_verification BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (user_id, email)
    );
  `;
  // comment them out when you eed the database or they will take ys to seed , just go to admin and use route 
  // After all table creation, populate flight and hotel data
  await seedFlightsPostgres();
  await seedHotelsPostgres();

  console.log('✅ PostgreSQL seeding complete.');
}

// ... (all table creation code from your existing file remains exactly the same)
async function seedFlightsPostgres() {
  // Clear flight data (order matters) -- No Need for it as the Glopal command at the top will do this
  //await sql`TRUNCATE TABLE flight_seats, flight_segments, flight_itineraries, airline_flight_prices, airplanes, airports, airlines CASCADE`;
  // Generate data using the existing functions
  console.log('   Generating flights data for PostgreSQL...');
  const airports = await generateAirportsDB(primaryAirportData);
  const { airplaneData: airplanes, seatData: seats } = await generateAirplanesDB(primaryAirplaneData);
  const airlines = await generateAirlinesDB(primaryAirlineData);
  const airlineFlightPrices = await generateAirlineFlightPricesDB(primaryAirlineData);
  const flightsData = await generateFlightsDB(10, airports, airplanes, airlines, airlineFlightPrices);

  // Flatten
  const flightItineraries: any[] = [];
  const flightSegments: any[] = [];
  const flightSeats: any[] = [];
  for (const day of flightsData) {
    flightItineraries.push(...day.flightItinerary);
    flightSegments.push(...day.flightSegments);
    flightSeats.push(...day.flightSeats);
  }

  // Insert airports
  for (const airport of airports) {
    await sql`
      INSERT INTO airports (iata_code, name, city, state, country, latitude, longitude, timezone, facilities, image)
      VALUES (${airport.iataCode}, ${airport.name}, ${airport.city}, ${airport.state || null}, ${airport.country},
              ${airport.latitude}, ${airport.longitude}, ${airport.timezone}, ${airport.facilities || []}, ${airport.image || null})
      ON CONFLICT (iata_code) DO NOTHING;
    `;
  }

  // Insert airlines
  for (const airline of airlines) {
    await sql`
      INSERT INTO airlines (iata_code, name, logo, contact, airline_policy)
      VALUES (${airline.iataCode}, ${airline.name}, ${airline.logo || null},
              ${JSON.stringify(airline.contact || {})}::jsonb,
              ${JSON.stringify(airline.airlinePolicy || {})}::jsonb)
      ON CONFLICT (iata_code) DO NOTHING;
    `;
  }

  // Insert airplanes (generate UUIDs)
  const airplaneIdMap = new Map<string, string>();
  for (const airplane of airplanes) {
    const newId = randomUUID();
    airplaneIdMap.set(airplane._id, newId);
    await sql`
      INSERT INTO airplanes (id, airline_id, model, cruise_speed, classes, total_seats, seats, images)
      VALUES (${newId}, ${airplane.airlineId}, ${airplane.model},
              ${JSON.stringify(airplane.cruiseSpeed)}::jsonb, ${airplane.classes},
              ${airplane.totalSeats}, ${JSON.stringify(airplane.seats)}::jsonb, ${airplane.images || []})
    `;
  }

  // Insert airline flight prices
  for (const price of airlineFlightPrices) {
    await sql`
      INSERT INTO airline_flight_prices (airline_code, departure_airport_code, arrival_airport_code, distance, base_price, discount, service_fee, taxes)
      VALUES (${price.airlineCode}, ${price.departureAirportCode}, ${price.arrivalAirportCode},
              ${JSON.stringify(price.distance)}::jsonb, ${JSON.stringify(price.basePrice)}::jsonb,
              ${JSON.stringify(price.discount)}::jsonb, ${JSON.stringify(price.serviceFee)}::jsonb,
              ${JSON.stringify(price.taxes)}::jsonb)
    `;
  }

  // Insert flight segments (map airplane IDs)
  const segmentIdMap = new Map<string, string>();
  for (const segment of flightSegments) {
    const newId = randomUUID();
    segmentIdMap.set(segment._id, newId);
    const newAirplaneId = airplaneIdMap.get(segment.airplaneId);
    await sql`
      INSERT INTO flight_segments (id, flight_number, date, airline_id, airplane_id, from_airport, scheduled_departure, from_terminal, from_gate,
                                  to_airport, scheduled_arrival, to_terminal, to_gate, duration_minutes, fare_details, baggage_allowance, seats, status, expire_at)
      VALUES (${newId}, ${segment.flightNumber}, ${segment.date}, ${segment.airlineId}, ${newAirplaneId},
              ${segment.from.airport}, ${segment.from.scheduledDeparture}, ${segment.from.terminal || null}, ${segment.from.gate || null},
              ${segment.to.airport}, ${segment.to.scheduledArrival}, ${segment.to.terminal || null}, ${segment.to.gate || null},
              ${Math.floor(segment.durationMinutes)}, ${JSON.stringify(segment.fareDetails)}::jsonb,
              ${JSON.stringify(segment.baggageAllowance)}::jsonb, '{}'::uuid[], ${segment.status}, ${segment.expireAt})
    `;
  }
  // Insert flight seats (map segment IDs)
  for (const seat of flightSeats) {
    const newSegmentId = segmentIdMap.get(seat.segmentId);
    if (!newSegmentId) continue;
    const newAirplaneId = airplaneIdMap.get(seat.airplaneId);
    await sql`
      INSERT INTO flight_seats (id, seat_number, airplane_id, segment_id, class, reservation, expire_at)
      VALUES (${randomUUID()}, ${seat.seatNumber}, ${newAirplaneId}, ${newSegmentId}, ${seat.class},
              ${JSON.stringify(seat.reservation)}::jsonb, ${seat.expireAt})
    `;
  }

  // Insert flight itineraries (map segment IDs)
  for (const itinerary of flightItineraries) {
    const newId = randomUUID();
    const realSegmentIds = itinerary.segmentIds.map((sid: string) => segmentIdMap.get(sid)).filter(Boolean);
    await sql`
      INSERT INTO flight_itineraries (id, flight_code, date, carrier_in_charge, departure_airport_id, arrival_airport_id,
                                      segment_ids, total_duration_minutes, layovers, baggage_allowance, status, expire_at)
      VALUES (${newId}, ${itinerary.flightCode}, ${itinerary.date}, ${itinerary.carrierInCharge},
              ${itinerary.departureAirportId}, ${itinerary.arrivalAirportId}, ${realSegmentIds}::uuid[],
              ${Math.floor(itinerary.totalDurationMinutes)}, ${JSON.stringify(itinerary.layovers)}::jsonb,
              ${JSON.stringify(itinerary.baggageAllowance)}::jsonb, ${itinerary.status}, ${itinerary.expireAt})
    `;
  }

  console.log(`   Inserted ${airports.length} airports, ${airlines.length} airlines, ${flightItineraries.length} flight itineraries.`);
}

async function seedHotelsPostgres() {
  // Clear hotel data before inserting (respect foreign keys) -- No Need for it as the Glopal command at the top will do this
  //await sql`TRUNCATE TABLE hotel_rooms, hotels CASCADE`;
  console.log('   Generating hotels data for PostgreSQL...');
  const { hotel: hotels, hotelRoom: rooms } = await generateHotelsDB();
  // Insert hotels
  for (const hotel of hotels) {
    // Ensure address has city and country
    if (!hotel.address) {
      hotel.address = { city: 'Unknown City', country: 'Unknown Country' };
    } else {
      hotel.address.city = hotel.address.city || 'Unknown City';
      hotel.address.country = hotel.address.country || 'Unknown Country';
    }
    // 1. // Ensure address is a plain object (defensive)
    let addressObj = hotel.address;
    if (typeof addressObj === 'string') {
      try {
        addressObj = JSON.parse(addressObj);
      } catch {
        addressObj = {};
      }
    }
    // 2. Fallback for missing city/country to Re‑apply defaults just in case
    addressObj = {
      streetAddress: addressObj.streetAddress || '',
      city: addressObj.city || 'Unknown City',
      stateProvince: addressObj.stateProvince || '',
      postalCode: addressObj.postalCode || '',
      country: addressObj.country || 'Unknown Country',
    };
    const hotelId = randomUUID();
    // 👇 if you don't want to have any field as String,
    // Pass the object directly, no JSON.stringify + ::jsonb - EX:
    // Remove the ${JSON.stringify(addressObj)}::jsonb, and put just 
    await sql`
      INSERT INTO hotels (
        id, slug, name, description, category, parking_included,
        last_renovation_date, is_deleted, address, coordinates,
        amenities, features, images, tags, policies, total_rooms, status
      ) VALUES (
        ${hotelId},
        ${hotel.slug},
        ${hotel.name},
        ${hotel.description ?? null},
        ${hotel.category ?? null},
        ${hotel.parkingIncluded ?? false},
        ${hotel.lastRenovationDate ? new Date(hotel.lastRenovationDate) : null},
        ${hotel.isDeleted ?? false},
        ${addressObj},                     -- object → jsonb automatically
        ${hotel.coordinates ?? {}},        -- object → jsonb
        ${hotel.amenities ?? []},
        ${hotel.features ?? []},
        ${hotel.images ?? []},
        ${hotel.tags ?? []},
        ${hotel.policies ?? {}},           -- object → jsonb
        ${hotel.totalRooms ?? 0},
        ${hotel.status ?? 'Opened'}
      )
    `;

    // Insert rooms
    for (const room of rooms.filter(r => r.hotelId === hotel._id)) {
      // if you want the price as an object then ${room.price ?? {}}, 
      await sql`
        INSERT INTO hotel_rooms (
          id, hotel_id, room_number, description, room_type, bed_options,
          sleeps_count, floor, total_beds, smoking_allowed, max_adults,
          max_children, extra_bed_allowed, tags, price, images, amenities, features
        ) VALUES (
          ${randomUUID()},
          ${hotelId},
          ${room.roomNumber ?? null},
          ${room.description ?? null},
          ${room.roomType ?? null},
          ${room.bedOptions ?? null},
          ${room.sleepsCount ?? 0},
          ${room.floor ?? null},
          ${room.totalBeds ?? 1},
          ${room.smokingAllowed ?? false},
          ${room.maxAdults ?? 2},
          ${room.maxChildren ?? 0},
          ${room.extraBedAllowed ?? false},
          ${room.tags ?? []},
          ${JSON.stringify(room.price ?? {})}::jsonb,
          ${room.images ?? []},
          ${room.amenities ?? []},
          ${room.features ?? []}
        )
      `;
    }
  }
  console.log(` Inserted ${hotels.length} hotels, ${rooms.length} hotel rooms.`);
}