"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MarketItemCard from "@/components/marketplace/MarketItemCard";
import MarketShell from "@/components/marketplace/MarketShell";
import { getMarketplaceItemsWithFallback } from "@/lib/marketplaceSupabase";
import {
  getMarketplaceCategoryLabel,
  getMarketplaceConditionLabel,
  marketplaceCategoryValues,
  marketplaceConditionValues,
  marketplaceCopy,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";
import {
  getMarketplaceCityLabel,
  getMarketplaceCountryLabelWithFlag,
  getMarketplaceLocation,
  marketplaceCityMatches,
  marketplaceLocations,
} from "@/lib/marketplaceLocations";
import type { MarketplaceItem } from "@/types/marketplace";

export default function MarketplacePage() {
  const locale = useMarketplaceLocale();
  const t = marketplaceCopy(locale);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [country, setCountry] = useState("all");
  const [city, setCity] = useState("all");
  const [condition, setCondition] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
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

  const cities = useMemo(() => getMarketplaceLocation(country)?.cities ?? [], [country]);

  function parsePrice(value: string) {
    const normalized = value
      .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
      .replace(/[,\u066c\u060c\s]/g, "");

    return normalized ? Number(normalized) : null;
  }

  const filteredItems = items.filter((item) => {
    const min = parsePrice(minPrice);
    const max = parsePrice(maxPrice);
    const matchesQuery = item.title
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesCategory = category === "all" || item.category === category;
    const matchesCountry = country === "all" || item.country === country;
    const matchesCity = marketplaceCityMatches(item.country, city, item.city);
    const matchesCondition = condition === "all" || item.condition === condition;
    const matchesPrice =
      (min === null || item.price >= min) && (max === null || item.price <= max);

    return (
      matchesQuery &&
      matchesCategory &&
      matchesCountry &&
      matchesCity &&
      matchesCondition &&
      matchesPrice
    );
  }).sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setCountry("all");
    setCity("all");
    setCondition("all");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
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
      <section className="mb-6 rounded-[8px] border border-[#d2b98f]/18 bg-[#fff4e2]/8 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 lg:col-span-2">
          <span className="text-xs font-semibold text-[#dcc18a]">{t.search}</span>
          <div className="relative">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#dcc18a]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            className="h-11 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-9 text-sm text-[#fff4e2] outline-none placeholder:text-[#dcc18a]/70 focus:border-[#b88a3d]"
          />
          </div>
        </label>

        <FilterSelect label={t.category} value={category} onChange={setCategory}>
          <option value="all">{t.allCategories}</option>
          {marketplaceCategoryValues.map((value) => (
            <option key={value} value={value}>
              {getMarketplaceCategoryLabel(value, locale)}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label={t.country}
          value={country}
          onChange={(value) => {
            setCountry(value);
            setCity("all");
          }}
        >
          <option value="all">{t.allCountries}</option>
          {marketplaceLocations.map((location) => (
            <option key={location.code} value={location.value}>
              {getMarketplaceCountryLabelWithFlag(location.value, locale)}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label={t.city}
          value={city}
          onChange={setCity}
          disabled={country === "all"}
        >
          <option value="all">
            {country === "all" ? t.chooseCountryFirst : t.allCities}
          </option>
          {cities.map((value) => (
            <option key={value.value} value={value.value}>
              {getMarketplaceCityLabel(country, value.value, locale)}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label={t.condition} value={condition} onChange={setCondition}>
          <option value="all">{t.allConditions}</option>
          {marketplaceConditionValues.map((value) => (
            <option key={value} value={value}>
              {getMarketplaceConditionLabel(value, locale)}
            </option>
          ))}
        </FilterSelect>

        <FilterInput label={t.minPrice} value={minPrice} onChange={setMinPrice} />
        <FilterInput label={t.maxPrice} value={maxPrice} onChange={setMaxPrice} />
        <FilterSelect label={t.sort} value={sort} onChange={setSort}>
          <option value="newest">{t.newest}</option>
          <option value="price_asc">{t.priceLowHigh}</option>
          <option value="price_desc">{t.priceHighLow}</option>
          <option value="views" disabled>{t.mostViewed} TODO</option>
        </FilterSelect>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 rounded-[8px] border border-[#d2b98f]/28 bg-[#fff4e2]/8 px-4 text-sm font-semibold text-[#fff4e2] transition hover:bg-[#fff4e2]/14"
          >
            {t.resetFilters}
          </button>
          <button
            type="button"
            className="h-10 rounded-[8px] bg-[#b88a3d] px-4 text-sm font-semibold text-[#fff4e2] transition hover:bg-[#986f2e]"
          >
            {t.applyFilters}
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
          {t.loadingMarket}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
          {t.noItems}
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

function FilterSelect({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold text-[#dcc18a]">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2] outline-none focus:border-[#b88a3d] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {children}
      </select>
    </label>
  );
}

function FilterInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold text-[#dcc18a]">{label}</span>
      <input
        value={value}
        inputMode="numeric"
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2] outline-none placeholder:text-[#dcc18a]/70 focus:border-[#b88a3d]"
      />
    </label>
  );
}
