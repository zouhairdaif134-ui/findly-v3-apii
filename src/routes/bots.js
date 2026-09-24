import { getSupabase } from "../lib/supabase.js";

export async function getBots(env) {
  const supabase = getSupabase(env);

  const { data, error } = await supabase
    .from("bots")
    .select(
      "id, name, slug, bot_type, telegram_username, description, icon, is_active, sort_order"
    )
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}
