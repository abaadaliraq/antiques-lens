"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, Coins, RefreshCw, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ProfileCompletionGate from "@/components/antique-ai/ProfileCompletionGate";
import type { Locale } from "@/components/antique-ai/types";
import {
  getMarketplaceDirection,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";

type MetalKey = "gold" | "silver" | "copper" | "platinum";

type MetalPrice = {
  symbol: "XAU" | "XAG" | "XCU" | "XPT";
  name: string;
  priceUsdPerOunce: number;
  priceUsdPerGram: number;
  updatedAt: string;
  changeUsdPerOunce?: number;
  changePercent?: number;
};

type MetalPricesPayload = Partial<Record<MetalKey, MetalPrice>> & {
  source?: string;
  warning?: string;
};

const metalKeys: MetalKey[] = ["gold", "silver", "copper", "platinum"];

const copy = {
  ar: {
    eyebrow: "بورصة المعادن",
    title: "أسعار المعادن اليومية",
    subtitle: "تابع الذهب والفضة والنحاس والبلاتينيوم بالدولار لكل أونصة.",
    back: "الرئيسية",
    refresh: "تحديث الأسعار",
    refreshing: "جاري التحديث",
    loading: "جاري تحميل أسعار المعادن...",
    empty: "لا توجد بيانات أسعار متاحة حالياً.",
    error: "تعذر تحميل أسعار المعادن حالياً. حاول مرة أخرى لاحقاً.",
    usd: "USD",
    perOunce: "per ounce",
    updated: "آخر تحديث",
    change: "التغيير",
    unavailable: "غير متوفر",
    note: "الأسعار تقديرية وتعتمد على بيانات السوق المتاحة، وليست توصية بيع أو شراء.",
    source: "المصدر",
  },
  en: {
    eyebrow: "Metal Prices",
    title: "Daily metal prices",
    subtitle: "Track gold, silver, copper, and platinum in USD per ounce.",
    back: "Home",
    refresh: "Refresh prices",
    refreshing: "Refreshing",
    loading: "Loading metal prices...",
    empty: "No metal price data is available right now.",
    error: "Metal prices could not be loaded right now. Please try again later.",
    usd: "USD",
    perOunce: "per ounce",
    updated: "Last updated",
    change: "Change",
    unavailable: "Unavailable",
    note: "Prices are indicative market data and not financial advice.",
    source: "Source",
  },
  fr: {
    eyebrow: "Prix des métaux",
    title: "Prix quotidiens des métaux",
    subtitle: "Or, argent, cuivre et platine en USD par once.",
    back: "Accueil",
    refresh: "Actualiser les prix",
    refreshing: "Actualisation",
    loading: "Chargement des prix des métaux...",
    empty: "Aucune donnée de prix disponible pour le moment.",
    error: "Les prix des métaux ne peuvent pas être chargés maintenant. Réessayez plus tard.",
    usd: "USD",
    perOunce: "par once",
    updated: "Dernière mise à jour",
    change: "Variation",
    unavailable: "Indisponible",
    note: "Les prix sont des données indicatives de marché et ne constituent pas un conseil financier.",
    source: "Source",
  },
  hi: {
    eyebrow: "धातु कीमतें",
    title: "दैनिक धातु कीमतें",
    subtitle: "सोना, चांदी, तांबा और प्लैटिनम USD प्रति ounce में.",
    back: "होम",
    refresh: "कीमतें अपडेट करें",
    refreshing: "अपडेट हो रहा है",
    loading: "धातु कीमतें लोड हो रही हैं...",
    empty: "अभी कोई धातु मूल्य डेटा उपलब्ध नहीं है.",
    error: "धातु कीमतें अभी लोड नहीं हो सकीं. बाद में फिर कोशिश करें.",
    usd: "USD",
    perOunce: "per ounce",
    updated: "अंतिम अपडेट",
    change: "बदलाव",
    unavailable: "उपलब्ध नहीं",
    note: "कीमतें केवल सांकेतिक बाजार डेटा हैं और वित्तीय सलाह नहीं हैं.",
    source: "Source",
  },
  fa: {
    eyebrow: "قیمت فلزات",
    title: "قیمت روزانه فلزات",
    subtitle: "طلا، نقره، مس و پلاتین به دلار برای هر اونس.",
    back: "خانه",
    refresh: "به‌روزرسانی قیمت‌ها",
    refreshing: "در حال به‌روزرسانی",
    loading: "در حال بارگذاری قیمت فلزات...",
    empty: "فعلاً داده قیمتی در دسترس نیست.",
    error: "قیمت فلزات اکنون بارگذاری نشد. بعداً دوباره تلاش کنید.",
    usd: "USD",
    perOunce: "برای هر اونس",
    updated: "آخرین به‌روزرسانی",
    change: "تغییر",
    unavailable: "ناموجود",
    note: "قیمت‌ها داده‌های تقریبی بازار هستند و توصیه مالی محسوب نمی‌شوند.",
    source: "منبع",
  },
  tr: {
    eyebrow: "Metal Fiyatları",
    title: "Günlük metal fiyatları",
    subtitle: "Altın, gümüş, bakır ve platini ons başına USD olarak takip edin.",
    back: "Ana sayfa",
    refresh: "Fiyatları yenile",
    refreshing: "Yenileniyor",
    loading: "Metal fiyatları yükleniyor...",
    empty: "Şu anda metal fiyat verisi yok.",
    error: "Metal fiyatları şu anda yüklenemedi. Lütfen daha sonra deneyin.",
    usd: "USD",
    perOunce: "ons başına",
    updated: "Son güncelleme",
    change: "Değişim",
    unavailable: "Yok",
    note: "Fiyatlar gösterge niteliğinde piyasa verileridir ve finansal tavsiye değildir.",
    source: "Kaynak",
  },
  ru: {
    eyebrow: "Цены на металлы",
    title: "Ежедневные цены на металлы",
    subtitle: "Золото, серебро, медь и платина в USD за унцию.",
    back: "Главная",
    refresh: "Обновить цены",
    refreshing: "Обновление",
    loading: "Загрузка цен на металлы...",
    empty: "Данные о ценах сейчас недоступны.",
    error: "Цены на металлы сейчас не удалось загрузить. Попробуйте позже.",
    usd: "USD",
    perOunce: "за унцию",
    updated: "Последнее обновление",
    change: "Изменение",
    unavailable: "Недоступно",
    note: "Цены являются ориентировочными рыночными данными и не являются финансовой рекомендацией.",
    source: "Источник",
  },
  ku: {
    eyebrow: "نرخی کانزاکان",
    title: "نرخی ڕۆژانەی کانزاکان",
    subtitle: "زێڕ، زیو، مس و پلاتینیۆم بە USD بۆ هەر ئۆنس.",
    back: "سەرەکی",
    refresh: "نوێکردنەوەی نرخەکان",
    refreshing: "نوێ دەکرێتەوە",
    loading: "نرخی کانزاکان بار دەکرێت...",
    empty: "ئێستا هیچ داتای نرخێک بەردەست نییە.",
    error: "ئێستا نرخی کانزاکان بار نەکرا. دواتر هەوڵ بدەوە.",
    usd: "USD",
    perOunce: "بۆ هەر ئۆنس",
    updated: "دوایین نوێکردنەوە",
    change: "گۆڕان",
    unavailable: "بەردەست نییە",
    note: "نرخەکان تەنها داتای بازاڕی ڕێنمایین و ڕاوێژی دارایی نین.",
    source: "سەرچاوە",
  },
} satisfies Record<Locale, Record<string, string>>;

const metalNames = {
  ar: { gold: "الذهب", silver: "الفضة", copper: "النحاس", platinum: "البلاتينيوم" },
  en: { gold: "Gold", silver: "Silver", copper: "Copper", platinum: "Platinum" },
  fr: { gold: "Or", silver: "Argent", copper: "Cuivre", platinum: "Platine" },
  hi: { gold: "सोना", silver: "चांदी", copper: "तांबा", platinum: "प्लैटिनम" },
  fa: { gold: "طلا", silver: "نقره", copper: "مس", platinum: "پلاتین" },
  tr: { gold: "Altın", silver: "Gümüş", copper: "Bakır", platinum: "Platin" },
  ru: { gold: "Золото", silver: "Серебро", copper: "Медь", platinum: "Платина" },
  ku: { gold: "زێڕ", silver: "زیو", copper: "مس", platinum: "پلاتینیۆم" },
} satisfies Record<Locale, Record<MetalKey, string>>;

function getPerGramLabel(locale: Locale) {
  if (locale === "ar") return "per gram / لكل غرام";
  if (locale === "fa") return "per gram / برای هر گرم";
  if (locale === "ku") return "per gram / بۆ هەر گرام";
  if (locale === "fr") return "per gramme";
  if (locale === "tr") return "gram başına";
  return "per gram";
}

function getIndicativeWarning(locale: Locale) {
  if (locale === "ar") {
    return "تعذر الاتصال بالمصدر الحي حالياً، لذلك تظهر أسعار تقديرية مؤقتة بدل إخفاء الأسعار.";
  }

  return "Live market data is temporarily unavailable, so indicative fallback prices are shown instead of hiding prices.";
}

export default function MetalPricesPage() {
  const locale = useMarketplaceLocale();
  const t = copy[locale] ?? copy.en;
  const [data, setData] = useState<MetalPricesPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadPrices = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      const response = await fetch(`/api/metal-prices?ts=${Date.now()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Metal price request failed");
      }

      const payload = (await response.json()) as MetalPricesPayload;
      setData(payload);
    } catch {
      setData(null);
      setError(t.error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t.error]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPrices(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPrices]);

  const metals = useMemo(
    () =>
      metalKeys
        .map((key) => ({ key, price: data?.[key] }))
        .filter((item): item is { key: MetalKey; price: MetalPrice } =>
          Boolean(item.price),
        ),
    [data],
  );

  return (
    <ProfileCompletionGate locale={locale}>
      <main
        dir={getMarketplaceDirection(locale)}
        className="min-h-dvh bg-[#efe3cf] text-[#241913] kishib-bg-result"
      >
        <div className="min-h-dvh bg-[#fff7e8]/72">
          <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#d2b98f]/70 bg-[#fff4e2]/82 px-3 text-sm font-semibold text-[#735f4b] transition hover:border-[#b88a3d] hover:text-[#241913]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Link>

            <div className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-[#986f2e]">
              <Coins className="h-4 w-4" />
              KISHIB
            </div>
          </header>

          <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-2 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-5 border-b border-[#d2b98f]/55 pb-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#b88a3d]">
                  {t.eyebrow}
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-[#241913] sm:text-4xl">
                  {t.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#735f4b]">
                  {t.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadPrices(true)}
                disabled={isLoading || isRefreshing}
                className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-[8px] bg-[#b88a3d] px-4 text-sm font-semibold text-[#fff4e2] shadow-[0_12px_28px_rgba(184,138,61,0.22)] transition hover:bg-[#986f2e] disabled:cursor-not-allowed disabled:opacity-65"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? t.refreshing : t.refresh}
              </button>
            </div>

            {isLoading ? (
              <StatusMessage>{t.loading}</StatusMessage>
            ) : error ? (
              <StatusMessage tone="error">{error}</StatusMessage>
            ) : metals.length === 0 ? (
              <StatusMessage>{t.empty}</StatusMessage>
            ) : (
              <>
                {data?.warning ? (
                  <div className="mb-5 flex items-start gap-3 rounded-[8px] border border-[#b88a3d]/35 bg-[#fff4e2]/78 p-4 text-sm leading-6 text-[#735f4b]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#986f2e]" />
                    <span>{getIndicativeWarning(locale)}</span>
                  </div>
                ) : null}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {metals.map(({ key, price }) => (
                    <MetalCard
                      key={key}
                      label={metalNames[locale][key]}
                      price={price}
                      locale={locale}
                      labels={t}
                    />
                  ))}
                </section>

                <div className="mt-6 flex flex-col gap-2 text-xs leading-6 text-[#735f4b] sm:flex-row sm:items-center sm:justify-between">
                  <p>{t.note}</p>
                  {data?.source ? (
                    <p className="font-semibold text-[#986f2e]">
                      {t.source}: {data.source}
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </ProfileCompletionGate>
  );
}

function MetalCard({
  label,
  price,
  locale,
  labels,
}: {
  label: string;
  price: MetalPrice;
  locale: Locale;
  labels: Record<string, string>;
}) {
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: price.priceUsdPerOunce < 1 ? 4 : 2,
    maximumFractionDigits: price.priceUsdPerOunce < 1 ? 4 : 2,
  });
  const gramFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: price.priceUsdPerGram < 1 ? 4 : 2,
    maximumFractionDigits: price.priceUsdPerGram < 1 ? 4 : 2,
  });
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const change = formatChange(price, formatter, labels.unavailable);

  return (
    <article className="rounded-[8px] border border-[#d2b98f]/62 bg-[#fff4e2]/82 p-5 shadow-[0_14px_34px_rgba(62,39,22,0.1)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#241913]">{label}</h2>
          <p className="mt-1 text-xs font-semibold tracking-[0.18em] text-[#986f2e]">
            {price.symbol}
          </p>
        </div>
        <TrendingUp className="h-5 w-5 text-[#b88a3d]" />
      </div>

      <div className="mt-6">
        <div className="rounded-[8px] bg-[#fff7e8]/75 p-3">
          <p className="text-2xl font-semibold text-[#241913]">
            {formatter.format(price.priceUsdPerOunce)}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#735f4b]">
            {labels.usd} / {labels.perOunce}
          </p>
        </div>
        <div className="mt-2 rounded-[8px] border border-[#d2b98f]/42 bg-[#fff4e2]/55 p-3">
          <p className="text-xl font-semibold text-[#241913]">
            {gramFormatter.format(price.priceUsdPerGram)}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#735f4b]">
            {labels.usd} / {getPerGramLabel(locale)}
          </p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 border-t border-[#d2b98f]/48 pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[#735f4b]">{labels.updated}</dt>
          <dd className="text-end font-medium text-[#241913]">
            {dateFormatter.format(new Date(price.updatedAt))}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[#735f4b]">{labels.change}</dt>
          <dd className={change.tone}>{change.value}</dd>
        </div>
      </dl>
    </article>
  );
}

function formatChange(
  price: MetalPrice,
  formatter: Intl.NumberFormat,
  unavailable: string,
) {
  if (typeof price.changeUsdPerOunce !== "number") {
    return { value: unavailable, tone: "font-medium text-[#735f4b]" };
  }

  const sign = price.changeUsdPerOunce > 0 ? "+" : "";
  const percent =
    typeof price.changePercent === "number"
      ? ` (${sign}${price.changePercent.toFixed(2)}%)`
      : "";

  return {
    value: `${sign}${formatter.format(price.changeUsdPerOunce)}${percent}`,
    tone:
      price.changeUsdPerOunce >= 0
        ? "font-semibold text-[#2f7a4f]"
        : "font-semibold text-[#9a3a2f]",
  };
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
