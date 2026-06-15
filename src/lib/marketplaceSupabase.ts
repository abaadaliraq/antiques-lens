"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  getMockMarketplaceItemById,
  marketplaceMockData,
} from "@/data/marketplaceMockData";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateMarketplaceItemInput,
  MarketplaceCategory,
  MarketplaceCondition,
  MarketplaceItem,
  MarketplaceItemImage,
  MarketplaceItemStatus,
  MarketplaceNotification,
  MarketplaceOrder,
  MarketplaceOrderStatus,
} from "@/types/marketplace";

export const KISHIB_COMMISSION_PERCENT = 3;
export const MARKETPLACE_STORAGE_BUCKET = "marketplace-items";

type MarketplaceDatabase = {
  public: {
    Tables: {
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
        Row: MarketplaceItemImageRow;
        Insert: {
          item_id: string;
          image_url: string;
          storage_path?: string | null;
          sort_order?: number;
        };
        Update: Partial<MarketplaceItemImageRow>;
        Relationships: [];
      };
      marketplace_orders: {
        Row: MarketplaceOrderRow;
        Insert: {
          item_id: string;
          seller_id: string;
          buyer_id: string;
          item_price: number;
          commission_percent: number;
          commission_amount: number;
          seller_net_amount: number;
          payment_gateway_fee: number;
          total_paid_by_buyer: number;
          status: MarketplaceOrderStatus;
        };
        Update: Partial<MarketplaceOrderRow>;
        Relationships: [];
      };
      marketplace_notifications: {
        Row: MarketplaceNotificationRow;
        Insert: Partial<MarketplaceNotificationRow> & {
          user_id: string;
          title: string;
          message: string;
          type: string;
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

export const marketplaceCategories: MarketplaceCategory[] = [
  "قطع سومرية",
  "مخطوطات",
  "فضيات",
  "سجاد",
  "خزف",
  "حلي",
  "أخشاب",
];

export const marketplaceConditions: MarketplaceCondition[] = [
  "ممتازة",
  "جيدة جدا",
  "جيدة",
  "تحتاج ترميم",
  "آثار عمر واضحة",
];

type MarketplaceItemImageRow = {
  id: string;
  item_id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number | null;
  created_at: string;
};

type MarketplaceItemRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category: MarketplaceCategory;
  material: string | null;
  origin: string | null;
  estimated_age: string | null;
  condition: MarketplaceCondition;
  price: number | string;
  currency: "IQD" | "USD" | null;
  country: string | null;
  city: string | null;
  delivery_method: string | null;
  has_kishib_evaluation: boolean | null;
  kishib_evaluation_summary: string | null;
  status: MarketplaceItemStatus;
  rejection_reason: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
  marketplace_item_images?: MarketplaceItemImageRow[];
};

type MarketplaceNotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_item_id: string | null;
  related_order_id: string | null;
  read_at: string | null;
  created_at: string;
};

type MarketplaceOrderRow = {
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
  marketplace_items?: MarketplaceItemRow | MarketplaceItemRow[] | null;
};

function getMarketplaceSupabase() {
  return getSupabaseBrowserClient() as SupabaseClient<MarketplaceDatabase>;
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function mapImage(row: MarketplaceItemImageRow): MarketplaceItemImage {
  return {
    id: row.id,
    itemId: row.item_id,
    imageUrl: row.image_url,
    storagePath: row.storage_path,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
  };
}

function mapItem(row: MarketplaceItemRow): MarketplaceItem {
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
    reviewNote: row.review_note ?? row.rejection_reason,
    reviewedAt: row.reviewed_at ?? null,
    reviewedBy: row.reviewed_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrder(row: MarketplaceOrderRow): MarketplaceOrder {
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

async function getCurrentUser() {
  const supabase = getMarketplaceSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("يجب تسجيل الدخول أولا.");
  }

  return data.user;
}

export async function getCurrentUserIsMarketplaceAdmin() {
  const supabase = getMarketplaceSupabase();
  const { data } = await supabase.auth.getUser();
  const metadata = data.user?.app_metadata ?? {};

  return metadata.role === "admin" || metadata.marketplace_admin === true;
}

export function calculateMarketplaceAmounts(itemPrice: number) {
  const commissionAmount =
    Math.round(itemPrice * (KISHIB_COMMISSION_PERCENT / 100) * 100) / 100;
  const sellerNetAmount = Math.round((itemPrice - commissionAmount) * 100) / 100;

  return {
    commissionPercent: KISHIB_COMMISSION_PERCENT,
    commissionAmount,
    sellerNetAmount,
    paymentGatewayFee: 0,
    totalPaidByBuyer: itemPrice,
  };
}

export async function getPublishedMarketplaceItems() {
  const supabase = getMarketplaceSupabase();
  const { data, error } = await supabase
    .from("marketplace_items")
    .select("*, marketplace_item_images(*)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as MarketplaceItemRow[]).map(mapItem);
}

export async function getMarketplaceItemsWithFallback() {
  try {
    const items = await getPublishedMarketplaceItems();
    return items.length > 0 ? items : marketplaceMockData;
  } catch {
    return marketplaceMockData;
  }
}

export async function getMarketplaceItemById(id: string) {
  const supabase = getMarketplaceSupabase();
  const { data, error } = await supabase
    .from("marketplace_items")
    .select("*, marketplace_item_images(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data ? mapItem(data as MarketplaceItemRow) : null;
}

export async function getMarketplaceItemByIdWithFallback(id: string) {
  const mockItem = getMockMarketplaceItemById(id);
  if (mockItem) return mockItem;

  try {
    return await getMarketplaceItemById(id);
  } catch {
    return null;
  }
}

export async function createMarketplaceItem(input: CreateMarketplaceItemInput) {
  const supabase = getMarketplaceSupabase();
  const user = await getCurrentUser();

  const { data: itemRow, error: itemError } = await supabase
    .from("marketplace_items")
    .insert({
      seller_id: user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      material: input.material,
      origin: input.origin,
      estimated_age: input.estimatedAge,
      condition: input.condition,
      price: input.price,
      currency: input.currency,
      country: input.country,
      city: input.city ?? null,
      delivery_method: input.deliveryMethod,
      status: "pending_review",
    })
    .select("*, marketplace_item_images(*)")
    .single();

  if (itemError) throw itemError;

  const itemId = (itemRow as MarketplaceItemRow).id;
  const imageRows: Array<{
    item_id: string;
    image_url: string;
    storage_path: string;
    sort_order: number;
  }> = [];

  for (const [index, file] of input.images.entries()) {
    const path = `${user.id}/${itemId}/${Date.now()}-${index}-${cleanFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(MARKETPLACE_STORAGE_BUCKET)
      .upload(path, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(MARKETPLACE_STORAGE_BUCKET)
      .getPublicUrl(path);

    imageRows.push({
      item_id: itemId,
      image_url: publicUrlData.publicUrl,
      storage_path: path,
      sort_order: index,
    });
  }

  if (imageRows.length > 0) {
    const { error: imageError } = await supabase
      .from("marketplace_item_images")
      .insert(imageRows);

    if (imageError) throw imageError;
  }

  const created = await getMarketplaceItemById(itemId);
  if (!created) throw new Error("تعذر قراءة القطعة بعد إنشائها.");

  return created;
}

export async function getSellerMarketplaceItems() {
  const supabase = getMarketplaceSupabase();
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("marketplace_items")
    .select("*, marketplace_item_images(*)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as MarketplaceItemRow[]).map(mapItem);
}

export async function createMarketplaceOrder(itemId: string) {
  const supabase = getMarketplaceSupabase();
  const user = await getCurrentUser();
  const item = await getMarketplaceItemById(itemId);

  if (!item) throw new Error("القطعة غير موجودة.");
  if (item.sellerId === user.id) throw new Error("لا يمكنك شراء قطعتك الخاصة.");
  if (item.status !== "published") {
    throw new Error("هذه القطعة غير متاحة للشراء حاليا.");
  }

  const amounts = calculateMarketplaceAmounts(item.price);
  const { data, error } = await supabase
    .from("marketplace_orders")
    .insert({
      item_id: item.id,
      buyer_id: user.id,
      seller_id: item.sellerId,
      item_price: item.price,
      commission_percent: amounts.commissionPercent,
      commission_amount: amounts.commissionAmount,
      seller_net_amount: amounts.sellerNetAmount,
      payment_gateway_fee: amounts.paymentGatewayFee,
      total_paid_by_buyer: amounts.totalPaidByBuyer,
      status: "purchase_requested",
    })
    .select("*, marketplace_items(*, marketplace_item_images(*))")
    .single();

  if (error) throw error;

  return mapOrder(data as MarketplaceOrderRow);
}

export async function getBuyerOrders() {
  const supabase = getMarketplaceSupabase();
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("marketplace_orders")
    .select("*, marketplace_items(*, marketplace_item_images(*))")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as MarketplaceOrderRow[]).map(mapOrder);
}

export async function getSellerOrders() {
  const supabase = getMarketplaceSupabase();
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("marketplace_orders")
    .select("*, marketplace_items(*, marketplace_item_images(*))")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as MarketplaceOrderRow[]).map(mapOrder);
}

export async function resubmitMarketplaceItemForReview(itemId: string) {
  const supabase = getMarketplaceSupabase();
  const user = await getCurrentUser();
  const { error } = await supabase
    .from("marketplace_items")
    .update({
      status: "pending_review",
      review_note: null,
      rejection_reason: null,
    })
    .eq("id", itemId)
    .eq("seller_id", user.id)
    .neq("status", "sold");

  if (error) throw error;
}

export async function getMarketplaceNotifications(): Promise<MarketplaceNotification[]> {
  const supabase = getMarketplaceSupabase();
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("marketplace_notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as MarketplaceNotificationRow[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type as MarketplaceNotification["type"],
    relatedItemId: row.related_item_id,
    relatedOrderId: row.related_order_id,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}

export async function markMarketplaceNotificationRead(notificationId: string) {
  const supabase = getMarketplaceSupabase();
  const user = await getCurrentUser();
  const { error } = await supabase
    .from("marketplace_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function getPendingMarketplaceItemsForAdmin() {
  if (!(await getCurrentUserIsMarketplaceAdmin())) {
    return [];
  }

  const supabase = getMarketplaceSupabase();
  const { data, error } = await supabase
    .from("marketplace_items")
    .select("*, marketplace_item_images(*)")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as MarketplaceItemRow[]).map(mapItem);
}

export async function adminApproveMarketplaceItem(id: string) {
  if (!(await getCurrentUserIsMarketplaceAdmin())) {
    throw new Error("صلاحية الأدمن مطلوبة لمراجعة السوق.");
  }

  const supabase = getMarketplaceSupabase();
  const { error } = await supabase
    .from("marketplace_items")
    .update({ status: "published", rejection_reason: null })
    .eq("id", id);

  if (error) throw error;
}

export async function adminRejectMarketplaceItem(id: string, reason?: string) {
  if (!(await getCurrentUserIsMarketplaceAdmin())) {
    throw new Error("صلاحية الأدمن مطلوبة لمراجعة السوق.");
  }

  const supabase = getMarketplaceSupabase();
  const { error } = await supabase
    .from("marketplace_items")
    .update({ status: "rejected", rejection_reason: reason ?? null })
    .eq("id", id);

  if (error) throw error;
}

export function formatMarketplaceMoney(amount: number, currency = "IQD") {
  return new Intl.NumberFormat("ar-IQ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusLabel(status: MarketplaceItemStatus | MarketplaceOrderStatus) {
  const labels: Record<string, string> = {
    pending_review: "بانتظار المراجعة",
    published: "منشورة",
    rejected: "مرفوضة",
    reserved: "محجوزة",
    sold: "مباعة",
    purchase_requested: "طلب شراء مرسل",
    seller_confirmed: "أكدها البائع",
    awaiting_payment: "بانتظار الدفع",
    paid: "مدفوعة",
    delivered: "تم التسليم",
    completed: "مكتملة",
    cancelled: "ملغاة",
    dispute: "نزاع",
  };

  return labels[status] ?? status;
}
