"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Printer,
  Share2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AnalysisResult, Locale, SimilarImageResult } from "./types";
import AntiqueReportDocument from "./AntiqueReportDocument";
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
  if (locale === "hi") return "स्पष्ट नहीं";
  if (locale === "fa") return "نامشخص";
  if (locale === "tr") return "Net değil";
  if (locale === "ru") return "Не ясно";
  return "غير واضح";
}

function getAddInfoText(locale: Locale) {
  if (locale === "en") return "Add info";
  if (locale === "fr") return "Ajouter";
  if (locale === "ku") return "زیادکردن";
  if (locale === "hi") return "जानकारी जोड़ें";
  if (locale === "fa") return "افزودن اطلاعات";
  if (locale === "tr") return "Bilgi ekle";
  if (locale === "ru") return "Добавить информацию";
  return "أضف معلومات";
}

function getReportLabels(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "Report",
      title: "Printable evaluation",
      hint: "Open the A4 report only when you need PDF export or printing.",
      open: "Open report",
      print: "PDF / Print",
      close: "Close",
    };
  }

  if (locale === "fr") {
    return {
      eyebrow: "Rapport",
      title: "Évaluation imprimable",
      hint: "Ouvrez le rapport A4 uniquement pour l’export PDF ou l’impression.",
      open: "Ouvrir",
      print: "PDF / Imprimer",
      close: "Fermer",
    };
  }

  if (locale === "ku") {
    return {
      eyebrow: "ڕاپۆرت",
      title: "هەڵسەنگاندنی چاپکراو",
      hint: "ڕاپۆرتی A4 تەنها بۆ PDF یان چاپ بکەرەوە.",
      open: "کردنەوە",
      print: "PDF / چاپ",
      close: "داخستن",
    };
  }

  return {
    eyebrow: "التقرير",
    title: "تقرير تقييم قابل للطباعة",
    hint: "التقرير مخفي حتى لا يزحم الصفحة. افتحيه فقط عند الطباعة أو التصدير.",
    open: "فتح التقرير",
    print: "PDF / طباعة",
    close: "إغلاق",
  };
}

function getSimilarSourceLabel(locale: Locale) {
  if (locale === "en") return "Comparable sources";
  if (locale === "fr") return "Sources comparables";
  if (locale === "hi") return "तुलनीय स्रोत";
  if (locale === "fa") return "منابع مشابه";
  if (locale === "tr") return "Benzer kaynaklar";
  if (locale === "ru") return "Похожие источники";
  if (locale === "ku") return "سەرچاوە هاوشێوەکان";
  return "مصادر مشابهة";
}

function buildReportId() {
  const now = new Date();
  const year = now.getFullYear();
  const stamp = `${now.getMonth() + 1}${now.getDate()}${now.getHours()}${now.getMinutes()}`;
  return `KS-${year}-${stamp}`;
}

export default function ResultView({
  locale,
  labels,
  result,
  imagePreview,
  imagePreviews = [],
  similarImages = [],
  isLoadingSimilar = false,
  followUpPanel,
  onShare,
  onAddInfo,
}: Props) {
  const [openImageIndex, setOpenImageIndex] = useState<number | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [hasOpenedFollowUp, setHasOpenedFollowUp] = useState(false);

  const reportId = useMemo(() => buildReportId(), []);
  const fallbackText = getFallbackText(locale);
  const reportLabels = getReportLabels(locale);
  const similarSourceLabel = getSimilarSourceLabel(locale);

  const galleryImages =
    imagePreviews.length > 0 ? imagePreviews : imagePreview ? [imagePreview] : [];

  const mainImage = galleryImages[0] || null;
  const openedImage =
    openImageIndex !== null ? galleryImages[openImageIndex] : null;

  useEffect(() => {
    if (!openedImage && !isReportOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenImageIndex(null);
        setIsReportOpen(false);
      }

      if (!openedImage || galleryImages.length < 2) return;

      if (event.key === "ArrowLeft") {
        setOpenImageIndex((current) => {
          if (current === null) return current;
          return current === 0 ? galleryImages.length - 1 : current - 1;
        });
      }

      if (event.key === "ArrowRight") {
        setOpenImageIndex((current) => {
          if (current === null) return current;
          return current === galleryImages.length - 1 ? 0 : current + 1;
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openedImage, isReportOpen, galleryImages.length]);

  if (!result) return null;

  function handleAddInfoClick() {
    setHasOpenedFollowUp(true);
    onAddInfo?.();
  }

  function openImage(index: number) {
    setOpenImageIndex(index);
  }

  function closeImage() {
    setOpenImageIndex(null);
  }

  function showPrevImage() {
    setOpenImageIndex((current) => {
      if (current === null || galleryImages.length === 0) return current;
      return current === 0 ? galleryImages.length - 1 : current - 1;
    });
  }

  function showNextImage() {
    setOpenImageIndex((current) => {
      if (current === null || galleryImages.length === 0) return current;
      return current === galleryImages.length - 1 ? 0 : current + 1;
    });
  }

  const canShowAddInfoButton = Boolean(onAddInfo && !followUpPanel && !hasOpenedFollowUp);

  return (
    <article className="relative pb-12 text-white">
      <div className="mx-auto w-full max-w-6xl px-3 pt-4 sm:px-5 md:pt-7">
        <header className="overflow-hidden rounded-[2rem] border border-[#d6a25f]/12 bg-[#130c08]/52 shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
          {mainImage ? (
            <div className="relative min-h-[520px] overflow-hidden bg-[#0b0705] sm:min-h-[610px] md:min-h-[680px]">
              <div className="absolute inset-0">
                <img
                  src={mainImage}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full scale-110 object-cover opacity-30 blur-3xl"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35),rgba(8,4,2,0.72)_62%,rgba(19,12,8,0.98))]" />
              </div>

              <button
                type="button"
                onClick={() => openImage(0)}
                className="relative z-10 flex h-[420px] w-full items-center justify-center p-3 transition hover:bg-white/[0.02] sm:h-[500px] md:h-[560px]"
                aria-label="Open image"
              >
                <img
                  src={mainImage}
                  alt={result.title || labels.result}
                  className="max-h-full max-w-full rounded-[1.15rem] object-contain shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
                />
              </button>

              <button
                type="button"
                onClick={onShare}
                className="absolute end-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/35 text-white/70 backdrop-blur-xl transition hover:bg-black/55 hover:text-white"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>

              {galleryImages.length > 1 && (
                <div className="relative z-20 border-y border-[#d6a25f]/10 bg-[#160d08]/70 px-3 py-3 backdrop-blur-xl">
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                    {galleryImages.map((src, index) => (
                      <button
                        type="button"
                        key={`${src}-${index}`}
                        onClick={() => openImage(index)}
                        className={[
                          "relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-white/[0.04] transition sm:h-28 sm:w-28",
                          index === 0
                            ? "border-[#d6a25f]/55"
                            : "border-white/10 hover:border-[#d6a25f]/45",
                        ].join(" ")}
                        aria-label={`Open image ${index + 1}`}
                      >
                        <img
                          src={src}
                          alt={`${result.title || labels.result} ${index + 1}`}
                          className="h-full w-full object-cover"
                        />

                        <span className="absolute bottom-1.5 end-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] text-white/80 backdrop-blur-md">
                          {index + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative z-10 px-5 py-7 sm:px-8 md:px-10">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-[#d6a25f]/75">
                  {labels.result}
                </p>

                <h1 className="max-w-4xl text-[27px] font-medium leading-[1.22] tracking-[-0.035em] text-white/94 sm:text-[34px] md:text-[46px]">
                  {result.title || labels.result}
                </h1>

                {canShowAddInfoButton && (
                  <button
                    type="button"
                    onClick={handleAddInfoClick}
                    className="mt-5 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#d6a25f]/22 bg-[#d6a25f]/8 px-3.5 text-[11.5px] font-medium text-[#d6a25f]/90 transition hover:bg-[#d6a25f]/13 hover:text-[#f0c987]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {labels.addInfo || getAddInfoText(locale)}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="px-5 py-8 sm:px-8 md:px-10">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-[#d6a25f]/75">
                {labels.result}
              </p>

              <h1 className="max-w-4xl text-[27px] font-medium leading-[1.22] tracking-[-0.035em] text-white/94 sm:text-[34px] md:text-[46px]">
                {result.title || labels.result}
              </h1>

              {canShowAddInfoButton && (
                <button
                  type="button"
                  onClick={handleAddInfoClick}
                  className="mt-5 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#d6a25f]/22 bg-[#d6a25f]/8 px-3.5 text-[11.5px] font-medium text-[#d6a25f]/90 transition hover:bg-[#d6a25f]/13 hover:text-[#f0c987]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {labels.addInfo || getAddInfoText(locale)}
                </button>
              )}
            </div>
          )}
        </header>

        {followUpPanel ? (
          <section className="mt-4 border-y border-[#d6a25f]/10 bg-[#120c08]/28 px-3 py-4 backdrop-blur-xl sm:px-5">
            <div className="compact-followup-panel">{followUpPanel}</div>
          </section>
        ) : null}

        <section className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6 border-y border-white/10 py-6 md:grid-cols-4">
          <MetricBlock
            label={labels.age}
            value={result.timePeriod || result.period}
            fallback={fallbackText}
          />
          <MetricBlock
            label={labels.value}
            value={result.estimatedValue || result.priceRange}
            fallback={fallbackText}
            gold
          />
          <MetricBlock
            label={labels.material}
            value={result.material}
            fallback={fallbackText}
          />
          <MetricBlock
            label={labels.origin}
            value={result.origin}
            fallback={fallbackText}
          />
        </section>

        {result.lookup && <TextSection title={labels.lookup} body={result.lookup} />}

        <TextSection
          title={labels.description}
          body={result.history || result.description}
          large
        />

        <div className="mt-7 grid grid-cols-1 gap-7 md:grid-cols-3">
          <TextSection title={labels.condition} body={result.condition} compact />
          <TextSection title={labels.authenticity} body={result.authenticity} compact />
          <TextSection title={labels.priceReason} body={result.priceReasoning} compact />
        </div>

        <section className="mt-8 grid grid-cols-1 gap-6 border-y border-white/10 py-7 md:grid-cols-2">
          <SoftList title={labels.valueDrivers} items={result.valueDrivers} />
          <SoftList title={labels.valueReducers} items={result.valueReducers} />
        </section>

        {(isLoadingSimilar || similarImages.length > 0) && (
          <section className="mt-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#d6a25f]/70">
                  {similarSourceLabel}
                </p>
                <h2 className="text-[24px] font-medium leading-8 tracking-[-0.035em] text-white/92">
                  {labels.similar}
                </h2>
                <p className="mt-2 max-w-2xl text-[13px] font-normal leading-6 text-white/52">
                  {labels.similarHint}
                </p>
              </div>
            </div>

            {isLoadingSimilar ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-[3/4] animate-pulse rounded-2xl bg-white/[0.06]"
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
                    className="group overflow-hidden border border-white/10 bg-[#120c08]/34 transition hover:border-[#d6a25f]/35"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-black/50">
                      <img
                        src={item.imageUrl}
                        alt={item.title || "Similar result"}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-3">
                      <p className="text-[12px] font-normal leading-5 text-white/70">
                        {item.title || "Similar result"}
                      </p>
                      {item.price ? (
                        <p className="mt-2 text-[10.5px] font-medium text-white/55">
                          {item.price}
                        </p>
                      ) : null}
                      <p className="mt-2 text-[10.5px] font-medium text-[#d6a25f]/75">
                        {item.source || "Google Lens"}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        <CompactNeededPhotos title={labels.neededPhotos} items={result.neededPhotos} />

        {result.followUpQuestion && (
          <section className="mt-8 border-t border-white/10 pt-6">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#d6a25f]/70">
              {labels.followUp}
            </p>

            <p className="max-w-4xl text-[18px] font-normal leading-9 tracking-[-0.02em] text-white/74">
              {result.followUpQuestion}
            </p>
          </section>
        )}

        <section className="mt-8 border-t border-white/10 pt-5">
          <p className="text-[12px] font-normal leading-6 text-white/42">
            {result.disclaimer || labels.notice}
          </p>
        </section>

        <section className="mt-9 border-y border-[#d6a25f]/12 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#d6a25f]/70">
                {reportLabels.eyebrow}
              </p>

              <h2 className="text-[24px] font-medium leading-8 tracking-[-0.035em] text-white/92">
                {reportLabels.title}
              </h2>

              <p className="mt-2 max-w-xl text-[13px] font-normal leading-6 text-white/48">
                {reportLabels.hint}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#d6a25f]/22 bg-[#d6a25f]/8 px-4 text-[12px] font-medium text-[#d6a25f]/90 transition hover:bg-[#d6a25f]/13 hover:text-[#f0c987]"
            >
              <FileText className="h-4 w-4" />
              {reportLabels.open}
            </button>
          </div>
        </section>
      </div>

      {openedImage && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/96 p-3 backdrop-blur-xl"
          onClick={closeImage}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              closeImage();
            }}
            className="absolute end-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/10 text-white/85 backdrop-blur-xl transition hover:bg-white/15 hover:text-white"
            aria-label="Close image"
          >
            <X className="h-4 w-4" />
          </button>

          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevImage();
                }}
                className="absolute start-4 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl border border-white/10 bg-white/10 text-white/85 backdrop-blur-xl transition hover:bg-white/15 hover:text-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNextImage();
                }}
                className="absolute end-4 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl border border-white/10 bg-white/10 text-white/85 backdrop-blur-xl transition hover:bg-white/15 hover:text-white"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          <img
            src={openedImage}
            alt={result.title || labels.result}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[94dvh] max-w-[96vw] rounded-xl object-contain shadow-[0_30px_120px_rgba(0,0,0,0.8)]"
          />

          {galleryImages.length > 1 && openImageIndex !== null && (
            <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/75 backdrop-blur-xl">
              {openImageIndex + 1} / {galleryImages.length}
            </div>
          )}
        </div>
      )}

      {isReportOpen && (
        <div
          className="fixed inset-0 z-[99998] bg-black/94 p-3 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsReportOpen(false)}
        >
          <div
            className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden border border-[#d6a25f]/15 bg-[#0d0805]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-4">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#d6a25f]/70">
                  {reportLabels.eyebrow}
                </p>
                <h3 className="mt-1 truncate text-[16px] font-medium text-white/90">
                  {reportLabels.title}
                </h3>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#d6a25f]/22 bg-[#d6a25f]/8 px-3 text-[11.5px] font-medium text-[#d6a25f]/90 transition hover:bg-[#d6a25f]/13"
                >
                  <Printer className="h-3.5 w-3.5" />
                  {reportLabels.print}
                </button>

                <button
                  type="button"
                  onClick={() => setIsReportOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/10 text-white/75 transition hover:bg-white/15 hover:text-white"
                  aria-label={reportLabels.close}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="report-preview-scroll min-h-0 flex-1 overflow-auto bg-[#050302] p-4">
              <div className="report-preview-shell">
                <div className="report-preview-inner">
                  <AntiqueReportDocument
                    locale={locale}
                    result={result}
                    imageUrl={mainImage || undefined}
                    reportId={reportId}
                    variant="print"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="report-print-area">
        <AntiqueReportDocument
          locale={locale}
          result={result}
          imageUrl={mainImage || undefined}
          reportId={reportId}
          variant="print"
        />
      </div>

      <style jsx global>{`
        .compact-followup-panel h1,
        .compact-followup-panel h2,
        .compact-followup-panel h3 {
          font-size: 18px !important;
          line-height: 1.35 !important;
          font-weight: 500 !important;
          letter-spacing: -0.02em !important;
        }

        .compact-followup-panel p,
        .compact-followup-panel label {
          font-weight: 400 !important;
        }

        .compact-followup-panel button {
          min-height: 36px !important;
          border-radius: 0.75rem !important;
          font-size: 12px !important;
          font-weight: 500 !important;
        }

        .compact-followup-panel textarea,
        .compact-followup-panel input {
          border-radius: 0.85rem !important;
          font-weight: 400 !important;
        }

        .compact-followup-panel textarea {
          min-height: 88px !important;
          max-height: 150px !important;
        }

        .report-preview-shell {
          --report-scale: 0.42;
          width: calc(210mm * var(--report-scale));
          height: calc(297mm * var(--report-scale));
          margin: 0 auto;
          overflow: visible;
        }

        .report-preview-inner {
          width: 210mm;
          height: 297mm;
          transform: scale(var(--report-scale));
          transform-origin: top left;
          overflow: visible;
        }

        .report-preview-inner .antique-report-document {
          width: 210mm !important;
          max-width: none !important;
          margin: 0 !important;
          overflow: visible !important;
        }

        .report-preview-inner .report-page {
          width: 210mm !important;
          height: 297mm !important;
          overflow: hidden !important;
        }

        @media (min-width: 430px) {
          .report-preview-shell {
            --report-scale: 0.48;
          }
        }

        @media (min-width: 640px) {
          .report-preview-shell {
            --report-scale: 0.62;
          }
        }

        @media (min-width: 900px) {
          .report-preview-shell {
            --report-scale: 0.78;
          }
        }

        @media (min-width: 1200px) {
          .report-preview-shell {
            --report-scale: 0.9;
          }
        }

        .report-print-area {
          position: fixed;
          left: -99999px;
          top: 0;
          width: 210mm;
          height: auto;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
        }

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
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: white !important;
            overflow: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
          }

          .report-print-area .antique-report-document {
            width: 210mm !important;
            max-width: none !important;
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

function MetricBlock({
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
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#d6a25f]/58">
        {label}
      </p>

      <p
        className={[
          "text-[14px] font-normal leading-7 tracking-[-0.015em]",
          gold ? "text-[#e3b36d]" : "text-white/76",
        ].join(" ")}
      >
        {value && value.trim() ? value : fallback}
      </p>
    </div>
  );
}

function TextSection({
  title,
  body,
  large = false,
  compact = false,
}: {
  title: string;
  body?: string;
  large?: boolean;
  compact?: boolean;
}) {
  if (!body || !body.trim()) return null;

  return (
    <section className={compact ? "" : "mt-8 border-t border-white/10 pt-6"}>
      <h2
        className={[
          "mb-3 font-medium leading-7 tracking-[-0.03em] text-white/92",
          large ? "text-[24px] md:text-[30px]" : "text-[19px] md:text-[22px]",
        ].join(" ")}
      >
        {title}
      </h2>

      <p
        className={[
          "whitespace-pre-line font-normal tracking-[-0.015em] text-white/70",
          large ? "text-[16px] leading-9 md:text-[17px]" : "text-[14.5px] leading-8",
        ].join(" ")}
      >
        {body}
      </p>
    </section>
  );
}

function SoftList({ title, items }: { title: string; items?: string[] }) {
  const cleanItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (cleanItems.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-[20px] font-medium leading-7 tracking-[-0.03em] text-white/92">
        {title}
      </h2>

      <div className="flex flex-wrap gap-2">
        {cleanItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex min-w-0 items-start gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-[12.5px] font-normal leading-6 text-white/68"
          >
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d6a25f]/80" />
            <span className="whitespace-normal">{item}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

function CompactNeededPhotos({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  const cleanItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (cleanItems.length === 0) return null;

  return (
    <section className="mt-8 border-t border-white/10 pt-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <p className="shrink-0 text-[13px] font-medium text-white/82">
          {title}
        </p>

        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {cleanItems.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-[12px] font-normal leading-5 text-white/62"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d6a25f]/80" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
