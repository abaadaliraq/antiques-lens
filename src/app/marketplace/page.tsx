"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MarketItemCard from "@/components/marketplace/MarketItemCard";
import MarketShell from "@/components/marketplace/MarketShell";
import { getMarketplaceItemsWithFallback } from "@/lib/marketplaceSupabase";
import {
  cleanMarketplaceText,
  getMarketplaceCategoryLabel,
  marketplaceCategoryValues,
  marketplaceCopy,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";
import {
  getMarketplaceCountryLabelWithFlag,
  marketplaceLocations,
} from "@/lib/marketplaceLocations";
import type { MarketplaceItem } from "@/types/marketplace";

const categorySearchTerms: Record<string, string[]> = {
  metals: ["metal", "معادن", "معدن", "فضة", "ذهب", "نحاس", "برونز"],
  wood: ["wood", "خشب", "أخشاب"],
  furniture: ["furniture", "أثاث", "كرسي", "طاولة", "خزانة"],
  paintings: ["painting", "paintings", "لوحة", "لوحات", "زيتية"],
  artworks: ["art", "artwork", "artworks", "فن", "فنية", "أعمال فنية"],
  crystal: ["crystal", "كرستال", "كريستال"],
  glass: ["glass", "زجاج"],
  accessories: ["accessory", "accessories", "اكسسوارات", "إكسسوارات", "مسبحة"],
  boxes: ["box", "boxes", "صندوق", "صناديق"],
  silver: ["silver", "فضة", "فضيات"],
  gold: ["gold", "ذهب"],
  copper: ["copper", "نحاس"],
  bronze: ["bronze", "برونز"],
  ceramic: ["ceramic", "ceramics", "سيراميك", "خزف"],
  porcelain: ["porcelain", "بورسلان"],
  textiles: ["textile", "textiles", "نسيج", "منسوجات", "قماش"],
  rugs: ["rug", "rugs", "carpet", "سجاد", "سجادة"],
  leather: ["leather", "جلد"],
  paper_manuscripts: ["paper", "manuscript", "manuscripts", "ورق", "مخطوطات", "مخطوطة"],
  coins: ["coin", "coins", "عملة", "عملات"],
  watches: ["watch", "watches", "ساعة", "ساعات"],
  jewelry: ["jewelry", "jewellery", "حلي", "مجوهرات"],
  religious_antiques: ["religious", "prayer", "دينية", "تحف دينية", "مسبحة"],
  vintage_household: ["household", "home", "منزلية", "قطع منزلية", "مصباح"],
  other: ["other", "أخرى"],
};

export default function MarketplacePage() {
  const locale = useMarketplaceLocale();
  const t = marketplaceCopy(locale);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [category, setCategory] = useState("all");
  const [country, setCountry] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getMarketplaceItemsWithFallback()
      .then((marketplaceItems) => {
        if (!active) return;
        setItems(marketplaceItems);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const countryOptions = useMemo(
    () =>
      [...marketplaceLocations].sort((a, b) =>
        cleanMarketplaceText(getMarketplaceCountryLabelWithFlag(a.value, locale)).localeCompare(
          cleanMarketplaceText(getMarketplaceCountryLabelWithFlag(b.value, locale)),
          locale,
        ),
      ),
    [locale],
  );

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      category === "all" || item.category === category || itemMatchesCategory(item, category);
    const matchesCountry = country === "all" || item.country === country;

    return matchesCategory && matchesCountry;
  });

  function resetFilters() {
    setCategory("all");
    setCountry("all");
  }

  return (
    <MarketShell
      title={t.marketTitle}
      subtitle={t.marketSubtitle}
      action={
        <Link
          href="/marketplace/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#b88a3d] px-4 text-sm font-semibold text-[#fff4e2] transition hover:bg-[#986f2e]"
        >
          <Plus className="h-4 w-4" />
          {t.sellItem}
        </Link>
      }
    >
      <section className="mb-5 rounded-[8px] border border-[#d2b98f]/18 bg-[#fff4e2]/8 p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end sm:gap-3">
          <FilterSelect label={t.country} value={country} onChange={setCountry}>
            <option value="all">{t.allCountries}</option>
            {countryOptions.map((location) => (
              <option key={location.code} value={location.value}>
                {cleanMarketplaceText(getMarketplaceCountryLabelWithFlag(location.value, locale))}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label={t.category} value={category} onChange={setCategory}>
            <option value="all">{t.allCategories}</option>
            {marketplaceCategoryValues.map((value) => (
              <option key={value} value={value}>
                {getMarketplaceCategoryLabel(value, locale)}
              </option>
            ))}
          </FilterSelect>

          <button
            type="button"
            className="h-10 rounded-[8px] bg-[#b88a3d] px-2 text-xs font-semibold text-[#fff4e2] transition hover:bg-[#986f2e] sm:px-4 sm:text-sm"
          >
            {t.applyFilters}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 rounded-[8px] border border-[#d2b98f]/28 bg-[#fff4e2]/8 px-2 text-xs font-semibold text-[#fff4e2] transition hover:bg-[#fff4e2]/14 sm:px-4 sm:text-sm"
          >
            {t.resetFilters}
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
          {t.loadingMarket}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
          {locale === "en"
            ? "No items match the current filters."
            : "لا توجد قطع مطابقة للفلاتر الحالية"}
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <MarketItemCard key={item.id} item={item} />
          ))}
        </section>
      )}
    </MarketShell>
  );
}

function itemMatchesCategory(item: MarketplaceItem, selectedCategory: string) {
  const terms = categorySearchTerms[selectedCategory] ?? [];
  if (terms.length === 0) return false;

  const haystack = [item.category, item.material, item.title, item.description]
    .filter(Boolean)
    .map((value) => cleanMarketplaceText(value))
    .join(" ")
    .toLowerCase();

  return terms.some((term) => haystack.includes(term.toLowerCase()));
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0 space-y-1">
      <span className="block truncate text-[11px] font-semibold text-[#dcc18a] sm:text-xs">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full min-w-0 rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-2 text-xs text-[#fff4e2] outline-none focus:border-[#b88a3d] sm:px-3 sm:text-sm"
      >
        {children}
      </select>
    </label>
  );
}
