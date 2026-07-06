import "server-only";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export type AnalysisAccessDecision = {
  allowed: boolean;
  code: string;
  status: "processing" | "succeeded" | "failed" | "refunded";
  accessMode: "free_trial" | "subscription" | "lifetime" | "none";
  consumedCredit: boolean;
  remainingCredits: number;
  usedCount: number;
  freeLimit: number;
  subscriptionStatus: string;
  accessType: string;
  isLifetimeFree: boolean;
  evaluationId: string | null;
  cachedResult: Record<string, unknown> | null;
};

export type AnalysisAccessResult =
  | { ok: true; action: "run" | "cached"; user: User; requestId: string; decision: AnalysisAccessDecision }
  | { ok: false; status: 401 | 402 | 409 | 503; code: string; message: string };

type CompleteInput = {
  user: User;
  requestId: string;
  result: Record<string, unknown>;
  locale: string;
  notes: string;
  uploadedImageUrls: string[];
  cloudinaryPublicId: string | null;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function readBearerToken(request: Request) {
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization")?.trim() ?? "");
  return match?.[1]?.trim() || null;
}

function requestIdFrom(request: Request) {
  const supplied = request.headers.get("x-kishib-request-id")?.trim();
  return supplied && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(supplied)
    ? supplied
    : crypto.randomUUID();
}

function normalizeDecision(value: unknown): AnalysisAccessDecision | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const accessMode = String(row.accessMode ?? "none");
  const status = String(row.status ?? (row.code === "ANALYSIS_SUCCEEDED" ? "succeeded" : "processing"));
  if (typeof row.allowed !== "boolean" || typeof row.code !== "string") return null;
  if (!["free_trial", "subscription", "lifetime", "none"].includes(accessMode)) return null;
  if (!["processing", "succeeded", "failed", "refunded"].includes(status)) return null;
  const numeric = (key: string) => {
    const item = row[key];
    return typeof item === "number" && Number.isFinite(item) ? Math.max(0, item) : 0;
  };
  return {
    allowed: row.allowed,
    code: row.code,
    status: status as AnalysisAccessDecision["status"],
    accessMode: accessMode as AnalysisAccessDecision["accessMode"],
    consumedCredit: row.consumedCredit === true,
    remainingCredits: numeric("remainingCredits"),
    usedCount: numeric("usedCount"),
    freeLimit: numeric("freeLimit"),
    subscriptionStatus: typeof row.subscriptionStatus === "string" ? row.subscriptionStatus : "inactive",
    accessType: typeof row.accessType === "string" ? row.accessType : "free_trial",
    isLifetimeFree: row.isLifetimeFree === true,
    evaluationId: typeof row.evaluationId === "string" ? row.evaluationId : null,
    cachedResult: row.cachedResult && typeof row.cachedResult === "object" ? row.cachedResult as Record<string, unknown> : null,
  };
}

export async function authorizeAnalysisRequest(request: Request): Promise<AnalysisAccessResult> {
  const token = readBearerToken(request);
  if (!token) return { ok: false, status: 401, code: "AUTH_REQUIRED", message: "Authentication is required." };
  const admin = adminClient();
  if (!admin) return { ok: false, status: 503, code: "ACCESS_SERVICE_UNAVAILABLE", message: "Access verification is unavailable." };
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return { ok: false, status: 401, code: "INVALID_SESSION", message: "The session is invalid or expired." };

  const requestId = requestIdFrom(request);
  const { data, error } = await admin.rpc("authorize_analysis_request", {
    target_user_id: userData.user.id,
    target_request_id: requestId,
  });
  if (error) {
    console.error("Analysis access RPC failed:", { code: error.code, message: error.message });
    return { ok: false, status: 503, code: "ACCESS_SERVICE_UNAVAILABLE", message: "Access verification is unavailable." };
  }
  const decision = normalizeDecision(data);
  if (!decision) return { ok: false, status: 503, code: "INVALID_ACCESS_RESPONSE", message: "Access verification returned an invalid response." };

  if (decision.status === "succeeded" && decision.cachedResult) {
    return { ok: true, action: "cached", user: userData.user, requestId, decision };
  }
  if (!decision.allowed) {
    const conflictCodes = new Set(["REQUEST_CONFLICT", "ANALYSIS_IN_PROGRESS", "ANALYSIS_ATTEMPT_CLOSED"]);
    return {
      ok: false,
      status: conflictCodes.has(decision.code) ? 409 : 402,
      code: decision.code,
      message: decision.code === "TRIAL_LIMIT_REACHED" ? "Your free evaluations are finished." : "This analysis attempt cannot be started again.",
    };
  }
  return { ok: true, action: "run", user: userData.user, requestId, decision };
}

async function loadProfile(admin: SupabaseClient, userId: string) {
  const { data } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data && typeof data === "object" ? data as Record<string, unknown> : {};
}

export async function persistAndCompleteAnalysis(input: CompleteInput) {
  const admin = adminClient();
  if (!admin) throw new Error("ACCESS_SERVICE_UNAVAILABLE");
  const profile = await loadProfile(admin, input.user.id);
  const text = (key: string) => typeof profile[key] === "string" ? profile[key] as string : null;
  const imageUrl = input.uploadedImageUrls[0] ?? null;
  const payload = {
    id: input.requestId,
    user_id: input.user.id,
    user_email: text("email") ?? input.user.email ?? null,
    user_name: text("full_name"),
    user_phone: text("phone"),
    user_country: text("country"),
    user_country_code: text("country_code"),
    user_country_name_en: text("country_name_en"),
    user_city: text("city"),
    user_province: text("province"),
    user_province_code: text("province_code"),
    user_province_name_en: text("province_name_en"),
    user_gender: text("gender"),
    title: typeof input.result.title === "string" ? input.result.title : null,
    locale: input.locale,
    item_type: typeof input.result.itemType === "string" ? input.result.itemType : typeof input.result.lookup === "string" ? input.result.lookup : null,
    image_url: imageUrl,
    cloudinary_public_id: input.cloudinaryPublicId,
    analysis_result: { ...input.result, userNote: input.notes, uploadedImageUrls: input.uploadedImageUrls },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: insertError } = await admin.from("evaluations").insert(payload);
  if (insertError && insertError.code !== "23505") throw new Error(`EVALUATION_SAVE_FAILED:${insertError.code}`);

  const { data, error } = await admin.rpc("complete_analysis_request", {
    target_user_id: input.user.id,
    target_request_id: input.requestId,
    target_evaluation_id: input.requestId,
    target_result_payload: input.result,
  });
  if (error) throw new Error(`ANALYSIS_FINALIZE_FAILED:${error.code}`);
  return normalizeDecision(data);
}

export async function failAndRefundAnalysis(userId: string, requestId: string, reason: string) {
  const admin = adminClient();
  if (!admin) return null;
  const { data, error } = await admin.rpc("fail_analysis_request", {
    target_user_id: userId,
    target_request_id: requestId,
    target_failure_reason: reason.slice(0, 500),
  });
  if (error) {
    console.error("Analysis refund RPC failed:", { code: error.code, message: error.message });
    return null;
  }
  return normalizeDecision(data);
}
