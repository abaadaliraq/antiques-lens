"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MarketItemCard from "@/components/marketplace/MarketItemCard";
import MarketShell from "@/components/marketplace/MarketShell";
import { getMarketplaceItemsWithFallback } from "@/lib/marketplaceSupabase";
import {
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

const countryGroups: Record<string, string[]> = {
  Europe: [
    "France",
    "Germany",
    "Italy",
    "Spain",
    "United Kingdom",
    "Russia",
    "Turkey",
  ],
  "North America": ["United States", "Canada"],
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
        getMarketplaceCountryLabelWithFlag(a.value, locale).localeCompare(
          getMarketplaceCountryLabelWithFlag(b.value, locale),
          locale,
        ),
      ),
    [locale],
  );

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      category === "all" || item.category === category || itemMatchesCategory(item, category);
    const matchesCountry = country === "all" || itemMatchesCountry(item, country);

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
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <FilterSelect label={t.country} value={country} onChange={setCountry}>
            <option value="all">{t.allCountries}</option>
            {countryOptions.map((location) => (
              <option key={location.code} value={location.value}>
                {getMarketplaceCountryLabelWithFlag(location.value, locale)}
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
            className="h-10 rounded-[8px] bg-[#b88a3d] px-4 text-sm font-semibold text-[#fff4e2] transition hover:bg-[#986f2e]"
          >
            {t.applyFilters}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 rounded-[8px] border border-[#d2b98f]/28 bg-[#fff4e2]/8 px-4 text-sm font-semibold text-[#fff4e2] transition hover:bg-[#fff4e2]/14"
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
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    .join(" ")
    .toLowerCase();

  return terms.some((term) => haystack.includes(term.toLowerCase()));
}

function itemMatchesCountry(item: MarketplaceItem, selectedCountry: string) {
  const group = countryGroups[selectedCountry];
  if (group) return group.includes(item.country);
  return item.country === selectedCountry;
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
    <label className="space-y-1">
      <span className="text-xs font-semibold text-[#dcc18a]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2] outline-none focus:border-[#b88a3d]"
      >
        {children}
      </select>
    </label>
  );
}
