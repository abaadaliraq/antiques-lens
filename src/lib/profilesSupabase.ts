"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  getCountryByCode,
  getProvinceByCode,
  normalizeCountry,
  normalizeProvince,
} from "@/lib/locationOptions";

export const PROFILE_UPDATED_EVENT = "kishib:profile-updated";

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  gender: string | null;
  country: string | null;
  country_code: string | null;
  country_name_en: string | null;
  city: string | null;
  province: string | null;
  province_code: string | null;
  province_name_en: string | null;
  provider: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RequiredProfileInput = {
  full_name: string;
  phone: string;
  gender: string;
  country: string;
  country_code: string;
  province_code?: string;
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

const PROFILE_SELECT =
  "id,email,full_name,avatar_url,phone,gender,country,country_code,country_name_en,city,province,province_code,province_name_en,provider,created_at,updated_at";

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
    gender: typeof record.gender === "string" ? record.gender : null,
    country: typeof record.country === "string" ? record.country : null,
    country_code:
      typeof record.country_code === "string" ? record.country_code : null,
    country_name_en:
      typeof record.country_name_en === "string"
        ? record.country_name_en
        : null,
    city: typeof record.city === "string" ? record.city : null,
    province: typeof record.province === "string" ? record.province : null,
    province_code:
      typeof record.province_code === "string" ? record.province_code : null,
    province_name_en:
      typeof record.province_name_en === "string"
        ? record.province_name_en
        : null,
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
      profile.gender?.trim() &&
      (profile.country_code?.trim() || profile.country?.trim()) &&
      ((profile.country_code || normalizeCountry(profile.country)?.code) !== "IQ" ||
        profile.province_code?.trim() ||
        normalizeProvince(profile.city || profile.province)?.code),
  );
}

export async function getCurrentUserProfile() {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return { user: null, profile: null, complete: false };
    }

    const { data, error } = await (supabase as unknown as SupabaseProfilesClient)
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", userData.user.id)
      .maybeSingle();

    if (error) throw error;

    const profile = profileFromUnknown(data);

    return {
      user: userData.user,
      profile,
      complete: isProfileComplete(profile),
    };
  } catch {
    console.warn("[KISHIB profile] Profile load skipped after network error.");
    return { user: null, profile: null, complete: false };
  }
}

export async function ensureCurrentUserProfile() {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return { user: null, profile: null, complete: false };
    }

    const user = userData.user;
    const metadata = user.user_metadata ?? {};
    const existing = await getCurrentUserProfile();

    if (existing.profile) return existing;

    const metadataCountry = readText(metadata, ["country_code", "country", "country_name"]);
    const metadataProvince = readText(metadata, [
      "province_code",
      "province",
      "governorate",
      "city",
    ]);
    const normalizedCountry = normalizeCountry(metadataCountry);
    const normalizedProvince = normalizeProvince(metadataProvince);

    const baseProfile = {
      id: user.id,
      email: user.email ?? null,
      full_name:
        readText(metadata, ["full_name", "name", "display_name"]) || null,
      avatar_url: readText(metadata, ["avatar_url", "picture", "photo_url"]) || null,
      phone: readText(metadata, ["phone", "phone_number", "mobile"]) || null,
      gender: readText(metadata, ["gender"]) || null,
      country: normalizedCountry?.nameEn || readText(metadata, ["country", "country_name"]) || null,
      country_code: normalizedCountry?.code || null,
      country_name_en: normalizedCountry?.nameEn || null,
      city: normalizedProvince?.nameEn || readText(metadata, ["city"]) || null,
      province: normalizedProvince?.nameEn || readText(metadata, ["province", "governorate"]) || null,
      province_code: normalizedProvince?.code || null,
      province_name_en: normalizedProvince?.nameEn || null,
      provider: getProvider(user) || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase as unknown as SupabaseProfilesClient)
      .from("profiles")
      .upsert(baseProfile, { onConflict: "id" })
      .select(PROFILE_SELECT)
      .single();

    if (error) throw error;

    const profile = profileFromUnknown(data);

    return {
      user,
      profile,
      complete: isProfileComplete(profile),
    };
  } catch {
    console.warn("[KISHIB profile] Profile ensure skipped after network error.");
    return { user: null, profile: null, complete: false };
  }
}

export async function updateCurrentUserProfile(input: RequiredProfileInput) {
  const supabase = getSupabaseBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) throw userError || new Error("No user");

  const user = userData.user;
  const metadata = user.user_metadata ?? {};
  const country = getCountryByCode(input.country_code) || normalizeCountry(input.country);
  const province =
    input.country_code === "IQ"
      ? getProvinceByCode(input.province_code) ||
        normalizeProvince(input.city)
      : null;
  const payload = {
    id: user.id,
    email: user.email ?? null,
    full_name: input.full_name.trim(),
    avatar_url: readText(metadata, ["avatar_url", "picture", "photo_url"]) || null,
    phone: input.phone.trim(),
    gender: input.gender.trim(),
    country: country?.nameEn || input.country.trim(),
    country_code: country?.code || input.country_code.trim(),
    country_name_en: country?.nameEn || input.country.trim(),
    city: province?.nameEn || input.city.trim(),
    province: province?.nameEn || input.city.trim(),
    province_code: province?.code || input.province_code?.trim() || null,
    province_name_en: province?.nameEn || (input.country_code === "IQ" ? input.city.trim() : null),
    provider: getProvider(user) || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase as unknown as SupabaseProfilesClient)
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select(PROFILE_SELECT)
    .single();

  if (error) throw error;

  await supabase.auth.updateUser({
    data: {
      ...metadata,
      full_name: payload.full_name,
      name: payload.full_name,
      phone: payload.phone,
      gender: payload.gender,
      country: payload.country,
      country_code: payload.country_code,
      country_name_en: payload.country_name_en,
      city: payload.city,
      province: payload.province,
      province_code: payload.province_code,
      province_name_en: payload.province_name_en,
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
