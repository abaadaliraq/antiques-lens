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
  userNote?: string;
  followUpPanel?: React.ReactNode;
  onShare: () => void;
  onAddInfo?: () => void;
};

function getFallbackText(locale: Locale) {
  if (locale === "en") return "Not clear";
  if (locale === "fr") return "Non clair";
  if (locale === "ku") return "Ú•ÙˆÙˆÙ† Ù†ÛŒÛŒÛ•";
  if (locale === "hi") return "à¤¸à¥à¤ªà¤·à¥à¤Ÿ à¤¨à¤¹à¥€à¤‚";
  if (locale === "fa") return "Ù†Ø§Ù…Ø´Ø®Øµ";
  if (locale === "tr") return "Net deÄŸil";
  if (locale === "ru") return "ÐÐµ ÑÑÐ½Ð¾";
  return "غير واضح";
}

function getAddInfoText(locale: Locale) {
  if (locale === "en") return "Add info";
  if (locale === "fr") return "Ajouter";
  if (locale === "ku") return "Ø²ÛŒØ§Ø¯Ú©Ø±Ø¯Ù†";
  if (locale === "hi") return "à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤œà¥‹à¤¡à¤¼à¥‡à¤‚";
  if (locale === "fa") return "Ø§ÙØ²ÙˆØ¯Ù† Ø§Ø·Ù„Ø§Ø¹Ø§Øª";
  if (locale === "tr") return "Bilgi ekle";
  if (locale === "ru") return "Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸ÑŽ";
  return "أضف معلومات";
}

function getUserNoteLabel(locale: Locale) {
  if (locale === "en") return "Your note about the item";
  if (locale === "fr") return "Votre note sur l'objet";
  if (locale === "tr") return "Parca hakkindaki notunuz";
  if (locale === "ru") return "Your note about the item";
  if (locale === "fa") return "ÛŒØ§Ø¯Ø¯Ø§Ø´Øª Ø´Ù…Ø§ Ø¯Ø±Ø¨Ø§Ø±Ù‡ Ø´ÛŒØ¡";
  if (locale === "ku") return "ØªÛŽØ¨ÛŒÙ†ÛŒÛŒÛ•Ú©Û•Øª Ø¯Û•Ø±Ø¨Ø§Ø±Û•ÛŒ Ù¾Ø§Ø±Ú†Û•Ú©Û•";
  if (locale === "hi") return "Your note about the item";
  return "ملاحظتك عن القطعة";
}

function looksMojibake(value: string) {
  return /(?:\u00d8|\u00d9|\u00da|\u00db|\u00c3|\u00c2|Ø|Ù|Û|Ã|Â|Ð|Ñ|�)/.test(
    value,
  );
}

function mojibakeScore(value: string) {
  return (
    value.match(
      /(?:\u00d8|\u00d9|\u00da|\u00db|\u00c3|\u00c2|Ø|Ù|Û|Ã|Â|Ð|Ñ|�)/g,
    )?.length || 0
  );
}

const cp1252Reverse: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

function decodeMojibakeOnce(value: string) {
  const bytes = Uint8Array.from(
    Array.from(value, (character) => {
      const code = character.charCodeAt(0);
      return cp1252Reverse[code] ?? (code <= 0xff ? code : 0x3f);
    }),
  );

  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function cleanDisplayText(value?: string | null) {
  if (!value || !value.trim()) return "";

  let best = value.trim();
  let bestScore = mojibakeScore(best);

  try {
    for (let attempt = 0; attempt < 3 && bestScore > 0; attempt += 1) {
      const repaired = decodeMojibakeOnce(best);
      const score = mojibakeScore(repaired);

      if (score > bestScore || repaired === best) break;

      best = repaired.trim();
      bestScore = score;
    }
  } catch {
    return looksMojibake(best) ? "" : best;
  }

  return looksMojibake(best) ? "" : best;
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
      back: "Back",
      share: "Share",
      printable: "Printable Report",
    };
  }

  if (locale === "fr") {
    return {
      eyebrow: "Rapport",
      title: "Évaluation imprimable",
      hint: "Ouvrez le rapport A4 uniquement pour l'export PDF ou l'impression.",
      open: "Ouvrir",
      print: "PDF / Imprimer",
      close: "Fermer",
      back: "Retour",
      share: "Partager",
      printable: "Rapport imprimable",
    };
  }

  if (locale === "ku") {
    return {
      eyebrow: "Ú•Ø§Ù¾Û†Ø±Øª",
      title: "Ù‡Û•ÚµØ³Û•Ù†Ú¯Ø§Ù†Ø¯Ù†ÛŒ Ú†Ø§Ù¾Ú©Ø±Ø§Ùˆ",
      hint: "Ú•Ø§Ù¾Û†Ø±ØªÛŒ A4 ØªÛ•Ù†Ù‡Ø§ Ø¨Û† PDF ÛŒØ§Ù† Ú†Ø§Ù¾ Ø¨Ú©Û•Ø±Û•ÙˆÛ•.",
      open: "Ú©Ø±Ø¯Ù†Û•ÙˆÛ•",
      print: "PDF / Ú†Ø§Ù¾",
      close: "Ø¯Ø§Ø®Ø³ØªÙ†",
      back: "گەڕانەوە",
      share: "هاوبەشکردن",
      printable: "ڕاپۆرتی چاپکراو",
    };
  }

  return {
    eyebrow: "التقرير",
    title: "تقرير تقييم قابل للطباعة",
    hint: "افتح تقرير A4 فقط عند الحاجة للطباعة أو التصدير.",
    open: "فتح التقرير",
    print: "PDF / طباعة",
    close: "إغلاق",
    back: "رجوع",
    share: "مشاركة",
    printable: "تقرير قابل للطباعة",
  };
}

function getSimilarSourceLabel(locale: Locale) {
  if (locale === "en") return "Comparable sources";
  if (locale === "fr") return "Sources comparables";
  if (locale === "hi") return "à¤¤à¥à¤²à¤¨à¥€à¤¯ à¤¸à¥à¤°à¥‹à¤¤";
  if (locale === "fa") return "Ù…Ù†Ø§Ø¨Ø¹ Ù…Ø´Ø§Ø¨Ù‡";
  if (locale === "tr") return "Benzer kaynaklar";
  if (locale === "ru") return "ÐŸÐ¾Ñ…Ð¾Ð¶Ð¸Ðµ Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ¸";
  if (locale === "ku") return "Ø³Û•Ø±Ú†Ø§ÙˆÛ• Ù‡Ø§ÙˆØ´ÛŽÙˆÛ•Ú©Ø§Ù†";
  return "مصادر مشابهة";
}

function getSimilarDisplayTitle(locale: Locale, fallback: string) {
  if (locale === "ar") return "صور مشابهة للاطلاع";
  if (locale === "en") return "Similar images for reference";
  if (locale === "fr") return "Images similaires à consulter";
  if (locale === "tr") return "Referans için benzer görseller";
  if (locale === "ru") return "Похожие изображения для ориентира";
  return fallback;
}

function getNoSimilarImagesMessage(locale: Locale) {
  if (locale === "en") {
    return "Not enough similar images were found for this item right now.";
  }
  if (locale === "fr") {
    return "Pas assez d'images similaires ont été trouvées pour cet objet pour le moment.";
  }
  if (locale === "tr") {
    return "Bu parça için şu anda yeterli benzer görsel bulunamadı.";
  }
  if (locale === "ru") {
    return "Пока не найдено достаточно похожих изображений для этого предмета.";
  }

  return "لم يتم العثور على صور مشابهة كافية لهذه القطعة حالياً.";
}

function normalizeSimilarImageItems(items: unknown): SimilarImageResult[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item): SimilarImageResult | null => {
      if (!item || typeof item !== "object") return null;

      const record = item as Record<string, unknown>;
      const title = typeof record.title === "string" ? record.title : "";
      const imageUrl =
        typeof record.imageUrl === "string"
          ? record.imageUrl
          : Array.isArray(record.images) && typeof record.images[0] === "string"
            ? record.images[0]
            : "";
      const link =
        typeof record.link === "string"
          ? record.link
          : typeof record.url === "string"
            ? record.url
            : imageUrl;

      if (!imageUrl && !link) return null;

      const normalizedItem: SimilarImageResult = {
        title: title || "Similar item",
        imageUrl,
        link,
      };

      if (typeof record.source === "string") normalizedItem.source = record.source;
      if (typeof record.price === "string") normalizedItem.price = record.price;
      if (typeof record.description === "string") {
        normalizedItem.description = record.description;
      }

      return normalizedItem;
    })
    .filter((item): item is SimilarImageResult => Boolean(item));
}

function isHouseStoreSimilarImage(item: SimilarImageResult) {
  const sourceText = `${item.source || ""} ${item.link || ""} ${item.imageUrl || ""}`
    .toLowerCase();

  return (
    item.isHouseOfAntiques === true ||
    sourceText.includes("house_store") ||
    sourceText.includes("house of antiques") ||
    sourceText.includes("houseofantiques.store")
  );
}

function filterVisibleSimilarImages(items: SimilarImageResult[]) {
  const seen = new Set<string>();

  return items
    .filter((item) => !isHouseStoreSimilarImage(item))
    .filter((item) => {
      const key = item.imageUrl || item.link || item.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 24);
}

function getSimilarItems(result: AnalysisResult | null): SimilarImageResult[] {
  const extendedResult = result as
    | (AnalysisResult & {
        houseOfAntiquesMatches?: SimilarImageResult[];
      })
    | null;

  return normalizeSimilarImageItems(
    result?.similarItems ||
    result?.similarPhotos ||
    result?.similarImages ||
    result?.imageMatches ||
    result?.visualMatches ||
    result?.storeMatches ||
    result?.matches ||
    result?.similar ||
    result?.similarPieces ||
    extendedResult?.houseOfAntiquesMatches ||
    result?.houseOfAntiques?.matches ||
    [],
  );
}

function getItemTypeLabel(locale: Locale) {
  if (locale === "en") return "Object type";
  if (locale === "fr") return "Type dâ€™objet";
  if (locale === "hi") return "à¤µà¤¸à¥à¤¤à¥ à¤•à¤¾ à¤ªà¥à¤°à¤•à¤¾à¤°";
  if (locale === "fa") return "Ù†ÙˆØ¹ Ø´ÛŒØ¡";
  if (locale === "tr") return "Nesne tÃ¼rÃ¼";
  if (locale === "ru") return "Ð¢Ð¸Ð¿ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚Ð°";
  if (locale === "ku") return "Ø¬Û†Ø±ÛŒ Ù¾Ø§Ø±Ú†Û•";
  return "نوع القطعة";
}

function getSilverScenarioLabels(locale: Locale) {
  if (locale === "en") {
    return {
      title: "Silver value scenarios by weight",
      note:
        "No exact weight was entered, so these are scenario estimates. Final valuation requires weighing the item and checking purity marks.",
      weight: "Assumed weight",
      melt: "Raw silver value",
      antique: "With antique value",
    };
  }

  return {
    title: "Ø§Ø­ØªÙ…Ø§Ù„Ø§Øª Ù‚ÙŠÙ…Ø© Ø§Ù„ÙØ¶Ø© Ø­Ø³Ø¨ Ø§Ù„ÙˆØ²Ù†",
    note:
      "Ù„Ù… ÙŠØªÙ… Ø¥Ø¯Ø®Ø§Ù„ ÙˆØ²Ù† Ø¯Ù‚ÙŠÙ‚ØŒ Ù„Ø°Ù„Ùƒ Ù‡Ø°Ù‡ ØªÙ‚Ø¯ÙŠØ±Ø§Øª Ø§Ø­ØªÙ…Ø§Ù„ÙŠØ©. Ø§Ù„ÙˆØ²Ù† ÙˆØ§Ù„Ø¹ÙŠØ§Ø± Ø¶Ø±ÙˆØ±ÙŠØ§Ù† Ù„ØªÙ‚ÙŠÙŠÙ… Ù†Ù‡Ø§Ø¦ÙŠ.",
    weight: "Ø§Ù„ÙˆØ²Ù† Ø§Ù„Ù…ÙØªØ±Ø¶",
    melt: "Ù‚ÙŠÙ…Ø© Ø§Ù„ÙØ¶Ø© Ø§Ù„Ø®Ø§Ù…",
    antique: "Ù…Ø¹ Ù‚ÙŠÙ…Ø© Ø§Ù„Ø£Ù†ØªÙŠÙƒ",
  };
}

const luxuryCategoryKeywords = [
  "watch",
  "watches",
  "handbag",
  "bag",
  "jewelry",
  "jewellery",
  "ring",
  "bracelet",
  "necklace",
  "earring",
  "accessory",
  "accessories",
  "fashion",
  "shoe",
  "shoes",
  "clothing",
  "luxury",
  "brand",
  "serial",
  "invoice",
  "authenticity card",
  "audemars",
  "rolex",
  "cartier",
  "chanel",
  "hermes",
  "louis vuitton",
  "gucci",
  "prada",
  "dior",
  "tiffany",
  "bvlgari",
];

const nonLuxuryObjectKeywords = [
  "art",
  "artwork",
  "wooden artwork",
  "painting",
  "sculpture",
  "carving",
  "craft",
  "furniture",
  "wood",
  "wooden",
  "antique wood",
  "chair",
  "table",
  "cabinet",
  "box",
  "panel",
  "relief",
  "statue",
  "ceramic",
  "pottery",
  "rug",
  "carpet",
  "textile",
  "manuscript",
];

function shouldShowBrandAssessment(result: AnalysisResult) {
  if (!result.brandAssessment) return false;

  const text = [
    result.itemType,
    result.title,
    result.lookup,
    result.material,
    result.history,
    result.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const hasLuxuryCategory = luxuryCategoryKeywords.some((word) =>
    text.includes(word),
  );
  const hasNonLuxuryCategory = nonLuxuryObjectKeywords.some((word) =>
    text.includes(word),
  );

  return hasLuxuryCategory && !hasNonLuxuryCategory;
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
  userNote = "",
  followUpPanel,
  onShare,
  onAddInfo,
}: Props) {
  const [openImageIndex, setOpenImageIndex] = useState<number | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [hasOpenedFollowUp, setHasOpenedFollowUp] = useState(false);
  const [failedImageSources, setFailedImageSources] = useState<Set<string>>(
    () => new Set(),
  );
useEffect(() => {
  if (isReportOpen) {
    document.body.classList.add("kishib-report-open");
  } else {
    document.body.classList.remove("kishib-report-open");
  }

  return () => {
    document.body.classList.remove("kishib-report-open");
  };
}, [isReportOpen]);
  const reportId = useMemo(() => buildReportId(), []);
  const fallbackText = getFallbackText(locale);
  const reportLabels = getReportLabels(locale);
  const similarSourceLabel = getSimilarSourceLabel(locale);
  const itemTypeLabel = getItemTypeLabel(locale);
  const silverScenarioLabels = getSilverScenarioLabels(locale);

  const resultWithArchiveImages = result as AnalysisResult & {
    imagePreview?: string;
    imagePreviews?: string[];
    originalImage?: string;
    originalImages?: string[];
    uploadedImageUrl?: string;
    sourceImageUrl?: string;
    imageUrl?: string;
  };
  const resultImagePreviews = Array.isArray(resultWithArchiveImages.imagePreviews)
    ? resultWithArchiveImages.imagePreviews.filter(
        (preview) => typeof preview === "string",
      )
    : [];
  const resultImagePreview =
    typeof resultWithArchiveImages.imagePreview === "string"
      ? resultWithArchiveImages.imagePreview
      : null;
  const resultOriginalImages = Array.isArray(resultWithArchiveImages.originalImages)
    ? resultWithArchiveImages.originalImages.filter(
        (preview) => typeof preview === "string",
      )
    : [];
  const resultStableImage =
    typeof resultWithArchiveImages.originalImage === "string"
      ? resultWithArchiveImages.originalImage
      : typeof resultWithArchiveImages.uploadedImageUrl === "string"
        ? resultWithArchiveImages.uploadedImageUrl
        : typeof resultWithArchiveImages.sourceImageUrl === "string"
          ? resultWithArchiveImages.sourceImageUrl
          : typeof resultWithArchiveImages.imageUrl === "string"
            ? resultWithArchiveImages.imageUrl
            : null;

  const rawGalleryImages = imagePreviews.length
    ? imagePreviews
    : imagePreview
      ? [imagePreview]
      : resultOriginalImages.length
        ? resultOriginalImages
        : resultStableImage
          ? [resultStableImage]
          : resultImagePreviews.length
            ? resultImagePreviews
            : resultImagePreview
              ? [resultImagePreview]
              : [];
  const galleryImages = rawGalleryImages.filter(
    (src) => !failedImageSources.has(src),
  );

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

  const resolvedSimilarImages = filterVisibleSimilarImages(
    similarImages.length > 0 ? similarImages : getSimilarItems(result),
  );
  const cleanUserNote = cleanDisplayText(userNote);
  const cleanTitle = cleanDisplayText(result.title) || labels.result;
  const canShowBrandAssessment =
    shouldShowBrandAssessment(result) &&
    Boolean(
      cleanDisplayText(result.brandAssessment?.possibleBrand) ||
        cleanDisplayText(result.brandAssessment?.authenticityStatus) ||
        cleanDisplayText(result.brandAssessment?.priceScenario),
    );
  const metalScenarios = result.metalValue?.scenarios || [];
  const shouldShowMetalValue = Boolean(result.metalValue);
  const markAnalysis = result.markAnalysis?.hasMark ? result.markAnalysis : null;
  const markReferenceMatches =
    markAnalysis?.referenceMatches?.filter(
      (match) =>
        cleanDisplayText(match.markText) ||
        cleanDisplayText(match.possibleMeaning) ||
        cleanDisplayText(match.confidenceNotes),
    ) || [];
  const shouldShowMarkAnalysis = Boolean(
    markAnalysis &&
      (cleanDisplayText(markAnalysis.visibleText) ||
        cleanDisplayText(markAnalysis.symbolDescription) ||
        cleanDisplayText(markAnalysis.locationOnObject) ||
        cleanDisplayText(markAnalysis.possibleMeaning) ||
        markReferenceMatches.length > 0),
  );

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

  function handleImageError(src: string) {
    setFailedImageSources((current) => {
      const next = new Set(current);
      next.add(src);
      return next;
    });
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
    <article className="kishib-result-view relative pb-12 text-[#241913]">
      <div className="mx-auto w-full max-w-6xl px-3 pt-2 sm:px-5 md:pt-5">
        <header className="kishib-primary-result-card">
          {mainImage ? (
            <div className="relative min-h-[380px] overflow-hidden sm:min-h-[470px] md:min-h-[520px]">
              <div className="absolute inset-0 hidden">
                <img
                  src={mainImage}
                  alt=""
                  aria-hidden="true"
                  onError={() => handleImageError(mainImage)}
                  className="h-full w-full scale-110 object-cover opacity-10 blur-3xl"
                />
              </div>

              <button
                type="button"
                onClick={() => openImage(0)}
                className="relative z-10 flex h-[275px] w-full items-center justify-center p-4 pb-2 transition hover:bg-[#fff4e2]/8 sm:h-[350px] md:h-[390px]"
                aria-label="Open image"
              >
                <img
                  src={mainImage}
                  alt={result.title || labels.result}
                  onError={() => handleImageError(mainImage)}
                  className="h-full w-full rounded-[16px] border border-[#d6b576]/35 object-contain shadow-lg"
                />
              </button>

              <button
                type="button"
                onClick={onShare}
                className="absolute end-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-[12px] border border-[#d6b576]/45 bg-[#fff4e2]/12 text-[#fff4e2] backdrop-blur transition hover:bg-[#fff4e2]/20"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>

              {galleryImages.length > 1 && (
                <div className="relative z-20 border-y border-[#d6b576]/25 bg-[#230c08]/18 px-3 py-2 backdrop-blur">
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                    {galleryImages.map((src, index) => (
                      <button
                        type="button"
                        key={`${src}-${index}`}
                        onClick={() => openImage(index)}
                        className={[
                          "relative h-20 w-20 shrink-0 overflow-hidden rounded-[12px] border bg-[#fff4e2]/10 transition sm:h-24 sm:w-24",
                          index === 0
                            ? "border-[#d6b576]/70"
                            : "border-[#d6b576]/30 hover:border-[#d6b576]/60",
                        ].join(" ")}
                        aria-label={`Open image ${index + 1}`}
                      >
                        <img
                          src={src}
                          alt={`${result.title || labels.result} ${index + 1}`}
                          onError={() => handleImageError(src)}
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

              <div className="relative z-10 px-5 pb-5 pt-3 sm:px-7 md:px-8">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[#d6b576]">
                  {labels.result}
                </p>

                <h1 className="max-w-4xl text-[25px] font-medium leading-[1.22] tracking-[-0.035em] text-[#fff4e2] sm:text-[32px] md:text-[42px]">
                  {cleanTitle}
                </h1>

                {canShowAddInfoButton && (
                  <button
                    type="button"
                    onClick={handleAddInfoClick}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-[12px] border border-[#d6b576]/55 bg-[#fff4e2]/12 px-4 py-2 text-sm font-semibold text-[#fff4e2] backdrop-blur transition hover:bg-[#fff4e2]/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {labels.addInfo || getAddInfoText(locale)}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="px-5 py-6 sm:px-8 md:px-10">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[#d6b576]">
                {labels.result}
              </p>

              <h1 className="max-w-4xl text-[25px] font-medium leading-[1.22] tracking-[-0.035em] text-[#fff4e2] sm:text-[32px] md:text-[42px]">
                  {cleanTitle}
              </h1>

              {canShowAddInfoButton && (
                <button
                  type="button"
                  onClick={handleAddInfoClick}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-[12px] border border-[#d6b576]/55 bg-[#fff4e2]/12 px-4 py-2 text-sm font-semibold text-[#fff4e2] backdrop-blur transition hover:bg-[#fff4e2]/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {labels.addInfo || getAddInfoText(locale)}
                </button>
              )}
            </div>
          )}
        </header>

        {cleanUserNote ? (
          <section className="mt-3 rounded-[18px] border border-[#d2b98f] bg-[#fff4e2]/82 p-4">
            <p className="mb-2 text-xs font-semibold text-[#986f2e]">
              {getUserNoteLabel(locale)}
            </p>
            <p className="whitespace-pre-line text-sm leading-7 text-[#735f4b]">
              {cleanUserNote}
            </p>
          </section>
        ) : null}

        {followUpPanel ? (
          <section className="-mx-3 mt-3 border-y border-[#d2b98f]/45 bg-[#fff4e2]/28 py-2 backdrop-blur-md sm:-mx-5">
            <div className="compact-followup-panel">{followUpPanel}</div>
          </section>
        ) : null}

        <section className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-y border-[#c7b99e] py-5 md:grid-cols-5">
          <MetricBlock
            label={itemTypeLabel}
            value={result.itemType}
            fallback={fallbackText}
          />
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

        {shouldShowMetalValue ? (
          <section className="mt-5 rounded-[20px] border border-[#c7b99e] bg-[#fff4e2]/90 p-4">
            <p className="text-xs font-semibold text-[#986f2e]">
              {silverScenarioLabels.title}
            </p>

            <p className="mt-2 text-xs leading-5 text-[#735f4b]">
              {silverScenarioLabels.note}
            </p>

            {metalScenarios.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {metalScenarios.map((scenario) => (
                  <div
                    key={scenario.label}
                    className="rounded-[16px] border border-[#d2b98f] bg-[#efe3cf]/75 p-3"
                  >
                    <p className="text-sm font-bold text-[#233f32]">
                      {locale === "en" ? scenario.label : scenario.labelAr}
                    </p>

                    <p className="mt-2 text-xs text-[#735f4b]">
                      {silverScenarioLabels.weight}: {scenario.weightGrams}g
                    </p>

                    <p className="mt-2 text-xs text-[#735f4b]">
                      {silverScenarioLabels.melt}
                    </p>

                    <p className="text-sm font-bold text-[#8a642f]">
                      ${scenario.meltValueUsdMid}
                    </p>

                    <p className="mt-2 text-xs text-[#735f4b]">
                      {silverScenarioLabels.antique}
                    </p>

                    <p className="text-sm font-bold text-[#233f32]">
                      ${scenario.antiqueEstimateUsdLow} - $
                      {scenario.antiqueEstimateUsdHigh}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[16px] border border-[#d2b98f] bg-[#efe3cf]/75 p-3 text-sm leading-6 text-[#735f4b]">
                <p className="font-bold text-[#233f32]">
                  {locale === "en" ? "Metal price indicator" : "مؤشر سعر المعدن"}
                </p>
                <p className="mt-2">
                  {locale === "en" ? "Possible metal" : "المعدن المحتمل"}:{" "}
                  {result.metalValue?.metal}
                </p>
                {result.metalValue?.spotPricePerGramUsd ? (
                  <p>
                    {locale === "en" ? "Market price" : "سعر السوق"}: $
                    {result.metalValue.spotPricePerGramUsd} / g
                  </p>
                ) : null}
                {result.metalValue?.weightGrams ? (
                  <p>
                    {locale === "en" ? "Weight used" : "الوزن المستخدم"}:{" "}
                    {result.metalValue.weightGrams}g
                  </p>
                ) : null}
                {result.metalValue?.meltValueUsdLow &&
                result.metalValue?.meltValueUsdHigh ? (
                  <p className="font-bold text-[#8a642f]">
                    {locale === "en" ? "Raw metal estimate" : "تقدير المعدن الخام"}: $
                    {result.metalValue.meltValueUsdLow} - $
                    {result.metalValue.meltValueUsdHigh}
                  </p>
                ) : null}
                {result.metalValue?.note ? (
                  <p className="mt-2 text-xs">{result.metalValue.note}</p>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        {shouldShowMarkAnalysis && markAnalysis ? (
          <section className="mt-5 rounded-[20px] border border-[#c7b99e] bg-[#fff4e2]/90 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#986f2e]">
                {locale === "en" ? "Mark or signature" : "الختم أو التوقيع"}
              </p>
              <span className="rounded-full border border-[#d2b98f] bg-[#efe3cf]/80 px-2.5 py-1 text-[11px] font-bold text-[#735f4b]">
                {markAnalysis.clarity}
              </span>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {cleanDisplayText(markAnalysis.visibleText) ? (
                <div className="rounded-[16px] border border-[#d2b98f] bg-[#efe3cf]/70 p-3">
                  <p className="text-[11px] font-bold text-[#986f2e]">
                    {locale === "en" ? "Visible text" : "النص الظاهر"}
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6 text-[#233f32]">
                    {cleanDisplayText(markAnalysis.visibleText)}
                  </p>
                </div>
              ) : null}

              {cleanDisplayText(markAnalysis.symbolDescription) ? (
                <div className="rounded-[16px] border border-[#d2b98f] bg-[#efe3cf]/70 p-3">
                  <p className="text-[11px] font-bold text-[#986f2e]">
                    {locale === "en" ? "Visual description" : "الوصف البصري"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#735f4b]">
                    {cleanDisplayText(markAnalysis.symbolDescription)}
                  </p>
                </div>
              ) : null}

              {cleanDisplayText(markAnalysis.locationOnObject) ? (
                <div className="rounded-[16px] border border-[#d2b98f] bg-[#efe3cf]/70 p-3">
                  <p className="text-[11px] font-bold text-[#986f2e]">
                    {locale === "en" ? "Location" : "مكان العلامة"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#735f4b]">
                    {cleanDisplayText(markAnalysis.locationOnObject)}
                  </p>
                </div>
              ) : null}

              {cleanDisplayText(markAnalysis.possibleMeaning) ? (
                <div className="rounded-[16px] border border-[#d2b98f] bg-[#efe3cf]/70 p-3">
                  <p className="text-[11px] font-bold text-[#986f2e]">
                    {locale === "en" ? "Possible meaning" : "المعنى المحتمل"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#735f4b]">
                    {cleanDisplayText(markAnalysis.possibleMeaning)}
                  </p>
                </div>
              ) : null}
            </div>

            {markReferenceMatches.length > 0 ? (
              <div className="mt-3 rounded-[16px] border border-[#d2b98f] bg-[#efe3cf]/70 p-3">
                <p className="text-[11px] font-bold text-[#986f2e]">
                  {locale === "en" ? "Reference hint" : "إشارة مرجعية"}
                </p>
                {markReferenceMatches.map((match) => (
                  <p
                    key={match.id}
                    className="mt-2 text-xs leading-5 text-[#735f4b]"
                  >
                    <span className="font-bold text-[#233f32]">
                      {cleanDisplayText(match.markText)}
                    </span>
                    {cleanDisplayText(match.possibleMeaning)
                      ? ` — ${cleanDisplayText(match.possibleMeaning)}`
                      : ""}
                  </p>
                ))}
              </div>
            ) : null}

            <p className="mt-3 text-xs leading-5 text-[#735f4b]">
              {locale === "en"
                ? "This is a visual clue only, not proof of authenticity, maker, material, or purity. A close-up and direct inspection are still needed."
                : "هذه إشارة بصرية فقط، وليست إثباتًا للأصالة أو الصانع أو المادة أو العيار. تبقى صورة مقرّبة والفحص المباشر ضروريين."}
            </p>
          </section>
        ) : null}

        {cleanDisplayText(result.lookup) ? (
          <TextSection title={labels.lookup} body={result.lookup} />
        ) : null}

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

        <section className="mt-8 grid grid-cols-1 gap-6 border-y border-[#c7b99e] py-7 md:grid-cols-2">
          <SoftList title={labels.valueDrivers} items={result.valueDrivers} />
          <SoftList title={labels.valueReducers} items={result.valueReducers} />
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#986f2e]">
                {similarSourceLabel}
              </p>
              <h2 className="text-[24px] font-medium leading-8 tracking-[-0.035em] text-[#233f32]">
                {getSimilarDisplayTitle(locale, labels.similar)}
              </h2>
              <p className="mt-2 max-w-2xl text-[13px] font-normal leading-6 text-[#735f4b]">
                {labels.similarHint}
              </p>
            </div>
          </div>

          {isLoadingSimilar ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[3/4] animate-pulse rounded-[16px] bg-[#fff4e2]/70"
                />
              ))}
            </div>
          ) : resolvedSimilarImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {resolvedSimilarImages.map((item, index) => (
                <a
                  key={`${item.imageUrl}-${index}`}
                  href={item.link || item.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-[16px] border border-[#d2b98f] bg-[#fff4e2]/88 transition hover:border-[#b88a3d]/55"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-[#d9b59e]">
                    <img
                      src={item.imageUrl}
                      alt={item.title || "Similar result"}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-3">
                    {cleanDisplayText(item.title) ? (
                      <p className="text-[12px] font-normal leading-5 text-[#241913]">
                        {cleanDisplayText(item.title)}
                      </p>
                    ) : null}
                    {cleanDisplayText(item.price) ? (
                      <p className="mt-2 text-[10.5px] font-medium text-[#735f4b]">
                        {cleanDisplayText(item.price)}
                      </p>
                    ) : null}
                    {cleanDisplayText(item.source) || item.source === undefined ? (
                      <p className="mt-2 text-[10.5px] font-medium text-[#986f2e]">
                        {cleanDisplayText(item.source) || "Google Lens"}
                      </p>
                    ) : null}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-[16px] border border-[#d2b98f]/70 bg-[#fff4e2]/72 px-4 py-4 text-sm leading-6 text-[#735f4b]">
              {getNoSimilarImagesMessage(locale)}
            </div>
          )}
        </section>

        {canShowBrandAssessment ? (
          <section className="mt-8 border-t border-[#c7b99e] pt-6">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#986f2e]">
              {locale === "ar" ? "تقييم البراند" : "Brand assessment"}
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/70 p-4">
                <p className="text-[13px] font-medium text-[#233f32]">
                  {cleanDisplayText(result.brandAssessment?.possibleBrand)}
                </p>
                <p className="mt-2 text-[12px] leading-6 text-[#735f4b]">
                  {cleanDisplayText(result.brandAssessment?.category)} ·{" "}
                  {result.brandAssessment?.confidence}
                </p>
                <p className="mt-3 text-[12px] leading-6 text-[#735f4b]">
                  {cleanDisplayText(result.brandAssessment?.authenticityStatus)}
                </p>
              </div>

              <div className="rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/70 p-4">
                <p className="text-[12px] font-medium text-[#233f32]">
                  {locale === "ar" ? "سيناريو السعر المشروط" : "Conditional price scenario"}
                </p>
                <p className="mt-2 text-[12px] leading-6 text-[#735f4b]">
                  {cleanDisplayText(result.brandAssessment?.priceScenario)}
                </p>
              </div>
            </div>

          </section>
        ) : null}

        <section className="mt-9 border-y border-[#c7b99e] py-6">
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#986f2e]">
                {reportLabels.eyebrow}
              </p>

              <h2 className="text-[24px] font-medium leading-8 tracking-[-0.035em] text-[#233f32]">
                {reportLabels.title}
              </h2>

              <p className="mt-2 max-w-xl text-[13px] font-normal leading-6 text-[#735f4b]">
                {reportLabels.hint}
              </p>
            </div>

            <div className="grid gap-2 sm:max-w-xs">
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/86 px-4 text-[12px] font-semibold text-[#233f32] transition hover:bg-[#fff4e2] hover:text-[#6d241d]"
              >
                <FileText className="h-4 w-4" />
                {reportLabels.printable}
              </button>
            </div>
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
            onError={() => {
              handleImageError(openedImage);
              setOpenImageIndex(null);
            }}
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
          className="fixed inset-0 z-[99998] overflow-x-hidden bg-[#efe3cf] text-[#241913]"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-dvh w-full flex-col overflow-hidden">
            <div className="no-print flex shrink-0 items-center justify-between gap-2 border-b border-[#d2b98f] bg-[#fff4e2]/92 px-3 py-3 shadow-[0_12px_36px_rgba(62,39,22,0.10)] backdrop-blur-xl sm:px-4">
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[12px] border border-[#d2b98f] bg-[#efe3cf]/70 px-3 text-[12px] font-semibold text-[#735f4b]"
              >
                <ChevronLeft className="h-4 w-4" />
                {reportLabels.back}
              </button>

              <h3 className="min-w-0 flex-1 truncate text-center text-[16px] font-bold text-[#233f32]">
                {locale === "ar" ? "تقرير KISHIB" : "KISHIB Report"}
              </h3>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={onShare}
                  className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/80 text-[#735f4b]"
                  aria-label={reportLabels.share}
                >
                  <Share2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/80 text-[#735f4b]"
                  aria-label={reportLabels.print}
                >
                  <Printer className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="report-preview-scroll min-h-0 flex-1 overflow-auto bg-[#efe3cf] p-4">
              <div className="report-preview-shell mx-auto flex w-max max-w-full justify-center">
                <AntiqueReportDocument
                  locale={locale}
                  result={result}
                  imageUrl={mainImage || undefined}
                  imageUrls={galleryImages}
                  reportId={reportId}
                  variant="preview"
                />
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
          imageUrls={galleryImages}
          reportId={reportId}
          variant="print"
        />
      </div>

      <style jsx global>{`
      body.kishib-report-open .kishib-app-chrome {
  display: none !important;
}
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
          font-size: 12px !important;
          font-weight: 500 !important;
        }

        .compact-followup-panel textarea,
        .compact-followup-panel input {
          border-radius: 0.85rem !important;
          font-weight: 400 !important;
        }

        .compact-followup-panel textarea {
          max-height: 150px !important;
        }

        .report-preview-scroll {
          display: flex;
          justify-content: center;
          overscroll-behavior: contain;
        }

        .report-preview-shell .antique-report-document {
          width: 794px !important;
          max-width: none !important;
          overflow: visible !important;
        }

        .report-preview-shell .report-page {
          width: 100% !important;
          height: auto !important;
          min-height: auto !important;
          overflow: visible !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        @media (max-width: 720px) {
          .report-preview-shell .report-page {
            width: min(100vw - 32px, 794px) !important;
            padding: 14px !important;
          }

          .report-preview-shell .report-page header,
          .report-preview-shell .report-page section,
          .report-preview-shell .report-page footer {
            position: relative !important;
          }

          .report-preview-shell .report-page .report-main-grid,
          .report-preview-shell .report-page .report-two-grid {
            grid-template-columns: 1fr !important;
          }
        }

        .report-print-area {
          position: fixed;
          left: -99999px;
          top: 0;
          width: 794px;
          height: auto;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
        }

        @media print {
          html,
          body {
            width: 794px !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }

          body * {
            visibility: hidden !important;
          }

          .no-print,
          .kishib-app-chrome {
            display: none !important;
          }

          .kishib-result-view {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .kishib-result-view > :not(.report-print-area) {
            display: none !important;
          }

          .report-print-area,
          .report-print-area * {
            visibility: visible !important;
          }

          .report-print-area {
            display: block !important;
            position: static !important;
            inset: auto !important;
            box-sizing: border-box !important;
            width: 794px !important;
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
            width: 794px !important;
            max-width: none !important;
            margin: 0 auto !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          .report-print-area .report-page {
            width: 794px !important;
            height: auto !important;
            min-height: 0 !important;
            page-break-after: auto !important;
            break-after: auto !important;
            page-break-before: auto !important;
            break-before: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          .report-print-area .report-page > .relative {
            height: auto !important;
            min-height: 0 !important;
            padding-bottom: 8mm !important;
          }

          .report-print-area .report-page footer,
          .report-print-area .report-page > .relative > div:last-child {
            position: static !important;
            margin-top: 5mm !important;
          }

          .report-print-area .report-page header,
          .report-print-area .report-page section,
          .report-print-area .report-page footer,
          .report-print-area .report-page img {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .report-print-area .report-page + .report-page {
            page-break-before: always !important;
            break-before: page !important;
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
  const cleanValue = cleanDisplayText(value);
  const cleanLabel = cleanDisplayText(label) || label;

  return (
    <div className="min-w-0">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#986f2e]">
        {cleanLabel}
      </p>

      <p
        className={[
          "text-[14px] font-normal leading-7 tracking-[-0.015em]",
          gold ? "text-[#986f2e]" : "text-[#735f4b]",
        ].join(" ")}
      >
        {cleanValue || fallback}
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
  const cleanBody = cleanDisplayText(body);

  if (!cleanBody) return null;

  return (
    <section className={compact ? "" : "mt-8 border-t border-[#c7b99e] pt-6"}>
      <h2
        className={[
          "mb-3 font-medium leading-7 tracking-[-0.03em] text-[#233f32]",
          large ? "text-[24px] md:text-[30px]" : "text-[19px] md:text-[22px]",
        ].join(" ")}
      >
        {title}
      </h2>

      <p
        className={[
          "whitespace-pre-line font-normal tracking-[-0.015em] text-[#735f4b]",
          large ? "text-[16px] leading-9 md:text-[17px]" : "text-[14.5px] leading-8",
        ].join(" ")}
      >
        {cleanBody}
      </p>
    </section>
  );
}

function SoftList({ title, items }: { title: string; items?: string[] }) {
  const cleanItems = Array.isArray(items)
    ? items.map((item) => cleanDisplayText(item)).filter(Boolean)
    : [];

  if (cleanItems.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-[20px] font-medium leading-7 tracking-[-0.03em] text-[#233f32]">
        {title}
      </h2>

      <div className="flex flex-wrap gap-2">
        {cleanItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex min-w-0 items-start gap-2 rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/70 px-3 py-2 text-[12.5px] font-normal leading-6 text-[#735f4b]"
          >
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#b88a3d]" />
            <span className="whitespace-normal">{item}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

