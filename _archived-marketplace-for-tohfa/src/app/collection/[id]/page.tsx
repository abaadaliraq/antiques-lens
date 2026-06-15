"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import MarketShell from "@/components/marketplace/MarketShell";
import {
  convertCollectionItemToMarketplace,
  deleteCollectionItem,
  getCollectionItemById,
} from "@/lib/collectionSupabase";
import { collectionCopy, getCollectionStatusLabel } from "@/lib/collectionI18n";
import {
  getMarketplaceCategoryLabel,
  getMarketplaceConditionLabel,
  getMarketplaceCountryLabel,
  marketplaceCopy,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";
import { formatMarketplaceMoney } from "@/lib/marketplaceSupabase";
import type { CollectionItem } from "@/types/collection";

export default function CollectionItemPage() {
  const locale = useMarketplaceLocale();
  const t = collectionCopy(locale);
  const marketT = marketplaceCopy(locale);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<CollectionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadItem() {
    setError("");
    setIsLoading(true);

    try {
      setItem(await getCollectionItemById(params.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load collection item.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadItem();
  }, [params.id]);

  async function listForSale() {
    if (!item) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await convertCollectionItemToMarketplace(item.id);
      setMessage(t.listedRequestSent);
      await loadItem();
    } catch (saleError) {
      setError(saleError instanceof Error ? saleError.message : t.cannotList);
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem() {
    if (!item) return;
    setBusy(true);

    try {
      await deleteCollectionItem(item.id);
      router.push("/collection");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete item.");
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <MarketShell title={t.myCollection} subtitle={marketT.loadingMarket}>
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
          {marketT.loadingMarket}
        </div>
      </MarketShell>
    );
  }

  if (!item) {
    return (
      <MarketShell title={t.myCollection} subtitle={t.privateOnly}>
        <div className="rounded-[8px] border border-[#8e3c32]/50 bg-[#7a2f25]/38 p-6 text-sm text-[#ffd7cf]">
          {error || "Collection item not found."}
        </div>
      </MarketShell>
    );
  }

  return (
    <MarketShell title={item.title} subtitle={t.privateOnly}>
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
            {item.reviewStatus === "verified" ? (
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#113f35]/90 px-3 py-1 text-xs font-semibold text-[#e7d7aa]">
                <ShieldCheck className="h-4 w-4" />
                {t.verifiedBadge}
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
                  {item.estimatedValue
                    ? formatMarketplaceMoney(item.estimatedValue, item.currency)
                    : t.estimatedValue}
                </h2>
              </div>
              <span className="rounded-full bg-[#fff4e2]/10 px-3 py-1 text-xs text-[#f8ead6]">
                {getCollectionStatusLabel(item.reviewStatus, locale)}
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Detail label={marketT.country} value={getMarketplaceCountryLabel(item.country, locale)} />
              <Detail label={marketT.city} value={item.city || marketT.unknown} />
              <Detail label={marketT.condition} value={getMarketplaceConditionLabel(item.condition, locale)} />
              <Detail label={marketT.material} value={item.material || marketT.unknown} />
              <Detail label={marketT.age} value={item.estimatedAge || marketT.unknown} />
              <Detail label={marketT.origin} value={item.origin || marketT.unknown} />
              <Detail label={t.dimensions} value={item.dimensions || marketT.unknown} />
              <Detail label={t.weight} value={item.weight || marketT.unknown} />
            </dl>

            <p className="mt-5 text-sm leading-7 text-[#f8ead6]/82">
              {item.description}
            </p>
            {item.notes ? (
              <p className="mt-3 rounded-[8px] bg-black/16 p-3 text-sm leading-7 text-[#dcc18a]">
                {item.notes}
              </p>
            ) : null}
          </div>

          <div className="rounded-[8px] border border-[#d2b98f]/22 bg-[#113f35]/42 p-5">
            <h3 className="font-semibold text-[#e7d7aa]">{t.reviewStatus}</h3>
            <p className="mt-2 text-sm text-[#f8ead6]/84">
              {getCollectionStatusLabel(item.reviewStatus, locale)}
            </p>
            {item.reviewNote ? (
              <p className="mt-3 rounded-[8px] border border-[#d7ae61]/34 bg-black/16 p-3 text-sm leading-6 text-[#dcc18a]">
                {t.reviewReason}: {item.reviewNote}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {item.reviewStatus === "verified" ? (
              <button
                type="button"
                onClick={() => void listForSale()}
                disabled={busy || Boolean(item.marketplaceItemId)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#b88a3d] text-sm font-semibold text-[#fff4e2] transition hover:bg-[#986f2e] disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" />
                {item.marketplaceItemId ? marketT.status : t.listForSale}
              </button>
            ) : null}

            {["pending_review", "needs_changes", "rejected"].includes(item.reviewStatus) ? (
              <Link
                href="/collection/new"
                className="inline-flex h-11 items-center justify-center rounded-[8px] border border-[#d2b98f]/28 bg-[#fff4e2]/9 text-sm font-semibold text-[#fff4e2] transition hover:bg-[#fff4e2]/14"
              >
                {t.editItem}
              </Link>
            ) : null}

            {item.visibility !== "listed" ? (
              <button
                type="button"
                onClick={() => void deleteItem()}
                disabled={busy}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-[#8e3c32]/50 bg-[#7a2f25]/38 text-sm font-semibold text-[#ffd7cf] transition hover:bg-[#7a2f25]/56 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {t.deleteItem}
              </button>
            ) : null}
          </div>
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
