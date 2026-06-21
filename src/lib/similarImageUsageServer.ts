import "server-only";

import { createClient } from "@supabase/supabase-js";

type SimilarSource = "google_lens" | "pinterest";
type SimilarStatus = "success" | "failed" | "skipped_limit";

type UsageLimitRow = {
  access_type?: string | null;
  subscription_status?: string | null;
  subscription_ends_at?: string | null;
  is_lifetime_free?: boolean | null;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function cleanError(value: unknown) {
  return String(value || "")
    .replace(/api[_-]?key=[^&\s]+/gi, "api_key=[redacted]")
    .replace(/key=[^&\s]+/gi, "key=[redacted]")
    .slice(0, 240);
}

function isActivePaidSubscription(row: UsageLimitRow | null) {
  if (!row || row.subscription_status !== "active") return false;
  if (!row.subscription_ends_at) return false;
  return new Date(row.subscription_ends_at).getTime() > Date.now();
}

export async function getSimilarImageUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) return { supabase: getSupabaseAdmin(), userId: null };

  const supabase = getSupabaseAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  return { supabase, userId: user?.id || null };
}

export async function getGoogleLensDailyLimit(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("user_usage_limits")
    .select("access_type, subscription_status, subscription_ends_at, is_lifetime_free")
    .eq("user_id", userId)
    .maybeSingle<UsageLimitRow>();

  const accessType = data?.access_type || "free_trial";

  if (
    data?.is_lifetime_free === true ||
    accessType === "lifetime_free" ||
    accessType === "admin"
  ) {
    return { accessType, limit: 20 };
  }

  if (
    accessType === "paid_monthly" ||
    accessType === "paid_yearly" ||
    isActivePaidSubscription(data || null)
  ) {
    return { accessType, limit: 10 };
  }

  return { accessType, limit: 1 };
}

export async function getGoogleLensUsageCount(userId: string) {
  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("similar_image_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("source", "google_lens")
    .in("status", ["success", "failed"])
    .gte("created_at", since);

  if (error) return 0;
  return count || 0;
}

export async function logSimilarImageUsage(
  userId: string | null,
  source: SimilarSource,
  status: SimilarStatus,
  errorMessage?: unknown,
) {
  if (!userId) return;

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("similar_image_usage_logs").insert({
      user_id: userId,
      source,
      status,
      error_message: errorMessage ? cleanError(errorMessage) : null,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[KISHIB similar] usage log skipped", {
        source,
        status,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
