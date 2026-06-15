"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  calculateMarketplaceAmounts,
  MARKETPLACE_STORAGE_BUCKET,
} from "@/lib/marketplaceSupabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CollectionItem,
  CollectionItemImage,
  CollectionReviewStatus,
  CollectionVisibility,
  CreateCollectionItemInput,
  UpdateCollectionItemInput,
} from "@/types/collection";
import type {
  MarketplaceCategory,
  MarketplaceCondition,
  MarketplaceNotification,
} from "@/types/marketplace";

export const COLLECTION_STORAGE_BUCKET = "collection-items";

type CollectionDatabase = {
  public: {
    Tables: {
      collection_items: {
        Row: CollectionItemRow;
        Insert: Partial<CollectionItemRow> & {
          owner_id: string;
          title: string;
          category: string;
        };
        Update: Partial<CollectionItemRow>;
        Relationships: [];
      };
      collection_item_images: {
        Row: CollectionImageRow;
        Insert: {
          collection_item_id: string;
          image_url: string;
          storage_path?: string | null;
          sort_order?: number;
        };
        Update: Partial<CollectionImageRow>;
        Relationships: [];
      };
      collection_item_likes: {
        Row: CollectionLikeRow;
        Insert: {
          collection_item_id: string;
          visitor_key: string;
        };
        Update: Partial<CollectionLikeRow>;
        Relationships: [];
      };
      collection_item_offers: {
        Row: CollectionOfferRow;
        Insert: {
          collection_item_id: string;
          visitor_key: string;
          amount: number;
          currency?: "IQD" | "USD";
        };
        Update: Partial<CollectionOfferRow>;
        Relationships: [];
      };
      marketplace_items: {
        Row: MarketplaceItemRow;
        Insert: Partial<MarketplaceItemRow> & {
          seller_id: string;
          title: string;
          category: string;
          condition: string;
          price: number;
        };
        Update: Partial<MarketplaceItemRow>;
        Relationships: [];
      };
      marketplace_item_images: {
        Row: MarketplaceImageRow;
        Insert: {
          item_id: string;
          image_url: string;
          storage_path?: string | null;
          sort_order?: number;
        };
        Update: Partial<MarketplaceImageRow>;
        Relationships: [];
      };
      marketplace_notifications: {
        Row: MarketplaceNotificationRow;
        Insert: Partial<MarketplaceNotificationRow> & {
          user_id: string;
          title: string;
          message: string;
          type: MarketplaceNotification["type"];
        };
        Update: Partial<MarketplaceNotificationRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type CollectionItemRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: MarketplaceCategory;
  material: string | null;
  origin: string | null;
  estimated_age: string | null;
  condition: MarketplaceCondition | null;
  estimated_value: number | string | null;
  currency: "IQD" | "USD" | null;
  country: string | null;
  city: string | null;
  dimensions: string | null;
  weight: string | null;
  has_mark: boolean | null;
  notes: string | null;
  visibility: CollectionVisibility;
  review_status: CollectionReviewStatus;
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  marketplace_item_id: string | null;
  created_at: string;
  updated_at: string;
  collection_item_images?: CollectionImageRow[];
};

type CollectionImageRow = {
  id: string;
  collection_item_id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number | null;
  created_at: string;
};

type CollectionLikeRow = {
  id: string;
  collection_item_id: string;
  visitor_key: string;
  created_at: string;
};

type CollectionOfferRow = {
  id: string;
  collection_item_id: string;
  visitor_key: string;
  amount: number | string;
  currency: "IQD" | "USD" | null;
  created_at: string;
};

type MarketplaceItemRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category: string;
  material: string | null;
  origin: string | null;
  estimated_age: string | null;
  condition: string;
  price: number | string;
  currency: "IQD" | "USD" | null;
  country: string | null;
  city: string | null;
  delivery_method: string | null;
  has_kishib_evaluation: boolean | null;
  kishib_evaluation_summary: string | null;
  status: string;
};

type MarketplaceImageRow = {
  id: string;
  item_id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number | null;
};

type MarketplaceNotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: MarketplaceNotification["type"];
  related_item_id: string | null;
  related_order_id: string | null;
  read_at: string | null;
  created_at: string;
};

function getCollectionSupabase() {
  return getSupabaseBrowserClient() as SupabaseClient<CollectionDatabase>;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  return Number(value);
}

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function mapImage(row: CollectionImageRow): CollectionItemImage {
  return {
    id: row.id,
    collectionItemId: row.collection_item_id,
    imageUrl: row.image_url,
    storagePath: row.storage_path,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
  };
}

function mapCollectionItem(row: CollectionItemRow): CollectionItem {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description ?? "",
    category: row.category,
    material: row.material ?? "",
    origin: row.origin ?? "",
    estimatedAge: row.estimated_age ?? "",
    condition: row.condition ?? ("Ø¬ÙŠØ¯Ø©" as MarketplaceCondition),
    estimatedValue: toNumber(row.estimated_value),
    currency: row.currency ?? "USD",
    country: row.country ?? "",
    city: row.city ?? undefined,
    dimensions: row.dimensions ?? "",
    weight: row.weight ?? "",
    hasMark: Boolean(row.has_mark),
    notes: row.notes ?? "",
    visibility: row.visibility,
    reviewStatus: row.review_status,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    marketplaceItemId: row.marketplace_item_id,
    images: (row.collection_item_images ?? [])
      .map(mapImage)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getCurrentUser() {
  const supabase = getCollectionSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Login is required.");
  }

  return data.user;
}

export async function getMyCollectionItems() {
  const supabase = getCollectionSupabase();
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("collection_items")
    .select("*, collection_item_images(*)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as CollectionItemRow[]).map(mapCollectionItem);
}

export async function getPublicCollectionItems() {
  const supabase = getCollectionSupabase();
  const { data, error } = await supabase
    .from("collection_items")
    .select("*, collection_item_images(*)")
    .eq("review_status", "verified")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as CollectionItemRow[]).map(mapCollectionItem);
}

export async function getCollectionInteractionSummary(itemIds: string[]) {
  if (itemIds.length === 0) return {};

  const supabase = getCollectionSupabase();
  const [likesResult, offersResult] = await Promise.all([
    supabase
      .from("collection_item_likes")
      .select("collection_item_id")
      .in("collection_item_id", itemIds),
    supabase
      .from("collection_item_offers")
      .select("collection_item_id, amount, currency, created_at")
      .in("collection_item_id", itemIds),
  ]);

  if (likesResult.error || offersResult.error) {
    return {};
  }

  const summary: Record<
    string,
    { likes: number; highestOffer: number | null; currency: "IQD" | "USD" }
  > = {};

  for (const id of itemIds) {
    summary[id] = { likes: 0, highestOffer: null, currency: "USD" };
  }

  for (const like of likesResult.data ?? []) {
    const id = (like as Pick<CollectionLikeRow, "collection_item_id">).collection_item_id;
    if (summary[id]) summary[id].likes += 1;
  }

  for (const offer of (offersResult.data ?? []) as CollectionOfferRow[]) {
    const current = summary[offer.collection_item_id];
    if (!current) continue;

    const amount = Number(offer.amount);
    if (!Number.isFinite(amount)) continue;

    if (current.highestOffer === null || amount > current.highestOffer) {
      current.highestOffer = amount;
      current.currency = offer.currency ?? "USD";
    }
  }

  return summary;
}

export async function likeCollectionItem(itemId: string, visitorKey: string) {
  const supabase = getCollectionSupabase();
  const { error } = await supabase.from("collection_item_likes").insert({
    collection_item_id: itemId,
    visitor_key: visitorKey,
  });

  if (error && error.code !== "23505") throw error;
}

export async function createCollectionOffer(
  itemId: string,
  visitorKey: string,
  amount: number,
  currency: "IQD" | "USD",
) {
  const supabase = getCollectionSupabase();
  const { error } = await supabase.from("collection_item_offers").insert({
    collection_item_id: itemId,
    visitor_key: visitorKey,
    amount,
    currency,
  });

  if (error) throw error;
}

export async function getCollectionItemById(id: string) {
  await getCurrentUser();
  const supabase = getCollectionSupabase();
  const { data, error } = await supabase
    .from("collection_items")
    .select("*, collection_item_images(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data ? mapCollectionItem(data as CollectionItemRow) : null;
}

async function uploadCollectionImages(
  itemId: string,
  ownerId: string,
  images: File[],
) {
  const supabase = getCollectionSupabase();
  const imageRows: Array<{
    collection_item_id: string;
    image_url: string;
    storage_path: string;
    sort_order: number;
  }> = [];

  for (const [index, file] of images.entries()) {
    const path = `${ownerId}/${itemId}/${Date.now()}-${index}-${cleanFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(COLLECTION_STORAGE_BUCKET)
      .upload(path, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(COLLECTION_STORAGE_BUCKET)
      .getPublicUrl(path);

    imageRows.push({
      collection_item_id: itemId,
      image_url: publicUrlData.publicUrl,
      storage_path: path,
      sort_order: index,
    });
  }

  if (imageRows.length > 0) {
    const { error } = await supabase.from("collection_item_images").insert(imageRows);
    if (error) throw error;
  }
}

export async function createCollectionItem(input: CreateCollectionItemInput) {
  const supabase = getCollectionSupabase();
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("collection_items")
    .insert({
      owner_id: user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      material: input.material,
      origin: input.origin,
      estimated_age: input.estimatedAge,
      condition: input.condition,
      estimated_value: input.estimatedValue ?? null,
      currency: input.currency,
      country: input.country,
      city: input.city ?? null,
      dimensions: input.dimensions ?? null,
      weight: input.weight ?? null,
      has_mark: input.hasMark,
      notes: input.notes ?? null,
      visibility: "private",
      review_status: "pending_review",
    })
    .select("*, collection_item_images(*)")
    .single();

  if (error) throw error;

  const itemId = (data as CollectionItemRow).id;
  await uploadCollectionImages(itemId, user.id, input.images);

  const created = await getCollectionItemById(itemId);
  if (!created) throw new Error("Unable to read the collection item after creation.");
  return created;
}

export async function updateCollectionItem(
  id: string,
  input: UpdateCollectionItemInput,
) {
  const supabase = getCollectionSupabase();
  const user = await getCurrentUser();
  const current = await getCollectionItemById(id);

  if (!current || current.ownerId !== user.id) {
    throw new Error("Collection item not found.");
  }

  if (current.visibility === "listed") {
    throw new Error("Listed collection items cannot be edited.");
  }

  const { error } = await supabase
    .from("collection_items")
    .update({
      title: input.title,
      description: input.description,
      category: input.category,
      material: input.material,
      origin: input.origin,
      estimated_age: input.estimatedAge,
      condition: input.condition,
      estimated_value: input.estimatedValue ?? null,
      currency: input.currency,
      country: input.country,
      city: input.city ?? null,
      dimensions: input.dimensions ?? null,
      weight: input.weight ?? null,
      has_mark: input.hasMark,
      notes: input.notes ?? null,
      review_status:
        current.reviewStatus === "needs_changes" || current.reviewStatus === "rejected"
          ? "pending_review"
          : current.reviewStatus,
      review_note: null,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) throw error;

  return getCollectionItemById(id);
}

export async function deleteCollectionItem(id: string) {
  const supabase = getCollectionSupabase();
  const user = await getCurrentUser();
  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
    .neq("visibility", "listed");

  if (error) throw error;
}

export async function convertCollectionItemToMarketplace(id: string) {
  const supabase = getCollectionSupabase();
  const user = await getCurrentUser();
  const item = await getCollectionItemById(id);

  if (!item || item.ownerId !== user.id) {
    throw new Error("Collection item not found.");
  }

  if (item.reviewStatus !== "verified") {
    throw new Error("Only verified collection items can be listed for sale.");
  }

  if (!item.estimatedValue || item.estimatedValue <= 0) {
    throw new Error("Estimated value is required before listing this item for sale.");
  }

  if (item.marketplaceItemId) return item.marketplaceItemId;

  const amounts = calculateMarketplaceAmounts(item.estimatedValue);
  if (amounts.commissionPercent !== 7) {
    throw new Error("Invalid marketplace commission.");
  }

  const { data: marketplaceItem, error: itemError } = await supabase
    .from("marketplace_items")
    .insert({
      seller_id: user.id,
      title: item.title,
      description: item.description,
      category: item.category,
      material: item.material,
      origin: item.origin,
      estimated_age: item.estimatedAge,
      condition: item.condition,
      price: item.estimatedValue,
      currency: item.currency,
      country: item.country,
      city: item.city ?? null,
      delivery_method: "",
      has_kishib_evaluation: true,
      kishib_evaluation_summary: "KISHIB Verified collection item.",
      status: "pending_review",
    })
    .select("id")
    .single();

  if (itemError) throw itemError;

  const marketplaceItemId = (marketplaceItem as Pick<MarketplaceItemRow, "id">).id;

  if (item.images.length > 0) {
    const { error: imageError } = await supabase
      .from("marketplace_item_images")
      .insert(
        item.images.map((image) => ({
          item_id: marketplaceItemId,
          image_url: image.imageUrl,
          storage_path: image.storagePath,
          sort_order: image.sortOrder,
        })),
      );

    if (imageError) throw imageError;
  }

  const { error: updateError } = await supabase
    .from("collection_items")
    .update({
      marketplace_item_id: marketplaceItemId,
      visibility: "ready_for_sale",
    })
    .eq("id", item.id)
    .eq("owner_id", user.id);

  if (updateError) throw updateError;

  return marketplaceItemId;
}

async function createCollectionNotification(input: {
  userId: string;
  title: string;
  message: string;
  type: MarketplaceNotification["type"];
  relatedItemId?: string | null;
}) {
  const supabase = getCollectionSupabase();
  const { error } = await supabase.from("marketplace_notifications").insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    related_item_id: input.relatedItemId ?? null,
  });

  if (error) throw error;
}

async function getAdminUser() {
  const supabase = getCollectionSupabase();
  const { data, error } = await supabase.auth.getUser();
  const metadata = data.user?.app_metadata ?? {};
  const isAdmin = metadata.role === "admin" || metadata.marketplace_admin === true;

  if (error || !data.user || !isAdmin) {
    throw new Error("Unauthorized");
  }

  return data.user;
}

export async function getPendingCollectionItemsForAdmin() {
  await getAdminUser();
  const supabase = getCollectionSupabase();
  const { data, error } = await supabase
    .from("collection_items")
    .select("*, collection_item_images(*)")
    .eq("review_status", "pending_review")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as CollectionItemRow[]).map(mapCollectionItem);
}

async function getAdminCollectionItemOrThrow(id: string) {
  await getAdminUser();
  const supabase = getCollectionSupabase();
  const { data, error } = await supabase
    .from("collection_items")
    .select("*, collection_item_images(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return mapCollectionItem(data as CollectionItemRow);
}

export async function verifyCollectionItem(id: string) {
  const admin = await getAdminUser();
  const item = await getAdminCollectionItemOrThrow(id);
  const supabase = getCollectionSupabase();
  const { error } = await supabase
    .from("collection_items")
    .update({
      review_status: "verified",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      review_note: null,
    })
    .eq("id", id);

  if (error) throw error;

  await createCollectionNotification({
    userId: item.ownerId,
    title: "تم توثيق مقتناك في KISHIB",
    message: "المقتنى أصبح موثقا ويمكنك عرضه للبيع في سوق كيشب.",
    type: "collection_verified",
    relatedItemId: null,
  });
}

export async function requestCollectionItemChanges(id: string, reason: string) {
  const admin = await getAdminUser();
  const item = await getAdminCollectionItemOrThrow(id);
  const supabase = getCollectionSupabase();
  const { error } = await supabase
    .from("collection_items")
    .update({
      review_status: "needs_changes",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      review_note: reason,
    })
    .eq("id", id);

  if (error) throw error;

  await createCollectionNotification({
    userId: item.ownerId,
    title: "المقتنى يحتاج تعديلات",
    message: reason,
    type: "collection_needs_changes",
  });
}

export async function rejectCollectionItem(id: string, reason: string) {
  const admin = await getAdminUser();
  const item = await getAdminCollectionItemOrThrow(id);
  const supabase = getCollectionSupabase();
  const { error } = await supabase
    .from("collection_items")
    .update({
      review_status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      review_note: reason,
    })
    .eq("id", id);

  if (error) throw error;

  await createCollectionNotification({
    userId: item.ownerId,
    title: "تم رفض توثيق المقتنى",
    message: reason,
    type: "collection_rejected",
  });
}

export function getCollectionReviewStatusLabel(status: CollectionReviewStatus) {
  const labels: Record<CollectionReviewStatus, string> = {
    pending_review: "قيد المراجعة",
    verified: "موثق",
    needs_changes: "يحتاج تعديل",
    rejected: "مرفوض",
  };

  return labels[status] ?? status;
}
