-- =====================================================
-- Drop flight tables in reverse dependency order
-- =====================================================

-- 1. Tables that reference flight_bookings
DROP TABLE IF EXISTS flight_payments CASCADE;

-- 2. Tables that reference users, airlines, airports (but not flight_bookings)
DROP TABLE IF EXISTS flight_reviews CASCADE;

-- 3. Tables that reference flight_itineraries, users, passengers
DROP TABLE IF EXISTS flight_bookings CASCADE;

-- 4. Tables that reference flight_segments
DROP TABLE IF EXISTS flight_seats CASCADE;

-- 5. Tables that reference airlines, airplanes, airports
DROP TABLE IF EXISTS flight_segments CASCADE;

-- 6. Tables that reference airlines, airports
DROP TABLE IF EXISTS flight_itineraries CASCADE;

-- 7. Tables that reference airlines, airports
DROP TABLE IF EXISTS airline_flight_prices CASCADE;

-- 8. Tables that reference airlines
DROP TABLE IF EXISTS airplanes CASCADE;

-- 9. Independent tables that are referenced by others
DROP TABLE IF EXISTS airports CASCADE;
DROP TABLE IF EXISTS airlines CASCADE;

-- 10. Passengers table (shared with hotels, no foreign keys to flight tables)
DROP TABLE IF EXISTS passengers CASCADE;