import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  "https://rcebarvpmpxsosclexyg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "YOUR_PUBLISHABLE_KEY";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
