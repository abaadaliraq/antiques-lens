"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MarketShell from "@/components/marketplace/MarketShell";
import {
  formatMarketplaceMoney,
  getBuyerOrders,
} from "@/lib/marketplaceSupabase";
import {
  getMarketplaceStatusLabel,
  marketplaceCopy,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";
import type { MarketplaceOrder } from "@/types/marketplace";

export default function MarketplaceOrdersPage() {
  const locale = useMarketplaceLocale();
  const t = marketplaceCopy(locale);
  const router = useRouter();
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void getBuyerOrders()
      .then((buyerOrders) => {
        if (!active) return;
        setOrders(buyerOrders);
      })
      .catch((loadError) => {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "تعذر تحميل الطلبات.";

        if (message.includes("تسجيل الدخول")) {
          router.push("/");
          return;
        }

        if (!active) return;
        setError(message);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <MarketShell
      title={t.ordersTitle}
      subtitle={t.ordersSubtitle}
    >
      {isLoading ? (
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
          جار تحميل طلباتك...
        </div>
      ) : error ? (
        <div className="rounded-[8px] border border-[#8e3c32]/50 bg-[#7a2f25]/38 p-6 text-sm text-[#ffd7cf]">
          {error}
        </div>
      ) : (
        <section className="overflow-hidden rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8">
          <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-[#d2b98f]/16 p-4 text-sm font-semibold text-[#dcc18a] sm:grid-cols-[1.2fr_0.7fr_0.8fr_0.7fr]">
            <span>القطعة</span>
            <span>الحالة</span>
            <span className="hidden sm:block">السعر</span>
            <span className="hidden sm:block">التاريخ</span>
          </div>
          {orders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-[1fr_auto] gap-3 border-b border-[#d2b98f]/10 p-4 text-sm text-[#f8ead6] last:border-b-0 sm:grid-cols-[1.2fr_0.7fr_0.8fr_0.7fr]"
            >
              <span>{order.item?.title ?? order.itemId}</span>
              <span className="rounded-full bg-[#fff4e2]/10 px-3 py-1 text-xs">
                {getMarketplaceStatusLabel(order.status, locale)}
              </span>
              <span className="hidden sm:block">
                {formatMarketplaceMoney(order.itemPrice)}
              </span>
              <span className="hidden sm:block">
                {new Date(order.createdAt).toLocaleDateString("ar-IQ")}
              </span>
            </div>
          ))}
          {orders.length === 0 ? (
            <div className="p-4 text-sm text-[#dcc18a]">
              لا توجد طلبات شراء حتى الآن.
            </div>
          ) : null}
        </section>
      )}
    </MarketShell>
  );
}
