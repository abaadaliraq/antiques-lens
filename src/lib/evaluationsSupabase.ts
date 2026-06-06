"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { ArchiveItem } from "@/components/antique-ai/archiveStore";
import type { AnalysisResult, Locale } from "@/components/antique-ai/types";

type SupabaseTableClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => {
          limit: (count: number) => Promise<{ data: unknown; error: unknown }>;
        };
      };
    };
    insert: (
      payload: Record<string, unknown>,
    ) => Promise<{ error: unknown }>;
  };
};

type EvaluationRow = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  title: string | null;
  locale: string | null;
  item_type: string | null;
  image_url: string | null;
  cloudinary_public_id: string | null;
  analysis_result: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

type SaveEvaluationInput = {
  archiveItem: ArchiveItem;
  locale: Locale;
  imageUrl?: string;
  cloudinaryPublicId?: string;
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

function mapEvaluationRowToArchiveItem(row: EvaluationRow): ArchiveItem {
  const result = (row.analysis_result || {}) as Partial<AnalysisResult> & {
    userNote?: string;
    cloudinaryPublicId?: string;
  };
  const imageUrl = getResultImageUrl(result, row.image_url || undefined);
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
    imagePreviews: imageUrl ? [imageUrl] : [],
    originalImage: imageUrl || undefined,
    originalImages: imageUrl ? [imageUrl] : [],
    createdAt: row.created_at || new Date().toISOString(),
    result: {
      ...result,
      title,
      itemType: row.item_type || result.itemType,
      uploadedImageUrl: imageUrl || result.uploadedImageUrl,
      sourceImageUrl: imageUrl || result.sourceImageUrl,
      imageUrl: imageUrl || result.imageUrl,
      imagePreview: imageUrl || result.imagePreview,
      imagePreviews: imageUrl ? [imageUrl] : result.imagePreviews,
      originalImage: imageUrl || result.originalImage,
      originalImages: imageUrl ? [imageUrl] : result.originalImages,
    },
    similarImages,
    cloudinaryPublicId:
      row.cloudinary_public_id || result.cloudinaryPublicId || undefined,
  };
}

export function mergeEvaluationArchiveItems(
  localItems: ArchiveItem[],
  supabaseItems: ArchiveItem[],
) {
  const seen = new Set<string>();

  return [...supabaseItems, ...localItems]
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

export async function loadEvaluationArchiveItemsFromSupabase() {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) return [];

    const { data, error } = await (supabase as unknown as SupabaseTableClient)
      .from("evaluations")
      .select(
        "id,user_id,user_email,user_name,title,locale,item_type,image_url,cloudinary_public_id,analysis_result,created_at,updated_at",
      )
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return ((data || []) as EvaluationRow[]).map(mapEvaluationRowToArchiveItem);
  } catch (error) {
    console.error("Failed to load evaluations from Supabase", error);
    return [];
  }
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
    const metadata = user?.user_metadata ?? {};
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
    };

    const payload = {
      id: archiveItem.id,
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      user_name: userName || null,
      title: archiveItem.title || result.title || null,
      locale,
      item_type: result.itemType || result.lookup || null,
      image_url: finalImageUrl || null,
      cloudinary_public_id: finalCloudinaryPublicId || null,
      analysis_result: analysisResult,
      created_at: archiveItem.createdAt,
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase as unknown as SupabaseTableClient)
      .from("evaluations")
      .insert(payload);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to save evaluation to Supabase", error);
  }
}
