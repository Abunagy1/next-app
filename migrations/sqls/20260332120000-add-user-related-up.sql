-- =====================================================
-- PostgreSQL Schema for Dual‑Database Travel Agency
-- =====================================================
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid() in some tables
-- =====================================================
-- 3. Search History and Analytics (from old project)
-- =====================================================
-- Favourites (flights and hotels)
CREATE TABLE IF NOT EXISTS favourites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('flight', 'hotel')),
    item_id TEXT NOT NULL, -- flight itinerary id or hotel id
    search_state JSONB, -- for flights, store search state
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, type, item_id)
);
-- favourites
-- Queries filter by user_id, type, and item_id (to check if a specific item is favourited).
-- For user_id, type, and item_id, we can create standard indexes since we often query favourites by user and type (e.g., get all flight favourites for a user) or check if a specific item is favourited by a user.
-- For search_state, we can create a GIN index if we often query based on specific keys/values in the search_state JSONB (e.g., find all favourites with a specific origin or destination).
-- For example, if we frequently query for favourites with a specific origin in the search_state, we can create a GIN index on the search_state column to speed up those queries.
CREATE INDEX IF NOT EXISTS idx_favourites_search_state ON favourites USING GIN(search_state);
CREATE INDEX IF NOT EXISTS idx_favourites_user ON favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_favourites_type ON favourites(type);
CREATE INDEX IF NOT EXISTS idx_favourites_item ON favourites(item_id);
-- Search History
CREATE TABLE IF NOT EXISTS search_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('flight', 'hotel')),
    search_state JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
-- search_history
-- Queries filter by user_id, type, and created_at (for recent searches).
-- For user_id and type, we can create standard indexes since we often query search history by user and type (e.g., recent flight searches).
-- For created_at, we can create an index to speed up queries that filter search history by recent dates (e.g., searches in the last 7 days).
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_type ON search_history(type);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at);
-- User Flight Bookmarks
CREATE TABLE IF NOT EXISTS user_flight_bookmarks (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    flight_id UUID REFERENCES flight_itineraries(id) ON DELETE CASCADE,
    search_state JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, flight_id)
);
-- Promo Codes (if you want to implement promotions)
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

-- User Hotel Bookmarks
CREATE TABLE IF NOT EXISTS user_hotel_bookmarks (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, hotel_id)
);

-- Website Config (single row)
CREATE TABLE IF NOT EXISTS website_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    maintenance_mode JSONB,
    enable_flight_booking BOOLEAN DEFAULT true,
    enable_hotel_booking BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics (single row)
CREATE TABLE analytics (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_users_signed_up INT DEFAULT 0,
  total_accounts_deleted INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- website-reviews
CREATE TABLE IF NOT EXISTS website_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    category VARCHAR(50) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- website_reviews
-- Queries filter by user_id, rating, and category.
-- For user_id, we can create an index since we often query reviews by user (e.g., get all reviews by a user).
-- For rating, we can create an index since we might filter reviews by rating (e.g., get all 5-star reviews).
-- For category, we can create an index since we might filter reviews by category (e.g., get all reviews for a specific category).
CREATE INDEX IF NOT EXISTS idx_website_reviews_category ON website_reviews(category);
CREATE INDEX IF NOT EXISTS idx_website_reviews_user ON website_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_website_reviews_rating ON website_reviews(rating);

-- User Emails (if you prefer separate table instead of JSONB)
-- But we already have emails JSONB in users table, so this is optional.
-- Uncomment if you want a normalized approach.
-- User Emails (for multiple emails per user)
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

-- =====================================================
-- 1. Subscriptions table
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    email_verified TIMESTAMP,
    subscribed BOOLEAN DEFAULT true,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. Anonymous users table
-- =====================================================
CREATE TABLE IF NOT EXISTS anonymous_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    flights JSONB DEFAULT '{}',
    hotels JSONB DEFAULT '{}',
    expire_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- anonymous_users (already have expire_at and session_id, add user_id if needed)
CREATE INDEX IF NOT EXISTS idx_anonymous_users_expire_at ON anonymous_users(expire_at);
CREATE INDEX IF NOT EXISTS idx_anonymous_users_session_id ON anonymous_users(session_id);

-- =====================================================
-- 3. Accounts table (NextAuth)
-- =====================================================
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

-- =====================================================
-- 4. Sessions table (NextAuth)
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    expires TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);