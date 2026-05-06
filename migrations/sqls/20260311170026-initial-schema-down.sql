-- Then drop tables that may reference users indirectly
DROP TABLE IF EXISTS verification_codes;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS verification_tokens;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS revenue;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS customers;
-- Finally drop users
DROP TABLE IF EXISTS users;