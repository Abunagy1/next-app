-- =====================================================
-- Drop hotel tables in reverse dependency order
-- =====================================================

-- 1. Tables that depend on hotel_bookings (child tables)
DROP TABLE IF EXISTS hotel_guests CASCADE;
DROP TABLE IF EXISTS hotel_payments CASCADE;

-- 2. Tables that depend on hotels or hotel_rooms
DROP TABLE IF EXISTS hotel_reviews CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;

-- 3. Tables that depend on hotels (but not on the above)
DROP TABLE IF EXISTS hotel_bookings CASCADE;

-- 4. Tables that depend on hotels
DROP TABLE IF EXISTS hotel_rooms CASCADE;

-- 5. Finally, drop the hotels table
DROP TABLE IF EXISTS hotels CASCADE;