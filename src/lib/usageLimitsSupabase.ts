"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export type UsageLimitStatus = {
  canAnalyze: boolean;
  remainingCredits: number;
  usedCount: number;
  freeLimit: number;
  subscriptionStatus: string;
  accessType: string;
  isLifetimeFree: boolean;
  reason: string;
};

export const DEFAULT_USAGE_LIMIT_STATUS: UsageLimitStatus = {
  canAnalyze: false,
  remainingCredits: 0,
  usedCount: 0,
  freeLimit: 5,
  subscriptionStatus: "inactive",
  accessType: "free_trial",
  isLifetimeFree: false,
  reason: "auth_required",
};

type RpcResult = {
  canAnalyze?: unknown;
  remainingCredits?: unknown;
  usedCount?: unknown;
  freeLimit?: unknown;
  subscriptionStatus?: unknown;
  accessType?: unknown;
  isLifetimeFree?: unknown;
  reason?: unknown;
};

function toNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeUsageStatus(value: unknown): UsageLimitStatus {
  const record = value && typeof value === "object" ? (value as RpcResult) : {};

  return {
    canAnalyze: record.canAnalyze === true,
    remainingCredits: Math.max(0, toNumber(record.remainingCredits, 0)),
    usedCount: Math.max(0, toNumber(record.usedCount, 0)),
    freeLimit: Math.max(0, toNumber(record.freeLimit, 5)),
    subscriptionStatus:
      typeof record.subscriptionStatus === "string"
        ? record.subscriptionStatus
        : "inactive",
    accessType:
      typeof record.accessType === "string" ? record.accessType : "free_trial",
    isLifetimeFree: record.isLifetimeFree === true,
    reason: typeof record.reason === "string" ? record.reason : "unknown",
  };
}

async function getAuthenticatedUser() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  return data.user;
}

export async function canUserAnalyze(): Promise<UsageLimitStatus> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) return DEFAULT_USAGE_LIMIT_STATUS;

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.rpc("can_user_analyze");

    if (error) throw error;

    return normalizeUsageStatus(data);
  } catch {
    return {
      ...DEFAULT_USAGE_LIMIT_STATUS,
      reason: "usage_check_failed",
    };
  }
}

export async function getSupabaseAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}
