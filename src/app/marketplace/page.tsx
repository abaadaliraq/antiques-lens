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
  getMarketplaceCountryLabel,
  marketplaceCategoryValues,
  marketplaceConditionValues,
  marketplaceCopy,
  marketplaceCountries,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";
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
  const [maxPrice, setMaxPrice] = useState("");
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

  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .filter((item) => country === "all" || item.country === country)
            .map((item) => item.city)
            .filter(Boolean),
        ),
      ),
    [items, country],
  );

  const filteredItems = items.filter((item) => {
    const matchesQuery = item.title
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesCategory = category === "all" || item.category === category;
    const matchesCountry = country === "all" || item.country === country;
    const matchesCity = city === "all" || item.city === city;
    const matchesCondition = condition === "all" || item.condition === condition;
    const matchesPrice = !maxPrice || item.price <= Number(maxPrice);

    return (
      matchesQuery &&
      matchesCategory &&
      matchesCountry &&
      matchesCity &&
      matchesCondition &&
      matchesPrice
    );
  });

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
      <section className="mb-6 grid gap-3 rounded-[8px] border border-[#d2b98f]/18 bg-[#fff4e2]/8 p-3 sm:grid-cols-2 lg:grid-cols-6">
        <label className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#dcc18a]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            className="h-11 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-9 text-sm text-[#fff4e2] outline-none placeholder:text-[#dcc18a]/70 focus:border-[#b88a3d]"
          />
        </label>

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-11 rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2] outline-none focus:border-[#b88a3d]"
        >
          <option value="all">{t.allCategories}</option>
          {marketplaceCategoryValues.map((value) => (
            <option key={value} value={value}>
              {getMarketplaceCategoryLabel(value, locale)}
            </option>
          ))}
        </select>

        <select
          value={country}
          onChange={(event) => {
            setCountry(event.target.value);
            setCity("all");
          }}
          className="h-11 rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2] outline-none focus:border-[#b88a3d]"
        >
          <option value="all">{t.allCountries}</option>
          {marketplaceCountries.map((value) => (
            <option key={value} value={value}>
              {getMarketplaceCountryLabel(value, locale)}
            </option>
          ))}
        </select>

        <select
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="h-11 rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2] outline-none focus:border-[#b88a3d]"
        >
          <option value="all">{t.allCities}</option>
          {cities.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <select
          value={condition}
          onChange={(event) => setCondition(event.target.value)}
          className="h-11 rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2] outline-none focus:border-[#b88a3d]"
        >
          <option value="all">{t.allConditions}</option>
          {marketplaceConditionValues.map((value) => (
            <option key={value} value={value}>
              {getMarketplaceConditionLabel(value, locale)}
            </option>
          ))}
        </select>

        <input
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          inputMode="numeric"
          placeholder={t.maxPrice}
          className="h-11 rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2] outline-none placeholder:text-[#dcc18a]/70 focus:border-[#b88a3d] sm:col-span-2 lg:col-span-1"
        />
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
