import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.HOUSE_SUPABASE_URL;
const supabaseAnonKey = process.env.HOUSE_SUPABASE_ANON_KEY;

export const houseSupabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function hasHouseSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
