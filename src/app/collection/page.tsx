"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import MarketShell from "@/components/marketplace/MarketShell";
import { getMyCollectionItems, convertCollectionItemToMarketplace } from "@/lib/collectionSupabase";
import { collectionCopy, getCollectionStatusLabel } from "@/lib/collectionI18n";
import {
  getMarketplaceCategoryLabel,
  getMarketplaceCountryLabel,
  marketplaceCopy,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";
import { formatMarketplaceMoney } from "@/lib/marketplaceSupabase";
import type { CollectionItem } from "@/types/collection";

export default function CollectionPage() {
  const locale = useMarketplaceLocale();
  const t = collectionCopy(locale);
  const marketT = marketplaceCopy(locale);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function loadItems() {
    setError("");
    setIsLoading(true);

    try {
      setItems(await getMyCollectionItems());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load collection.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function listForSale(itemId: string) {
    setBusyId(itemId);
    setMessage("");
    setError("");

    try {
      await convertCollectionItemToMarketplace(itemId);
      setMessage(t.listedRequestSent);
      await loadItems();
    } catch (saleError) {
      setError(saleError instanceof Error ? saleError.message : t.cannotList);
    } finally {
      setBusyId("");
    }
  }

  return (
    <MarketShell
      title={t.myCollection}
      subtitle={t.myCollectionSubtitle}
      action={
        <Link
          href="/collection/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#b88a3d] px-4 text-sm font-semibold text-[#fff4e2] transition hover:bg-[#986f2e]"
        >
          <Plus className="h-4 w-4" />
          {t.addItem}
        </Link>
      }
    >
      {message ? (
        <p className="mb-4 rounded-[8px] border border-[#4f8f72]/40 bg-[#113f35]/54 px-4 py-3 text-sm text-[#d7f0cf]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-[8px] border border-[#8e3c32]/50 bg-[#7a2f25]/38 px-4 py-3 text-sm text-[#ffd7cf]">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
          {marketT.loadingMarket}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
          {t.noItems}
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-[8px] border border-[#d2b98f]/22 bg-[#fff4e2]/9 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur"
            >
              <div className="relative aspect-[4/3] bg-[#2b1b12]">
                <Image
                  src={item.images[0]?.imageUrl ?? "/kishib-logo.png"}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
                {item.reviewStatus === "verified" ? (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#113f35]/90 px-2.5 py-1 text-[11px] font-semibold text-[#e7d7aa]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t.verifiedBadge}
                  </span>
                ) : null}
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="line-clamp-1 text-base font-semibold text-[#fff4e2]">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-xs text-[#dcc18a]">
                      {getMarketplaceCountryLabel(item.country, locale)}
                      {item.city ? ` / ${item.city}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#fff4e2]/10 px-3 py-1 text-xs text-[#f8ead6]">
                    {getCollectionStatusLabel(item.reviewStatus, locale)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-[#f8ead6]/82">
                  <span className="rounded-full bg-[#fff4e2]/9 px-2.5 py-1">
                    {getMarketplaceCategoryLabel(item.category, locale)}
                  </span>
                  {item.estimatedValue ? (
                    <span className="rounded-full bg-[#fff4e2]/9 px-2.5 py-1">
                      {formatMarketplaceMoney(item.estimatedValue, item.currency)}
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Link
                    href={`/collection/${item.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-[8px] bg-[#b88a3d] text-sm font-semibold text-[#fff4e2] transition hover:bg-[#986f2e]"
                  >
                    {t.details}
                  </Link>
                  {item.reviewStatus === "verified" ? (
                    <button
                      type="button"
                      onClick={() => void listForSale(item.id)}
                      disabled={busyId === item.id || Boolean(item.marketplaceItemId)}
                      className="inline-flex h-10 items-center justify-center rounded-[8px] border border-[#d2b98f]/28 bg-[#fff4e2]/9 text-sm font-semibold text-[#fff4e2] transition hover:bg-[#fff4e2]/14 disabled:opacity-50"
                    >
                      {item.marketplaceItemId ? marketT.status : t.listForSale}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </MarketShell>
  );
}
