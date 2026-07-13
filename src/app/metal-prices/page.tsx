"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, Coins, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ProfileCompletionGate from "@/components/antique-ai/ProfileCompletionGate";
import type { Locale } from "@/components/antique-ai/types";

type MetalKey = "gold" | "silver" | "platinum" | "palladium" | "copper";

type MetalPrice = {
  symbol: "XAU" | "XAG" | "XPT" | "XPD" | "XCU";
  name: string;
  priceUsdPerOunce: number;
  priceUsdPerGram: number;
  updatedAt: string;
};

type MetalPricesPayload = Partial<Record<MetalKey, MetalPrice>> & {
  updatedAt?: string;
  source?: string;
  stale?: boolean;
  warning?: string;
  error?: string;
};

type MetalRow = {
  key: MetalKey;
  name: string;
  symbol: string;
  ounce: number;
  gram: number;
  unit: string;
  updatedAt: string;
};

type PurityRow = {
  label: string;
  purity: string;
  price: number;
  note: string;
};

const metalKeys: MetalKey[] = [
  "gold",
  "silver",
  "platinum",
  "palladium",
  "copper",
];

const supportedLocales: Locale[] = ["ar", "en", "fr", "hi", "fa", "tr", "ru", "ku"];
const rtlLocales: Locale[] = ["ar", "ku", "fa"];
const localeStorageKeys = ["antiques-lens:locale", "kishib:pending-oauth-locale"];

function normalizeLocale(value: unknown): Locale {
  return typeof value === "string" && supportedLocales.includes(value as Locale)
    ? (value as Locale)
    : "ar";
}

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "ar";

  for (const key of localeStorageKeys) {
    const stored = window.localStorage.getItem(key);
    if (stored && supportedLocales.includes(stored as Locale)) {
      return stored as Locale;
    }
  }

  return normalizeLocale(document.documentElement.lang);
}

function useMetalPricesLocale() {
  const [locale, setLocale] = useState<Locale>(() => getStoredLocale());

  useEffect(() => {
    const syncLocale = () => setLocale(getStoredLocale());
    syncLocale();
    window.addEventListener("storage", syncLocale);
    window.addEventListener("focus", syncLocale);

    return () => {
      window.removeEventListener("storage", syncLocale);
      window.removeEventListener("focus", syncLocale);
    };
  }, []);

  return locale;
}

function getLocaleDirection(locale: Locale) {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}

const copy = {
  ar: {
    eyebrow: "بورصة المعادن",
    title: "أسعار المعادن",
    subtitle:
      "مرجع إرشادي لأسعار المعادن الخام، يُستخدم كعامل مساعد في تقييم القطع وليس كتقييم نهائي.",
    back: "الرئيسية",
    refresh: "تحديث الأسعار",
    refreshing: "جار التحديث",
    loading: "جار تحميل أسعار المعادن...",
    empty: "الأسعار غير متاحة حاليًا.",
    error: "الأسعار غير متاحة حاليًا.",
    globalTitle: "الأسعار العالمية للمعادن",
    goldTitle: "أسعار الذهب حسب العيار",
    silverTitle: "أسعار الفضة حسب النقاوة",
    metal: "المعدن",
    symbol: "الرمز",
    ouncePrice: "السعر للأونصة",
    gramPrice: "السعر للغرام",
    unit: "الوحدة",
    updated: "آخر تحديث",
    karat: "العيار",
    purity: "النقاوة",
    description: "الوصف",
    noteColumn: "ملاحظة",
    usd: "دولار",
    troyOunce: "أونصة تروية",
    gram: "غرام",
    lastUpdated: "آخر تحديث",
    source: "المصدر",
    copperNote:
      "النحاس يعرض كمؤشر خام تقريبي وقد تختلف وحدته حسب السوق.",
    footerNote:
      "هذه الأسعار تمثل قيمة المعدن الخام التقريبية حسب السعر العالمي، ولا تمثل القيمة النهائية للقطعة. قيمة التحف والمقتنيات قد تختلف حسب العمر، الصنعة، الندرة، الحالة، التوقيع، الختم، والمصدر.",
    stale:
      "تعذر الاتصال بالمصدر الحي حاليًا، لذلك قد تكون الأسعار المعروضة من آخر تحديث محفوظ.",
  },
  en: {
    eyebrow: "Metal Exchange",
    title: "Metal Prices",
    subtitle:
      "Indicative raw metal prices used as supporting context for KISHIB evaluations, not as a final item appraisal.",
    back: "Home",
    refresh: "Refresh prices",
    refreshing: "Refreshing",
    loading: "Loading metal prices...",
    empty: "Prices are not available right now.",
    error: "Prices are not available right now.",
    globalTitle: "Global Metal Prices",
    goldTitle: "Gold Prices by Karat",
    silverTitle: "Silver Prices by Purity",
    metal: "Metal",
    symbol: "Symbol",
    ouncePrice: "Price per ounce",
    gramPrice: "Price per gram",
    unit: "Unit",
    updated: "Last updated",
    karat: "Karat",
    purity: "Purity",
    description: "Description",
    noteColumn: "Note",
    usd: "USD",
    troyOunce: "Troy ounce",
    gram: "Gram",
    lastUpdated: "Last updated",
    source: "Source",
    copperNote:
      "Copper is shown as an approximate raw indicator and its market unit may vary.",
    footerNote:
      "These prices represent approximate raw metal value based on global market prices. They do not represent the final value of an item. Antique and collectible value may vary by age, craftsmanship, rarity, condition, signature, stamp, and provenance.",
    stale:
      "Live source is temporarily unavailable, so these prices may come from the latest saved update.",
  },
  ku: {
    eyebrow: "بازاڕی کانزا",
    title: "نرخی کانزاکان",
    subtitle:
      "نرخی ڕێنمایی کانزای خاوە، وەک یارمەتیدەر بۆ هەڵسەنگاندن بەکاردێت نەک نرخی کۆتایی.",
    back: "سەرەکی",
    refresh: "نوێکردنەوەی نرخ",
    refreshing: "نوێ دەکرێتەوە",
    loading: "نرخی کانزاکان بار دەکرێت...",
    empty: "نرخەکان ئێستا بەردەست نین.",
    error: "نرخەکان ئێستا بەردەست نین.",
    globalTitle: "نرخی جیهانی کانزاکان",
    goldTitle: "نرخی زێڕ بەپێی عەیار",
    silverTitle: "نرخی زیو بەپێی پاکی",
    metal: "کانزا",
    symbol: "هێما",
    ouncePrice: "نرخ بۆ ئۆنس",
    gramPrice: "نرخ بۆ گرام",
    unit: "یەکە",
    updated: "دوایین نوێکردنەوە",
    karat: "عەیار",
    purity: "پاکی",
    description: "وەسف",
    noteColumn: "تێبینی",
    usd: "USD",
    troyOunce: "ئۆنسی ترۆی",
    gram: "گرام",
    lastUpdated: "دوایین نوێکردنەوە",
    source: "سەرچاوە",
    copperNote: "مس وەک ئاماژەی خاو دەردەکەوێت و یەکەکەی لە بازاڕدا دەگۆڕێت.",
    footerNote:
      "ئەم نرخانە بەهای نزیکەی کانزای خاو نیشان دەدەن و بەهای کۆتایی پارچەکە نین.",
    stale:
      "سەرچاوەی زیندوو بەردەست نییە، بۆیە نرخەکان لە دوایین نوێکردنەوەی پاشەکەوتکراون.",
  },
} satisfies Partial<Record<Locale, Record<string, string>>>;

const arabicCopy: Record<keyof typeof copy.en, string> = {
  eyebrow: "بورصة المعادن",
  title: "أسعار المعادن",
  subtitle:
    "مرجع إرشادي لأسعار المعادن الخام، يستخدم كعامل مساعد في تقييم القطع وليس كتقييم نهائي.",
  back: "الرئيسية",
  refresh: "تحديث الأسعار",
  refreshing: "جار التحديث",
  loading: "جار تحميل أسعار المعادن...",
  empty: "الأسعار غير متاحة حاليًا.",
  error: "الأسعار غير متاحة حاليًا.",
  globalTitle: "الأسعار العالمية للمعادن",
  goldTitle: "أسعار الذهب حسب العيار",
  silverTitle: "أسعار الفضة حسب النقاوة",
  metal: "المعدن",
  symbol: "الرمز",
  ouncePrice: "السعر للأونصة",
  gramPrice: "السعر للغرام",
  unit: "الوحدة",
  updated: "آخر تحديث",
  karat: "العيار",
  purity: "النقاوة",
  description: "الوصف",
  noteColumn: "ملاحظة",
  usd: "دولار",
  troyOunce: "أونصة تروية",
  gram: "غرام",
  lastUpdated: "آخر تحديث",
  source: "المصدر",
  copperNote:
    "النحاس يعرض كمؤشر خام تقريبي، وقد تختلف وحدة تسعيره حسب السوق.",
  footerNote:
    "هذه الأسعار تمثل قيمة المعدن الخام التقريبية حسب السعر العالمي، ولا تمثل القيمة النهائية للقطعة. قيمة التحف والمقتنيات قد تختلف حسب العمر، الصنعة، الندرة، الحالة، التوقيع، الختم، والمصدر.",
  stale:
    "تعذر الاتصال بالمصدر الحي حاليًا، لذلك نعرض أسعارًا إرشادية مؤقتة إلى أن يعود التحديث المباشر.",
};

const metalNames = {
  ar: {
    gold: "الذهب",
    silver: "الفضة",
    platinum: "البلاتين",
    palladium: "البلاديوم",
    copper: "النحاس",
  },
  en: {
    gold: "Gold",
    silver: "Silver",
    platinum: "Platinum",
    palladium: "Palladium",
    copper: "Copper",
  },
  ku: {
    gold: "زێڕ",
    silver: "زیو",
    platinum: "پلاتین",
    palladium: "پالادیۆم",
    copper: "مس",
  },
} satisfies Partial<Record<Locale, Record<MetalKey, string>>>;

const arabicMetalNames: Record<MetalKey, string> = {
  gold: "الذهب",
  silver: "الفضة",
  platinum: "البلاتين",
  palladium: "البلاديوم",
  copper: "النحاس",
};

const goldPurities = [
  { labelAr: "ذهب عيار 24", labelEn: "24K gold", purity: "999", factor: 1, noteAr: "ذهب نقي تقريبًا", noteEn: "Nearly pure gold" },
  { labelAr: "ذهب عيار 22", labelEn: "22K gold", purity: "916", factor: 0.916, noteAr: "شائع في بعض الأسواق", noteEn: "Common in some markets" },
  { labelAr: "ذهب عيار 21", labelEn: "21K gold", purity: "875", factor: 0.875, noteAr: "شائع في العراق والمنطقة", noteEn: "Common in Iraq and the region" },
  { labelAr: "ذهب عيار 18", labelEn: "18K gold", purity: "750", factor: 0.75, noteAr: "شائع في المجوهرات", noteEn: "Common in jewelry" },
  { labelAr: "ذهب عيار 14", labelEn: "14K gold", purity: "585", factor: 0.585, noteAr: "نقاوة أقل", noteEn: "Lower purity" },
];

const arabicGoldPurities = [
  { label: "ذهب عيار 24", purity: "999", factor: 1, note: "ذهب نقي تقريبًا" },
  { label: "ذهب عيار 22", purity: "916", factor: 0.916, note: "شائع في بعض الأسواق" },
  { label: "ذهب عيار 21", purity: "875", factor: 0.875, note: "شائع في العراق والمنطقة" },
  { label: "ذهب عيار 18", purity: "750", factor: 0.75, note: "شائع في المجوهرات" },
  { label: "ذهب عيار 14", purity: "585", factor: 0.585, note: "نقاوة أقل" },
];

const silverPurities = [
  { purity: "999", description: "فضة نقية تقريبًا", descriptionEn: "Nearly pure silver", factor: 0.999, noteAr: "أعلى نقاوة", noteEn: "Highest purity" },
  { purity: "958", description: "Britannia Silver", descriptionEn: "Britannia Silver", factor: 0.958, noteAr: "نقاوة بريطانية", noteEn: "British purity standard" },
  { purity: "925", description: "Sterling Silver", descriptionEn: "Sterling Silver", factor: 0.925, noteAr: "الأكثر شيوعًا", noteEn: "Most common" },
  { purity: "900", description: "Coin Silver", descriptionEn: "Coin Silver", factor: 0.9, noteAr: "شائعة في بعض العملات والقطع", noteEn: "Common in some coins and pieces" },
  { purity: "880", description: "فضة 880", descriptionEn: "880 silver", factor: 0.88, noteAr: "نقاوة متوسطة", noteEn: "Medium purity" },
  { purity: "800", description: "فضة 800", descriptionEn: "800 silver", factor: 0.8, noteAr: "شائعة في بعض القطع القديمة", noteEn: "Common in some older pieces" },
];

const arabicSilverPurities = [
  { purity: "999", label: "فضة نقية تقريبًا", factor: 0.999, note: "أعلى نقاوة" },
  { purity: "958", label: "Britannia Silver", factor: 0.958, note: "نقاوة بريطانية" },
  { purity: "925", label: "Sterling Silver", factor: 0.925, note: "الأكثر شيوعًا" },
  { purity: "900", label: "Coin Silver", factor: 0.9, note: "شائعة في بعض العملات والقطع" },
  { purity: "880", label: "فضة 880", factor: 0.88, note: "نقاوة متوسطة" },
  { purity: "800", label: "فضة 800", factor: 0.8, note: "شائعة في بعض القطع القديمة" },
];

function getCopy(locale: Locale) {
  return locale === "ar" ? arabicCopy : copy.en;
}

function getMetalNames(locale: Locale) {
  return locale === "ar" ? arabicMetalNames : metalNames.en;
}

function formatMoney(locale: Locale, value?: number) {
  if (!value || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

function formatDate(locale: Locale, value?: string) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function MetalPricesPage() {
  const locale = useMetalPricesLocale();
  const t = getCopy(locale);
  const names = getMetalNames(locale);
  const [data, setData] = useState<MetalPricesPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadPrices = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError("");

      try {
        const response = await fetch("/api/metal-prices", {
          cache: "no-store",
        });
        const payload = (await response.json()) as MetalPricesPayload;

        if (!response.ok || payload.error) {
          throw new Error(payload.error || "Metal price request failed");
        }

        setData(payload);
      } catch {
        setData(null);
        setError(t.error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [t.error],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPrices(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPrices]);

  const metalRows = useMemo<MetalRow[]>(
    () =>
      metalKeys.reduce<MetalRow[]>((rows, key) => {
        const price = data?.[key];
        if (!price) return rows;

        rows.push({
          key,
          name: names[key],
          symbol: price.symbol,
          ounce: price.priceUsdPerOunce,
          gram: price.priceUsdPerGram,
          unit: t.troyOunce,
          updatedAt: price.updatedAt,
        });

        return rows;
      }, []),
    [data, names, t.troyOunce],
  );

  const goldRows = useMemo<PurityRow[]>(() => {
    const gramPrice = data?.gold?.priceUsdPerGram;
    if (locale === "ar") {
      return arabicGoldPurities.map((item) => ({
        label: item.label,
        purity: item.purity,
        price: gramPrice ? gramPrice * item.factor : 0,
        note: item.note,
      }));
    }

    return goldPurities.map((item) => ({
      label: item.labelEn,
      purity: item.purity,
      price: gramPrice ? gramPrice * item.factor : 0,
      note: item.noteEn,
    }));
  }, [data?.gold?.priceUsdPerGram, locale]);

  const silverRows = useMemo<PurityRow[]>(() => {
    const gramPrice = data?.silver?.priceUsdPerGram;
    if (locale === "ar") {
      return arabicSilverPurities.map((item) => ({
        label: item.label,
        purity: item.purity,
        price: gramPrice ? gramPrice * item.factor : 0,
        note: item.note,
      }));
    }

    return silverPurities.map((item) => ({
      label: item.descriptionEn,
      purity: item.purity,
      price: gramPrice ? gramPrice * item.factor : 0,
      note: item.noteEn,
    }));
  }, [data?.silver?.priceUsdPerGram, locale]);

  const lastUpdated = data?.updatedAt || metalRows[0]?.updatedAt;

  return (
    <ProfileCompletionGate locale={locale}>
      <main
        dir={getLocaleDirection(locale)}
        className="min-h-dvh overflow-x-hidden bg-[#efe3cf] text-[#241913] kishib-bg-result"
      >
        <div className="min-h-dvh bg-[#fff7e8]/78">
          <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#d2b98f]/70 bg-[#fff4e2]/82 px-3 text-sm font-semibold text-[#735f4b] transition hover:border-[#b88a3d] hover:text-[#241913]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Link>

            <div className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.16em] text-[#986f2e]">
              <Coins className="h-4 w-4" />
              KISHIB
            </div>
          </header>

          <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-2 sm:px-6">
            <div className="mb-6 flex flex-col gap-5 border-b border-[#d2b98f]/55 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b88a3d]">
                  {t.eyebrow}
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-[#1f382c] sm:text-4xl">
                  {t.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[#735f4b]">
                  {t.subtitle}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {lastUpdated ? (
                  <p className="text-xs font-semibold leading-5 text-[#735f4b]">
                    {t.lastUpdated}: {formatDate(locale, lastUpdated)}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => void loadPrices(true)}
                  disabled={isLoading || isRefreshing}
                  className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-[8px] bg-[#8A4F32] px-4 text-sm font-semibold text-[#F5E6CF] shadow-[0_12px_28px_rgba(138,79,50,0.22)] transition hover:bg-[#986f2e] active:bg-[#735f4b] disabled:cursor-not-allowed disabled:bg-[#8A4F32]/70 disabled:text-[#F5E6CF]/85 disabled:shadow-none"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing ? t.refreshing : t.refresh}
                </button>
              </div>
            </div>

            {isLoading ? (
              <StatusMessage>{t.loading}</StatusMessage>
            ) : error ? (
              <StatusMessage tone="error">{error}</StatusMessage>
            ) : metalRows.length === 0 ? (
              <StatusMessage>{t.empty}</StatusMessage>
            ) : (
              <div className="space-y-7">
                {data?.stale || data?.warning ? (
                  <div className="flex items-start gap-3 rounded-[8px] border border-[#b88a3d]/35 bg-[#fff4e2]/78 p-4 text-sm leading-6 text-[#735f4b]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#986f2e]" />
                    <span>{t.stale}</span>
                  </div>
                ) : null}

                <TableSection title={t.globalTitle}>
                  <DataTable
                    headers={[
                      t.metal,
                      t.symbol,
                      t.ouncePrice,
                      t.gramPrice,
                      t.unit,
                      t.updated,
                    ]}
                  >
                    {metalRows.map((row) => (
                      <tr key={row.key}>
                        <Cell strong>{row.name}</Cell>
                        <Cell>{row.symbol}</Cell>
                        <Cell>
                          ${formatMoney(locale, row.ounce)}
                        </Cell>
                        <Cell>
                          ${formatMoney(locale, row.gram)}
                        </Cell>
                        <Cell>{row.unit}</Cell>
                        <Cell>{formatDate(locale, row.updatedAt)}</Cell>
                      </tr>
                    ))}
                  </DataTable>
                  <p className="mt-3 text-xs leading-6 text-[#735f4b]">
                    {t.copperNote}
                  </p>
                </TableSection>

                <TableSection title={t.goldTitle}>
                  <DataTable
                    headers={[t.karat, t.purity, t.gramPrice, t.noteColumn]}
                  >
                    {goldRows.map((row) => (
                      <tr key={row.purity}>
                        <Cell strong>{row.label}</Cell>
                        <Cell>{row.purity}</Cell>
                        <Cell>${formatMoney(locale, row.price)}</Cell>
                        <Cell>{row.note}</Cell>
                      </tr>
                    ))}
                  </DataTable>
                </TableSection>

                <TableSection title={t.silverTitle}>
                  <DataTable
                    headers={[t.purity, t.description, t.gramPrice, t.noteColumn]}
                  >
                    {silverRows.map((row) => (
                      <tr key={row.purity}>
                        <Cell strong>{row.purity}</Cell>
                        <Cell>{row.label}</Cell>
                        <Cell>${formatMoney(locale, row.price)}</Cell>
                        <Cell>{row.note}</Cell>
                      </tr>
                    ))}
                  </DataTable>
                </TableSection>

                <div className="border-t border-[#d2b98f]/55 pt-4 text-xs leading-6 text-[#735f4b]">
                  <p>{t.footerNote}</p>
                  {data?.source ? (
                    <p className="mt-2 font-semibold text-[#986f2e]">
                      {t.source}: {data.source}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </ProfileCompletionGate>
  );
}

function TableSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-y border-[#d2b98f]/60 py-5">
      <h2 className="mb-4 text-xl font-semibold text-[#1f382c]">{title}</h2>
      {children}
    </section>
  );
}

function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[8px] border border-[#d2b98f]/62 bg-[#fff4e2]/70">
      <table className="min-w-[760px] w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#d2b98f]/70 bg-[#efe3cf]/82 text-[#1f382c]">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 text-start text-xs font-bold uppercase tracking-[0.08em]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d2b98f]/45">{children}</tbody>
      </table>
    </div>
  );
}

function Cell({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={[
        "whitespace-nowrap px-4 py-3 text-[#735f4b]",
        strong ? "font-semibold text-[#241913]" : "font-medium",
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function StatusMessage({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      className={[
        "rounded-[8px] border p-6 text-sm leading-6 shadow-[0_14px_34px_rgba(62,39,22,0.08)]",
        tone === "error"
          ? "border-[#9a3a2f]/28 bg-[#fff4e2]/82 text-[#7a241d]"
          : "border-[#d2b98f]/58 bg-[#fff4e2]/82 text-[#735f4b]",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
