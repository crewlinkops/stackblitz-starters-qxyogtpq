-- Migration to add field service specific columns to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS customer_address text,
ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'normal' CHECK (urgency IN ('emergency', 'high', 'normal', 'flexible'));
