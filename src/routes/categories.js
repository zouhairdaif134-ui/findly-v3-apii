import { getSupabase } from "../lib/supabase.js";

export async function getCategories(env) {
  const supabase = getSupabase(env);

  const { data, error } = await supabase
    .from("categories")
    .select(
      "id, name, slug, description, icon, is_active, sort_order"
    )
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}
