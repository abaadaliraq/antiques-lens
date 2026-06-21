import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

function cleanText(value: unknown, maxLength = 180) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : null;
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const now = new Date().toISOString();
    const payload = {
      user_id: user.id,
      last_seen_at: now,
      updated_at: now,
      current_page: cleanText(body.currentPage) || "unknown",
      platform: cleanText(body.platform, 40) || "web",
      app_version: cleanText(body.appVersion, 80),
      device_locale: cleanText(body.deviceLocale, 40),
    };

    const { error } = await supabase
      .from("user_activity")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "activity_unavailable" },
        { status: 200 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "activity_unavailable" },
      { status: 200 },
    );
  }
}
