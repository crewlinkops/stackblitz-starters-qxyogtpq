/*
  # Create core Crewlink schema

  1. New Tables
    - `services`
      - `id` (serial, primary key)
      - `business_slug` (text) - References which business offers this service
      - `name` (text) - Service name (e.g., "Plumbing Repair", "HVAC Installation")
      - `description` (text, nullable) - Detailed service description
      - `duration_min` (integer, nullable) - Estimated duration in minutes
      - `price_cents` (integer, nullable) - Price in cents
      - `active` (boolean) - Whether service is currently offered
      - `created_at` (timestamptz)

    - `technicians`
      - `id` (serial, primary key)
      - `business_slug` (text) - Which business this tech works for
      - `name` (text) - Technician's full name
      - `email` (text, nullable) - Contact email
      - `phone` (text, nullable) - Contact phone
      - `active` (boolean) - Whether tech is currently available for assignments
      - `notify_by_email` (boolean) - Send email notifications for new bookings
      - `created_at` (timestamptz)

    - `time_slots`
      - `id` (serial, primary key)
      - `business_slug` (text) - Which business this slot belongs to
      - `start_time` (timestamptz) - Slot start time
      - `end_time` (timestamptz) - Slot end time
      - `technician_id` (integer, nullable) - Assigned technician (FK to technicians)
      - `status` (text) - 'open', 'booked', 'blocked'
      - `booking_id` (integer, nullable) - Related booking if status is 'booked'
      - `created_at` (timestamptz)

    - `bookings`
      - `id` (serial, primary key)
      - `business_slug` (text) - Which business this booking is for
      - `customer_name` (text) - Customer's name
      - `customer_email` (text) - Customer's email for confirmation
      - `customer_phone` (text, nullable) - Customer's phone
      - `service_id` (integer) - Requested service (FK to services)
      - `preferred_time` (timestamptz) - Customer's preferred appointment time
      - `start_time` (timestamptz, nullable) - Actual scheduled start time
      - `end_time` (timestamptz, nullable) - Actual scheduled end time
      - `assigned_technician_id` (integer, nullable) - Assigned tech (FK to technicians)
      - `status` (text) - 'new', 'confirmed', 'in_progress', 'completed', 'cancelled'
      - `notes` (text, nullable) - Internal notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public can read services (for booking page)
    - Public can insert bookings (for customer booking)
    - Public can read open time_slots (for booking page)
    - Authenticated users have full access to all tables (for admin)

  3. Indexes
    - Index on business_slug for all tables (common filter)
    - Index on time_slots.status for finding open slots
    - Index on bookings.status for filtering

  4. Notes
    - All times stored in UTC (timestamptz)
    - Prices in cents to avoid floating point issues
    - Foreign keys use integer IDs for simplicity
    - business_slug used instead of FK to businesses table for flexibility
*/

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id serial PRIMARY KEY,
  business_slug text NOT NULL,
  name text NOT NULL,
  description text,
  duration_min integer,
  price_cents integer,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_business_slug ON services(business_slug);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON services
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "Authenticated users can view all services"
  ON services
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert services"
  ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update services"
  ON services
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete services"
  ON services
  FOR DELETE
  TO authenticated
  USING (true);

-- Technicians table
CREATE TABLE IF NOT EXISTS technicians (
  id serial PRIMARY KEY,
  business_slug text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  active boolean DEFAULT true,
  notify_by_email boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_technicians_business_slug ON technicians(business_slug);

ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view technicians"
  ON technicians
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert technicians"
  ON technicians
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update technicians"
  ON technicians
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete technicians"
  ON technicians
  FOR DELETE
  TO authenticated
  USING (true);

-- Time slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id serial PRIMARY KEY,
  business_slug text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  technician_id integer,
  status text DEFAULT 'open' CHECK (status IN ('open', 'booked', 'blocked')),
  booking_id integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_slots_business_slug ON time_slots(business_slug);
CREATE INDEX IF NOT EXISTS idx_time_slots_status ON time_slots(status);
CREATE INDEX IF NOT EXISTS idx_time_slots_start_time ON time_slots(start_time);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open time slots"
  ON time_slots
  FOR SELECT
  TO anon, authenticated
  USING (status = 'open');

CREATE POLICY "Authenticated users can view all time slots"
  ON time_slots
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert time slots"
  ON time_slots
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update time slots"
  ON time_slots
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can update open time slots to booked"
  ON time_slots
  FOR UPDATE
  TO anon, authenticated
  USING (status = 'open')
  WITH CHECK (status = 'booked');

CREATE POLICY "Authenticated users can delete time slots"
  ON time_slots
  FOR DELETE
  TO authenticated
  USING (true);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id serial PRIMARY KEY,
  business_slug text NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  service_id integer NOT NULL,
  preferred_time timestamptz NOT NULL,
  start_time timestamptz,
  end_time timestamptz,
  assigned_technician_id integer,
  status text DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_business_slug ON bookings(business_slug);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create bookings"
  ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on bookings
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();