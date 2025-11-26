-- Users table extended by supabase auth
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  wallet_address text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE listings (
  id bigint PRIMARY KEY,
  owner uuid REFERENCES profiles(id),
  onchain_listing_id bigint,
  title text,
  description text,
  price_per_night numeric,
  cid text, -- IPFS CID for full metadata (images etc.)
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

CREATE TABLE bookings (
  id bigint PRIMARY KEY,
  onchain_booking_id bigint,
  listing_id bigint REFERENCES listings(id),
  renter uuid REFERENCES profiles(id),
  amount numeric,
  status text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX ON listings (owner);
CREATE INDEX ON bookings (listing_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING ( true );
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING ( auth.uid() = id );

CREATE POLICY "Listings are viewable by everyone." ON listings FOR SELECT USING ( true );
CREATE POLICY "Users can insert their own listings." ON listings FOR INSERT WITH CHECK ( auth.uid() = owner );
CREATE POLICY "Users can update own listings." ON listings FOR UPDATE USING ( auth.uid() = owner );

CREATE POLICY "Bookings are viewable by owner and renter." ON bookings FOR SELECT USING ( auth.uid() = renter OR auth.uid() IN (SELECT owner FROM listings WHERE id = listing_id) );
