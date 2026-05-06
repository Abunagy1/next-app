-- Enable UUID extension
-- =====================================================
-- PostgreSQL Schema for Dual‑Database Travel Agency
-- =====================================================
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid() in some tables
-- =====================================================
-- 2. Flight Booking Tables (from old project)
-- =====================================================

-- Airlines table (should already exist from initial schema? We'll add if not)
CREATE TABLE IF NOT EXISTS airlines (
    iata_code VARCHAR(3) PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    contact JSONB,
    airline_policy JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Airports table
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

-- Airplanes table
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

-- Airline Flight Prices table
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

-- Flight Itineraries
CREATE TABLE IF NOT EXISTS flight_itineraries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    flight_code TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    carrier_in_charge VARCHAR(3) REFERENCES airlines(iata_code),
    departure_airport_id VARCHAR(3) REFERENCES airports(iata_code),
    arrival_airport_id VARCHAR(3) REFERENCES airports(iata_code),
    segment_ids UUID[],              -- references flight_segments.id
    total_duration_minutes INT,
    layovers JSONB,                  -- array of { fromSegmentIndex, durationMinutes }
    baggage_allowance JSONB,
    status TEXT DEFAULT 'scheduled',
    expire_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- flight_itineraries
-- Indexes for common queries: by departure/arrival airport, date, status, carrier
-- We often search for itineraries by departure/arrival airport and date, and filter by status and carrier.
-- Also, we join with flight_segments, so indexing segment_ids can help.
-- Queries filter by departure_airport_id, arrival_airport_id, date, status, and carrier_in_charge.
CREATE INDEX IF NOT EXISTS idx_flight_itineraries_dep_airport ON flight_itineraries(departure_airport_id);
CREATE INDEX IF NOT EXISTS idx_flight_itineraries_arr_airport ON flight_itineraries(arrival_airport_id);
CREATE INDEX IF NOT EXISTS idx_flight_itineraries_date ON flight_itineraries(date);
CREATE INDEX IF NOT EXISTS idx_flight_itineraries_status ON flight_itineraries(status);
CREATE INDEX IF NOT EXISTS idx_flight_itineraries_carrier ON flight_itineraries(carrier_in_charge);
-- Flight Segments
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
    fare_details JSONB,              -- from airline_flight_prices
    baggage_allowance JSONB,
    seats UUID[],                    -- references flight_seats.id
    status TEXT DEFAULT 'scheduled',
    expire_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- flight_segments
-- Queries filter by flight_number, date, airline_id, and from_airport/to_airport.
CREATE INDEX IF NOT EXISTS idx_flight_segments_flight_number ON flight_segments(flight_number);
CREATE INDEX IF NOT EXISTS idx_flight_segments_date ON flight_segments(date);
CREATE INDEX IF NOT EXISTS idx_flight_segments_airline ON flight_segments(airline_id);
CREATE INDEX IF NOT EXISTS idx_flight_segments_from_airport ON flight_segments(from_airport);
CREATE INDEX IF NOT EXISTS idx_flight_segments_to_airport ON flight_segments(to_airport);
-- Flight Seats
CREATE TABLE IF NOT EXISTS flight_seats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seat_number TEXT NOT NULL,
    airplane_id UUID REFERENCES airplanes(id),
    segment_id UUID REFERENCES flight_segments(id) ON DELETE CASCADE,
    class TEXT,                     -- economy, premium_economy, business, first
    reservation JSONB,               -- { pnrCode, for, type, expiresAt }
    expire_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- flight_seats
-- Queries filter by segment_id and class, and check reservation status.
-- Queries filter by segment_id and class (when searching for available seats).
CREATE INDEX IF NOT EXISTS idx_flight_seats_segment ON flight_seats(segment_id);
CREATE INDEX IF NOT EXISTS idx_flight_seats_class ON flight_seats(class);
-- Flight Bookings
CREATE TABLE IF NOT EXISTS flight_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pnr_code TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    flight_itinerary_id UUID REFERENCES flight_itineraries(id),
    segment_ids UUID[],              -- array of segment ids
    passengers UUID[],               -- references passengers.id
    selected_seats JSONB,            -- array of { passengerId, seatId }
    fare_breakdown JSONB,
    total_fare DECIMAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    promo_code TEXT,
    payment_status TEXT DEFAULT 'pending',
    ticket_status TEXT DEFAULT 'pending',
    cancellation_info JSONB,
    refund_info JSONB,
    payment_id UUID,                 -- references flight_payments.id
    earned_miles INT DEFAULT 0,
    guaranteed_reservation_until TIMESTAMP,
    user_time_zone TEXT,
    source TEXT DEFAULT 'web',
    booked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- flight_bookings
-- Queries filter by user_id, flight_itinerary_id, payment_status, ticket_status, and pnr_code.
CREATE INDEX IF NOT EXISTS idx_flight_bookings_user ON flight_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_itinerary ON flight_bookings(flight_itinerary_id);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_payment_status ON flight_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_ticket_status ON flight_bookings(ticket_status);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_pnr ON flight_bookings(pnr_code);
-- Flight Payments
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

-- Flight Reviews
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
-- flight_reviews
-- Queries filter by reviewer_id, rating, and airline_id.
-- For reviewer_id, we can create an index since we often query reviews by user (e.g., get all reviews by a user).
-- For rating, we can create an index since we might filter reviews by rating (e.g., get all 5-star reviews).
-- For airline_id, we can create an index since we often query reviews for a specific airline (e.g., get all reviews for a specific airline).
-- Filter by reviewer_id, rating, and foreign keys.
CREATE INDEX IF NOT EXISTS idx_flight_reviews_reviewer ON flight_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_flight_reviews_rating ON flight_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_flight_reviews_airline ON flight_reviews(airline_id);

-- Passengers (shared with hotels)
CREATE TABLE IF NOT EXISTS passengers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    title TEXT,
    date_of_birth DATE NOT NULL,
    gender TEXT,
    address JSONB,
    passenger_type TEXT,             -- adult, child, infant
    email TEXT,
    phone_number JSONB,              -- { number, dialCode }
    passport_number TEXT,
    passport_expiry_date DATE,
    country TEXT,
    visa_details JSONB,
    redress_number TEXT,
    known_traveler_number TEXT,
    frequent_flyer_number TEXT,
    frequent_flyer_airline TEXT,
    seat_class TEXT,                 -- economy, premium_economy, business, first
    is_primary BOOLEAN DEFAULT false,
    preferences JSONB,               -- seat, meal, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- passengers
-- Queries filter by passenger_type, email, and whether they are primary.
-- For passenger_type, we can create an index since we often query passengers by their type (e.g., when counting adults vs. children).
-- For email, we can create an index since we might search for passengers by email (e.g., when looking up a passenger's bookings).
-- For is_primary, we can create an index since we often query for the primary passenger in a booking.
CREATE INDEX IF NOT EXISTS idx_passengers_type ON passengers(passenger_type);
CREATE INDEX IF NOT EXISTS idx_passengers_email ON passengers(email);
CREATE INDEX IF NOT EXISTS idx_passengers_primary ON passengers(is_primary);