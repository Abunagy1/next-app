-- =====================================================
-- PostgreSQL Schema for Dual‑Database Travel Agency
-- =====================================================
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid() in some tables
-- =====================================================
-- 2. Hotel Booking Tables (from old project)
-- =====================================================
-- Hotels
CREATE TABLE IF NOT EXISTS hotels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    parking_included BOOLEAN,
    last_renovation_date DATE,
    is_deleted BOOLEAN DEFAULT false,
    address JSONB,                   -- { streetAddress, city, stateProvince, postalCode, country }
    coordinates JSONB,               -- { lat, lon }
    amenities TEXT[],
    features TEXT[],
    images TEXT[],
    tags TEXT[],
    policies JSONB,                  -- checkIn, checkOut, cancellation, refund, etc.
    total_rooms INT,
    status TEXT DEFAULT 'Opened',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- hotels
-- Queries filter by slug (unique – already indexed), city/country (inside JSONB address
-- use GIN index), status, and amenities/features (array columns).
-- For JSONB address fields (e.g., address->>'city'), we can create expression indexes to speed up queries filtering by city or country.
CREATE INDEX IF NOT EXISTS idx_hotels_slug ON hotels(slug);
CREATE INDEX IF NOT EXISTS idx_hotels_name ON hotels(name);
CREATE INDEX IF NOT EXISTS idx_hotels_address_city ON hotels((address->>'city'));
CREATE INDEX IF NOT EXISTS idx_hotels_address_country ON hotels((address->>'country'));
-- For array columns like amenities and features, we can use GIN indexes to speed up queries that check for the presence of specific amenities or features.
CREATE INDEX IF NOT EXISTS idx_hotels_amenities ON hotels USING GIN(amenities);
CREATE INDEX IF NOT EXISTS idx_hotels_features ON hotels USING GIN(features);
CREATE INDEX IF NOT EXISTS idx_hotels_status ON hotels(status);

-- Hotel Rooms
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
    price JSONB,                     -- { base, tax, discount, serviceFee, currency }
    images TEXT[],
    amenities TEXT[],
    features TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- hotel_rooms
-- Queries filter by hotel_id, room_type, price range (price->>'base'), amenities/features (array columns), and tags.
-- For hotel_id, we can create a standard index since we often query rooms by their hotel.
-- For price range queries, we can create an expression index on the base price (price->>'base') to speed up filtering rooms by price.
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_hotel ON hotel_rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_type ON hotel_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_price ON hotel_rooms((price->>'base'));
-- Hotel Guests (temporary, before booking is confirmed)
CREATE TABLE IF NOT EXISTS hotel_guests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    hotel_booking_id UUID,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    guest_type TEXT,                 -- adult, child, infant
    age INT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Hotel Bookings
CREATE TABLE IF NOT EXISTS hotel_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    hotel_id UUID REFERENCES hotels(id),
    rooms UUID[],                    -- references hotel_rooms.id
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guests UUID[],                   -- references hotel_guests.id
    fare_breakdown JSONB,
    total_price DECIMAL,
    booking_status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT,
    payment_id UUID,                 -- references hotel_payments.id
    refund_info JSONB,
    guaranteed_reservation_until TIMESTAMP,
    source TEXT DEFAULT 'web',
    booked_at TIMESTAMP,
    promo_code TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- hotel_bookings
-- Queries filter by user_id, hotel_id, check_in_date, check_out_date, booking_status, payment_status.
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_user ON hotel_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_hotel ON hotel_bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_dates ON hotel_bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_status ON hotel_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_payment_status ON hotel_bookings(payment_status);
-- Hotel Payments
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

-- Hotel Reviews
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
-- hotel_reviews
-- Queries filter by reviewer_id, rating, and hotel_id.
-- For reviewer_id, we can create an index since we often query reviews by user (e.g., get all reviews by a user).
-- For rating, we can create an index since we might filter reviews by rating (e.g., get all 5-star reviews).
-- For hotel_id, we can create an index since we often query reviews for a specific hotel (e.g., get all reviews for a specific hotel).
CREATE INDEX IF NOT EXISTS idx_hotel_reviews_reviewer ON hotel_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_hotel_reviews_rating ON hotel_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_hotel_reviews_hotel ON hotel_reviews(hotel_id);
-- Reservations (legacy, maybe used for hotel bookings)
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