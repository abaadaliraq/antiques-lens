"use client";

import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, MapPin } from "lucide-react";
import type { MarketplaceItem } from "@/types/marketplace";
import { formatMarketplaceMoney } from "@/lib/marketplaceSupabase";
import {
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
  const location = [getMarketplaceCountryLabel(item.country, locale), item.city]
    .filter(Boolean)
    .join(" / ");

  return (
    <article className="overflow-hidden rounded-[8px] border border-[#d2b98f]/22 bg-[#fff4e2]/9 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur">
      <div className="relative aspect-[4/3] bg-[#2b1b12]">
        {primaryImage ? (
          <Image
            src={primaryImage.imageUrl}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-[#dcc18a]">
            KISHIB
          </div>
        )}

        {item.hasKishibEvaluation ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#113f35]/90 px-2.5 py-1 text-[11px] font-semibold text-[#e7d7aa]">
            <BadgeCheck className="h-3.5 w-3.5" />
            {t.kishibCheck}
          </span>
        ) : null}

        {item.isMock ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#b88a3d]/95 px-2.5 py-1 text-[11px] font-semibold text-[#fff4e2]">
            {t.sample}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="line-clamp-1 text-base font-semibold text-[#fff4e2]">
              {item.title}
            </h2>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#dcc18a]">
              <MapPin className="h-3.5 w-3.5" />
              {location || t.unknown}
            </p>
          </div>
          <p className="shrink-0 text-sm font-bold text-[#d7ae61]">
            {formatMarketplaceMoney(item.price, item.currency)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] text-[#f8ead6]/82">
          <span className="rounded-full bg-[#fff4e2]/9 px-2.5 py-1">
            {getMarketplaceCategoryLabel(item.category, locale)}
          </span>
          <span className="rounded-full bg-[#fff4e2]/9 px-2.5 py-1">
            {getMarketplaceConditionLabel(item.condition, locale)}
          </span>
          <span className="rounded-full bg-[#fff4e2]/9 px-2.5 py-1">
            {getMarketplaceStatusLabel(item.status, locale)}
          </span>
        </div>

        <Link
          href={`/marketplace/${item.id}`}
          className="inline-flex h-10 w-full items-center justify-center rounded-[8px] bg-[#b88a3d] text-sm font-semibold text-[#fff4e2] transition hover:bg-[#986f2e]"
        >
          {t.details}
        </Link>
      </div>
    </article>
  );
}
