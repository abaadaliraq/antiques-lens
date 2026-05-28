"use client";

import { Printer, Share2 } from "lucide-react";
import type { AnalysisResult } from "./types";
import AntiqueReportDocument from "./AntiqueReportDocument";

type Locale = "ar" | "en" | "ku" | "fr";

type ResultLabels = {
  result: string;
  lookup: string;
  age: string;
  value: string;
  material: string;
  origin: string;
  description: string;
  condition: string;
  authenticity: string;
  priceReason: string;
  valueDrivers: string;
  valueReducers: string;
  similar: string;
  similarHint: string;
  soon: string;
  neededPhotos: string;
  followUp: string;
  confidence: string;
  notice: string;
  addInfo?: string;
};

type SimilarImageResult = {
  title: string;
  imageUrl: string;
  link: string;
  source?: string;
};

type Props = {
  locale: Locale;
  labels: ResultLabels;
  result: AnalysisResult | null;
  imagePreview: string | null;
  imagePreviews?: string[];
  similarImages?: SimilarImageResult[];
  isLoadingSimilar?: boolean;
  followUpPanel?: React.ReactNode;
  onShare: () => void;
  onAddInfo?: () => void;
};

function getFallbackText(locale: Locale) {
  if (locale === "en") return "Not clear";
  if (locale === "fr") return "Non clair";
  if (locale === "ku") return "ڕوون نییە";
  return "غير واضح";
}

function getAddInfoText(locale: Locale) {
  if (locale === "en") return "Add photos or information";
  if (locale === "fr") return "Ajouter des photos ou informations";
  if (locale === "ku") return "وێنە یان زانیاری زیاد بکە";
  return "إضافة صور أو معلومات";
}

function getPremiumLabels(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "Premium Report",
      title: "Printable evaluation report",
      hint: "A clean A4-style report prepared for PDF export, traders, auctions, and paid subscriptions.",
      print: "PDF / Print",
    };
  }

  if (locale === "fr") {
    return {
      eyebrow: "Rapport Premium",
      title: "Rapport imprimable",
      hint: "Un rapport propre au format A4, adapté à l’export PDF, aux marchands, aux enchères et aux abonnements payants.",
      print: "PDF / Imprimer",
    };
  }

  if (locale === "ku") {
    return {
      eyebrow: "ڕاپۆرتی Premium",
      title: "ڕاپۆرتی چاپکردن",
      hint: "ڕاپۆرتێکی پاک بە شێوەی A4 بۆ PDF، بازرگانان، مزایدەکان و بەستەکانی پارەدان.",
      print: "PDF / چاپ",
    };
  }

  return {
    eyebrow: "تقرير احترافي",
    title: "تقرير تقييم قابل للطباعة",
    hint: "نموذج A4 مرتب للتصدير PDF، مناسب لاحقاً لباقات التجار والمزادات والاشتراكات المدفوعة.",
    print: "PDF / طباعة",
  };
}

function buildReportId() {
  const now = new Date();
  const year = now.getFullYear();
  const stamp = `${now.getMonth() + 1}${now.getDate()}${now.getHours()}${now.getMinutes()}`;
  return `AL-${year}-${stamp}`;
}
export default function ResultView({
  locale,
  labels,
  result,
  
  imagePreview,
  imagePreviews = [],
  similarImages = [],
  isLoadingSimilar = false,
  
  onShare,
  onAddInfo,
  followUpPanel,
}: Props) {
  if (!result) return null;

  const fallbackText = getFallbackText(locale);
  const premiumLabels = getPremiumLabels(locale);

  const galleryImages =
    imagePreviews.length > 0 ? imagePreviews : imagePreview ? [imagePreview] : [];

  const mainImage = galleryImages[0] || null;
  const secondaryImages = galleryImages.slice(1);
  const reportId = buildReportId();

  return (
    <article className="pb-10 text-white">
      {mainImage && (
        <section className="relative -mx-4 -mt-20 mb-8 overflow-hidden bg-black">
          <div className="relative h-[390px] overflow-hidden md:h-[460px]">
            <img
              src={mainImage}
              alt={result.title || labels.result}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/20 to-black/10" />

            <button
              type="button"
              onClick={onShare}
              className="absolute end-4 top-24 grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white/75 backdrop-blur-2xl transition hover:bg-black/60 hover:text-white"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>

            <div className="absolute bottom-5 start-4 end-4">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.34em] text-[#d6a25f]/80">
                {labels.result}
              </p>

              <h1 className="max-w-[520px] text-[32px] font-semibold leading-[1.12] tracking-[-0.055em] text-white md:text-[42px]">
                {result.title || labels.result}
              </h1>
            </div>
          </div>

          {secondaryImages.length > 0 && (
            <div className="border-t border-white/10 bg-[#050505] px-4 py-4">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                {secondaryImages.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
                  >
                    <img
                      src={src}
                      alt={`${result.title || labels.result} ${index + 2}`}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute bottom-1.5 end-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-md">
                      {index + 2}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {!mainImage && (
        <section className="mb-8 px-1 pt-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.34em] text-[#d6a25f]/75">
                {labels.result}
              </p>

              <h1 className="max-w-[520px] text-[34px] font-semibold leading-[1.12] tracking-[-0.055em] text-white">
                {result.title || labels.result}
              </h1>
            </div>

            <button
              type="button"
              onClick={onShare}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[0.07] text-white/70 backdrop-blur-2xl transition hover:bg-white/[0.12] hover:text-white"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </section>
      )}

      <div className="px-1">
        {result.lookup && (
          <section className="mb-8">
            <p className="mb-2 text-[11px] font-medium tracking-[0.02em] text-[#d6a25f]/70">
              {labels.lookup}
            </p>

            <p className="text-[16px] font-light leading-8 tracking-[-0.01em] text-white/68">
              {result.lookup}
            </p>
          </section>
        )}

        <div className="my-8 h-px bg-white/10" />

        <div className="grid grid-cols-2 gap-x-7 gap-y-7">
          <CleanInfo
            label={labels.age}
            value={result.timePeriod || result.period}
            fallback={fallbackText}
          />

          <CleanInfo
            label={labels.value}
            value={result.estimatedValue || result.priceRange}
            fallback={fallbackText}
            gold
          />

          <CleanInfo
            label={labels.material}
            value={result.material}
            fallback={fallbackText}
          />

          <CleanInfo
            label={labels.origin}
            value={result.origin}
            fallback={fallbackText}
          />
        </div>

        <FreeText
          title={labels.description}
          body={result.history || result.description}
        />

        <FreeText title={labels.condition} body={result.condition} />
        <FreeText title={labels.priceReason} body={result.priceReasoning} />
        <FreeText title={labels.authenticity} body={result.authenticity} />

        <FreeList title={labels.valueDrivers} items={result.valueDrivers} />
        <FreeList title={labels.valueReducers} items={result.valueReducers} />

        {(isLoadingSimilar || similarImages.length > 0) && (
          <section className="mt-11 border-t border-white/10 pt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[19px] font-semibold tracking-[-0.03em] text-white">
                {labels.similar}
              </h2>

              <span className="rounded-full bg-[#d6a25f]/10 px-3 py-1 text-[11px] font-medium text-[#d6a25f]/90">
                Google Lens
              </span>
            </div>

            <p className="mb-5 text-[14px] font-light leading-7 text-white/48">
              {labels.similarHint}
            </p>

            {isLoadingSimilar ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-[3/4] animate-pulse rounded-[24px] bg-white/[0.06]"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {similarImages.map((item, index) => (
                  <a
                    key={`${item.imageUrl}-${index}`}
                    href={item.link || item.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.045] transition hover:border-[#d6a25f]/35"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-black">
                      <img
                        src={item.imageUrl}
                        alt={item.title || "Google Lens result"}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-3">
                      <p className="line-clamp-2 text-[12px] leading-5 text-white/62">
                        {item.title || "Google Lens result"}
                      </p>

                      <p className="mt-2 text-[11px] text-[#d6a25f]/80">
                        {item.source || "Google Lens"}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        <FreeList title={labels.neededPhotos} items={result.neededPhotos} />

        {result.followUpQuestion && (
          <section className="mt-11 border-t border-white/10 pt-8">
            <h2 className="mb-3 text-[19px] font-semibold tracking-[-0.03em] text-white">
              {labels.followUp}
            </h2>

            <p className="text-[16px] font-light leading-8 tracking-[-0.01em] text-white/66">
              {result.followUpQuestion}
            </p>

           {onAddInfo && (
  <button
    type="button"
    onClick={onAddInfo}
    className="mt-5 inline-flex h-12 items-center justify-center rounded-full border border-[#d6a25f]/25 bg-[#d6a25f]/10 px-6 text-[13px] font-bold text-[#d6a25f] transition hover:bg-[#d6a25f]/15"
  >
    {labels.addInfo || getAddInfoText(locale)}
  </button>
)}

{followUpPanel ? <div className="mt-6">{followUpPanel}</div> : null}
            
          </section>
        )}

       {!result.followUpQuestion && onAddInfo && (
  <section className="mt-11 border-t border-white/10 pt-8">
    <button
      type="button"
      onClick={onAddInfo}
      className="inline-flex h-12 items-center justify-center rounded-full border border-[#d6a25f]/25 bg-[#d6a25f]/10 px-6 text-[13px] font-bold text-[#d6a25f] transition hover:bg-[#d6a25f]/15"
    >
      {labels.addInfo || getAddInfoText(locale)}
    </button>

    {followUpPanel ? <div className="mt-6">{followUpPanel}</div> : null}
  </section>
)}
      
        <section className="mt-11 border-t border-white/10 pt-7">
          <p className="text-[12px] font-light leading-6 text-white/36">
            {result.disclaimer || labels.notice}
          </p>

          {typeof result.confidence === "number" && (
            <p className="mt-3 text-[12px] font-light leading-6 text-white/30">
              {labels.confidence}: {result.confidence}/10
              {result.confidenceNote ? ` — ${result.confidenceNote}` : ""}
            </p>
          )}
        </section>

        <section className="mt-12 border-t border-white/10 pt-8">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.32em] text-[#d6a25f]/70">
                {premiumLabels.eyebrow}
              </p>

              <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-white">
                {premiumLabels.title}
              </h2>

              <p className="mt-2 max-w-[560px] text-[13px] font-light leading-6 text-white/44">
                {premiumLabels.hint}
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d6a25f]/25 bg-[#d6a25f]/10 px-5 text-[12px] font-medium text-[#d6a25f] transition hover:bg-[#d6a25f]/15"
            >
              <Printer className="h-4 w-4" />
              {premiumLabels.print}
            </button>
          </div>

          <div className="report-print-area overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[0.04] p-3">
            <AntiqueReportDocument
              locale={locale}
              result={result}
              imageUrl={mainImage || undefined}
              reportId={reportId}
              variant="print"
            />
          </div>
        </section>
      </div>

      <style jsx global>{`
        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .report-print-area,
          .report-print-area * {
            visibility: visible !important;
          }

          .report-print-area {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: white !important;
            overflow: visible !important;
          }

          .report-print-area .antique-report-document {
            width: 210mm !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          .report-print-area .report-page {
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 !important;
            overflow: hidden !important;
          }

          .report-print-area .report-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </article>
  );
}

function CleanInfo({
  label,
  value,
  fallback,
  gold = false,
}: {
  label: string;
  value?: string;
  fallback: string;
  gold?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-[11px] font-medium tracking-[0.02em] text-white/34">
        {label}
      </p>

      <p
        className={[
          "text-[15px] leading-7 tracking-[-0.015em]",
          gold ? "font-medium text-[#d6a25f]" : "font-light text-white/76",
        ].join(" ")}
      >
        {value && value.trim() ? value : fallback}
      </p>
    </div>
  );
}

function FreeText({ title, body }: { title: string; body?: string }) {
  if (!body || !body.trim()) return null;

  return (
    <section className="mt-11 border-t border-white/10 pt-8">
      <h2 className="mb-3 text-[19px] font-semibold leading-7 tracking-[-0.035em] text-white">
        {title}
      </h2>

      <p className="text-[16px] font-light leading-8 tracking-[-0.015em] text-white/66">
        {body}
      </p>
    </section>
  );
}

function FreeList({ title, items }: { title: string; items?: string[] }) {
  const cleanItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (cleanItems.length === 0) return null;

  return (
    <section className="mt-11 border-t border-white/10 pt-8">
      <h2 className="mb-4 text-[19px] font-semibold leading-7 tracking-[-0.035em] text-white">
        {title}
      </h2>

      <div className="space-y-4">
        {cleanItems.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex gap-3 text-[16px] font-light leading-8 tracking-[-0.015em] text-white/64"
          >
            <span className="mt-[13px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d6a25f]/85" />
            <p>{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}