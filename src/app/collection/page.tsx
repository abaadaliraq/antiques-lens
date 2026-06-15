"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus, ShieldCheck, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MarketShell from "@/components/marketplace/MarketShell";
import {
  createCollectionOffer,
  getCollectionInteractionSummary,
  getPublicCollectionItems,
  likeCollectionItem,
} from "@/lib/collectionSupabase";
import { collectionCopy, getCollectionStatusLabel } from "@/lib/collectionI18n";
import {
  getMarketplaceCategoryLabel,
  getMarketplaceCountryLabel,
  marketplaceCopy,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";
import { formatMarketplaceMoney } from "@/lib/marketplaceSupabase";
import type { CollectionItem } from "@/types/collection";

type InteractionSummary = Record<
  string,
  { likes: number; highestOffer: number | null; currency: "IQD" | "USD" }
>;

function getVisitorKey() {
  const key = "kishib:collection-visitor";
  const current = window.localStorage.getItem(key);
  if (current) return current;

  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

export default function CollectionPage() {
  const locale = useMarketplaceLocale();
  const t = collectionCopy(locale);
  const marketT = marketplaceCopy(locale);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [summary, setSummary] = useState<InteractionSummary>({});
  const [offerDrafts, setOfferDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const visitorKey = useMemo(
    () => (typeof window === "undefined" ? "" : getVisitorKey()),
    [],
  );

  async function loadItems() {
    setError("");
    setIsLoading(true);

    try {
      const publicItems = await getPublicCollectionItems();
      setItems(publicItems);
      setSummary(await getCollectionInteractionSummary(publicItems.map((item) => item.id)));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load collection items.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function handleLike(itemId: string) {
    setBusyId(itemId);
    setMessage("");
    setError("");

    try {
      await likeCollectionItem(itemId, visitorKey);
      setSummary((current) => ({
        ...current,
        [itemId]: {
          likes: (current[itemId]?.likes ?? 0) + 1,
          highestOffer: current[itemId]?.highestOffer ?? null,
          currency: current[itemId]?.currency ?? "USD",
        },
      }));
      setMessage(locale === "en" ? "Like added." : "تم تسجيل الإعجاب.");
    } catch (likeError) {
      setError(likeError instanceof Error ? likeError.message : "Unable to like item.");
    } finally {
      setBusyId("");
    }
  }

  async function submitOffer(item: CollectionItem) {
    const amount = Number((offerDrafts[item.id] ?? "").replace(/[,\s]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(locale === "en" ? "Enter a valid offer." : "أدخل مبلغ عرض صحيح.");
      return;
    }

    setBusyId(item.id);
    setMessage("");
    setError("");

    try {
      await createCollectionOffer(item.id, visitorKey, amount, item.currency);
      setSummary((current) => ({
        ...current,
        [item.id]: {
          likes: current[item.id]?.likes ?? 0,
          highestOffer: Math.max(amount, current[item.id]?.highestOffer ?? 0),
          currency: item.currency,
        },
      }));
      setOfferDrafts((current) => ({ ...current, [item.id]: "" }));
      setMessage(
        locale === "en"
          ? "Your offer was added. The collector can decide later."
          : "تمت إضافة عرضك. يبقى القرار لصاحب المقتنى لاحقًا.",
      );
    } catch (offerError) {
      setError(offerError instanceof Error ? offerError.message : "Unable to add offer.");
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
          {items.map((item) => {
            const itemSummary = summary[item.id] ?? {
              likes: 0,
              highestOffer: null,
              currency: item.currency,
            };

            return (
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
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#113f35]/90 px-2.5 py-1 text-[11px] font-semibold text-[#e7d7aa]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {getCollectionStatusLabel(item.reviewStatus, locale)}
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <h2 className="line-clamp-1 text-base font-semibold text-[#fff4e2]">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-xs text-[#dcc18a]">
                      {getMarketplaceCountryLabel(item.country, locale)}
                      {item.city ? ` / ${item.city}` : ""}
                    </p>
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e2]/9 px-2.5 py-1">
                      <Heart className="h-3.5 w-3.5" />
                      {itemSummary.likes}
                    </span>
                  </div>

                  <div className="rounded-[8px] border border-[#d2b98f]/16 bg-black/14 p-3 text-sm text-[#dcc18a]">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#d7ae61]" />
                      <span>
                        {itemSummary.highestOffer
                          ? `${locale === "en" ? "Highest offer" : "أعلى عرض"}: ${formatMarketplaceMoney(
                              itemSummary.highestOffer,
                              itemSummary.currency,
                            )}`
                          : locale === "en"
                            ? "No offers yet"
                            : "لا توجد عروض بعد"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => void handleLike(item.id)}
                      disabled={busyId === item.id}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#d2b98f]/28 bg-[#fff4e2]/9 text-sm font-semibold text-[#fff4e2] transition hover:bg-[#fff4e2]/14 disabled:opacity-50"
                    >
                      <Heart className="h-4 w-4" />
                      {locale === "en" ? "Like" : "إعجاب"}
                    </button>

                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input
                        value={offerDrafts[item.id] ?? ""}
                        inputMode="numeric"
                        onChange={(event) =>
                          setOfferDrafts((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        placeholder={locale === "en" ? "Offer amount" : "مبلغ العرض"}
                        className="h-10 rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2] outline-none placeholder:text-[#dcc18a]/70 focus:border-[#b88a3d]"
                      />
                      <button
                        type="button"
                        onClick={() => void submitOffer(item)}
                        disabled={busyId === item.id}
                        className="h-10 rounded-[8px] bg-[#b88a3d] px-4 text-sm font-semibold text-[#fff4e2] transition hover:bg-[#986f2e] disabled:opacity-50"
                      >
                        {locale === "en" ? "Buy / Bid" : "اشتري / زايد"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </MarketShell>
  );
}
