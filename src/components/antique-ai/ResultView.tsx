"use client";

import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { AnalysisResult, Locale, SimilarImageResult } from "./types";
import AntiqueReportDocument from "./AntiqueReportDocument";
import ValuationRangeCard from "./ValuationRangeCard";
type ResultLabels = {
  result: string;
  lookup: string;
  age: string;
  value: string;
  material: string;
  origin: string;
  historicalReading: string;
  description: string;
  condition: string;
  authenticity: string;
  safeInitialChecks: string;
  safeInitialChecksNote: string;
  carePreservation: string;
  carePreservationNote: string;
  priceReason: string;
  valueDrivers: string;
  valueReducers: string;
  similar: string;
  similarHint: string;
  soon: string;
  neededPhotos: string;
  followUp: string;
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
  onBack?: () => void;
  onSavePdf?: () => void;
  onPrintReport?: () => void;
  isSavingPdf?: boolean;
  isPreparingPrint?: boolean;
};

type ResultSectionLink = {
  id: string;
  label: string;
};

function getResultExperienceLabels(locale: Locale) {
  if (locale === "ar") {
    return {
      back: "رجوع",
      swipe: "اسحب للأعلى لعرض تفاصيل التقييم",
      collapse: "اسحب للأسفل للعودة إلى الملخص",
      value: "القيمة التقديرية",
    };
  }

  return {
    back: "Back",
    swipe: "Swipe up to view evaluation details",
    collapse: "Swipe down to return to the summary",
    value: "Estimated value",
  };
}

function getFallbackText(locale: Locale) {
  if (locale === "en") return "Not clear";
  if (locale === "fr") return "Non clair";
  if (locale === "ku") return "ڕوون نییە";
  if (locale === "hi") return "स्पष्ट नहीं";
  if (locale === "fa") return "نامشخص";
  if (locale === "tr") return "Net değil";
  if (locale === "ru") return "Не ясно";
  if (locale === "es") return "No está claro";
  return "غير واضح";
}

function getUserNoteLabel(locale: Locale) {
  if (locale === "en") return "Your note about the item";
  if (locale === "fr") return "Votre note sur l'objet";
  if (locale === "tr") return "Parça hakkındaki notunuz";
  if (locale === "ru") return "Ваша заметка о предмете";
  if (locale === "fa") return "یادداشت شما درباره شیء";
  if (locale === "ku") return "تێبینییەکەت دەربارەی پارچەکە";
  if (locale === "hi") return "वस्तु के बारे में आपका नोट";
  if (locale === "es") return "Tu nota sobre la pieza";
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
      printable: "Rapport imprimable",
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
      back: "گەڕانەوە",
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
    printable: "تقرير قابل للطباعة",
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
  if (locale === "es") return "Fuentes comparables";
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
  if (locale === "fr") return "Type d'objet";
  if (locale === "hi") return "Object type";
  if (locale === "fa") return "Object type";
  if (locale === "tr") return "Nesne türü";
  if (locale === "ru") return "Object type";
  if (locale === "ku") return "Object type";
  return "نوع القطعة";
}

function getSilverScenarioLabels(locale: Locale) {
  const labels: Record<Locale, {
    title: string;
    note: string;
    weight: string;
    melt: string;
    antique: string;
    indicator: string;
    possibleMetal: string;
    marketPrice: string;
    weightUsed: string;
    rawEstimate: string;
  }> = {
    ar: {
      title: "احتمالات قيمة الفضة حسب الوزن",
      note:
        "هذه سيناريوهات مشروطة حسب سعر السوق اليوم. التقييم النهائي يحتاج وزنًا دقيقًا وعيارًا أو ختمًا واضحًا.",
      weight: "الوزن المفترض",
      melt: "قيمة الفضة الخام",
      antique: "مع قيمة الأنتيك",
      indicator: "مؤشر سعر المعدن",
      possibleMetal: "المعدن المحتمل",
      marketPrice: "سعر السوق",
      weightUsed: "الوزن المستخدم",
      rawEstimate: "تقدير المعدن الخام",
    },
    en: {
      title: "Silver value scenarios by weight",
      note:
        "These are conditional scenarios from today's market rate. Final valuation requires exact weight and a clear purity mark or hallmark.",
      weight: "Assumed weight",
      melt: "Raw silver value",
      antique: "With antique value",
      indicator: "Metal price indicator",
      possibleMetal: "Possible metal",
      marketPrice: "Market price",
      weightUsed: "Weight used",
      rawEstimate: "Raw metal estimate",
    },
    ku: {
      title: "سیناریۆکانی نرخی زیو بەپێی کێش",
      note:
        "ئەمە سیناریۆی مەرجدارە بەپێی نرخی بازاڕی ئەمڕۆ. خەمڵاندنی کۆتایی پێویستی بە کێشی ورد و نیشانەی پاکی یان مۆری ڕوون هەیە.",
      weight: "کێشی دانراو",
      melt: "نرخی زیوی خاو",
      antique: "لەگەڵ نرخی ئانتیک",
      indicator: "نیشاندەری نرخی کانزا",
      possibleMetal: "کانزای ئەگەری",
      marketPrice: "نرخی بازاڕ",
      weightUsed: "کێشی بەکارهاتوو",
      rawEstimate: "خەمڵاندنی کانزای خاو",
    },
    fr: {
      title: "Scénarios de valeur de l'argent selon le poids",
      note:
        "Ces scénarios sont conditionnels selon le cours du jour. L'évaluation finale exige un poids exact et un poinçon ou une pureté claire.",
      weight: "Poids supposé",
      melt: "Valeur brute de l'argent",
      antique: "Avec valeur d'antiquité",
      indicator: "Indicateur du prix du métal",
      possibleMetal: "Métal possible",
      marketPrice: "Prix du marché",
      weightUsed: "Poids utilisé",
      rawEstimate: "Estimation du métal brut",
    },
    hi: {
      title: "वजन के अनुसार चांदी मूल्य परिदृश्य",
      note:
        "ये आज के बाजार भाव पर आधारित शर्तीय अनुमान हैं. अंतिम मूल्यांकन के लिए सही वजन और स्पष्ट शुद्धता/हॉलमार्क चाहिए.",
      weight: "अनुमानित वजन",
      melt: "कच्ची चांदी का मूल्य",
      antique: "एंटीक मूल्य सहित",
      indicator: "धातु मूल्य संकेतक",
      possibleMetal: "संभावित धातु",
      marketPrice: "बाजार भाव",
      weightUsed: "उपयोग किया गया वजन",
      rawEstimate: "कच्ची धातु का अनुमान",
    },
    fa: {
      title: "سناریوهای ارزش نقره بر اساس وزن",
      note:
        "این سناریوها بر اساس نرخ امروز بازار مشروط هستند. ارزیابی نهایی به وزن دقیق و مهر یا عیار روشن نیاز دارد.",
      weight: "وزن فرضی",
      melt: "ارزش خام نقره",
      antique: "با ارزش آنتیک",
      indicator: "شاخص قیمت فلز",
      possibleMetal: "فلز احتمالی",
      marketPrice: "قیمت بازار",
      weightUsed: "وزن استفاده‌شده",
      rawEstimate: "برآورد فلز خام",
    },
    tr: {
      title: "Ağırlığa göre gümüş değer senaryoları",
      note:
        "Bunlar bugünkü piyasa fiyatına göre koşullu senaryolardır. Nihai değer için kesin ağırlık ve net ayar/damga gerekir.",
      weight: "Varsayılan ağırlık",
      melt: "Ham gümüş değeri",
      antique: "Antika değeriyle",
      indicator: "Metal fiyat göstergesi",
      possibleMetal: "Olası metal",
      marketPrice: "Piyasa fiyatı",
      weightUsed: "Kullanılan ağırlık",
      rawEstimate: "Ham metal tahmini",
    },
    ru: {
      title: "Сценарии стоимости серебра по весу",
      note:
        "Это условные сценарии по сегодняшней рыночной цене. Для окончательной оценки нужен точный вес и четкая проба или клеймо.",
      weight: "Предполагаемый вес",
      melt: "Стоимость сырого серебра",
      antique: "С антикварной ценностью",
      indicator: "Индикатор цены металла",
      possibleMetal: "Возможный металл",
      marketPrice: "Рыночная цена",
      weightUsed: "Использованный вес",
      rawEstimate: "Оценка сырого металла",
    },
    es: {
      title: "Escenarios de valor de la plata según el peso",
      note:
        "Estos escenarios son condicionales según el precio de mercado de hoy. La valoración final requiere peso exacto y una marca clara de pureza o contraste.",
      weight: "Peso supuesto",
      melt: "Valor bruto de la plata",
      antique: "Con valor de antigüedad",
      indicator: "Indicador del precio del metal",
      possibleMetal: "Metal posible",
      marketPrice: "Precio de mercado",
      weightUsed: "Peso utilizado",
      rawEstimate: "Estimación del metal bruto",
    },  };

  return labels[locale] || labels.en;
}

function getResultSectionFallbackLabels(locale: Locale) {
  if (locale === "ar") {
    return {
      evaluation: "التقييم",
      identification: "التعريف",
      similar: "الصور المشابهة",
      authenticity: "الأصالة",
      pricing: "سبب السعر",
      care: "العناية",
    };
  }

  return {
    evaluation: "Evaluation",
    identification: "Identification",
    similar: "Similar images",
    authenticity: "Authenticity",
    pricing: "Price reason",
    care: "Care",
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
  onBack,
  onSavePdf,
  onPrintReport,
  isSavingPdf = false,
  isPreparingPrint = false,
}: Props) {
  const [openImageIndex, setOpenImageIndex] = useState<number | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [failedImageSources, setFailedImageSources] = useState<Set<string>>(
    () => new Set(),
  );
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [hasDraggedSheet, setHasDraggedSheet] = useState(false);
  const sheetRef = useRef<HTMLElement | null>(null);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);
  const ignoreNextClickRef = useRef(false);
  const [activeSectionId, setActiveSectionId] = useState("result-valuation");
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
  const experienceLabels = getResultExperienceLabels(locale);
  const sectionFallbackLabels = getResultSectionFallbackLabels(locale);

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

  useEffect(() => {
    if (!result) return;

    const root = scrollRootRef.current;
    if (!root) return;

    const sectionElements = Array.from(
      root.querySelectorAll<HTMLElement>("[data-result-section='true']"),
    );
    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          setActiveSectionId(visibleEntry.target.id);
        }
      },
      {
        root,
        rootMargin: "-72px 0px -52% 0px",
        threshold: [0.05, 0.2, 0.45, 0.7],
      },
    );

    sectionElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [result, isLoadingSimilar, similarImages.length]);

  if (!result) return null;

  const resolvedSimilarImages = filterVisibleSimilarImages(
    similarImages.length > 0 ? similarImages : getSimilarItems(result),
  );
  const cleanUserNote = cleanDisplayText(userNote);
  const cleanTitle = cleanDisplayText(result.title) || labels.result;
  const heroMetadata = [
    result.timePeriod || result.period,
    result.itemType,
    result.material,
  ]
    .map(cleanDisplayText)
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(" · ");
  const canShowBrandAssessment =
    shouldShowBrandAssessment(result) &&
    Boolean(
      cleanDisplayText(result.brandAssessment?.possibleBrand) ||
        cleanDisplayText(result.brandAssessment?.authenticityStatus) ||
        cleanDisplayText(result.brandAssessment?.priceScenario),
    );
  const metalScenarios = result.metalValue?.scenarios || [];
  const shouldShowMetalValue = false;
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
  const hasIdentificationSection = Boolean(
    cleanDisplayText(result.lookup) ||
      cleanDisplayText(result.historicalReading) ||
      cleanDisplayText(result.history || result.description) ||
      cleanDisplayText(result.itemType) ||
      cleanDisplayText(result.timePeriod || result.period) ||
      cleanDisplayText(result.material) ||
      cleanDisplayText(result.origin),
  );
  const hasAuthenticitySection = Boolean(
    shouldShowMarkAnalysis ||
      canShowBrandAssessment ||
      cleanDisplayText(result.condition) ||
      cleanDisplayText(result.authenticity),
  );
  const hasPricingSection = Boolean(
    cleanDisplayText(result.priceReasoning) ||
      (Array.isArray(result.valueDrivers) &&
        result.valueDrivers.some((item) => cleanDisplayText(item))) ||
      (Array.isArray(result.valueReducers) &&
        result.valueReducers.some((item) => cleanDisplayText(item))),
  );
  const hasCareSection = Boolean(
    (Array.isArray(result.safeInitialChecks) &&
      result.safeInitialChecks.some((item) => cleanDisplayText(item))) ||
      (Array.isArray(result.carePreservationTips) &&
        result.carePreservationTips.some((item) => cleanDisplayText(item))),
  );
  const resultSections = (() => {
    const sections: ResultSectionLink[] = [
      {
        id: "result-valuation",
        label: sectionFallbackLabels.evaluation,
      },
    ];

    if (hasIdentificationSection) {
      sections.push({
        id: "result-identification",
        label: labels.lookup || sectionFallbackLabels.identification,
      });
    }

    if (isLoadingSimilar || resolvedSimilarImages.length > 0) {
      sections.push({
        id: "result-similar",
        label: labels.similar || sectionFallbackLabels.similar,
      });
    }

    if (hasAuthenticitySection) {
      sections.push({
        id: "result-authenticity",
        label: labels.authenticity || sectionFallbackLabels.authenticity,
      });
    }

    if (hasPricingSection) {
      sections.push({
        id: "result-pricing",
        label: labels.priceReason || sectionFallbackLabels.pricing,
      });
    }

    if (hasCareSection) {
      sections.push({
        id: "result-care",
        label: labels.carePreservation || sectionFallbackLabels.care,
      });
    }

    return sections;
  })();

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

  function handleSheetPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    dragStartYRef.current = event.clientY;
    dragMovedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleSheetPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragStartYRef.current === null) return;

    const delta = event.clientY - dragStartYRef.current;
    if (Math.abs(delta) > 6) dragMovedRef.current = true;
    if (sheetRef.current) {
      const offset = Math.max(-220, Math.min(220, delta));
      sheetRef.current.style.transform = `translateY(${offset}px)`;
    }
  }

  function handleSheetPointerEnd(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragStartYRef.current === null) return;

    const delta = event.clientY - dragStartYRef.current;
    const moved = dragMovedRef.current;

    if (delta < -48) {
      setIsSheetExpanded(true);
      setHasDraggedSheet(true);
    } else if (delta > 48) {
      setIsSheetExpanded(false);
      setHasDraggedSheet(true);
    }

    ignoreNextClickRef.current = moved;
    dragStartYRef.current = null;
    dragMovedRef.current = false;
    if (sheetRef.current) sheetRef.current.style.transform = "";

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function toggleSheet() {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }

    setIsSheetExpanded((current) => !current);
    setHasDraggedSheet(true);
  }

  function scrollToResultSection(sectionId: string) {
    setIsSheetExpanded(true);
    setHasDraggedSheet(true);
    setActiveSectionId(sectionId);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const root = scrollRootRef.current;
        const target = document.getElementById(sectionId);
        if (!root || !target) return;

        const rootRect = root.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const stickyOffset = 76;
        const top = root.scrollTop + targetRect.top - rootRect.top - stickyOffset;

        root.scrollTo({
          top: Math.max(0, top),
          behavior: "smooth",
        });
      });
    });
  }

  return (
    <article className="kishib-result-view fixed inset-0 z-30 overflow-hidden bg-[#241713] text-[#241913]">
      <header className="absolute inset-x-0 top-0 h-[66dvh] min-h-[430px] overflow-hidden bg-[#3B1712]">
          {mainImage ? (
            <div className="relative h-full overflow-hidden">
              <button
                type="button"
                onClick={() => openImage(0)}
                className="absolute inset-0 h-full w-full"
                aria-label="Open image"
              >
                <img
                  src={mainImage}
                  alt={result.title || labels.result}
                  onError={() => handleImageError(mainImage)}
                  className="h-full w-full object-cover object-center"
                />
              </button>

              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(24,9,7,0.98)_0%,rgba(35,12,8,0.72)_24%,rgba(35,12,8,0.12)_62%,rgba(35,12,8,0.35)_100%)]" />

              {galleryImages.length > 1 && (
                <div className="absolute inset-x-0 bottom-[132px] z-20 px-4 sm:px-7">
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {galleryImages.map((src, index) => (
                      <button
                        type="button"
                        key={`${src}-${index}`}
                        onClick={() => openImage(index)}
                        className={[
                          "relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border bg-[#fff4e2]/10 shadow-lg transition sm:h-16 sm:w-16",
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

              <div className="absolute inset-x-0 bottom-5 z-20 px-5 sm:px-8 lg:px-12">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[#d6b576]">
                  {labels.result}
                </p>

                <h1 className="max-w-4xl text-[29px] font-medium leading-[1.14] tracking-[-0.04em] text-[#fff4e2] sm:text-[38px] md:text-[46px]">
                  {cleanTitle}
                </h1>
                {heroMetadata ? (
                  <p className="mt-2 line-clamp-1 text-[12px] text-[#f3e7d2]/72 sm:text-sm">
                    {heroMetadata}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-end bg-[radial-gradient(circle_at_top,#9A3D2A_0%,#3B1712_58%,#241713_100%)] px-5 pb-8 sm:px-8 md:px-10">
              <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[#d6b576]">
                {labels.result}
              </p>

              <h1 className="max-w-4xl text-[25px] font-medium leading-[1.22] tracking-[-0.035em] text-[#fff4e2] sm:text-[32px] md:text-[42px]">
                  {cleanTitle}
              </h1>
              </div>
            </div>
          )}
        </header>

        <div dir="ltr" className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-7">
          <button
            type="button"
            onClick={onBack}
            aria-label={experienceLabels.back}
            className="grid h-11 w-11 place-items-center rounded-full bg-[#F3E7D2] text-[#3B1712] shadow-[0_8px_24px_rgba(20,8,5,0.32)] transition hover:bg-[#fff8eb] active:scale-95"
          >
            {locale === "ar" ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </button>

          <div className="flex flex-col items-center gap-0.5 text-[#FFF8EB] drop-shadow-[0_4px_10px_rgba(20,8,5,0.45)]">
            <img
              src="/brand/kishib-logo.png"
              alt=""
              aria-hidden="true"
              className="h-7 w-7 object-contain"
            />
            <span className="text-[8px] font-medium tracking-[0.24em]">KISHIB</span>
          </div>
        </div>

      <section
        ref={sheetRef}
        className={[
          "absolute inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 rounded-t-[30px] border-t border-[#C79A45]/35 bg-[#F3E7D2] shadow-[0_-20px_60px_rgba(35,12,8,0.3)] transition-[top] duration-300 ease-out",
          isSheetExpanded ? "top-[7dvh]" : "top-[64dvh]",
        ].join(" ")}
        aria-label={labels.result}
      >
        <div className="sticky top-0 z-30 border-y border-[#C79A45]/22 bg-[#F3E7D2]/96 px-3 py-2.5 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={handleSheetPointerEnd}
            onPointerCancel={handleSheetPointerEnd}
            onClick={toggleSheet}
            aria-expanded={isSheetExpanded}
            className="mx-auto mb-2 block touch-none select-none rounded-full px-4 py-1 text-center"
            aria-label={isSheetExpanded ? experienceLabels.collapse : experienceLabels.swipe}
          >
            <span className="mx-auto block h-1.5 w-12 rounded-full bg-[#3B1712]/22" />
          </button>

          <nav
            dir={locale === "ar" || locale === "ku" || locale === "fa" ? "rtl" : "ltr"}
            aria-label={locale === "ar" ? "أقسام نتيجة التقييم" : "Evaluation result sections"}
            className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {resultSections.map((section) => {
              const isActive = activeSectionId === section.id;

              return (
                <button
                  type="button"
                  key={section.id}
                  onClick={() => scrollToResultSection(section.id)}
                  className={[
                    "relative shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold leading-5 transition sm:px-3.5 sm:text-[12px]",
                    isActive
                      ? "bg-[#fff4e2] text-[#6d241d] shadow-[inset_0_-2px_0_#b88a3d]"
                      : "text-[#735f4b] hover:bg-[#fff4e2]/55 hover:text-[#6d241d]",
                  ].join(" ")}
                  aria-current={isActive ? "true" : undefined}
                >
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div
          ref={scrollRootRef}
          className="h-[calc(100%_-_4.9rem)] overflow-y-auto overscroll-contain px-3 pb-20 pt-1 [scrollbar-width:thin] sm:px-5"
        >
      <div className="mx-auto w-full max-w-6xl">

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

        <div id="result-valuation" data-result-section="true" className="scroll-mt-24">
          <ValuationRangeCard
            result={result}
            locale={locale}
          />
        </div>

        <section
          id="result-identification"
          data-result-section="true"
          className="mt-5 scroll-mt-24 grid grid-cols-2 gap-x-4 gap-y-5 border-y border-[#c7b99e] py-5 md:grid-cols-4"
        >
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
          <section className="-mx-3 mt-4 border-y border-[#c7b99e]/70 bg-[#fff4e2]/72 px-3 py-4 sm:mx-0 sm:rounded-[18px] sm:border sm:px-4">
            <p className="text-xs font-semibold text-[#986f2e]">
              {silverScenarioLabels.title}
            </p>

            <p className="mt-2 text-xs leading-5 text-[#735f4b]">
              {silverScenarioLabels.note}
            </p>

            {metalScenarios.length > 0 ? (
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {metalScenarios.map((scenario) => (
                  <div
                    key={scenario.label}
                    className="rounded-[12px] border border-[#d2b98f] bg-[#efe3cf]/72 p-3"
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
              <div className="mt-3 rounded-[12px] border border-[#d2b98f] bg-[#efe3cf]/72 p-3 text-sm leading-6 text-[#735f4b]">
                <p className="font-bold text-[#233f32]">
                  {silverScenarioLabels.indicator}
                </p>
                <p className="mt-2">
                  {silverScenarioLabels.possibleMetal}:{" "}
                  {result.metalValue?.metal}
                </p>
                {result.metalValue?.spotPricePerGramUsd ? (
                  <p>
                    {silverScenarioLabels.marketPrice}: $
                    {result.metalValue.spotPricePerGramUsd} / g
                  </p>
                ) : null}
                {result.metalValue?.weightGrams ? (
                  <p>
                    {silverScenarioLabels.weightUsed}:{" "}
                    {result.metalValue.weightGrams}g
                  </p>
                ) : null}
                {result.metalValue?.meltValueUsdLow &&
                result.metalValue?.meltValueUsdHigh ? (
                  <p className="font-bold text-[#8a642f]">
                    {silverScenarioLabels.rawEstimate}: $
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
          <section
            id="result-authenticity"
            data-result-section="true"
            className="mt-5 scroll-mt-24 rounded-[20px] border border-[#c7b99e] bg-[#fff4e2]/90 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#986f2e]">
                {locale === "en" ? "Hallmark / signature analysis" : "تحليل الختم / التوقيع"}
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

        <HistoricalReadingSection
          title={labels.historicalReading}
          body={result.historicalReading}
        />

        <TextSection
          title={labels.description}
          body={result.history || result.description}
          large
        />

        {result.artistAttribution ? (
          <section className="mt-7 rounded-[16px] border border-[#d2b98f] bg-[#fff4e2]/70 p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#986f2e]">
              {locale === "ar" ? "نسبة الفنان المحتملة" : "Potential artist attribution"}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[13px] font-medium text-[#233f32]">
                  {locale === "ar" ? "الفنان المحتمل: " : "Potential artist: "}
                  {cleanDisplayText(result.artistAttribution.possibleArtist)}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#233f32]">
                  {locale === "ar" ? "سبب الترجيح" : "Reasons"}
                </p>
                <p className="mt-2 text-[12px] leading-6 text-[#735f4b]">
                  {result.artistAttribution.reasons.map(cleanDisplayText).filter(Boolean).join("، ")}
                </p>
              </div>
            </div>
            <p className="mt-4 border-t border-[#d2b98f] pt-4 text-[12px] leading-6 text-[#735f4b]">
              {cleanDisplayText(result.artistAttribution.notice)}
            </p>
          </section>
        ) : null}

        <div
          id={shouldShowMarkAnalysis ? undefined : "result-authenticity"}
          data-result-section={shouldShowMarkAnalysis ? undefined : "true"}
          className="mt-7 scroll-mt-24 grid grid-cols-1 gap-7 md:grid-cols-2"
        >
          <TextSection title={labels.condition} body={result.condition} compact />
          <TextSection title={labels.authenticity} body={result.authenticity} compact />
        </div>

        <div id="result-care" data-result-section="true" className="scroll-mt-24">
          <SafeInitialChecksSection
            title={labels.safeInitialChecks}
            note={labels.safeInitialChecksNote}
            items={result.safeInitialChecks}
          />

          <CarePreservationSection
            title={labels.carePreservation}
            note={labels.carePreservationNote}
            items={result.carePreservationTips}
          />
        </div>

        {hasPricingSection ? (
          <section
            id="result-pricing"
            data-result-section="true"
            className="mt-8 scroll-mt-24 border-y border-[#c7b99e] py-7"
          >
            <h2 className="mb-5 text-[20px] font-medium leading-7 tracking-[-0.03em] text-[#233f32] md:text-[22px]">
              {labels.priceReason}
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <SoftList title={labels.valueDrivers} items={result.valueDrivers} />
              <SoftList title={labels.valueReducers} items={result.valueReducers} />
            </div>

            {cleanDisplayText(result.priceReasoning) ? (
              <div className="mt-7 border-t border-[#c7b99e]/70 pt-5">
                <TextSection title={labels.priceReason} body={result.priceReasoning} compact />
              </div>
            ) : null}
          </section>
        ) : null}

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
                  {cleanDisplayText(result.brandAssessment?.category)}
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

        {(isLoadingSimilar || resolvedSimilarImages.length > 0) ? (
          <section
            id="result-similar"
            data-result-section="true"
            className="mt-8 scroll-mt-24 border-t border-[#c7b99e] pt-7"
          >
            <div className="mb-5">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#986f2e]">
                {similarSourceLabel}
              </p>
              <h2 className="text-[24px] font-medium leading-8 tracking-[-0.035em] text-[#233f32]">
                {labels.similar}
              </h2>
            </div>

            {isLoadingSimilar ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-[4/3] animate-pulse rounded-[16px] border border-[#d2b98f] bg-[#fff4e2]/70"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {resolvedSimilarImages.map((item, index) => (
                  <a
                    key={`${item.imageUrl}-${index}`}
                    href={item.link || item.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-[16px] border border-[#d2b98f] bg-[#fff4e2]/90 shadow-[0_8px_24px_rgba(62,39,22,0.08)] transition hover:border-[#b88a3d]/65 hover:shadow-[0_10px_28px_rgba(62,39,22,0.13)]"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-[#d9b59e]">
                      <img
                        src={item.imageUrl}
                        alt={item.title || "Similar result"}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="border-t border-[#d2b98f]/70 p-2.5">
                      {cleanDisplayText(item.title) ? (
                        <p className="line-clamp-2 text-[11px] font-medium leading-5 text-[#241913]">
                          {cleanDisplayText(item.title)}
                        </p>
                      ) : null}
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-semibold">
                        {cleanDisplayText(item.price) ? (
                          <span className="text-[#735f4b]">{cleanDisplayText(item.price)}</span>
                        ) : <span />}
                        <span className="truncate text-[#986f2e]">
                          {cleanDisplayText(item.source) || "Google Lens"}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
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
        </div>
      </section>

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
                  onClick={() => {
                    if (onPrintReport) onPrintReport();
                    else if (onSavePdf) onSavePdf();
                    else window.print();
                  }}
                  disabled={isPreparingPrint || isSavingPdf}
                  className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/80 text-[#735f4b] disabled:cursor-wait disabled:opacity-60"
                  aria-label={reportLabels.print}
                >
                  {isPreparingPrint || isSavingPdf ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#735f4b]/30 border-t-[#735f4b]" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
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
      @keyframes kishib-sheet-hint {
        0%, 100% {
          transform: translateY(0);
          opacity: 0.62;
        }
        50% {
          transform: translateY(-5px);
          opacity: 1;
        }
      }

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

function HistoricalReadingSection({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  const cleanBody = cleanDisplayText(body);

  if (!cleanBody) return null;

  return (
    <section className="mt-6 border-y border-[#d2b98f]/55 bg-[#fff4e2]/32 px-4 py-5 sm:px-5">
      <h2 className="mb-2 text-[15px] font-semibold leading-6 tracking-[-0.015em] text-[#7f5b2d] md:text-[17px]">
        {title}
      </h2>

      <p className="whitespace-pre-line text-[14px] font-normal leading-7 text-[#735f4b] md:text-[15px]">
        {cleanBody}
      </p>
    </section>
  );
}

function SafeInitialChecksSection({
  title,
  note,
  items,
}: {
  title: string;
  note: string;
  items?: string[];
}) {
  const cleanItems = Array.isArray(items)
    ? items.map((item) => cleanDisplayText(item)).filter(Boolean).slice(0, 7)
    : [];

  if (cleanItems.length === 0) return null;

  return (
    <section className="mt-6 border-y border-[#d2b98f]/55 bg-[#fff4e2]/28 px-4 py-5 sm:px-5">
      <h2 className="mb-3 text-[15px] font-semibold leading-6 tracking-[-0.015em] text-[#7f5b2d] md:text-[17px]">
        {title}
      </h2>

      <ul className="grid gap-2.5">
        {cleanItems.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2 text-[13.5px] leading-7 text-[#735f4b] md:text-[14.5px]">
            <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#b88a3d]/75" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[12px] font-normal leading-6 text-[#8a735c]">
        {note}
      </p>
    </section>
  );
}

function CarePreservationSection({
  title,
  note,
  items,
}: {
  title: string;
  note: string;
  items?: string[];
}) {
  const cleanItems = Array.isArray(items)
    ? items.map((item) => cleanDisplayText(item)).filter(Boolean).slice(0, 6)
    : [];

  if (cleanItems.length === 0) return null;

  return (
    <section className="mt-5 border-y border-[#d2b98f]/50 bg-[#fff4e2]/24 px-4 py-5 sm:px-5">
      <h2 className="mb-3 text-[15px] font-semibold leading-6 tracking-[-0.015em] text-[#7f5b2d] md:text-[17px]">
        {title}
      </h2>

      <ul className="grid gap-2.5">
        {cleanItems.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2 text-[13.5px] leading-7 text-[#735f4b] md:text-[14.5px]">
            <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#b88a3d]/65" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[12px] font-normal leading-6 text-[#8a735c]">
        {note}
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


