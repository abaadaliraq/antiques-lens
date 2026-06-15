"use client";

import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, MapPin } from "lucide-react";
import type { MarketplaceItem } from "@/types/marketplace";
import { formatMarketplaceMoney } from "@/lib/marketplaceSupabase";
import {
  cleanMarketplaceText,
  getMarketplaceCategoryLabel,
  getMarketplaceConditionLabel,
  getMarketplaceCountryLabel,
  getMarketplaceStatusLabel,
  marketplaceCopy,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";

export default function MarketItemCard({ item }: { item: MarketplaceItem }) {
  const locale = useMarketplaceLocale();
  const t = marketplaceCopy(locale);
  const primaryImage = item.images[0];
  const title = cleanMarketplaceText(item.title);
  const location = [getMarketplaceCountryLabel(item.country, locale), cleanMarketplaceText(item.city)]
    .filter(Boolean)
    .join(" / ");

  return (
    <article className="overflow-hidden rounded-[8px] border border-[#d2b98f]/22 bg-[#fff4e2]/9 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur">
      <div className="relative aspect-[3/4] bg-[#2b1b12] sm:aspect-[4/3]">
        {primaryImage ? (
          <Image
            src={primaryImage.imageUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-[#dcc18a]">
            KISHIB
          </div>
        )}

        {item.hasKishibEvaluation ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#113f35]/90 px-2 py-0.5 text-[10px] font-semibold text-[#e7d7aa] sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
            <BadgeCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">{t.kishibCheck}</span>
          </span>
        ) : null}

        {item.isMock ? (
          <span className="absolute left-2 top-2 rounded-full bg-[#b88a3d]/95 px-2 py-0.5 text-[10px] font-semibold text-[#fff4e2] sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
            {t.sample}
          </span>
        ) : null}
      </div>

      <div className="space-y-2 p-2 sm:space-y-3 sm:p-4">
        <div className="space-y-1 sm:flex sm:items-start sm:justify-between sm:gap-3 sm:space-y-0">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#fff4e2] sm:line-clamp-1 sm:text-base">
              {title}
            </h2>
            <p className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[10px] text-[#dcc18a] sm:text-xs">
              <MapPin className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
              {location || t.unknown}
            </p>
          </div>
          <p className="shrink-0 text-[11px] font-bold text-[#d7ae61] sm:text-sm">
            {formatMarketplaceMoney(item.price, item.currency)}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px] text-[#f8ead6]/82 sm:gap-2 sm:text-[11px]">
          <span className="max-w-full truncate rounded-full bg-[#fff4e2]/9 px-2 py-0.5 sm:px-2.5 sm:py-1">
            {getMarketplaceCategoryLabel(item.category, locale)}
          </span>
          <span className="hidden rounded-full bg-[#fff4e2]/9 px-2.5 py-1 sm:inline-flex">
            {getMarketplaceConditionLabel(item.condition, locale)}
          </span>
          <span className="hidden rounded-full bg-[#fff4e2]/9 px-2.5 py-1 sm:inline-flex">
            {getMarketplaceStatusLabel(item.status, locale)}
          </span>
        </div>

        <Link
          href={`/marketplace/${item.id}`}
          className="inline-flex h-8 w-full items-center justify-center rounded-[8px] bg-[#b88a3d] text-xs font-semibold text-[#fff4e2] transition hover:bg-[#986f2e] sm:h-10 sm:text-sm"
        >
          {t.details}
        </Link>
      </div>
    </article>
  );
}
