"use client";

import {
  ArrowLeftRight,
  BadgeDollarSign,
  Check,
  ChevronRight,
  Copy,
  Download,
  EyeOff,
  HelpCircle,
  Landmark,
  Share2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  AnalysisResult,
  Locale,
  ShareCardData,
  ShareCardSize,
  ShareCardVariant,
} from "./types";

type Props = {
  open: boolean;
  locale: Locale;
  result: AnalysisResult | null;
  onClose: () => void;
  onShare: (options: ShareCardData) => Promise<void> | void;
};

type VariantOption = {
  id: ShareCardVariant;
  icon: LucideIcon;
  title: string;
  description: string;
};

function isArabic(locale: Locale) {
  return locale === "ar";
}

function isRtl(locale: Locale) {
  return locale === "ar" || locale === "ku" || locale === "fa";
}

function compact(value?: string | null, fallback = "-") {
  const text = (value || "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 64 ? `${text.slice(0, 64).trim()}...` : text;
}

function getPrice(result: AnalysisResult) {
  const scenario = result.valuation_scenarios?.[0] || result.valuationScenarios?.[0];
  if (
    scenario &&
    typeof scenario.min === "number" &&
    typeof scenario.max === "number"
  ) {
    const symbol =
      scenario.currency === "EUR" ? "€" : scenario.currency === "GBP" ? "£" : "$";
    return `${symbol}${scenario.min.toLocaleString("en-US")} - ${symbol}${scenario.max.toLocaleString("en-US")}`;
  }

  return compact(result.estimatedValue || result.priceRange);
}

function getLabels(locale: Locale) {
  const ar = isArabic(locale);

  return {
    title: ar ? "مشاركة التقييم" : "Share Result",
    subtitle: ar ? "اختر طريقة المشاركة" : "Choose a sharing style",
    story: "Story 9:16",
    post: "Post 1:1",
    share: ar ? "مشاركة" : "Share",
    download: ar ? "تحميل الصورة" : "Download image",
    copy: ar ? "نسخ الكابشن" : "Copy caption",
    copied: ar ? "تم النسخ" : "Copied",
    preview: ar ? "معاينة البطاقة" : "Card preview",
    price: ar ? "القيمة التقديرية" : "Estimated value",
    evaluated: ar ? "تم التقييم عبر KISHIB" : "Evaluated by KISHIB",
    noPrice: ar ? "بدون عرض السعر" : "Without price",
    guess: ar ? "احزر قيمة هذه القطعة؟" : "Guess the value?",
    try: ar ? "قيّم قطعتك عبر KISHIB" : "Scan yours with KISHIB",
    before: ar ? "قبل" : "Before",
    after: ar ? "بعد" : "After",
    unknown: ar ? "قطعة غير معروفة" : "Unknown item",
  };
}

function getOptions(locale: Locale): VariantOption[] {
  const ar = isArabic(locale);

  return [
    {
      id: "with_price",
      icon: BadgeDollarSign,
      title: ar ? "مشاركة مع السعر" : "With price",
      description: ar ? "الصورة والسعر والثقة" : "Image, price, and confidence",
    },
    {
      id: "without_price",
      icon: EyeOff,
      title: ar ? "مشاركة بدون السعر" : "Without price",
      description: ar ? "النوع والخامة والحقبة فقط" : "Type, material, and era only",
    },
    {
      id: "guess_value",
      icon: HelpCircle,
      title: ar ? "احزر قيمة القطعة" : "Guess the value",
      description: ar ? "قالب تسويقي بدون سعر" : "A playful no-price card",
    },
    {
      id: "historical_info",
      icon: Landmark,
      title: ar ? "معلومات تاريخية" : "Historical info",
      description: ar ? "سياق مختصر بدون سعر" : "Short context without price",
    },
    {
      id: "before_after",
      icon: ArrowLeftRight,
      title: ar ? "قبل وبعد كيشيب" : "Before / After",
      description: ar ? "تعريف سريع قبل وبعد" : "Quick before and after",
    },
  ];
}

function buildCaption(locale: Locale, variant: ShareCardVariant) {
  const ar = isArabic(locale);

  if (variant === "guess_value") {
    return ar
      ? "برأيك كم تساوي هذه القطعة؟ جرّب تقييم قطعك القديمة عبر KISHIB."
      : "How much do you think this antique is worth? Try evaluating yours with KISHIB.";
  }

  if (variant === "without_price" || variant === "historical_info") {
    return ar
      ? "قيّمت هذه القطعة عبر تطبيق KISHIB وحصلت على تحليل مبدئي للنوع، الخامة، والحقبة. جرّب تقييم قطعك القديمة خلال دقائق."
      : "I evaluated this antique with KISHIB and got an instant estimate of its type, material, and era. Try scanning your antiques in minutes.";
  }

  return ar
    ? "قيّمت هذه القطعة عبر تطبيق KISHIB وحصلت على تحليل مبدئي للنوع، الخامة، الحقبة، والقيمة التقريبية. جرّب تقييم قطعك القديمة خلال دقائق."
    : "I evaluated this antique with KISHIB and got an instant estimate of its type, material, era, and market value. Try scanning your antiques in minutes.";
}

function SharePreview({
  result,
  variant,
  size,
  locale,
}: {
  result: AnalysisResult;
  variant: ShareCardVariant;
  size: ShareCardSize;
  locale: Locale;
}) {
  const labels = getLabels(locale);
  const showPrice = variant === "with_price" || variant === "before_after";
  const isStory = size === "story";
  const title = compact(result.title || result.itemType, "KISHIB");

  return (
    <div className="rounded-[18px] border border-[#d2b98f]/70 bg-[#3f1512] p-3 text-[#fff4e2]">
      <p className="mb-2 text-[11px] font-bold text-[#e8c273]">{labels.preview}</p>
      <div
        className={[
          "mx-auto overflow-hidden rounded-[16px] border border-[#d6b576]/35 bg-gradient-to-br from-[#fff4e2] via-[#7a2f25] to-[#33100f] p-3 shadow-inner",
          isStory ? "aspect-[9/16] max-h-64 w-36" : "aspect-square w-44",
        ].join(" ")}
      >
        <div className="h-1/2 rounded-[12px] bg-[#2a1713]/45" />
        <div className="mt-3 text-[10px] font-bold text-[#f0cf83]">KISHIB</div>
        <div className="mt-2 text-sm font-black leading-4">
          {variant === "guess_value" ? labels.guess : title}
        </div>
        {variant === "without_price" || variant === "historical_info" ? (
          <div className="mt-2 text-[10px] leading-4 text-[#fff4e2]/85">
            {variant === "historical_info"
              ? compact(result.history || result.lookup, labels.noPrice)
              : `${compact(result.itemType)} / ${compact(result.material)}`}
          </div>
        ) : null}
        {variant === "guess_value" ? (
          <div className="mt-2 text-[10px] font-bold text-[#f0cf83]">{labels.try}</div>
        ) : null}
        {variant === "before_after" ? (
          <div className="mt-2 text-[10px] leading-4 text-[#fff4e2]/90">
            {labels.before}: {labels.unknown}
            <br />
            {labels.after}: {compact(result.itemType || result.title)}
          </div>
        ) : null}
        {showPrice ? (
          <div className="mt-2 text-base font-black text-[#f0cf83]">{getPrice(result)}</div>
        ) : null}
      </div>
    </div>
  );
}

export default function ShareResultSheet({
  open,
  locale,
  result,
  onClose,
  onShare,
}: Props) {
  const labels = useMemo(() => getLabels(locale), [locale]);
  const options = useMemo(() => getOptions(locale), [locale]);
  const [selected, setSelected] = useState<ShareCardVariant>("with_price");
  const [size, setSize] = useState<ShareCardSize>("story");
  const [copied, setCopied] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const rtl = isRtl(locale);

  if (!open || !result) return null;

  async function runAction(action: NonNullable<ShareCardData["action"]>) {
    const key = `${action}-${selected}-${size}`;
    setBusyKey(key);
    try {
      await onShare({ variant: selected, size, action });
      if (action === "share") onClose();
    } finally {
      setBusyKey(null);
    }
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(buildCaption(locale, selected));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/38 px-3 pb-3 backdrop-blur-sm sm:items-center sm:p-5">
      <section
        dir={rtl ? "rtl" : "ltr"}
        className="w-full max-w-lg overflow-hidden rounded-[26px] border border-[#d2b98f] bg-[#fff4e2] text-[#241913] shadow-[0_24px_80px_rgba(35,18,9,0.34)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#d2b98f]/60 px-4 py-4">
          <div>
            <p className="text-lg font-black text-[#4d1b17]">{labels.title}</p>
            <p className="mt-1 text-xs leading-5 text-[#735f4b]">{labels.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#efe3cf] text-[#735f4b]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[72dvh] overflow-y-auto px-4 py-3 pb-5">
          <div className="divide-y divide-[#d2b98f]/55">
            {options.map((option) => {
              const Icon = option.icon;
              const active = selected === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelected(option.id)}
                  className="flex w-full items-center gap-3 py-3 text-start"
                >
                  <span
                    className={[
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                      active
                        ? "bg-[#4d1b17] text-[#fff4e2]"
                        : "bg-[#efe3cf] text-[#986f2e]",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-[#4d1b17]">
                      {option.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#735f4b]">
                      {option.description}
                    </span>
                  </span>
                  {active ? (
                    <Check className="h-4 w-4 shrink-0 text-[#b88a3d]" />
                  ) : (
                    <ChevronRight
                      className={[
                        "h-4 w-4 shrink-0 text-[#b88a3d]/70",
                        rtl ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-full bg-[#efe3cf] p-1">
            {(["story", "post"] as ShareCardSize[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSize(item)}
                className={[
                  "rounded-full px-3 py-2 text-xs font-bold transition",
                  size === item
                    ? "bg-[#4d1b17] text-[#fff4e2]"
                    : "text-[#735f4b]",
                ].join(" ")}
              >
                {item === "story" ? labels.story : labels.post}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <SharePreview
              result={result}
              variant={selected}
              size={size}
              locale={locale}
            />
          </div>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => runAction("share")}
              disabled={Boolean(busyKey)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#4d1b17] px-4 py-3 text-sm font-bold text-[#fff4e2] disabled:opacity-60"
            >
              <Share2 className="h-4 w-4" />
              {labels.share}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => runAction("download")}
                disabled={Boolean(busyKey)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d2b98f] bg-[#fffaf3] px-3 py-2 text-xs font-bold text-[#4d1b17] disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {labels.download}
              </button>
              <button
                type="button"
                onClick={copyCaption}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d2b98f] bg-[#fffaf3] px-3 py-2 text-xs font-bold text-[#4d1b17]"
              >
                <Copy className="h-4 w-4" />
                {copied ? labels.copied : labels.copy}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
