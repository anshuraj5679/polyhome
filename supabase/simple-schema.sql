-- Simple schema without user authentication for easier setup
-- Drop existing tables if they exist
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Listings table (standalone, no foreign keys)
CREATE TABLE listings (
  id bigint PRIMARY KEY,
  onchain_listing_id bigint,
  title text,
  description text,
  price_per_night numeric,
  cid text,
  active boolean DEFAULT true,
  category text,
  rating numeric DEFAULT 0,
  guests int DEFAULT 2,
  bedrooms int DEFAULT 1,
  beds int DEFAULT 1,
  baths int DEFAULT 1,
  cleaning_fee numeric DEFAULT 0,
  service_fee numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Bookings table (simplified)
CREATE TABLE bookings (
  id bigint PRIMARY KEY,
  onchain_booking_id bigint,
  listing_id bigint REFERENCES listings(id),
  amount numeric,
  status text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX ON listings (category);
CREATE INDEX ON listings (active);
CREATE INDEX ON bookings (listing_id);

-- RLS Policies (allow all for now - you can restrict later)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read listings
CREATE POLICY "Anyone can view listings" ON listings FOR SELECT USING (true);

-- Allow anyone to insert listings (you can restrict this later)
CREATE POLICY "Anyone can create listings" ON listings FOR INSERT WITH CHECK (true);

-- Allow anyone to update listings (you can restrict this later)
CREATE POLICY "Anyone can update listings" ON listings FOR UPDATE USING (true);

-- Allow anyone to delete listings (you can restrict this later)
CREATE POLICY "Anyone can delete listings" ON listings FOR DELETE USING (true);

-- Bookings policies
CREATE POLICY "Anyone can view bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Anyone can create bookings" ON bookings FOR INSERT WITH CHECK (true);
