"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalysisResult, Locale, ValuationScenario } from "./types";

type Props = {
  result: AnalysisResult;
  locale: Locale;
};

type DisplayScenario = Omit<ValuationScenario, "label" | "min" | "max" | "currency"> & {
  label: string;
  min: number | null;
  max: number | null;
  currency: string;
};

function isRtl(locale: Locale) {
  return locale === "ar" || locale === "ku" || locale === "fa";
}

function text(locale: Locale) {
  const labels: Record<
    Locale,
    {
      estimated: string;
      based: string;
      low: string;
      medium: string;
      high: string;
      min: string;
      mid: string;
      max: string;
      warning: string;
      notConfirmed: string;
      primary: string;
      ifSilver: string;
      rawSilver: string;
      assumedPurity: string;
    }
  > = {
    ar: {
      estimated: "القيمة التقديرية",
      based: "تقدير أولي حسب المعلومات المتوفرة",
      low: "ثقة منخفضة",
      medium: "ثقة متوسطة",
      high: "ثقة عالية",
      min: "الأدنى",
      mid: "المتوسط",
      max: "الأعلى",
      warning: "إذا كانت القطعة فضة/معدنًا ثمينًا فعلًا، فالسعر الخام يعتمد على وزنها بالغرام وسعر السوق اليوم.",
      notConfirmed: "الصورة وحدها لا تكفي لتثبيت العيار، لكن يمكن عرض سيناريو مشروط عند توفر الوزن أو الختم.",
      primary: "التقدير الأساسي",
      ifSilver: "إذا كانت فضة حقيقية",
      rawSilver: "قيمة الفضة الخام",
      assumedPurity: "نطاق تقريبي حسب عيار 800 إلى 999",
    },
    en: {
      estimated: "Estimated Value",
      based: "Preliminary estimate from available information",
      low: "Low confidence",
      medium: "Medium confidence",
      high: "High confidence",
      min: "Low",
      mid: "Mid",
      max: "High",
      warning: "If the item is truly silver or precious metal, raw value depends on gram weight and today's market rate.",
      notConfirmed: "A photo alone cannot confirm purity, but KISHIB can show a conditional scenario when weight or hallmark is available.",
      primary: "Primary estimate",
      ifSilver: "If it is genuine silver",
      rawSilver: "Raw silver value",
      assumedPurity: "Approximate range using 800 to 999 purity",
    },
    ku: {
      estimated: "نرخی خەمڵێنراو",
      based: "خەمڵاندنی سەرەتایی بەپێی زانیارییە بەردەستەکان",
      low: "متمانەی نزم",
      medium: "متمانەی مامناوەند",
      high: "متمانەی بەرز",
      min: "کەمترین",
      mid: "ناوەند",
      max: "زۆرترین",
      warning: "ئەگەر پارچەکە بەڕاستی زیو یان کانزای بەنرخ بێت، نرخی خاوەکەی پشت بە کێشی گرام و نرخی بازاڕی ئەمڕۆ دەبەستێت.",
      notConfirmed: "وێنە بە تەنها پاکی کانزا پشتڕاست ناکاتەوە، بەڵام بە کێش یان مۆر دەتوانرێت سیناریۆی مەرجدار پیشان بدرێت.",
      primary: "خەمڵاندنی سەرەکی",
      ifSilver: "ئەگەر زیوی ڕاستەقینە بێت",
      rawSilver: "نرخی زیوی خاو",
      assumedPurity: "مەودای نزیکەیی بە پاکی 800 تا 999",
    },
    fr: {
      estimated: "Valeur estimée",
      based: "Estimation préliminaire selon les informations disponibles",
      low: "Confiance faible",
      medium: "Confiance moyenne",
      high: "Confiance élevée",
      min: "Bas",
      mid: "Milieu",
      max: "Haut",
      warning: "Si l'objet est réellement en argent ou en métal précieux, la valeur brute dépend du poids en grammes et du cours du jour.",
      notConfirmed: "Une photo seule ne confirme pas la pureté, mais KISHIB peut afficher un scénario conditionnel avec le poids ou le poinçon.",
      primary: "Estimation principale",
      ifSilver: "Si c'est de l'argent véritable",
      rawSilver: "Valeur brute de l'argent",
      assumedPurity: "Fourchette indicative avec pureté 800 à 999",
    },
    hi: {
      estimated: "अनुमानित मूल्य",
      based: "उपलब्ध जानकारी के आधार पर प्रारंभिक अनुमान",
      low: "कम भरोसा",
      medium: "मध्यम भरोसा",
      high: "अधिक भरोसा",
      min: "न्यूनतम",
      mid: "मध्य",
      max: "अधिकतम",
      warning: "यदि वस्तु सच में चांदी या कीमती धातु है, तो कच्चा मूल्य ग्राम वजन और आज के बाजार भाव पर निर्भर करता है.",
      notConfirmed: "सिर्फ फोटो से शुद्धता प्रमाणित नहीं होती, लेकिन वजन या हॉलमार्क मिलने पर KISHIB शर्तीय अनुमान दिखा सकता है.",
      primary: "मुख्य अनुमान",
      ifSilver: "यदि यह असली चांदी है",
      rawSilver: "कच्ची चांदी का मूल्य",
      assumedPurity: "800 से 999 शुद्धता पर अनुमानित सीमा",
    },
    fa: {
      estimated: "ارزش تخمینی",
      based: "برآورد اولیه بر اساس اطلاعات موجود",
      low: "اطمینان پایین",
      medium: "اطمینان متوسط",
      high: "اطمینان بالا",
      min: "کمترین",
      mid: "میانه",
      max: "بیشترین",
      warning: "اگر قطعه واقعاً نقره یا فلز گران‌بها باشد، ارزش خام به وزن گرم و نرخ امروز بازار بستگی دارد.",
      notConfirmed: "عکس به‌تنهایی عیار را تأیید نمی‌کند، اما با وزن یا مهر می‌توان سناریوی مشروط نشان داد.",
      primary: "برآورد اصلی",
      ifSilver: "اگر نقره واقعی باشد",
      rawSilver: "ارزش خام نقره",
      assumedPurity: "بازه تقریبی با عیار 800 تا 999",
    },
    tr: {
      estimated: "Tahmini Değer",
      based: "Mevcut bilgilere göre ön tahmin",
      low: "Düşük güven",
      medium: "Orta güven",
      high: "Yüksek güven",
      min: "Düşük",
      mid: "Orta",
      max: "Yüksek",
      warning: "Parça gerçekten gümüş veya değerli metalse ham değer gram ağırlığına ve bugünkü piyasa fiyatına bağlıdır.",
      notConfirmed: "Fotoğraf tek başına saflığı doğrulamaz, ancak ağırlık veya damga varsa KISHIB koşullu senaryo gösterebilir.",
      primary: "Ana tahmin",
      ifSilver: "Gerçek gümüşse",
      rawSilver: "Ham gümüş değeri",
      assumedPurity: "800 ile 999 saflık için yaklaşık aralık",
    },
    ru: {
      estimated: "Оценочная стоимость",
      based: "Предварительная оценка по доступной информации",
      low: "Низкая уверенность",
      medium: "Средняя уверенность",
      high: "Высокая уверенность",
      min: "Низко",
      mid: "Средне",
      max: "Высоко",
      warning: "Если предмет действительно из серебра или драгоценного металла, сырьевая стоимость зависит от веса в граммах и сегодняшней рыночной цены.",
      notConfirmed: "Фото само по себе не подтверждает пробу, но при наличии веса или клейма KISHIB может показать условный сценарий.",
      primary: "Основная оценка",
      ifSilver: "Если это настоящее серебро",
      rawSilver: "Стоимость сырого серебра",
      assumedPurity: "Примерный диапазон для пробы 800-999",
    },
  };

  return labels[locale] || labels.en;
}

function cleanNumber(value: string) {
  const number = Number(value.replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function parseRange(value: string): { min: number | null; max: number | null; currency: string } {
  const currency = /€|eur/i.test(value) ? "EUR" : /£|gbp/i.test(value) ? "GBP" : "USD";
  const matches = Array.from(value.matchAll(/(?:[$€£]\s*)?([0-9][0-9,]*(?:\.\d+)?)/g))
    .map((match) => cleanNumber(match[1]))
    .filter((item): item is number => item !== null);

  if (!matches.length) return { min: null, max: null, currency };
  return { min: Math.min(...matches), max: Math.max(...matches), currency };
}

function formatMoney(value: number | null, currency: string) {
  if (value === null) return "-";
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value < 100 ? 2 : 0,
  }).format(value)}`;
}

function confidenceFromResult(result: AnalysisResult) {
  if (result.confidence <= 3) return "low";
  if (result.confidence <= 6) return "medium";
  return "high";
}

function getScenarios(result: AnalysisResult, locale: Locale): DisplayScenario[] {
  const provided = result.valuation_scenarios || result.valuationScenarios || [];
  const fallbackRange = parseRange(result.estimatedValue || result.priceRange || "");

  if (provided.length > 0) {
    return provided.map((scenario, index) => ({
      ...scenario,
      label:
        isRtl(locale) && scenario.labelAr
          ? scenario.labelAr
          : scenario.label || `Scenario ${index + 1}`,
      min: typeof scenario.min === "number" ? scenario.min : fallbackRange.min,
      max: typeof scenario.max === "number" ? scenario.max : fallbackRange.max,
      currency: scenario.currency || fallbackRange.currency,
    }));
  }

  return [
    {
      label: text(locale).primary,
      min: fallbackRange.min,
      max: fallbackRange.max,
      currency: fallbackRange.currency,
      confidence: confidenceFromResult(result),
      note: result.priceReasoning || result.confidenceNote,
    },
  ];
}

function getMid(min: number | null, max: number | null) {
  if (min === null && max === null) return null;
  if (min === null) return max;
  if (max === null) return min;
  return Math.round((min + max) / 2);
}

function metalLooksPrecious(result: AnalysisResult) {
  const value = [
    result.material,
    result.title,
    result.lookup,
    result.priceReasoning,
    result.metalValue?.metal,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /gold|silver|platinum|palladium|ذهب|فضة|نقره|زیو|gümüş|altın|серебр|золот|चांदी|सोना|argent|or|بلاتين|بالاديوم/.test(
    value,
  );
}

function textLooksSilver(value: string) {
  return /silver|sterling|فضة|فضي|نقره|زیو|gümüş|серебр|चांदी|argent/i.test(value);
}

function getSilverMentionText(result: AnalysisResult, activeNote?: string) {
  return [
    result.material,
    result.title,
    result.lookup,
    result.priceReasoning,
    result.estimatedValue,
    result.metalValue?.metal,
    activeNote,
  ]
    .filter(Boolean)
    .join(" ");
}

function getSilverGramPriceFromPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as {
    silverGramUSD?: unknown;
    silver?: { priceUsdPerGram?: unknown };
  };
  const direct = Number(data.silverGramUSD);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const nested = Number(data.silver?.priceUsdPerGram);
  if (Number.isFinite(nested) && nested > 0) return nested;
  return null;
}

function buildSilverRows(input: {
  gramPrice: number | null;
  scenarios?: NonNullable<AnalysisResult["metalValue"]>["scenarios"];
}) {
  if (input.scenarios?.length) {
    return input.scenarios.map((scenario) => ({
      grams: scenario.weightGrams,
      low: scenario.meltValueUsdLow,
      high: scenario.meltValueUsdHigh,
    }));
  }

  const gramPrice = input.gramPrice;
  if (!gramPrice) return [];

  return [100, 250, 500].map((grams) => ({
    grams,
    low: Math.round(grams * gramPrice * 0.8),
    high: Math.round(grams * gramPrice * 0.999),
  }));
}

export default function ValuationRangeCard({ result, locale }: Props) {
  const labels = text(locale);
  const scenarios = useMemo(() => getScenarios(result, locale), [result, locale]);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = scenarios[Math.min(activeIndex, scenarios.length - 1)];
  const confidence = active.confidence || confidenceFromResult(result);
  const mid = getMid(active.min, active.max);
  const rtl = isRtl(locale);
  const silverMentionText = getSilverMentionText(result, active.note);
  const isSilverCandidate = textLooksSilver(silverMentionText);
  const isPreciousMetal = metalLooksPrecious(result) || isSilverCandidate;
  const [silverGramPrice, setSilverGramPrice] = useState<number | null>(null);
  const silverRows = buildSilverRows({
    gramPrice: silverGramPrice,
    scenarios: result.metalValue?.metal === "silver" ? result.metalValue.scenarios : undefined,
  });

  useEffect(() => {
    if (!isSilverCandidate || result.metalValue?.scenarios?.length || silverGramPrice) return;
    let cancelled = false;

    fetch("/api/metal-prices")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        setSilverGramPrice(getSilverGramPriceFromPayload(payload));
      })
      .catch(() => {
        if (!cancelled) setSilverGramPrice(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isSilverCandidate, result.metalValue?.scenarios?.length, silverGramPrice]);

  return (
    <section
      dir={rtl ? "rtl" : "ltr"}
      className="-mx-3 mt-4 border-y border-[#7b4a37]/25 bg-[#4d1b17] text-[#fff4e2] sm:mx-0 sm:rounded-[16px] sm:border"
    >
      <div className="px-4 py-3 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-[#e9c979]">{labels.estimated}</p>
            <h2 dir="ltr" className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-white">
              {formatMoney(active.min, active.currency)}
              {active.max !== active.min ? ` - ${formatMoney(active.max, active.currency)}` : ""}
            </h2>
          </div>
          <span className="shrink-0 rounded-full border border-[#f1d08a]/35 bg-[#fff4e2]/12 px-2.5 py-1 text-[11px] font-semibold text-[#fff4e2]">
            {confidence === "high" ? labels.high : confidence === "medium" ? labels.medium : labels.low}
          </span>
        </div>

        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-[#fff4e2]/22">
            <div className="h-full w-1/2 rounded-full bg-[#e9c979]" />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-[#f3dfb7]">
            <p>
              {labels.min}
              <br />
              <b className="text-white">{formatMoney(active.min, active.currency)}</b>
            </p>
            <p className="text-center">
              {labels.mid}
              <br />
              <b className="text-white">{formatMoney(mid, active.currency)}</b>
            </p>
            <p className="text-end">
              {labels.max}
              <br />
              <b className="text-white">{formatMoney(active.max, active.currency)}</b>
            </p>
          </div>
        </div>

        {scenarios.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {scenarios.map((scenario, index) => (
              <button
                type="button"
                key={`${scenario.label}-${index}`}
                onClick={() => setActiveIndex(index)}
                className={[
                  "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  activeIndex === index
                    ? "border-[#fff4e2] bg-[#fff4e2] text-[#2a1713]"
                    : "border-[#fff4e2]/25 bg-[#fff4e2]/8 text-[#fff4e2]",
                ].join(" ")}
              >
                {scenario.label}
              </button>
            ))}
          </div>
        ) : null}

        {active.note ? (
          <p className="mt-3 text-xs leading-5 text-[#fff4e2]/86">{active.note}</p>
        ) : (
          <p className="mt-3 text-xs leading-5 text-[#f3dfb7]">{labels.based}</p>
        )}

        {isSilverCandidate && silverRows.length > 0 ? (
          <div className="mt-3 rounded-[12px] border border-[#f1d08a]/25 bg-[#fff4e2]/10 p-2.5">
            <p className="text-[11px] font-bold text-[#e9c979]">{labels.ifSilver}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {silverRows.map((row) => (
                <div key={row.grams} className="rounded-[10px] bg-[#2a1713]/35 px-2 py-2">
                  <p className="text-[10px] text-[#f3dfb7]">{row.grams}g</p>
                  <p dir="ltr" className="text-sm font-bold text-white">
                    ${row.low} - ${row.high}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-4 text-[#f3dfb7]">
              {labels.rawSilver}. {labels.assumedPurity}
            </p>
          </div>
        ) : null}

        {isPreciousMetal ? (
          <p className="mt-2 text-[11px] leading-5 text-[#f3dfb7]">
            {labels.warning} {labels.notConfirmed}
          </p>
        ) : null}
      </div>
    </section>
  );
}
