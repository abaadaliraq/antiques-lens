import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Localized = string | Record<string, string>;
type SendBody = {
  title?: Localized; body?: Localized; route?: string; link?: string;
  audience?: "all" | "locale" | "country" | "user" | "paid" | "free";
  locale?: string; country?: string; userId?: string; kind?: string;
  dryRun?: boolean;
};
type PushTokenRow = {
  id: string;
  token: string;
  user_id: string;
  locale: string | null;
};

const SAFE_ROUTE = /^\/(?:archive|notifications|subscription|result\/[A-Za-z0-9_-]+)\/?$/;
const ADMIN_PUSH_SECRET_HEADER = "x-kishib-admin-push-secret";
const INVALID_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);
const DEFAULT_REMINDER_TITLE: Localized = {
  ar: "تذكير من KISHIB",
  en: "KISHIB reminder",
};
const DEFAULT_REMINDER_BODY: Localized = {
  ar: "افتح KISHIB وقيّم قطعة جديدة من مجموعتك.",
  en: "Open KISHIB and evaluate a new piece from your collection.",
};

function localized(value: Localized | undefined, locale?: string) {
  if (typeof value === "string") return value.trim();
  if (!value) return "";
  return (locale && value[locale]) || value.en || value.ar || Object.values(value)[0] || "";
}
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase server credentials");
  return createClient(url, key, { auth: { persistSession: false } });
}
function messaging() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) throw new Error("Missing Firebase credentials");
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return getMessaging();
}

async function requireAdmin(request: Request) {
  const configuredSecret = process.env.KISHIB_ADMIN_PUSH_SECRET?.trim();
  const providedSecret = request.headers.get(ADMIN_PUSH_SECRET_HEADER)?.trim();
  if (configuredSecret && providedSecret && providedSecret === configuredSecret) {
    return { supabase: adminClient(), user: null };
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) return { error: "auth_required" as const, status: 401 as const };

  const supabase = adminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(bearer);

  if (error || !user) return { error: "auth_required" as const, status: 401 as const };

  const adminEmails = (process.env.KISHIB_ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    user.app_metadata?.role === "admin" ||
    user.app_metadata?.kishib_admin === true ||
    user.user_metadata?.kishib_admin === true ||
    Boolean(user.email && adminEmails.includes(user.email.toLowerCase()));

  if (!isAdmin) return { error: "forbidden" as const, status: 403 as const };

  return { supabase, user };
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUSH][FAILED] admin check", error);
    return NextResponse.json({ ok: false, error: "admin_check_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase } = auth;

    const input = (await request.json()) as SendBody;
    const audience = input.audience || "all";
    if (audience === "locale" && !input.locale) {
      return NextResponse.json({ error: "locale_required" }, { status: 400 });
    }
    if (audience === "country" && !input.country) {
      return NextResponse.json({ error: "country_required" }, { status: 400 });
    }
    if (audience === "user" && !input.userId) {
      return NextResponse.json({ error: "user_required" }, { status: 400 });
    }

    let query = supabase.from("push_tokens").select("id,token,user_id,locale").eq("active", true);
    if (audience === "locale" && input.locale) query = query.eq("locale", input.locale);
    if (audience === "country" && input.country) query = query.eq("country", input.country);
    if (audience === "user" && input.userId) query = query.eq("user_id", input.userId);
    if (input.kind === "offer") query = query.eq("offers_enabled", true);
    if (input.kind === "evaluation") query = query.eq("evaluations_enabled", true);
    const { data, error } = await query;
    if (error) throw error;
    let rows = (data || []) as PushTokenRow[];

    if (audience === "paid" || audience === "free") {
      const { data: usage } = await supabase.from("user_usage_limits")
        .select("user_id,subscription_status,subscription_ends_at");
      const paid = new Set((usage || []).filter((row) =>
        row.subscription_status === "active" &&
        (!row.subscription_ends_at || new Date(row.subscription_ends_at) > new Date())
      ).map((row) => row.user_id));
      rows = rows.filter((row) => audience === "paid" ? paid.has(row.user_id) : !paid.has(row.user_id));
    }

    const unique = [...new Map(rows.map((row) => [row.token, row])).values()];
    const candidate = input.route || input.link || "";
    const route = SAFE_ROUTE.test(candidate) ? candidate : "/";
    const title = input.title || DEFAULT_REMINDER_TITLE;
    const body = input.body || DEFAULT_REMINDER_BODY;
    const kind = input.kind || "reminder";

    if (input.dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        targetCount: unique.length,
        route,
        kind,
      });
    }

    let successCount = 0, failureCount = 0;
    const invalidIds: string[] = [];
    for (let offset = 0; offset < unique.length; offset += 500) {
      const batch = unique.slice(offset, offset + 500);
      const response = await messaging().sendEach(batch.map((row) => ({
        token: row.token,
        notification: { title: localized(title, row.locale || undefined) || "KISHIB", body: localized(body, row.locale || undefined) },
        data: { route, kind },
        android: { priority: "high", notification: { channelId: "kishib_general" } },
      })));
      successCount += response.successCount; failureCount += response.failureCount;
      response.responses.forEach((result, index) => {
        if (!result.success && result.error?.code && INVALID_CODES.has(result.error.code)) invalidIds.push(batch[index].id);
      });
    }
    if (invalidIds.length) await supabase.from("push_tokens").update({ active: false }).in("id", invalidIds);
    return NextResponse.json({ ok: true, successCount, failureCount, invalidated: invalidIds.length });
  } catch (error) {
    console.error("[PUSH][FAILED] server send", error);
    return NextResponse.json({ error: "push_send_failed" }, { status: 500 });
  }
}
