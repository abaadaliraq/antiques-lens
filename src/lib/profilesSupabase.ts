"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export const PROFILE_UPDATED_EVENT = "kishib:profile-updated";

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  province: string | null;
  provider: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RequiredProfileInput = {
  full_name: string;
  phone: string;
  country: string;
  city: string;
};

type SupabaseProfilesClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
      };
    };
    upsert: (
      payload: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => {
      select: (columns: string) => {
        single: () => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
};

function readText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

function getProvider(user: {
  app_metadata?: Record<string, unknown> | null;
  identities?: { provider?: string | null }[] | null;
}) {
  const metadataProvider =
    typeof user.app_metadata?.provider === "string"
      ? user.app_metadata.provider
      : "";
  const identityProvider = user.identities?.find((item) => item.provider)
    ?.provider;

  return metadataProvider || identityProvider || "email";
}

function profileFromUnknown(value: unknown): UserProfile | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : "";
  if (!id) return null;

  return {
    id,
    email: typeof record.email === "string" ? record.email : null,
    full_name:
      typeof record.full_name === "string" ? record.full_name : null,
    avatar_url:
      typeof record.avatar_url === "string" ? record.avatar_url : null,
    phone: typeof record.phone === "string" ? record.phone : null,
    country: typeof record.country === "string" ? record.country : null,
    city: typeof record.city === "string" ? record.city : null,
    province: typeof record.province === "string" ? record.province : null,
    provider: typeof record.provider === "string" ? record.provider : null,
    created_at:
      typeof record.created_at === "string" ? record.created_at : null,
    updated_at:
      typeof record.updated_at === "string" ? record.updated_at : null,
  };
}

export function isProfileComplete(profile: UserProfile | null) {
  return Boolean(
    profile?.full_name?.trim() &&
      profile.phone?.trim() &&
      profile.country?.trim() &&
      (profile.city?.trim() || profile.province?.trim()),
  );
}

export async function getCurrentUserProfile() {
  const supabase = getSupabaseBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { user: null, profile: null, complete: false };
  }

  const { data, error } = await (supabase as unknown as SupabaseProfilesClient)
    .from("profiles")
    .select(
      "id,email,full_name,avatar_url,phone,country,city,province,provider,created_at,updated_at",
    )
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) throw error;

  return {
    user: userData.user,
    profile: profileFromUnknown(data),
    complete: isProfileComplete(profileFromUnknown(data)),
  };
}

export async function ensureCurrentUserProfile() {
  const supabase = getSupabaseBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { user: null, profile: null, complete: false };
  }

  const user = userData.user;
  const metadata = user.user_metadata ?? {};
  const existing = await getCurrentUserProfile();

  if (existing.profile) return existing;

  const baseProfile = {
    id: user.id,
    email: user.email ?? null,
    full_name:
      readText(metadata, ["full_name", "name", "display_name"]) || null,
    avatar_url: readText(metadata, ["avatar_url", "picture", "photo_url"]) || null,
    phone: readText(metadata, ["phone", "phone_number", "mobile"]) || null,
    country: readText(metadata, ["country", "country_name"]) || null,
    city: readText(metadata, ["city"]) || null,
    province: readText(metadata, ["province", "governorate"]) || null,
    provider: getProvider(user) || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase as unknown as SupabaseProfilesClient)
    .from("profiles")
    .upsert(baseProfile, { onConflict: "id" })
    .select(
      "id,email,full_name,avatar_url,phone,country,city,province,provider,created_at,updated_at",
    )
    .single();

  if (error) throw error;

  const profile = profileFromUnknown(data);

  return {
    user,
    profile,
    complete: isProfileComplete(profile),
  };
}

export async function updateCurrentUserProfile(input: RequiredProfileInput) {
  const supabase = getSupabaseBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) throw userError || new Error("No user");

  const user = userData.user;
  const metadata = user.user_metadata ?? {};
  const payload = {
    id: user.id,
    email: user.email ?? null,
    full_name: input.full_name.trim(),
    avatar_url: readText(metadata, ["avatar_url", "picture", "photo_url"]) || null,
    phone: input.phone.trim(),
    country: input.country.trim(),
    city: input.city.trim(),
    province: input.city.trim(),
    provider: getProvider(user) || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase as unknown as SupabaseProfilesClient)
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select(
      "id,email,full_name,avatar_url,phone,country,city,province,provider,created_at,updated_at",
    )
    .single();

  if (error) throw error;

  await supabase.auth.updateUser({
    data: {
      ...metadata,
      full_name: payload.full_name,
      name: payload.full_name,
      phone: payload.phone,
      country: payload.country,
      city: payload.city,
      province: payload.province,
    },
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
  }

  const profile = profileFromUnknown(data);

  return {
    profile,
    complete: isProfileComplete(profile),
  };
}
