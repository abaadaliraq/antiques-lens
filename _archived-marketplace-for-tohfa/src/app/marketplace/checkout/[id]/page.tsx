"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CheckoutRequest from "@/components/marketplace/CheckoutRequest";
import MarketShell from "@/components/marketplace/MarketShell";
import { getMarketplaceItemByIdWithFallback } from "@/lib/marketplaceSupabase";
import { marketplaceCopy, useMarketplaceLocale } from "@/lib/marketplaceI18n";
import type { MarketplaceItem } from "@/types/marketplace";

export default function MarketplaceCheckoutPage() {
  const locale = useMarketplaceLocale();
  const t = marketplaceCopy(locale);
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void getMarketplaceItemByIdWithFallback(params.id)
      .then((loadedItem) => {
        if (!active) return;
        setItem(loadedItem);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load purchase request.",
        );
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  return (
    <MarketShell title={t.checkoutTitle} subtitle={t.checkoutSubtitle}>
      {isLoading ? (
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
          {t.loadingMarket}
        </div>
      ) : error || !item ? (
        <div className="rounded-[8px] border border-[#8e3c32]/50 bg-[#7a2f25]/38 p-6 text-sm text-[#ffd7cf]">
          {error || t.itemUnavailable}
        </div>
      ) : (
        <CheckoutRequest item={item} />
      )}
    </MarketShell>
  );
}
