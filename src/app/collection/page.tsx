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
  cleanMarketplaceText,
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

const sampleCollectionItems: CollectionItem[] = [
  createSampleItem({
    id: "sample-collection-1",
    title: "إبريق نحاسي عثماني",
    description: "قطعة عرض مؤقتة لمقتنيات كيشيب.",
    category: "copper",
    material: "نحاس",
    imageUrl: "/images/hoa-cop-172.jpg",
    estimatedValue: 450,
    country: "Turkey",
    city: "Istanbul",
  }),
  createSampleItem({
    id: "sample-collection-2",
    title: "سجادة يدوية قديمة",
    description: "نموذج مؤقت لتجربة الإعجاب والعروض.",
    category: "rugs",
    material: "نسيج",
    imageUrl: "/images/hoa-car053.jpg",
    estimatedValue: 680,
    country: "Iran",
    city: "Tehran",
  }),
  createSampleItem({
    id: "sample-collection-3",
    title: "لوحة زيتية كلاسيكية",
    description: "نموذج مؤقت ضمن صفحة المقتنيات.",
    category: "paintings",
    material: "قماش",
    imageUrl: "/images/hoa-art-420.jpg",
    estimatedValue: 520,
    country: "France",
    city: "Paris",
  }),
];

const sampleSummary: InteractionSummary = {
  "sample-collection-1": { likes: 14, highestOffer: 470, currency: "USD" },
  "sample-collection-2": { likes: 9, highestOffer: 700, currency: "USD" },
  "sample-collection-3": { likes: 18, highestOffer: 560, currency: "USD" },
};

function createSampleItem(input: {
  id: string;
  title: string;
  description: string;
  category: string;
  material: string;
  imageUrl: string;
  estimatedValue: number;
  country: string;
  city: string;
}): CollectionItem {
  const now = new Date().toISOString();

  return {
    id: input.id,
    ownerId: "sample-owner",
    title: input.title,
    description: input.description,
    category: input.category,
    material: input.material,
    origin: input.country,
    estimatedAge: "نموذج مؤقت",
    condition: "good",
    estimatedValue: input.estimatedValue,
    currency: "USD",
    country: input.country,
    city: input.city,
    dimensions: "",
    weight: "",
    hasMark: false,
    notes: "",
    visibility: "private",
    reviewStatus: "verified",
    reviewNote: null,
    reviewedAt: now,
    reviewedBy: null,
    marketplaceItemId: null,
    images: [
      {
        id: `${input.id}-image`,
        collectionItemId: input.id,
        imageUrl: input.imageUrl,
        storagePath: null,
        sortOrder: 0,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function isSampleItem(itemId: string) {
  return itemId.startsWith("sample-collection-");
}

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
  const [summary, setSummary] = useState<InteractionSummary>(sampleSummary);
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
      const liveSummary = await getCollectionInteractionSummary(
        publicItems.map((item) => item.id),
      );

      setItems([...publicItems, ...sampleCollectionItems]);
      setSummary({ ...sampleSummary, ...liveSummary });
    } catch (loadError) {
      setItems(sampleCollectionItems);
      setSummary(sampleSummary);
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
      if (!isSampleItem(itemId)) {
        await likeCollectionItem(itemId, visitorKey);
      }

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
      if (!isSampleItem(item.id)) {
        await createCollectionOffer(item.id, visitorKey, amount, item.currency);
      }

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
          : "تمت إضافة عرضك. يبقى القرار لصاحب المقتنى لاحقا.",
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
        <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
          {items.map((item) => {
            const itemSummary = summary[item.id] ?? {
              likes: 0,
              highestOffer: null,
              currency: item.currency,
            };
            const title = cleanMarketplaceText(item.title);

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-[8px] border border-[#d2b98f]/22 bg-[#fff4e2]/9 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur"
              >
                <div className="relative aspect-[3/4] bg-[#2b1b12] sm:aspect-[4/3]">
                  <Image
                    src={item.images[0]?.imageUrl ?? "/kishib-logo.png"}
                    alt={title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 50vw"
                    className="object-cover"
                  />
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#113f35]/90 px-2 py-0.5 text-[10px] font-semibold text-[#e7d7aa] sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
                    <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {getCollectionStatusLabel(item.reviewStatus, locale)}
                  </span>
                </div>

                <div className="space-y-2 p-2 sm:space-y-3 sm:p-4">
                  <div>
                    <h2 className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#fff4e2] sm:line-clamp-1 sm:text-base">
                      {title}
                    </h2>
                    <p className="mt-1 truncate text-[10px] text-[#dcc18a] sm:text-xs">
                      {getMarketplaceCountryLabel(item.country, locale)}
                      {item.city ? ` / ${cleanMarketplaceText(item.city)}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px] text-[#f8ead6]/82 sm:gap-2 sm:text-[11px]">
                    <span className="max-w-full truncate rounded-full bg-[#fff4e2]/9 px-2 py-0.5 sm:px-2.5 sm:py-1">
                      {getMarketplaceCategoryLabel(item.category, locale)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e2]/9 px-2 py-0.5 sm:px-2.5 sm:py-1">
                      <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {itemSummary.likes}
                    </span>
                  </div>

                  <div className="rounded-[8px] border border-[#d2b98f]/16 bg-black/14 p-2 text-[11px] text-[#dcc18a] sm:p-3 sm:text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#d7ae61] sm:h-4 sm:w-4" />
                      <span className="line-clamp-1">
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
                    <div className="grid grid-cols-[auto_1fr] gap-2 sm:grid-cols-[auto_1fr_auto]">
                      <button
                        type="button"
                        onClick={() => void handleLike(item.id)}
                        disabled={busyId === item.id}
                        aria-label={locale === "en" ? "Like" : "إعجاب"}
                        title={locale === "en" ? "Like" : "إعجاب"}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d2b98f]/28 bg-[#fff4e2]/9 text-[#fff4e2] transition hover:bg-[#fff4e2]/14 disabled:opacity-50"
                      >
                        <Heart className="h-4 w-4" />
                      </button>
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
                        className="h-9 min-w-0 rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-2 text-xs text-[#fff4e2] outline-none placeholder:text-[#dcc18a]/70 focus:border-[#b88a3d] sm:px-3 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void submitOffer(item)}
                        disabled={busyId === item.id}
                        className="col-span-2 h-9 rounded-[8px] bg-[#b88a3d] px-3 text-xs font-semibold text-[#fff4e2] transition hover:bg-[#986f2e] disabled:opacity-50 sm:col-span-1 sm:px-4 sm:text-sm"
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
