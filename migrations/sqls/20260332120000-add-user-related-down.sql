-- =====================================================
-- Drop tables in reverse order of dependencies
-- =====================================================

-- Tables that reference users, flight_itineraries, hotels
DROP TABLE IF EXISTS favourites;
DROP TABLE IF EXISTS search_history;
DROP TABLE IF EXISTS user_flight_bookmarks;
DROP TABLE IF EXISTS user_hotel_bookmarks;
DROP TABLE IF EXISTS website_reviews;
DROP TABLE IF EXISTS user_emails;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS sessions;

-- Tables without dependencies on other tables we just dropped
DROP TABLE IF EXISTS anonymous_users;
DROP TABLE IF EXISTS promo_codes;
DROP TABLE IF EXISTS website_config;
DROP TABLE IF EXISTS analytics;


-- Note: The following tables were already covered in other migrations or are base tables:
-- users, customers, invoices, revenue, posts, products, verification_tokens, verification_codes, password_reset_tokens,
-- comments, comment_reactions, post_reactions, airlines, airports, airplanes, airline_flight_prices,
-- flight_itineraries, flight_segments, flight_seats, flight_bookings, flight_payments, flight_reviews,
-- passengers, hotels, hotel_rooms, hotel_guests, hotel_bookings, hotel_payments, hotel_reviews, reservations
-- are handled in the main schema down scripts (20260311170026-initial-schema-down.sql, etc.).