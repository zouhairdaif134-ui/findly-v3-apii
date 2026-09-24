import { getSupabase } from "../lib/supabase.js";

export async function getContent(env, botSlug, categorySlug) {
  const supabase = getSupabase(env);

  let query = supabase
    .from("content_items")
    .select(
      "id, bot_id, category_id, content_type, title, description, image_url, external_url, metadata, is_active, published_at, created_at, updated_at"
    )
    .eq("is_active", true)
    .order("published_at", { ascending: false, nullsFirst: false });

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

  if (categorySlug) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();

    if (categoryError) {
      throw categoryError;
    }

    query = query.eq("category_id", category.id);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}
