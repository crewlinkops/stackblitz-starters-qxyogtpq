import { createClient } from "@supabase/supabase-js";

// Hard-coded for StackBlitz dev environment.
// These values come from your Supabase project's API settings.
const SUPABASE_URL = "https://znfyliewyfutjjxntczh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZnlsaWV3eWZ1dGpqeG50Y3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzYzNTksImV4cCI6MjA3OTY1MjM1OX0.pmHVj-ttZYeU45292_wZI-PcNzrRMEJMwVhCDX_bTzE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
