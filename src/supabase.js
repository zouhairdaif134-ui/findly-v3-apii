import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  "https://rcebarvpmpxsosclexyg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_RKDieHYjjBXkT3iV7YlW5w_fND0QxaG";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
