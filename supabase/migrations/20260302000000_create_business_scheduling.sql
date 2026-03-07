/*
  # Create business_scheduling table

  1. New Tables
    - `business_scheduling`
      - `id` (serial, primary key)
      - `business_slug` (text, unique) - Links to businesses table slug
      - `work_start` (time) - Standard workday start time
      - `work_end` (time) - Standard workday end time
      - `lunch_start` (time, nullable) - Lunch start time
      - `lunch_end` (time, nullable) - Lunch end time
      - `slot_duration_min` (integer) - Default slot duration in minutes
      - `buffer_min` (integer) - Buffer between slots in minutes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Authenticated users (admins) can manage their business scheduling
    - Anyone can view scheduling settings (public booking page needs duration/buffer)
*/

CREATE TABLE IF NOT EXISTS business_scheduling (
  id serial PRIMARY KEY,
  business_slug text NOT NULL UNIQUE,
  work_start time NOT NULL DEFAULT '09:00:00',
  work_end time NOT NULL DEFAULT '17:00:00',
  lunch_start time,
  lunch_end time,
  slot_duration_min integer NOT NULL DEFAULT 60,
  buffer_min integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_business_scheduling_slug ON business_scheduling(business_slug);

-- RLS
ALTER TABLE business_scheduling ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business scheduling"
  ON business_scheduling
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage business scheduling"
  ON business_scheduling
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_business_scheduling_updated_at
  BEFORE UPDATE ON business_scheduling
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
