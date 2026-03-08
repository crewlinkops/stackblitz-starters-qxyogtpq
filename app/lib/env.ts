// DO NOT commit these to a public GitHub repo later.
// StackBlitz is sandboxed and safe for development only.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
export const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
export const GOOGLE_REDIRECT_URI = (process.env.GOOGLE_REDIRECT_URI || 'https://gocrewlink.com/api/google-calendar/callback').trim();
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://gocrewlink.com').trim();
export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
