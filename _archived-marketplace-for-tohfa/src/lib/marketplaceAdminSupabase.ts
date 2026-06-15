"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type {
  MarketplaceItem,
  MarketplaceItemImage,
  MarketplaceItemStatus,
  MarketplaceNotification,
  MarketplaceOrder,
  MarketplaceOrderStatus,
} from "@/types/marketplace";
import type { SupabaseClient } from "@supabase/supabase-js";

type AdminItemImageRow = {
  id: string;
  item_id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number | null;
  created_at: string;
};

type AdminItemRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category: MarketplaceItem["category"];
  material: string | null;
  origin: string | null;
  estimated_age: string | null;
  condition: MarketplaceItem["condition"];
  price: number | string;
  currency: "IQD" | "USD" | null;
  country: string | null;
  city: string | null;
  delivery_method: string | null;
  has_kishib_evaluation: boolean | null;
  kishib_evaluation_summary: string | null;
  status: MarketplaceItemStatus;
  rejection_reason: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  marketplace_item_images?: AdminItemImageRow[];
};

type AdminOrderRow = {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  item_price: number | string;
  commission_percent: number | string;
  commission_amount: number | string;
  seller_net_amount: number | string;
  payment_gateway_fee: number | string | null;
  total_paid_by_buyer: number | string;
  status: MarketplaceOrderStatus;
  created_at: string;
  updated_at: string;
  marketplace_items?: AdminItemRow | AdminItemRow[] | null;
};

type AdminNotificationRow = {
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

type AdminDatabase = {
  public: {
    Tables: {
      marketplace_items: {
        Row: AdminItemRow;
        Insert: Partial<AdminItemRow>;
        Update: Partial<AdminItemRow>;
        Relationships: [];
      };
      marketplace_item_images: {
        Row: AdminItemImageRow;
        Insert: Partial<AdminItemImageRow>;
        Update: Partial<AdminItemImageRow>;
        Relationships: [];
      };
      marketplace_orders: {
        Row: AdminOrderRow;
        Insert: Partial<AdminOrderRow>;
        Update: Partial<AdminOrderRow>;
        Relationships: [];
      };
      marketplace_notifications: {
        Row: AdminNotificationRow;
        Insert: Partial<AdminNotificationRow> & {
          user_id: string;
          title: string;
          message: string;
          type: MarketplaceNotification["type"];
        };
        Update: Partial<AdminNotificationRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type MarketplaceAdminStats = {
  pendingReview: number;
  published: number;
  needsChanges: number;
  rejected: number;
  sold: number;
  purchaseRequestedOrders: number;
  totalCommission: number;
};

function getAdminSupabase() {
  return getSupabaseBrowserClient() as SupabaseClient<AdminDatabase>;
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function mapImage(row: AdminItemImageRow): MarketplaceItemImage {
  return {
    id: row.id,
    itemId: row.item_id,
    imageUrl: row.image_url,
    storagePath: row.storage_path,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
  };
}

function mapItem(row: AdminItemRow): MarketplaceItem {
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.title,
    description: row.description ?? "",
    category: row.category,
    material: row.material ?? "",
    origin: row.origin ?? "",
    estimatedAge: row.estimated_age ?? "",
    condition: row.condition,
    price: toNumber(row.price),
    currency: row.currency ?? "IQD",
    country: row.country ?? "",
    city: row.city ?? "",
    deliveryMethod: row.delivery_method ?? "",
    images: (row.marketplace_item_images ?? [])
      .map(mapImage)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    hasKishibEvaluation: Boolean(row.has_kishib_evaluation),
    kishibEvaluationSummary: row.kishib_evaluation_summary ?? "",
    status: row.status,
    rejectionReason: row.rejection_reason,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrder(row: AdminOrderRow): MarketplaceOrder {
  const joinedItem = Array.isArray(row.marketplace_items)
    ? row.marketplace_items[0]
    : row.marketplace_items;
  const item = joinedItem ? mapItem(joinedItem) : undefined;

  return {
    id: row.id,
    itemId: row.item_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    itemPrice: toNumber(row.item_price),
    commissionPercent: toNumber(row.commission_percent),
    commissionAmount: toNumber(row.commission_amount),
    sellerNetAmount: toNumber(row.seller_net_amount),
    paymentGatewayFee: toNumber(row.payment_gateway_fee),
    totalPaidByBuyer: toNumber(row.total_paid_by_buyer),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    item: item
      ? {
          id: item.id,
          title: item.title,
          price: item.price,
          currency: item.currency,
          images: item.images,
        }
      : undefined,
  };
}

function mapNotification(row: AdminNotificationRow): MarketplaceNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    relatedItemId: row.related_item_id,
    relatedOrderId: row.related_order_id,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

async function getAdminUser() {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.auth.getUser();
  const metadata = data.user?.app_metadata ?? {};
  const isAdmin = metadata.role === "admin" || metadata.marketplace_admin === true;

  if (error || !data.user || !isAdmin) {
    throw new Error("Unauthorized");
  }

  return data.user;
}

export async function isCurrentUserMarketplaceAdmin() {
  const supabase = getAdminSupabase();
  const { data } = await supabase.auth.getUser();
  const metadata = data.user?.app_metadata ?? {};

  return metadata.role === "admin" || metadata.marketplace_admin === true;
}

export async function getMarketplaceAdminStats(): Promise<MarketplaceAdminStats> {
  await getAdminUser();
  const supabase = getAdminSupabase();
  const [{ data: items, error: itemsError }, { data: orders, error: ordersError }] =
    await Promise.all([
      supabase.from("marketplace_items").select("status"),
      supabase.from("marketplace_orders").select("status, commission_amount"),
    ]);

  if (itemsError) throw itemsError;
  if (ordersError) throw ordersError;

  const rows = (items ?? []) as Pick<AdminItemRow, "status">[];
  const orderRows = (orders ?? []) as Pick<AdminOrderRow, "status" | "commission_amount">[];

  return {
    pendingReview: rows.filter((item) => item.status === "pending_review").length,
    published: rows.filter((item) => item.status === "published").length,
    needsChanges: rows.filter((item) => item.status === "needs_changes").length,
    rejected: rows.filter((item) => item.status === "rejected").length,
    sold: rows.filter((item) => item.status === "sold").length,
    purchaseRequestedOrders: orderRows.filter(
      (order) => order.status === "purchase_requested",
    ).length,
    totalCommission: orderRows.reduce(
      (sum, order) => sum + toNumber(order.commission_amount),
      0,
    ),
  };
}

export async function getPendingReviewItems() {
  return getAdminMarketplaceItems("pending_review");
}

export async function getAdminMarketplaceItems(status?: MarketplaceItemStatus) {
  await getAdminUser();
  const supabase = getAdminSupabase();
  let query = supabase
    .from("marketplace_items")
    .select("*, marketplace_item_images(*)")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw error;

  return ((data ?? []) as AdminItemRow[]).map(mapItem);
}

async function createNotification(input: {
  userId: string;
  title: string;
  message: string;
  type: MarketplaceNotification["type"];
  relatedItemId?: string;
  relatedOrderId?: string;
}) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("marketplace_notifications").insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    related_item_id: input.relatedItemId ?? null,
    related_order_id: input.relatedOrderId ?? null,
  });

  if (error) throw error;
}

async function getAdminItemOrThrow(itemId: string) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("marketplace_items")
    .select("*, marketplace_item_images(*)")
    .eq("id", itemId)
    .single();

  if (error) throw error;

  return mapItem(data as AdminItemRow);
}

export async function approveMarketplaceItem(itemId: string) {
  const user = await getAdminUser();
  const item = await getAdminItemOrThrow(itemId);
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("marketplace_items")
    .update({
      status: "published",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      review_note: null,
      rejection_reason: null,
    })
    .eq("id", itemId);

  if (error) throw error;

  await createNotification({
    userId: item.sellerId,
    title: "تم نشر قطعتك في سوق كيشيب",
    message: "قطعتك أصبحت الآن ظاهرة للمشترين.",
    type: "item_published",
    relatedItemId: itemId,
  });
}

export async function rejectMarketplaceItem(itemId: string, reason: string) {
  const user = await getAdminUser();
  const item = await getAdminItemOrThrow(itemId);
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("marketplace_items")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      review_note: reason,
      rejection_reason: reason,
    })
    .eq("id", itemId);

  if (error) throw error;

  await createNotification({
    userId: item.sellerId,
    title: "تم رفض نشر القطعة",
    message: reason,
    type: "item_rejected",
    relatedItemId: itemId,
  });
}

export async function requestMarketplaceItemChanges(itemId: string, reason: string) {
  const user = await getAdminUser();
  const item = await getAdminItemOrThrow(itemId);
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("marketplace_items")
    .update({
      status: "needs_changes",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      review_note: reason,
    })
    .eq("id", itemId);

  if (error) throw error;

  await createNotification({
    userId: item.sellerId,
    title: "القطعة تحتاج تعديلات قبل النشر",
    message: reason,
    type: "item_needs_changes",
    relatedItemId: itemId,
  });
}

export async function getAdminMarketplaceOrders(status?: MarketplaceOrderStatus) {
  await getAdminUser();
  const supabase = getAdminSupabase();
  let query = supabase
    .from("marketplace_orders")
    .select("*, marketplace_items(*, marketplace_item_images(*))")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw error;

  return ((data ?? []) as AdminOrderRow[]).map(mapOrder);
}

export async function updateMarketplaceOrderStatus(
  orderId: string,
  status: MarketplaceOrderStatus,
) {
  await getAdminUser();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("marketplace_orders")
    .update({ status })
    .eq("id", orderId)
    .select("*, marketplace_items(*, marketplace_item_images(*))")
    .single();

  if (error) throw error;

  const order = mapOrder(data as AdminOrderRow);
  const title = "تم تحديث حالة طلب الشراء";
  const message = `حالة الطلب أصبحت: ${status}`;

  await Promise.all([
    createNotification({
      userId: order.buyerId,
      title,
      message,
      type: "order_updated",
      relatedItemId: order.itemId,
      relatedOrderId: order.id,
    }),
    createNotification({
      userId: order.sellerId,
      title,
      message,
      type: "order_updated",
      relatedItemId: order.itemId,
      relatedOrderId: order.id,
    }),
  ]);
}

export async function getAdminMarketplaceNotifications() {
  await getAdminUser();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("marketplace_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return ((data ?? []) as AdminNotificationRow[]).map(mapNotification);
}
