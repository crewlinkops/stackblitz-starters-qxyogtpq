/*
  # Add businesses table and Calendly integration support

  1. New Tables
    - `businesses`
      - `id` (integer, primary key, auto-increment)
      - `slug` (text, unique) - URL-friendly identifier for the business
      - `name` (text) - Business display name
      - `calendly_url` (text, nullable) - Calendly scheduling page URL
      - `created_at` (timestamptz) - Record creation timestamp

  2. Changes to Existing Tables
    - No changes to existing tables (services, bookings, etc. already reference business_slug)

  3. Security
    - Enable RLS on `businesses` table
    - Add policies for public read access (customers need to view business info)
    - Add policies for authenticated admin access

  4. Notes
    - If calendly_url is set, the booking page will show Calendly widget instead of custom booking form
    - This allows gradual migration: businesses without calendly_url continue using the existing system
*/

CREATE TABLE IF NOT EXISTS businesses (
  id serial PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  calendly_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view businesses"
  ON businesses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete businesses"
  ON businesses
  FOR DELETE
  TO authenticated
  USING (true);
