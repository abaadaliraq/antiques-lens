"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Heart, ShieldAlert, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import MarketShell from "@/components/marketplace/MarketShell";
import {
  formatMarketplaceMoney,
  getMarketplaceItemByIdWithFallback,
} from "@/lib/marketplaceSupabase";
import {
  getMarketplaceCategoryLabel,
  getMarketplaceConditionLabel,
  getMarketplaceCountryLabel,
  getMarketplaceStatusLabel,
  marketplaceCopy,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { MarketplaceItem } from "@/types/marketplace";

export default function MarketplaceItemPage() {
  const locale = useMarketplaceLocale();
  const t = marketplaceCopy(locale);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
            : "Unable to load item details.",
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

  async function handleBuyNow() {
    if (item?.isMock) {
      setNotice(t.sampleOnly);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/");
      return;
    }

    router.push(`/marketplace/checkout/${params.id}`);
  }

  if (isLoading) {
    return (
      <MarketShell title={t.itemDetails} subtitle={t.itemLoadSubtitle}>
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
          {t.loadingMarket}
        </div>
      </MarketShell>
    );
  }

  if (error || !item) {
    return (
      <MarketShell title={t.itemDetails} subtitle={t.itemUnavailable}>
        <div className="rounded-[8px] border border-[#8e3c32]/50 bg-[#7a2f25]/38 p-6 text-sm text-[#ffd7cf]">
          {error || t.itemUnavailable}
        </div>
      </MarketShell>
    );
  }

  return (
    <MarketShell title={item.title} subtitle={t.itemDetails}>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] border border-[#d2b98f]/22 bg-black/20">
            <Image
              src={item.images[0]?.imageUrl ?? "/kishib-logo.png"}
              alt={item.title}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
            {item.isMock ? (
              <span className="absolute left-4 top-4 rounded-full bg-[#b88a3d]/95 px-3 py-1 text-xs font-semibold text-[#fff4e2]">
                {t.sample}
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {item.images.map((image) => (
              <div
                key={image.id}
                className="relative aspect-square overflow-hidden rounded-[8px] border border-[#d2b98f]/18"
              >
                <Image
                  src={image.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 180px, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[8px] border border-[#d2b98f]/22 bg-[#fff4e2]/9 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#dcc18a]">
                  {getMarketplaceCategoryLabel(item.category, locale)}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-[#fff4e2]">
                  {formatMarketplaceMoney(item.price, item.currency)}
                </h2>
              </div>
              <span className="rounded-full bg-[#fff4e2]/10 px-3 py-1 text-xs text-[#f8ead6]">
                {getMarketplaceStatusLabel(item.status, locale)}
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Detail label={t.country} value={getMarketplaceCountryLabel(item.country, locale)} />
              <Detail label={t.city} value={item.city || t.unknown} />
              <Detail label={t.condition} value={getMarketplaceConditionLabel(item.condition, locale)} />
              <Detail label={t.material} value={item.material || t.unknown} />
              <Detail label={t.age} value={item.estimatedAge || t.unknown} />
              <Detail label={t.origin} value={item.origin || t.unknown} />
              <Detail label={t.delivery} value={item.deliveryMethod || t.unknown} />
            </dl>

            <p className="mt-5 text-sm leading-7 text-[#f8ead6]/82">
              {item.description}
            </p>
          </div>

          <div className="rounded-[8px] border border-[#d2b98f]/22 bg-[#113f35]/42 p-5">
            <div className="flex items-center gap-2 text-[#e7d7aa]">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="font-semibold">{t.evaluation}</h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#f8ead6]/84">
              {item.kishibEvaluationSummary || t.noEvaluation}
            </p>
            <p className="mt-3 rounded-[8px] border border-[#d7ae61]/34 bg-black/16 p-3 text-xs leading-6 text-[#dcc18a]">
              {t.evaluationNotice}
            </p>
          </div>

          <div className="rounded-[8px] border border-[#d2b98f]/22 bg-[#fff4e2]/9 p-5">
            <h3 className="font-semibold text-[#fff4e2]">{t.sellerInfo}</h3>
            <p className="mt-2 text-sm leading-7 text-[#dcc18a]">
              {t.sellerPrivacy}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleBuyNow}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#b88a3d] text-sm font-semibold text-[#fff4e2] transition hover:bg-[#986f2e]"
            >
              <ShoppingBag className="h-4 w-4" />
              {t.buyNow}
            </button>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-[#d2b98f]/28 bg-[#fff4e2]/9 text-sm font-semibold text-[#fff4e2] transition hover:bg-[#fff4e2]/14">
              <Heart className="h-4 w-4" />
              {t.favorite}
            </button>
          </div>

          {notice ? (
            <p className="rounded-[8px] border border-[#d7ae61]/34 bg-black/16 px-4 py-3 text-sm text-[#dcc18a]">
              {notice}
            </p>
          ) : null}
        </aside>
      </div>
    </MarketShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-black/16 p-3">
      <dt className="text-xs text-[#dcc18a]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#fff4e2]">{value}</dd>
    </div>
  );
}
