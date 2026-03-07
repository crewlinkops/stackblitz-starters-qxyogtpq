-- Add industry and onboarding metadata to businesses
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS onboarded boolean DEFAULT false;

-- Potential industry types: 'plumbing', 'hvac', 'electrical', 'pest_control', 'general_contracting', 'cleaning', 'landscaping'
