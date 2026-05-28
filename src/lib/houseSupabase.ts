import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.HOUSE_SUPABASE_URL;
const supabaseAnonKey = process.env.HOUSE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing HOUSE_SUPABASE_URL or HOUSE_SUPABASE_ANON_KEY.");
}

export const houseSupabase = createClient(supabaseUrl, supabaseAnonKey);