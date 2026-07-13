"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { getCurrentUserProfile } from "@/lib/profilesSupabase";
import type { ArchiveItem } from "@/components/antique-ai/archiveStore";
import type { AnalysisResult, Locale } from "@/components/antique-ai/types";
import { normalizeEvaluationImages } from "@/components/antique-ai/evaluationImages";

export const EVALUATION_ARCHIVE_PAGE_SIZE = 20;

const EVALUATION_SELECT_COLUMNS =
  "id,user_id,user_email,user_name,user_phone,user_country,user_country_code,user_country_name_en,user_city,user_province,user_province_code,user_province_name_en,user_gender,title,locale,item_type,image_url,main_image,cloudinary_public_id,analysis_result,status,created_at,updated_at";

type EvaluationRow = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  user_phone: string | null;
  user_country: string | null;
  user_country_code?: string | null;
  user_country_name_en?: string | null;
  user_city: string | null;
  user_province: string | null;
  user_province_code?: string | null;
  user_province_name_en?: string | null;
  user_gender?: string | null;
  title: string | null;
  locale: string | null;
  item_type: string | null;
  image_url: string | null;
  main_image?: string | null;
  cloudinary_public_id: string | null;
  analysis_result: Record<string, unknown> | null;
  status?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SaveEvaluationInput = {
  archiveItem: ArchiveItem;
  locale: Locale;
  imageUrl?: string;
  cloudinaryPublicId?: string;
};

type EvaluationsInsertClient = {
  from(table: "evaluations"): {
    insert(payload: unknown): Promise<{ error: unknown }>;
  };
};

type EvaluationsDeleteClient = {
  from(table: "evaluations"): {
    delete(): {
      eq(column: string, value: string): {
        eq(column: string, value: string): Promise<{ error: unknown }>;
      };
    };
  };
};

export type EvaluationArchivePage = {
  items: ArchiveItem[];
  hasMore: boolean;
  userId: string | null;
  page: number;
};

function readMetadataText(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

function getResultImageUrl(result: Partial<AnalysisResult>, fallback?: string) {
  return (
    fallback ||
    result.uploadedImageUrl ||
    result.sourceImageUrl ||
    result.imageUrl ||
    result.originalImage ||
    result.imagePreview ||
    ""
  );
}

function getResultImageUrls(result: Partial<AnalysisResult>, fallback?: string) {
  return normalizeEvaluationImages(result, [fallback]);
}

function mapEvaluationRowToArchiveItem(row: EvaluationRow): ArchiveItem {
  const result = (row.analysis_result || {}) as Partial<AnalysisResult> & {
    userNote?: string;
    cloudinaryPublicId?: string;
  };
  const imageUrl = getResultImageUrl(
    result,
    row.main_image || row.image_url || undefined,
  );
  const imageUrls = getResultImageUrls(
    result,
    row.main_image || row.image_url || undefined,
  );
  const title = row.title || result.title || result.itemType || "Untitled item";
  const similarImages =
    (Array.isArray(result.similarImages) && result.similarImages) ||
    (Array.isArray(result.similarItems) && result.similarItems) ||
    (Array.isArray(result.visualMatches) && result.visualMatches) ||
    [];

  return {
    id: row.id,
    title,
    prompt: typeof result.userNote === "string" ? result.userNote : "",
    locale: row.locale || undefined,
    imagePreview: imageUrl || undefined,
    imagePreviews: imageUrls.length ? imageUrls : imageUrl ? [imageUrl] : [],
    originalImage: imageUrl || undefined,
    originalImages: imageUrls.length ? imageUrls : imageUrl ? [imageUrl] : [],
    createdAt: row.created_at || new Date().toISOString(),
    result: {
      ...result,
      title,
      itemType: row.item_type || result.itemType,
      status: row.status || (result as { status?: string }).status || "completed",
      uploadedImageUrl: imageUrl || result.uploadedImageUrl,
      sourceImageUrl: imageUrl || result.sourceImageUrl,
      imageUrl: imageUrl || result.imageUrl,
      imagePreview: imageUrl || result.imagePreview,
      imagePreviews: imageUrls.length ? imageUrls : result.imagePreviews,
      originalImage: imageUrl || result.originalImage,
      originalImages: imageUrls.length ? imageUrls : result.originalImages,
    },
    similarImages,
    cloudinaryPublicId:
      row.cloudinary_public_id || result.cloudinaryPublicId || undefined,
  };
}

export function mergeEvaluationArchiveItems(
  primaryItems: ArchiveItem[],
  secondaryItems: ArchiveItem[],
) {
  const seen = new Set<string>();

  return [...primaryItems, ...secondaryItems]
    .filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });
}

export async function getCurrentEvaluationUserId() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;
  return data.user.id;
}

export async function loadEvaluationArchivePageFromSupabase({
  page = 0,
  pageSize = EVALUATION_ARCHIVE_PAGE_SIZE,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<EvaluationArchivePage> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return { items: [], hasMore: false, userId: null, page };
    }

    const from = page * pageSize;
    const to = from + pageSize;
    const { data, error } = await supabase
      .from("evaluations")
      .select(EVALUATION_SELECT_COLUMNS)
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const rows = ((data || []) as EvaluationRow[]).map(mapEvaluationRowToArchiveItem);

    return {
      items: rows.slice(0, pageSize),
      hasMore: rows.length > pageSize,
      userId: userData.user.id,
      page,
    };
  } catch (error) {
    console.warn("Supabase evaluations load skipped.", error);
    return { items: [], hasMore: false, userId: null, page };
  }
}

export async function loadEvaluationArchiveItemsFromSupabase() {
  const firstPage = await loadEvaluationArchivePageFromSupabase({
    page: 0,
    pageSize: EVALUATION_ARCHIVE_PAGE_SIZE,
  });

  return firstPage.items;
}

export async function saveEvaluationToSupabase({
  archiveItem,
  locale,
  imageUrl,
  cloudinaryPublicId,
}: SaveEvaluationInput) {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return false;

    const { profile } = await getCurrentUserProfile();
    const metadata = user.user_metadata ?? {};
    const userName = readMetadataText(metadata, [
      "full_name",
      "name",
      "display_name",
    ]);
    const result = (archiveItem.result || {}) as Partial<AnalysisResult>;
    const finalImageUrl = getResultImageUrl(result, imageUrl);
    const finalCloudinaryPublicId =
      cloudinaryPublicId || archiveItem.cloudinaryPublicId || "";

    const analysisResult = {
      ...archiveItem.result,
      userNote: archiveItem.prompt || "",
      cloudinaryPublicId: finalCloudinaryPublicId || undefined,
      status: "completed",
      userProfile: {
        phone: profile?.phone ?? null,
        gender: profile?.gender ?? null,
        country: profile?.country ?? null,
        country_code: profile?.country_code ?? null,
        country_name_en: profile?.country_name_en ?? null,
        city: profile?.city ?? null,
        province: profile?.province ?? null,
        province_code: profile?.province_code ?? null,
        province_name_en: profile?.province_name_en ?? null,
      },
    };

    const payload = {
      id: archiveItem.id,
      user_id: user.id,
      user_email: profile?.email ?? user.email ?? null,
      user_name: profile?.full_name || userName || null,
      user_phone: profile?.phone ?? null,
      user_country: profile?.country ?? null,
      user_country_code: profile?.country_code ?? null,
      user_country_name_en: profile?.country_name_en ?? null,
      user_city: profile?.city ?? null,
      user_province: profile?.province ?? null,
      user_province_code: profile?.province_code ?? null,
      user_province_name_en: profile?.province_name_en ?? null,
      user_gender: profile?.gender ?? null,
      title: archiveItem.title || result.title || null,
      locale,
      item_type: result.itemType || result.lookup || null,
      image_url: finalImageUrl || null,
      main_image: finalImageUrl || null,
      cloudinary_public_id: finalCloudinaryPublicId || null,
      analysis_result: analysisResult,
      status: "completed",
      created_at: archiveItem.createdAt,
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase as unknown as EvaluationsInsertClient)
      .from("evaluations")
      .insert(payload);

    if (error) throw error;
    return true;
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code || "")
        : "";

    if (code === "23505") return true;

    console.warn("Supabase evaluation save skipped.", error);
    return false;
  }
}

export async function deleteEvaluationFromSupabase(id: string) {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) return false;

    const { error } = await (supabase as unknown as EvaluationsDeleteClient)
      .from("evaluations")
      .delete()
      .eq("id", id)
      .eq("user_id", userData.user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.warn("Supabase evaluation delete skipped.", error);
    return false;
  }
}
