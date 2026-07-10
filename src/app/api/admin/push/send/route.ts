import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type Localized = string | Record<string, string>;
type SendBody = {
  title?: Localized; body?: Localized; route?: string; link?: string;
  audience?: "all" | "locale" | "country" | "user" | "paid" | "free";
  locale?: string; country?: string; userId?: string; kind?: string;
};
const SAFE_ROUTE = /^\/(?:archive|notifications|subscription|result\/[A-Za-z0-9_-]+)\/?$/;
const INVALID_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

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

export async function POST(request: Request) {
  try {
    const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!bearer) return NextResponse.json({ error: "auth_required" }, { status: 401 });
    const supabase = adminClient();
    const { data: { user } } = await supabase.auth.getUser(bearer);
    const adminEmails = (process.env.KISHIB_ADMIN_EMAILS || "").split(",")
      .map((item) => item.trim().toLowerCase()).filter(Boolean);
    const isAdmin = user?.app_metadata?.role === "admin" ||
      Boolean(user?.email && adminEmails.includes(user.email.toLowerCase()));
    if (!user || !isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const input = (await request.json()) as SendBody;
    const audience = input.audience || "all";
    let query = supabase.from("push_tokens").select("id,token,user_id,locale").eq("active", true);
    if (audience === "locale" && input.locale) query = query.eq("locale", input.locale);
    if (audience === "country" && input.country) query = query.eq("country", input.country);
    if (audience === "user" && input.userId) query = query.eq("user_id", input.userId);
    if (input.kind === "offer") query = query.eq("offers_enabled", true);
    if (input.kind === "evaluation") query = query.eq("evaluations_enabled", true);
    const { data, error } = await query;
    if (error) throw error;
    let rows = data || [];

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
    let successCount = 0, failureCount = 0;
    const invalidIds: string[] = [];
    for (let offset = 0; offset < unique.length; offset += 500) {
      const batch = unique.slice(offset, offset + 500);
      const response = await messaging().sendEach(batch.map((row) => ({
        token: row.token,
        notification: { title: localized(input.title, row.locale) || "KISHIB", body: localized(input.body, row.locale) },
        data: { route, kind: input.kind || "info" },
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
