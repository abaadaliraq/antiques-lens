"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeDollarSign, Bell, ClipboardList, Coins, Wallet } from "lucide-react";
import MarketShell from "@/components/marketplace/MarketShell";
import {
  formatMarketplaceMoney,
  getSellerMarketplaceItems,
  getSellerOrders,
  resubmitMarketplaceItemForReview,
} from "@/lib/marketplaceSupabase";
import {
  getMarketplaceCountryLabel,
  getMarketplaceStatusLabel,
  marketplaceCopy,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";
import type { MarketplaceItem, MarketplaceOrder } from "@/types/marketplace";

export default function SellerMarketplacePage() {
  const locale = useMarketplaceLocale();
  const t = marketplaceCopy(locale);
  const router = useRouter();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function loadSellerDashboard() {
    setError("");
    setIsLoading(true);

    try {
      const [sellerItems, sellerOrders] = await Promise.all([
        getSellerMarketplaceItems(),
        getSellerOrders(),
      ]);

      setItems(sellerItems);
      setOrders(sellerOrders);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "تعذر تحميل لوحة البائع.";

      if (message.includes("تسجيل الدخول")) {
        router.push("/");
        return;
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSellerDashboard();
  }, []);

  const totals = useMemo(() => {
    const completedOrders = orders.filter((order) =>
      ["paid", "delivered", "completed"].includes(order.status),
    );
    const totalSales = completedOrders.reduce(
      (sum, order) => sum + order.itemPrice,
      0,
    );
    const totalCommission = completedOrders.reduce(
      (sum, order) => sum + order.commissionAmount,
      0,
    );

    return {
      orderCount: orders.length,
      totalSales,
      totalCommission,
      netEarnings: totalSales - totalCommission,
    };
  }, [orders]);

  async function resubmitItem(itemId: string) {
    setBusyId(itemId);
    setError("");

    try {
      await resubmitMarketplaceItemForReview(itemId);
      await loadSellerDashboard();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "تعذر إعادة إرسال القطعة للمراجعة.",
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <MarketShell
      title="لوحة البائع"
      subtitle="متابعة قطعك وحالاتها وطلبات الشراء المرتبطة بها من Supabase."
      action={
        <Link
          href="/marketplace/notifications"
          className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#d2b98f]/28 bg-[#fff4e2]/8 px-4 text-sm text-[#fff4e2]"
        >
          <Bell className="h-4 w-4" />
          الإشعارات
        </Link>
      }
    >
      {isLoading ? (
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
          جار تحميل لوحة البائع...
        </div>
      ) : error ? (
        <div className="rounded-[8px] border border-[#8e3c32]/50 bg-[#7a2f25]/38 p-6 text-sm text-[#ffd7cf]">
          {error}
        </div>
      ) : (
        <>
          <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={<ClipboardList />} label="عدد الطلبات" value={String(totals.orderCount)} />
            <Metric icon={<BadgeDollarSign />} label="إجمالي المبيعات" value={formatMarketplaceMoney(totals.totalSales)} />
            <Metric icon={<Coins />} label="عمولة KISHIB" value={formatMarketplaceMoney(totals.totalCommission)} />
            <Metric icon={<Wallet />} label="صافي الأرباح" value={formatMarketplaceMoney(totals.netEarnings)} />
          </section>

          <section className="overflow-hidden rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8">
            <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-[#d2b98f]/16 p-4 text-sm font-semibold text-[#dcc18a] sm:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr]">
              <span>القطعة</span>
              <span>الحالة</span>
              <span className="hidden sm:block">السعر</span>
              <span className="hidden sm:block">المدينة</span>
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className="border-b border-[#d2b98f]/10 p-4 text-sm text-[#f8ead6] last:border-b-0"
              >
                <div className="grid grid-cols-[1fr_auto] gap-3 sm:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr]">
                  <span>{item.title}</span>
                  <span className="rounded-full bg-[#fff4e2]/10 px-3 py-1 text-xs">
                    {getMarketplaceStatusLabel(item.status, locale)}
                  </span>
                  <span className="hidden sm:block">
                    {formatMarketplaceMoney(item.price, item.currency)}
                  </span>
                  <span className="hidden sm:block">
                    {[getMarketplaceCountryLabel(item.country, locale), item.city]
                      .filter(Boolean)
                      .join(" / ") || t.unknown}
                  </span>
                </div>

                {item.status === "rejected" || item.status === "needs_changes" ? (
                  <div className="mt-3 rounded-[8px] border border-[#d7ae61]/30 bg-black/16 p-3 text-[#dcc18a]">
                    <p>ملاحظة المراجعة: {item.reviewNote || item.rejectionReason || "لا توجد ملاحظة."}</p>
                    <button
                      onClick={() => void resubmitItem(item.id)}
                      disabled={busyId === item.id}
                      className="mt-3 rounded-[8px] bg-[#b88a3d] px-4 py-2 text-sm font-semibold text-[#fff4e2] disabled:opacity-50"
                    >
                      تعديل وإعادة الإرسال
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
            {items.length === 0 ? (
              <div className="p-4 text-sm text-[#dcc18a]">
                لم تعرض أي قطع للبيع بعد.
              </div>
            ) : null}
          </section>
        </>
      )}
    </MarketShell>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-4">
      <div className="mb-3 text-[#d7ae61] [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      <p className="text-xs text-[#dcc18a]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#fff4e2]">{value}</p>
    </div>
  );
}
