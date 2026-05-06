-- =====================================================
-- PostgreSQL Schema for Dual‑Database Travel Agency
-- =====================================================
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid() in some tables
-- =====================================================
-- 1. Core tables (already present, extended)
-- =====================================================
-- Users table – extended to include old project fields
CREATE TABLE IF NOT EXISTS users (
    -- Existing fields
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255),                          -- kept for compatibility
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    image TEXT,                                 -- profile image
    phone TEXT,                                 -- single phone number (for backwards compatibility)
    city TEXT,
    about TEXT,
    birth_date DATE,                            -- original date of birth
    role VARCHAR(50) DEFAULT 'user',
    -- New fields from old project
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    address TEXT,
    cover_image TEXT,                           -- cover photo
    phone_numbers JSONB DEFAULT '[]',           -- array of { number, dialCode, primary, verifiedAt, inVerification }
    emails JSONB DEFAULT '[]',                  -- array of { email, emailVerifiedAt, primary, inVerification }
    customer_id TEXT,                           -- Stripe customer id
    flights JSONB DEFAULT '{}',
    hotels JSONB DEFAULT '{}',
    flight_bookmarks JSONB DEFAULT '[]',        -- [{ flightId, searchState }]
    hotel_bookmarks JSONB DEFAULT '[]',         -- [ hotelId ]
    reward_points JSONB DEFAULT '{}' ,           -- { totalPoints, pointHistory }
    user_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table (already have some, add missing)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
-- For JSONB fields (optional but helpful)
CREATE INDEX IF NOT EXISTS idx_users_emails ON users USING GIN(emails);
CREATE INDEX IF NOT EXISTS idx_users_phone_numbers ON users USING GIN(phone_numbers);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL
);
-- Queries often join customers.user_id or filter by email.
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID NOT NULL,
  amount INT NOT NULL,
  status VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  items JSONB,
  shipping_info JSONB,
  payment_intent_id TEXT,
  payment_method TEXT,
  payment_reference TEXT
);
-- Queries filter by customer_id, status, date, and join with customers.
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);

-- Revenue table
CREATE TABLE IF NOT EXISTS revenue (
  month VARCHAR(4) NOT NULL UNIQUE,
  revenue INT NOT NULL
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  slug TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  images TEXT[]
);
-- Queries often filter by user_id, created_at, and join with users. Also, slug is primary key for posts.
-- Search by user_id (when fetching user’s posts) and created_at (sorting).
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Queries often filter by type and name.
-- Search by type (filtering) and name (search).
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Verification tokens table
-- Table for generic verification codes (password reset, email confirmation, etc.)
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  identifier TEXT NOT NULL,      -- can be email address or user ID
  -- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, --for the base project but not flexible like identifier
  token TEXT NOT NULL UNIQUE, -- can be numeric code or UUID string
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Verification tokens
CREATE INDEX IF NOT EXISTS idx_verification_tokens_identifier ON verification_tokens(identifier);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON verification_tokens(expires);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Password reset tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires);




