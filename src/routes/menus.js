import { getSupabase } from "../lib/supabase.js";

export async function getMenus(env, botSlug) {
  const supabase = getSupabase(env);

  let query = supabase
    .from("menu_items")
    .select(
      "id, bot_id, parent_id, title, slug, item_type, action, icon, sort_order, is_active"
    )
    .order("sort_order", { ascending: true });

  if (botSlug) {
    const { data: bot, error: botError } = await supabase
      .from("bots")
      .select("id")
      .eq("slug", botSlug)
      .single();

    if (botError) {
      throw botError;
    }

    query = query.eq("bot_id", bot.id);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}
