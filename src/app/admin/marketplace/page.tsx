"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  approveMarketplaceItem,
  getAdminMarketplaceItems,
  getAdminMarketplaceNotifications,
  getAdminMarketplaceOrders,
  getMarketplaceAdminStats,
  getPendingReviewItems,
  isCurrentUserMarketplaceAdmin,
  rejectMarketplaceItem,
  requestMarketplaceItemChanges,
  updateMarketplaceOrderStatus,
  type MarketplaceAdminStats,
} from "@/lib/marketplaceAdminSupabase";
import {
  formatMarketplaceMoney,
} from "@/lib/marketplaceSupabase";
import {
  getMarketplaceCountryLabel,
  getMarketplaceStatusLabel,
  marketplaceCopy,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";
import {
  getPendingCollectionItemsForAdmin,
  rejectCollectionItem,
  requestCollectionItemChanges,
  verifyCollectionItem,
} from "@/lib/collectionSupabase";
import { collectionCopy, getCollectionStatusLabel } from "@/lib/collectionI18n";
import type {
  MarketplaceItem,
  MarketplaceItemStatus,
  MarketplaceNotification,
  MarketplaceOrder,
  MarketplaceOrderStatus,
} from "@/types/marketplace";
import type { Locale } from "@/components/antique-ai/types";
import type { CollectionItem } from "@/types/collection";

const itemStatuses: MarketplaceItemStatus[] = [
  "pending_review",
  "published",
  "needs_changes",
  "rejected",
  "reserved",
  "sold",
];

const orderStatuses: MarketplaceOrderStatus[] = [
  "seller_confirmed",
  "awaiting_payment",
  "paid",
  "delivered",
  "completed",
  "cancelled",
  "dispute",
];

const quickReasons = [
  "الصور غير واضحة، نحتاج صور أوضح من الأمام والخلف.",
  "نحتاج صورة قريبة للختم أو التوقيع.",
  "الوصف غير كاف، يرجى إضافة تفاصيل أكثر عن القطعة.",
  "السعر يحتاج مراجعة لأنه غير مناسب للحالة المعروضة.",
  "نحتاج صورة للقطعة بجانب مقياس حجم أو مسطرة.",
];

type Tab = "review" | "collection" | "items" | "orders" | "notifications";

const emptyStats: MarketplaceAdminStats = {
  pendingReview: 0,
  published: 0,
  needsChanges: 0,
  rejected: 0,
  sold: 0,
  purchaseRequestedOrders: 0,
  totalCommission: 0,
};

export default function AdminMarketplacePage() {
  const locale = useMarketplaceLocale();
  const t = marketplaceCopy(locale);
  const collectionT = collectionCopy(locale);
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>("review");
  const [stats, setStats] = useState<MarketplaceAdminStats>(emptyStats);
  const [pendingItems, setPendingItems] = useState<MarketplaceItem[]>([]);
  const [pendingCollectionItems, setPendingCollectionItems] = useState<CollectionItem[]>([]);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [notifications, setNotifications] = useState<MarketplaceNotification[]>([]);
  const [itemStatusFilter, setItemStatusFilter] =
    useState<MarketplaceItemStatus | "all">("all");
  const [reasonByItem, setReasonByItem] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function loadDashboard() {
    setError("");
    setIsChecking(true);

    try {
      const canUseAdmin = await isCurrentUserMarketplaceAdmin();
      setIsAdmin(canUseAdmin);

      if (!canUseAdmin) return;

      const [
        nextStats,
        reviewItems,
        collectionReviewItems,
        adminItems,
        adminOrders,
        adminNotifications,
      ] =
        await Promise.all([
          getMarketplaceAdminStats(),
          getPendingReviewItems(),
          getPendingCollectionItemsForAdmin(),
          getAdminMarketplaceItems(),
          getAdminMarketplaceOrders(),
          getAdminMarketplaceNotifications(),
        ]);

      setStats(nextStats);
      setPendingItems(reviewItems);
      setPendingCollectionItems(collectionReviewItems);
      setItems(adminItems);
      setOrders(adminOrders);
      setNotifications(adminNotifications);
    } catch (dashboardError) {
      setError(
        dashboardError instanceof Error
          ? dashboardError.message
          : "تعذر تحميل لوحة إدارة السوق.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const filteredItems = useMemo(() => {
    if (itemStatusFilter === "all") return items;
    return items.filter((item) => item.status === itemStatusFilter);
  }, [items, itemStatusFilter]);

  async function runItemAction(
    itemId: string,
    action: "approve" | "reject" | "changes",
  ) {
    const reason = reasonByItem[itemId]?.trim() ?? "";

    if ((action === "reject" || action === "changes") && !reason) {
      setError("سبب الرفض أو طلب التعديل إجباري.");
      return;
    }

    setBusyId(itemId);
    setError("");

    try {
      if (action === "approve") await approveMarketplaceItem(itemId);
      if (action === "reject") await rejectMarketplaceItem(itemId, reason);
      if (action === "changes") await requestMarketplaceItemChanges(itemId, reason);
      await loadDashboard();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "تعذر تنفيذ الإجراء.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function runCollectionAction(
    itemId: string,
    action: "verify" | "reject" | "changes",
  ) {
    const reason = reasonByItem[itemId]?.trim() ?? "";

    if ((action === "reject" || action === "changes") && !reason) {
      setError(collectionT.reviewReason);
      return;
    }

    setBusyId(itemId);
    setError("");

    try {
      if (action === "verify") await verifyCollectionItem(itemId);
      if (action === "reject") await rejectCollectionItem(itemId, reason);
      if (action === "changes") await requestCollectionItemChanges(itemId, reason);
      await loadDashboard();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to update collection review.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function changeOrderStatus(orderId: string, status: MarketplaceOrderStatus) {
    setBusyId(orderId);
    setError("");

    try {
      await updateMarketplaceOrderStatus(orderId, status);
      await loadDashboard();
    } catch (orderError) {
      setError(
        orderError instanceof Error ? orderError.message : "تعذر تحديث الطلب.",
      );
    } finally {
      setBusyId("");
    }
  }

  if (isChecking && !isAdmin) {
    return (
      <AdminShell>
        <StatusMessage>جار التحقق من صلاحية الأدمن...</StatusMessage>
      </AdminShell>
    );
  }

  if (!isAdmin) {
    return (
      <AdminShell>
        <StatusMessage danger>
          Unauthorized - هذه الصفحة متاحة فقط لأدمن سوق كيشيب.
        </StatusMessage>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <header className="mb-6 flex flex-col gap-4 border-b border-[#d2b98f]/16 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.26em] text-[#d7ae61]">
            KISHIB ADMIN
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#fff4e2] sm:text-4xl">
            لوحة إدارة سوق كيشيب
          </h1>
          <p className="mt-2 text-sm leading-7 text-[#dcc18a]">
            مراجعة القطع، نشرها، رفضها، ومتابعة طلبات الشراء.
          </p>
        </div>
        <button
          onClick={() => void loadDashboard()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#d2b98f]/28 bg-[#fff4e2]/8 px-4 text-sm text-[#fff4e2]"
        >
          <RefreshCw className="h-4 w-4" />
          تحديث
        </button>
      </header>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Metric label="بانتظار المراجعة" value={stats.pendingReview} icon={<ClipboardList />} />
        <Metric label="منشورة" value={stats.published} icon={<PackageCheck />} />
        <Metric label="تحتاج تعديل" value={stats.needsChanges} icon={<AlertCircle />} />
        <Metric label="مرفوضة" value={stats.rejected} icon={<XCircle />} />
        <Metric label="طلبات شراء جديدة" value={stats.purchaseRequestedOrders} icon={<CheckCircle2 />} />
        <Metric
          label="عمولة كيشيب"
          value={formatMarketplaceMoney(stats.totalCommission)}
          icon={<Bell />}
        />
      </section>

      <nav className="mb-5 flex gap-2 overflow-x-auto rounded-[8px] border border-[#d2b98f]/16 bg-black/18 p-1">
        <TabButton active={tab === "review"} onClick={() => setTab("review")}>
          مراجعة القطع
        </TabButton>
        <TabButton active={tab === "collection"} onClick={() => setTab("collection")}>
          {collectionT.collectionReview}
        </TabButton>
        <TabButton active={tab === "items"} onClick={() => setTab("items")}>
          كل القطع
        </TabButton>
        <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>
          طلبات الشراء
        </TabButton>
        <TabButton
          active={tab === "notifications"}
          onClick={() => setTab("notifications")}
        >
          الإشعارات
        </TabButton>
      </nav>

      {error ? <StatusMessage danger>{error}</StatusMessage> : null}

      {tab === "review" ? (
        <ItemReviewList
          items={pendingItems}
          busyId={busyId}
          reasonByItem={reasonByItem}
          setReasonByItem={setReasonByItem}
          onAction={runItemAction}
          locale={locale}
          unknownLabel={t.unknown}
        />
      ) : null}

      {tab === "collection" ? (
        <CollectionReviewList
          items={pendingCollectionItems}
          busyId={busyId}
          reasonByItem={reasonByItem}
          setReasonByItem={setReasonByItem}
          onAction={runCollectionAction}
          locale={locale}
          unknownLabel={t.unknown}
        />
      ) : null}

      {tab === "items" ? (
        <section className="space-y-4">
          <select
            value={itemStatusFilter}
            onChange={(event) =>
              setItemStatusFilter(event.target.value as MarketplaceItemStatus | "all")
            }
            className="h-10 rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2]"
          >
            <option value="all">كل الحالات</option>
            {itemStatuses.map((status) => (
              <option key={status} value={status}>
                {getMarketplaceStatusLabel(status, locale)}
              </option>
            ))}
          </select>
          <ItemReviewList
            items={filteredItems}
            busyId={busyId}
            reasonByItem={reasonByItem}
            setReasonByItem={setReasonByItem}
            onAction={runItemAction}
            locale={locale}
            unknownLabel={t.unknown}
            compact
          />
        </section>
      ) : null}

      {tab === "orders" ? (
        <section className="space-y-3">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-4 text-sm text-[#f8ead6]"
            >
              <div className="grid gap-2 lg:grid-cols-4">
                <p>{order.item?.title ?? order.itemId}</p>
                <p>{formatMarketplaceMoney(order.itemPrice)}</p>
                <p>عمولة: {formatMarketplaceMoney(order.commissionAmount)}</p>
                <p>صافي البائع: {formatMarketplaceMoney(order.sellerNetAmount)}</p>
              </div>
              <p className="mt-2 text-[#dcc18a]">
                buyer_id: {order.buyerId} | seller_id: {order.sellerId}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {orderStatuses.map((status) => (
                  <button
                    key={status}
                    disabled={busyId === order.id}
                    onClick={() => void changeOrderStatus(order.id, status)}
                    className="rounded-[8px] bg-[#fff4e2]/10 px-3 py-2 text-xs text-[#fff4e2] disabled:opacity-50"
                  >
                    {getMarketplaceStatusLabel(status, locale)}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {tab === "notifications" ? (
        <section className="space-y-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-4 text-sm text-[#f8ead6]"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-semibold">{notification.title}</h2>
                <span className="text-xs text-[#dcc18a]">
                  {new Date(notification.createdAt).toLocaleString("ar-IQ")}
                </span>
              </div>
              <p className="mt-2 text-[#dcc18a]">{notification.message}</p>
              <p className="mt-2 text-xs text-[#f8ead6]/70">
                {notification.type} | {notification.readAt ? "مقروء" : "غير مقروء"}
              </p>
            </article>
          ))}
          {notifications.length === 0 ? (
            <StatusMessage>لا توجد إشعارات مرسلة بعد.</StatusMessage>
          ) : null}
        </section>
      ) : null}
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main dir="rtl" className="min-h-dvh bg-[#130d0a] text-[#fff4e2]">
      <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(35,91,74,0.22),transparent_34%),linear-gradient(145deg,rgba(88,29,22,0.42),rgba(19,13,10,0.96)_46%,rgba(8,8,11,1))]">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-4">
      <div className="mb-3 text-[#d7ae61] [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      <p className="text-xs text-[#dcc18a]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#fff4e2]">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "shrink-0 rounded-[8px] px-4 py-2 text-sm font-semibold",
        active
          ? "bg-[#b88a3d] text-[#fff4e2]"
          : "text-[#dcc18a] hover:bg-[#fff4e2]/8",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatusMessage({
  children,
  danger,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[8px] border p-6 text-sm",
        danger
          ? "border-[#8e3c32]/50 bg-[#7a2f25]/38 text-[#ffd7cf]"
          : "border-[#d2b98f]/20 bg-[#fff4e2]/8 text-[#dcc18a]",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function CollectionReviewList({
  items,
  busyId,
  reasonByItem,
  setReasonByItem,
  onAction,
  locale,
  unknownLabel,
}: {
  items: CollectionItem[];
  busyId: string;
  reasonByItem: Record<string, string>;
  setReasonByItem: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onAction: (itemId: string, action: "verify" | "reject" | "changes") => void;
  locale: Locale;
  unknownLabel: string;
}) {
  const collectionT = collectionCopy(locale);

  return (
    <section className="grid gap-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="grid gap-4 rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-4 md:grid-cols-[180px_1fr]"
        >
          <div className="relative aspect-square overflow-hidden rounded-[8px] bg-black/20">
            <Image
              src={item.images[0]?.imageUrl ?? "/kishib-logo.png"}
              alt={item.title}
              fill
              sizes="(min-width: 768px) 180px, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-[#dcc18a]">
                  {getMarketplaceCountryLabel(item.country, locale)}
                  {item.city ? ` / ${item.city}` : ""}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[#fff4e2]">
                  {item.title}
                </h2>
              </div>
              <span className="rounded-full bg-[#fff4e2]/10 px-3 py-1 text-xs text-[#f8ead6]">
                {getCollectionStatusLabel(item.reviewStatus, locale)}
              </span>
            </div>

            <div className="mt-3 grid gap-2 text-sm text-[#dcc18a] sm:grid-cols-3">
              <span>{item.category}</span>
              <span>
                {item.estimatedValue
                  ? formatMarketplaceMoney(item.estimatedValue, item.currency)
                  : unknownLabel}
              </span>
              <span>owner_id: {item.ownerId}</span>
            </div>

            <div className="mt-3 grid gap-2 text-sm text-[#dcc18a] sm:grid-cols-3">
              <span>{item.material || unknownLabel}</span>
              <span>{item.origin || unknownLabel}</span>
              <span>{item.estimatedAge || unknownLabel}</span>
            </div>

            <p className="mt-3 text-sm leading-7 text-[#f8ead6]/82">
              {item.description}
            </p>
            {item.notes ? (
              <p className="mt-3 rounded-[8px] border border-[#d7ae61]/30 bg-black/16 p-3 text-sm text-[#dcc18a]">
                {item.notes}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {quickReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() =>
                    setReasonByItem((current) => ({
                      ...current,
                      [item.id]: reason,
                    }))
                  }
                  className="rounded-[8px] bg-[#fff4e2]/10 px-3 py-2 text-xs text-[#dcc18a]"
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              value={reasonByItem[item.id] ?? ""}
              onChange={(event) =>
                setReasonByItem((current) => ({
                  ...current,
                  [item.id]: event.target.value,
                }))
              }
              placeholder={collectionT.reviewReason}
              className="mt-3 min-h-20 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 p-3 text-sm text-[#fff4e2] outline-none placeholder:text-[#dcc18a]/70"
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                disabled={busyId === item.id}
                onClick={() => onAction(item.id, "verify")}
                className="rounded-[8px] bg-[#1f6b56] px-4 py-2 text-sm font-semibold text-[#efffe9] disabled:opacity-50"
              >
                {collectionT.verifyItem}
              </button>
              <button
                disabled={busyId === item.id}
                onClick={() => onAction(item.id, "changes")}
                className="rounded-[8px] bg-[#6a5a24] px-4 py-2 text-sm font-semibold text-[#fff4e2] disabled:opacity-50"
              >
                {collectionT.requestChanges}
              </button>
              <button
                disabled={busyId === item.id}
                onClick={() => onAction(item.id, "reject")}
                className="rounded-[8px] bg-[#7a2f25] px-4 py-2 text-sm font-semibold text-[#fff4e2] disabled:opacity-50"
              >
                {collectionT.rejectVerification}
              </button>
            </div>
          </div>
        </article>
      ))}
      {items.length === 0 ? (
        <StatusMessage>{collectionT.noReviewItems}</StatusMessage>
      ) : null}
    </section>
  );
}

function ItemReviewList({
  items,
  busyId,
  reasonByItem,
  setReasonByItem,
  onAction,
  locale,
  unknownLabel,
  compact,
}: {
  items: MarketplaceItem[];
  busyId: string;
  reasonByItem: Record<string, string>;
  setReasonByItem: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onAction: (itemId: string, action: "approve" | "reject" | "changes") => void;
  locale: Locale;
  unknownLabel: string;
  compact?: boolean;
}) {
  return (
    <section className="grid gap-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="grid gap-4 rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-4 md:grid-cols-[180px_1fr]"
        >
          <div className="relative aspect-square overflow-hidden rounded-[8px] bg-black/20">
            <Image
              src={item.images[0]?.imageUrl ?? "/kishib-logo.png"}
              alt={item.title}
              fill
              sizes="(min-width: 768px) 180px, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-[#dcc18a]">{item.category}</p>
                <h2 className="mt-1 text-xl font-semibold text-[#fff4e2]">
                  {item.title}
                </h2>
              </div>
              <span className="rounded-full bg-[#fff4e2]/10 px-3 py-1 text-xs text-[#f8ead6]">
                {getMarketplaceStatusLabel(item.status, locale)}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-[#dcc18a] sm:grid-cols-3">
              <span>{formatMarketplaceMoney(item.price, item.currency)}</span>
              <span>
                {[getMarketplaceCountryLabel(item.country, locale), item.city]
                  .filter(Boolean)
                  .join(" / ") || unknownLabel}
              </span>
              <span>seller_id: {item.sellerId}</span>
            </div>
            {!compact ? (
              <p className="mt-3 text-sm leading-7 text-[#f8ead6]/82">
                {item.description}
              </p>
            ) : null}
            {item.reviewNote ? (
              <p className="mt-3 rounded-[8px] border border-[#d7ae61]/30 bg-black/16 p-3 text-sm text-[#dcc18a]">
                ملاحظة المراجعة: {item.reviewNote}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {quickReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() =>
                    setReasonByItem((current) => ({
                      ...current,
                      [item.id]: reason,
                    }))
                  }
                  className="rounded-[8px] bg-[#fff4e2]/10 px-3 py-2 text-xs text-[#dcc18a]"
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              value={reasonByItem[item.id] ?? ""}
              onChange={(event) =>
                setReasonByItem((current) => ({
                  ...current,
                  [item.id]: event.target.value,
                }))
              }
              placeholder="سبب الرفض أو طلب التعديل"
              className="mt-3 min-h-20 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 p-3 text-sm text-[#fff4e2] outline-none placeholder:text-[#dcc18a]/70"
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                disabled={busyId === item.id}
                onClick={() => onAction(item.id, "approve")}
                className="rounded-[8px] bg-[#1f6b56] px-4 py-2 text-sm font-semibold text-[#efffe9] disabled:opacity-50"
              >
                نشر القطعة
              </button>
              <button
                disabled={busyId === item.id}
                onClick={() => onAction(item.id, "changes")}
                className="rounded-[8px] bg-[#6a5a24] px-4 py-2 text-sm font-semibold text-[#fff4e2] disabled:opacity-50"
              >
                طلب تعديل
              </button>
              <button
                disabled={busyId === item.id}
                onClick={() => onAction(item.id, "reject")}
                className="rounded-[8px] bg-[#7a2f25] px-4 py-2 text-sm font-semibold text-[#fff4e2] disabled:opacity-50"
              >
                رفض القطعة
              </button>
            </div>
          </div>
        </article>
      ))}
      {items.length === 0 ? (
        <StatusMessage>لا توجد قطع في هذا التبويب حاليا.</StatusMessage>
      ) : null}
    </section>
  );
}
