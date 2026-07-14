import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildKnowledgeContext } from "../../../lib/antiqueKnowledge";
import { buildArtistKnowledgeContext } from "@/data/artistKnowledgeBase";
export const runtime = "nodejs";
import {
  calculateSilverMeltValue,
  detectSilver,
  detectSilverPurity,
  normalizeWeightToGrams,
  type SilverScenario,
} from "@/lib/metalValue";
import { getMetalSpotPrices, type MetalSpotPrices } from "@/lib/metalPrices";
import {
  detectPossibleBrand,
  type BrandDetectionResult,
} from "@/lib/brandEvaluation";
import {
  
  searchMarketReferences,
  formatMarketReferencesForPrompt,
} from "@/lib/marketReferences";
import {
  findMarkReferenceMatches,
  type MarkAnalysis,
} from "@/lib/marksReference";
import {
  getGeminiSecondOpinion,
  type GeminiImageInput,
  type GeminiSecondOpinion,
} from "@/lib/gemini";
import {
  getDeepSeekLogicReview,
  type DeepSeekLogicReview,
} from "@/lib/deepseek";

type Locale = "ar" | "en" | "fr" | "hi" | "fa" | "tr" | "ru" | "ku" | "es";

function logDevelopmentTiming(
  label: string,
  startedAt: number,
  details?: Record<string, unknown>,
) {
  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[KISHIB TIMING] ${label}: ${Math.round(performance.now() - startedAt)}ms`,
      details || {},
    );
  }
}

type AnalysisResult = {
  title: string;
  itemType: string;
  lookup: string;
  timePeriod: string;
  origin: string;
  material: string;
  style: string;
  condition: string;
  authenticity: string;
  estimatedValue: string;
  priceReasoning: string;
  history: string;
  historicalReading?: string;
  safeInitialChecks?: string[];
  carePreservationTips?: string[];
  valueDrivers: string[];
  valueReducers: string[];
  visualSearchKeywords: string[];
  neededPhotos: string[];
  followUpQuestion: string;
  confidence: number;
  confidenceNote: string;
  disclaimer: string;
  brandAssessment?: {
    possibleBrand: string;
    category: string;
    confidence: "high" | "medium" | "low";
    authenticityStatus: string;
    missingEvidence: string[];
    requiredPhotos: string[];
    priceScenario: string;
  };
  artistAttribution?: {
    possibleArtist: string;
    matchLevel: "high" | "medium" | "low";
    reasons: string[];
    notice: string;
    exhibitionContext?: string;
  } | null;
  valuation_scenarios?: {
    label: string;
    labelAr?: string;
    min?: number;
    max?: number;
    currency?: string;
    confidence?: "high" | "medium" | "low" | string;
    note?: string;
    materialValueMin?: number;
    materialValueMax?: number;
    antiquePremiumMin?: number;
    antiquePremiumMax?: number;
  }[];
  valuationScenarios?: {
    label: string;
    labelAr?: string;
    min?: number;
    max?: number;
    currency?: string;
    confidence?: "high" | "medium" | "low" | string;
    note?: string;
    materialValueMin?: number;
    materialValueMax?: number;
    antiquePremiumMin?: number;
    antiquePremiumMax?: number;
  }[];
  evidenceUsed?: {
    images?: string;
    userAgeClaim?: string;
    hallmark?: string;
    weight?: string;
    metalMarketPrice?: string;
    similarItems?: string;
  } | null;
  hallmarkAnalysis?: {
    hallmark_detected?: true | false | "unclear";
    readable_text?: string;
    possible_type?: string;
    clarity?: string;
    interpretation?: string;
    recommendation?: string;
  } | null;
  markAnalysis?: MarkAnalysis | null;
  metalValue?: {
    metal: "silver" | "gold" | "platinum" | "palladium" | "copper" | "unknown";
    weightGrams?: number;
    purityAssumption?: string;
    spotPricePerGramUsd?: number;
    meltValueUsdLow?: number;
    meltValueUsdMid?: number;
    meltValueUsdHigh?: number;
    note?: string;
    scenarios?: SilverScenario[];
    warning?: string;
  };
};

type PreciousMetal = "gold" | "silver" | "platinum" | "palladium" | "copper";
type PreciousMetalConfidenceLevel =
  | "confirmed"
  | "possible"
  | "likely_plated"
  | "none";

type PreciousMetalValue = NonNullable<AnalysisResult["metalValue"]> & {
  metal: PreciousMetal;
};

type PreciousMetalConfidence = {
  metal: PreciousMetal | null;
  confidenceLevel: PreciousMetalConfidenceLevel;
  canUseSpotPrice: boolean;
  requiredEvidence: string[];
  purityFactor?: number;
};

type CompactFollowUpContext = {
  title?: string;
  category?: string;
  material?: string;
  agePeriod?: string;
  origin?: string;
  estimatedPriceRange?: string;
  shortDescription?: string;
  historicalReading?: string;
  safeInitialChecks?: string[];
  carePreservationTips?: string[];
  keyConditionNotes?: string;
  analysis?: string;
  priceReasoning?: string;
  valueDrivers?: string[];
  valueReducers?: string[];
};

const FOLLOW_UP_NOTE_MAX_CHARS = 1200;
const FOLLOW_UP_HARD_NOTE_MAX_CHARS = 6000;
const FOLLOW_UP_PROMPT_MAX_CHARS = 8500;
const USER_NOTE_MAX_CHARS = 200;

function normalizeLocale(locale: string): Locale {
  if (
    locale === "ar" ||
    locale === "en" ||
    locale === "fr" ||
    locale === "hi" ||
    locale === "fa" ||
    locale === "tr" ||
    locale === "ru" ||
    locale === "ku" ||
    locale === "es"
  ) {
    return locale;
  }

  return "ar";
}

function getLanguageName(locale: Locale) {
  switch (locale) {
    case "en":
      return "English";
    case "fr":
      return "French";
    case "hi":
      return "Hindi";
    case "fa":
      return "Persian";
    case "tr":
      return "Turkish";
    case "ru":
      return "Russian";
    case "ku":
      return "Sorani Kurdish";
    case "es":
      return "Spanish";
    case "ar":
    default:
      return "Arabic";
  }
}

function getLanguageInstruction(locale: Locale) {
  switch (locale) {
    case "en":
      return `
The visitor selected English.
All user-facing JSON values must be written in English.
Do not use Arabic or any other language except necessary antique terms.
`;
    case "fr":
      return `
The visitor selected French.
All user-facing JSON values must be written in French.
Do not use Arabic or any other language except necessary antique terms.
`;
    case "hi":
      return `
The visitor selected Hindi.
All user-facing JSON values must be written in Hindi.
Do not use Arabic or any other language except necessary antique terms.
`;
    case "fa":
      return `
The visitor selected Persian.
All user-facing JSON values must be written in Persian.
Use natural Persian for normal visitors.
Do not use Arabic or any other language except necessary antique terms.
`;
    case "tr":
      return `
The visitor selected Turkish.
All user-facing JSON values must be written in Turkish.
Do not use Arabic or any other language except necessary antique terms.
`;
    case "ru":
      return `
The visitor selected Russian.
All user-facing JSON values must be written in Russian.
Do not use Arabic or any other language except necessary antique terms.
`;
    case "ku":
      return `
The visitor selected Sorani Kurdish.
All user-facing JSON values must be written in Sorani Kurdish.
Use clear, natural Sorani Kurdish for normal visitors.
Do not use Arabic or any other language except necessary antique terms.
`;
    case "es":
      return `
The visitor selected Spanish.
All user-facing JSON values must be written in natural, professional Spanish.
Do not use Arabic, English, or any other language except necessary antique terms, artist names, marks, and brand names.
`;
    case "ar":
    default:
      return `
The visitor selected Arabic.
All user-facing JSON values must be written in Arabic.
Use clear, natural Arabic suitable for normal visitors.
Do not use English, Kurdish, or French except for necessary antique terms.
`;
  }
}

function buildBrandEvaluationContext(brand: BrandDetectionResult | null) {
  if (!brand) return "";

  return `
LUXURY & BRAND EVALUATION LAYER:
- Possible brand: ${brand.brandName}
- Category: ${brand.category}
- Detection confidence: ${brand.confidence}
- Matched signals: ${brand.matchedSignals.join("; ") || "brand name only"}
- Authenticity risk: ${brand.authenticityRisk}
- Missing evidence: ${brand.missingEvidence.join("; ") || "none listed"}
- Required photos: ${brand.requiredPhotos.join("; ")}

Rules for luxury brand evaluation:
- Never state that the item is 100% authentic from photos only.
- Use careful authenticity wording only: محتملة الأصالة, تحتاج تحقق, مرجّحة التقليد, or لا يمكن الجزم من الصور فقط.
- If locale is Arabic, all user-facing output must be Arabic. Do not mix English except unavoidable brand names.
- Provide a conditional price scenario:
  1. If authentic and documented.
  2. If inspired/replica/costume.
  3. If vintage and desirable.
  4. If excellent condition versus damaged.
- Include this warning in the result naturally in the selected language:
  "لا يمكن تأكيد أصالة القطع الفاخرة من الصور فقط. يلزم فحص العلامات، الرقم التسلسلي، الختم، الفاتورة، أو فحص خبير."
- Set brandAssessment in the JSON result with possibleBrand, category, confidence, authenticityStatus, missingEvidence, requiredPhotos, and priceScenario.
`;
}

function hasLuxuryCategoryEvidence(input?: string | null) {
  const text = (input || "").toLowerCase();

  return /\b(watch|watches|bag|handbag|purse|jewelry|jewellery|ring|bracelet|necklace|earring|accessory|accessories|shoe|shoes|clothing|fashion|luxury|brand|branded|serial|invoice|authenticity card|audemars|rolex|cartier|chanel|hermes|louis vuitton|gucci|prada|dior|tiffany|bvlgari)\b/.test(
    text,
  );
}

function canUseLuxuryBrandLayer(input?: string | null) {
  return hasLuxuryCategoryEvidence(input);
}

const metalCandidatePattern =
  /\b(jewelry|jewellery|coin|bullion|silverware|metal object|metal|metallic|watch|gold|silver|platinum|palladium|copper|bronze|brass|sterling|karat|carat|hallmark|925|900|800|750|875|916|585|18k|21k|22k|24k)\b|ذهب|ذهبي|فضة|فضي|نقرة|معدن|معدني|نحاس|برونز|براس|عيار|ختم|دمغة|مشغولات|مجوهر|ساعة|عملة|سبائك|إبريق|صينية|ملعقة|شمعدان|زیو|زێو|طلا/iu;

const nonMetalCategoryPattern =
  /\b(painting|canvas|artwork|print|paper|book|manuscript|document|photo|photograph|rug|carpet|textile|fabric|wood|wooden|furniture|chair|table|cabinet|ceramic|porcelain|pottery|glass|crystal|stone|coral|soapstone)\b|لوحة|رسم|كانفاس|ورق|كتاب|مخطوط|وثيقة|صورة|سجاد|سجادة|نسيج|قماش|خشب|خشبي|أثاث|كرسي|طاولة|خزانة|سيراميك|خزف|فخار|زجاج|كريستال|حجر|مرجان|سبستون/iu;

const purityOrHallmarkPattern =
  /\b(925|900|800|750|875|916|585|999|950|sterling|18k|21k|22k|24k|karat|carat|hallmark|stamp)\b|عيار|ختم|دمغة/iu;

function hasMetalCandidateEvidence(input: {
  itemType?: string;
  material?: string;
  notes?: string;
  followUpClaim?: string;
  weight?: string;
  hasMark?: string;
}) {
  const typeAndMaterial = [input.itemType, input.material].filter(Boolean).join(" ");
  const userEvidence = [input.notes, input.followUpClaim, input.hasMark]
    .filter(Boolean)
    .join(" ");
  const combined = [typeAndMaterial, userEvidence].filter(Boolean).join(" ");
  const hasTypeOrMaterialSignal = metalCandidatePattern.test(typeAndMaterial);
  const hasExplicitUserMetalSignal = metalCandidatePattern.test(userEvidence);
  const hasPurityOrHallmark = purityOrHallmarkPattern.test(userEvidence);
  const hasWeightWithMetal =
    Boolean(input.weight?.trim()) && metalCandidatePattern.test(combined);
  const isClearlyNonMetal =
    nonMetalCategoryPattern.test(typeAndMaterial) ||
    (nonMetalCategoryPattern.test(userEvidence) &&
      !hasTypeOrMaterialSignal &&
      !hasExplicitUserMetalSignal);

  if (isClearlyNonMetal && !hasTypeOrMaterialSignal && !hasExplicitUserMetalSignal) {
    return false;
  }

  return (
    hasTypeOrMaterialSignal ||
    hasExplicitUserMetalSignal ||
    hasPurityOrHallmark ||
    hasWeightWithMetal
  );
}

function looksMojibake(value: string) {
  return /(?:\u00d8|\u00d9|\u00da|\u00db|\u00d0|\u00d1|\u00c3|\u00c2|\u00e0\u00a4|\u00e0\u00a5|Ã˜|Ã™|Ãš|Ã›|Ãƒ|Ã‚|Ð|Ñ)/.test(
    value,
  );
}

function mojibakeScore(value: string) {
  return (
    value.match(
      /(?:\u00d8|\u00d9|\u00da|\u00db|\u00d0|\u00d1|\u00c3|\u00c2|\u00e0\u00a4|\u00e0\u00a5|Ã˜|Ã™|Ãš|Ã›|Ãƒ|Ã‚|Ð|Ñ)/g,
    )?.length || 0
  );
}

function repairMojibakeText(value: string) {
  if (!looksMojibake(value)) return value;

  try {
    let best = value;
    let bestScore = mojibakeScore(value);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const bytes = Uint8Array.from(best, (char) => char.charCodeAt(0) & 0xff);
      const repaired = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      const score = mojibakeScore(repaired);

      if (score >= bestScore) break;

      best = repaired;
      bestScore = score;

      if (score === 0) break;
    }

    return bestScore === 0 ? best : "";
  } catch {
    return "";
  }
}


function safeString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";

  const clean = value.replace(/\s+/g, " ").trim();

  if (clean.length <= maxLength) return clean;

  return clean.slice(0, maxLength).trim();
}

function cleanList(value: unknown, maxItems: number, maxItemLength: number) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => cleanText(item, maxItemLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function parseCompactFollowUpContext(value: string): CompactFollowUpContext | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;

    if (!parsed || typeof parsed !== "object") return null;

    return {
      title: cleanText(parsed.title, 180),
      category: cleanText(parsed.category, 120),
      material: cleanText(parsed.material, 160),
      agePeriod: cleanText(parsed.agePeriod, 160),
      origin: cleanText(parsed.origin, 160),
      estimatedPriceRange: cleanText(parsed.estimatedPriceRange, 180),
      shortDescription: cleanText(parsed.shortDescription, 700),
      historicalReading: cleanText(parsed.historicalReading, 700),
      safeInitialChecks: cleanList(parsed.safeInitialChecks, 7, 180),
      carePreservationTips: cleanList(parsed.carePreservationTips, 6, 180),
      keyConditionNotes: cleanText(parsed.keyConditionNotes, 700),
      analysis: cleanText(parsed.analysis, 900),
      priceReasoning: cleanText(parsed.priceReasoning, 700),
      valueDrivers: cleanList(parsed.valueDrivers, 5, 180),
      valueReducers: cleanList(parsed.valueReducers, 5, 180),
    };
  } catch {
    return null;
  }
}

function getCleanTooLongMessage(locale: Locale) {
  if (locale === "en") {
    return "The evaluation context is too long. Please reduce optional details.";
  }

  return "سياق التقييم طويل جداً. يرجى تقليل التفاصيل الاختيارية.";
}

function getNoteTooLongMessage(locale: Locale) {
  if (locale === "en") {
    return "The note must not exceed 200 characters.";
  }

  return "يجب ألا تتجاوز الملاحظة 200 حرف.";
}

function sanitizeApiError(error: unknown, locale: Locale) {
  const message = error instanceof Error ? error.message : "";

  if (
    /request too large|tokens?|context length|platform\.openai|gpt-4|openai/i.test(
      message,
    )
  ) {
    return getCleanTooLongMessage(locale);
  }

  return message || "Failed to analyze item";
}

function normalizeWeightFromNotes(input?: string | null) {
  const value = (input || "").toLowerCase();

  const hasWeightWithUnit =
    /\d+(?:[\.,]\d+)?\s*(kg|kgs|g|gram|grams|oz|ounce|ounces|غرام|جرام|غم|كيلو|كيلوغرام|كغم|اونصة|أونصة)\b/.test(
      value,
    ) ||
    /(kg|kgs|g|gram|grams|oz|ounce|ounces|غرام|جرام|غم|كيلو|كيلوغرام|كغم|اونصة|أونصة)\s*\d+(?:[\.,]\d+)?/.test(
      value,
    );

  if (!hasWeightWithUnit) {
    return null;
  }

  return normalizeWeightToGrams(value);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function detectPreciousMetal(text: string): PreciousMetal | null {
  const value = text.toLowerCase();

  if (
    value.includes("platinum") ||
    value.includes("xpt") ||
    value.includes("بلاتين")
  ) {
    return "platinum";
  }

  if (
    value.includes("palladium") ||
    value.includes("xpd") ||
    value.includes("بلاديوم")
  ) {
    return "palladium";
  }

  if (
    value.includes("gold") ||
    value.includes("xau") ||
    value.includes("ذهب") ||
    value.includes("ذهبي") ||
    value.includes("عيار") ||
    value.includes("karat") ||
    value.includes("carat") ||
    value.includes("24k") ||
    value.includes("22k") ||
    value.includes("21k") ||
    value.includes("18k") ||
    value.includes("14k") ||
    value.includes("ذهب") ||
    value.includes("ذهبي") ||
    value.includes("عيار")
  ) {
    return "gold";
  }

  if (detectSilver(value) || value.includes("فضي") || value.includes("xag")) {
    return "silver";
  }

  if (
    value.includes("copper") ||
    value.includes("xcu") ||
    value.includes("نحاس") ||
    value.includes("bronze") ||
    value.includes("brass")
  ) {
    return "copper";
  }

  return null;
}

function detectMetalPurity(metal: PreciousMetal, text: string) {
  const value = text.toLowerCase();

  if (metal === "silver") {
    return detectSilverPurity(value);
  }

  if (metal === "gold") {
    const karatMatch =
      value.match(/\b(24|22|21|18|14)\s*k\b/) ||
      value.match(/\b(24|22|21|18|14)\s*(karat|carat)\b/) ||
      value.match(/عيار\s*(24|22|21|18|14)/) ||
      value.match(/(24|22|21|18|14)\s*عيار/);
    const karat = karatMatch ? Number(karatMatch[1]) : null;

    if (value.includes("999")) return 1;
    if (value.includes("916")) return 0.916;
    if (value.includes("875")) return 0.875;
    if (value.includes("750")) return 0.75;
    if (value.includes("585")) return 0.585;

    const arabicKaratMatch =
      value.match(/عيار\s*(24|22|21|18|14)/) ||
      value.match(/(24|22|21|18|14)\s*عيار/);
    const arabicKarat = arabicKaratMatch ? Number(arabicKaratMatch[1]) : null;

    if (!karat && arabicKarat) {
      switch (arabicKarat) {
        case 24:
          return 1;
        case 22:
          return 0.916;
        case 21:
          return 0.875;
        case 18:
          return 0.75;
        case 14:
          return 0.585;
      }
    }

    switch (karat) {
      case 24:
        return 1;
      case 22:
        return 0.916;
      case 21:
        return 0.875;
      case 18:
        return 0.75;
      case 14:
        return 0.585;
      default:
        return null;
    }
  }

  if (metal === "platinum" || metal === "palladium") {
    if (value.includes("999")) return 0.999;
    if (value.includes("950")) return 0.95;
    if (value.includes("900")) return 0.9;
    return null;
  }

  if (metal === "copper") {
    if (value.includes("pure copper") || value.includes("نحاس خالص")) return 1;
    if (value.includes("999")) return 0.999;
    return null;
  }

  return null;
}

function hasExplicitPreciousMetalEvidence(text: string) {
  const value = text.toLowerCase();

  return (
    /\b(24|22|21|18|14)\s*k\b/.test(value) ||
    /\b(24|22|21|18|14)\s*(karat|carat)\b/.test(value) ||
    /عيار\s*(24|22|21|18|14)/.test(value) ||
    /(24|22|21|18|14)\s*عيار/.test(value) ||
    /\b(999|916|875|750|585|925|950|900|800)\b/.test(value) ||
    value.includes("sterling") ||
    value.includes("assayed") ||
    value.includes("xrf") ||
    value.includes("tested by jeweler") ||
    value.includes("tested by a jeweler") ||
    value.includes("checked by jeweler") ||
    value.includes("jeweler confirmed") ||
    value.includes("فحص صائغ") ||
    value.includes("مفحوص عند صائغ") ||
    value.includes("تم فحصها عند صائغ") ||
    value.includes("مختومة")
  );
}

function hasPlatedOrCostumeEvidence(text: string) {
  const value = text.toLowerCase();

  return (
    value.includes("gold-tone") ||
    value.includes("gold tone") ||
    value.includes("gold colored") ||
    value.includes("gold-coloured") ||
    value.includes("gold coloured") ||
    value.includes("gold plated") ||
    value.includes("gilded") ||
    value.includes("silver plated") ||
    value.includes("costume jewelry") ||
    value.includes("costume jewellery") ||
    value.includes("alloy") ||
    value.includes("brass") ||
    value.includes("لون ذهبي") ||
    value.includes("ذهبي اللون") ||
    value.includes("لون فضي") ||
    value.includes("فضي اللون") ||
    value.includes("مطلي") ||
    value.includes("مطلية") ||
    value.includes("إكسسوار") ||
    value.includes("اكسسوار") ||
    value.includes("سبيكة")
  );
}

function classifyPreciousMetalConfidence(input: {
  text: string;
  weightGrams?: number | null;
}): PreciousMetalConfidence {
  const normalizedText = input.text.toLowerCase();
  const metal =
    detectPreciousMetal(input.text) ??
    (normalizedText.includes("ذهب") ||
    normalizedText.includes("ذهبي") ||
    normalizedText.includes("عيار")
      ? "gold"
      : normalizedText.includes("فضة") || normalizedText.includes("فضي")
        ? "silver"
        : null);
  const requiredEvidence = [
    "close-up photo of hallmark / صورة قريبة للختم",
    "weight in grams / الوزن بالغرام",
    "karat or purity mark / العيار أو رقم النقاء",
    "jeweler or XRF test / فحص صائغ أو XRF",
  ];

  if (!metal) {
    return {
      metal: null,
      confidenceLevel: "none",
      canUseSpotPrice: false,
      requiredEvidence,
    };
  }

  if (hasPlatedOrCostumeEvidence(input.text)) {
    return {
      metal,
      confidenceLevel: "likely_plated",
      canUseSpotPrice: false,
      requiredEvidence,
    };
  }

  const purityFactor = detectMetalPurity(metal, input.text);
  const hasEvidence = hasExplicitPreciousMetalEvidence(input.text);

  if (hasEvidence && input.weightGrams && purityFactor) {
    return {
      metal,
      confidenceLevel: "confirmed",
      canUseSpotPrice: true,
      requiredEvidence: [],
      purityFactor,
    };
  }

  return {
    metal,
    confidenceLevel: "possible",
    canUseSpotPrice: false,
    requiredEvidence,
    purityFactor: purityFactor ?? undefined,
  };
}

function getMetalGramPrice(prices: MetalSpotPrices, metal: PreciousMetal) {
  switch (metal) {
    case "gold":
      return prices.goldGramUSD;
    case "silver":
      return prices.silverGramUSD;
    case "platinum":
      return prices.platinumGramUSD;
    case "palladium":
      return prices.palladiumGramUSD;
    case "copper":
      return prices.copperGramUSD;
  }
}

function getMetalOuncePrice(prices: MetalSpotPrices, metal: PreciousMetal) {
  switch (metal) {
    case "gold":
      return prices.goldOunceUSD;
    case "silver":
      return prices.silverOunceUSD;
    case "platinum":
      return prices.platinumOunceUSD;
    case "palladium":
      return prices.palladiumOunceUSD;
    case "copper":
      return prices.copperOunceUSD;
  }
}

function getMetalLabel(metal: PreciousMetal) {
  switch (metal) {
    case "gold":
      return "gold / ذهب";
    case "silver":
      return "silver / فضة";
    case "platinum":
      return "platinum / بلاتين";
    case "palladium":
      return "palladium / بلاديوم";
    case "copper":
      return "copper / نحاس";
  }
}

function getPurityAssumption(metal: PreciousMetal, purity: number | null) {
  if (purity) {
    return `${Math.round(purity * 1000)}/1000`;
  }

  if (metal === "gold") {
    return "unknown karat; cautious range: 14k / 18k / 21k";
  }

  if (metal === "silver") {
    return "unknown purity; cautious range: 800 / 925 / 999";
  }

  if (metal === "copper") {
    return "unknown purity; do not treat as confirmed raw copper value without weight and material testing";
  }

  return "unknown purity; cautious range: 900 / 950 / 999";
}

function getPurityRange(metal: PreciousMetal, purity: number | null) {
  if (purity) {
    return {
      low: purity,
      mid: purity,
      high: purity,
    };
  }

  if (metal === "gold") {
    return {
      low: 0.585,
      mid: 0.75,
      high: 0.875,
    };
  }

  if (metal === "silver") {
    return {
      low: 0.8,
      mid: 0.925,
      high: 0.999,
    };
  }

  if (metal === "copper") {
    return {
      low: 1,
      mid: 1,
      high: 1,
    };
  }

  return {
    low: 0.9,
    mid: 0.95,
    high: 0.999,
  };
}

function calculatePreciousMetalValue(input: {
  metal: PreciousMetal;
  weightGrams: number;
  purity: number | null;
  pricePerGramUsd: number;
  warning?: string;
}): PreciousMetalValue {
  const purity = getPurityRange(input.metal, input.purity);
  const low = input.weightGrams * purity.low * input.pricePerGramUsd;
  const mid = input.weightGrams * purity.mid * input.pricePerGramUsd;
  const high = input.weightGrams * purity.high * input.pricePerGramUsd;

  return {
    metal: input.metal,
    weightGrams: roundMoney(input.weightGrams),
    purityAssumption: getPurityAssumption(input.metal, input.purity),
    spotPricePerGramUsd: roundMoney(input.pricePerGramUsd),
    meltValueUsdLow: roundMoney(low),
    meltValueUsdMid: roundMoney(mid),
    meltValueUsdHigh: roundMoney(high),
    note:
      "Live spot metal value is only the raw material component. Antique, artistic, historical, condition, provenance, and market demand factors may raise or lower the final appraisal.",
    warning: input.warning,
  };
}

function buildGenericMetalScenarios(input: {
  metal: PreciousMetal;
  scenarioWeights: number[];
  purity: number | null;
  pricePerGramUsd: number;
}): SilverScenario[] {
  const purity = getPurityRange(input.metal, input.purity);
  const labels: Array<{
    label: "light" | "medium" | "heavy";
    labelAr: string;
    premiumLow: number;
    premiumHigh: number;
  }> = [
    { label: "light", labelAr: "خفيف", premiumLow: 1.08, premiumHigh: 1.6 },
    { label: "medium", labelAr: "متوسط", premiumLow: 1.06, premiumHigh: 1.9 },
    { label: "heavy", labelAr: "ثقيل", premiumLow: 1.04, premiumHigh: 2.2 },
  ];

  return input.scenarioWeights.map((weightGrams, index) => {
    const meta = labels[index] ?? labels[1];
    const low = weightGrams * purity.low * input.pricePerGramUsd;
    const mid = weightGrams * purity.mid * input.pricePerGramUsd;
    const high = weightGrams * purity.high * input.pricePerGramUsd;

    return {
      label: meta.label,
      labelAr: meta.labelAr,
      weightGrams: roundMoney(weightGrams),
      purityAssumption: getPurityAssumption(input.metal, input.purity),
      spotPricePerGramUsd: roundMoney(input.pricePerGramUsd),
      meltValueUsdLow: roundMoney(low),
      meltValueUsdMid: roundMoney(mid),
      meltValueUsdHigh: roundMoney(high),
      antiqueEstimateUsdLow: roundMoney(mid * meta.premiumLow),
      antiqueEstimateUsdHigh: roundMoney(high * meta.premiumHigh),
      note:
        "Estimated scenario because no exact weight was provided. Final valuation requires weighing the item and confirming purity.",
    };
  });
}
function hasHouseOfAntiquesContext(marketContext?: string) {
  const text = (marketContext || "").toLowerCase();

  return (
    text.includes("house of antiques") ||
    text.includes("houseofantiques") ||
    text.includes("بيت التحفيات") ||
    text.includes("internal house") ||
    text.includes("store match") ||
    text.includes("store comparable") ||
    text.includes("listed price") ||
    text.includes("exact listed price") ||
    text.includes("hasstrongmatch: true") ||
    text.includes("neutral internal reference")
  );
}

function buildHouseOfAntiquesRule(marketContext?: string) {
  if (!hasHouseOfAntiquesContext(marketContext)) {
    return `
HOUSE OF ANTIQUES STORE STATUS:
No strong internal reference context was provided.
Do not claim the item exists in any internal store.
`;
  }

  return `
HOUSE OF ANTIQUES STORE COMPARISON RULE:

The market comparison context includes neutral internal reference data.
This is not a random internet result, but it is still only a comparable reference.
Use the neutral internal reference only when the provided Match confidence is exactly "exact" and hasStrongMatch is true.
If confidence is strong, partial, weak, none, or missing, ignore the internal reference completely for identification, price, description, similar items, and user-facing wording.
Do not make an internal reference the basis of identification or valuation unless the uploaded item is clearly the same object type and very visually similar.

If the internal reference context includes a title, description, material, price, SKU, or product ID:
- Read the provided Match confidence value as exact, strong, partial, weak, or none.
- If confidence is exact and the image strongly supports it, you may use the store listing as a direct internal match.
- If confidence is not exact, do not use the store listing at all.
- Do NOT say "لم يتم العثور على مقارنة مباشرة" or "no direct comparison was found".
- Do NOT say there is a store match unless confidence is exact.
- Do NOT use a store price unless confidence is exact.
- Do NOT replace the item with a generic category if the store data is specific.
- In priceReasoning, use only neutral wording such as "a very close reference item" when confidence is exact and hasStrongMatch is true.
- The final estimate must still be based on the uploaded image, visible condition, material, age clues, user notes, and overall market logic.

Arabic wording rule:
If answering in Arabic and internal reference data exists, do not write:
"لم يتم العثور على مقارنة مباشرة"
"لم يتم العثور على القطعة في المتجر"
"لا توجد مقارنة موثوقة"
unless the context explicitly says the match failed.

Only if confidence is exact and hasStrongMatch is true, write that a very close internal reference item was used as one cautious pricing reference.
`;
}

function buildObjectTypeGuidance() {
  return `
AUTOMATIC OBJECT TYPE CLASSIFICATION - REQUIRED BEFORE VALUATION:

Before estimating price, first identify what kind of object this is.
Use the uploaded image, user notes, material clues, shape, function, and market context.
Do not value the item with one generic antique prompt.

Classify the item into the closest practical type:
- Vase / jar / vessel
- Plate / bowl / dish / tray
- Carpet / rug / textile
- Statue / figurine / sculpture
- Samovar / tea urn / traditional kettle
- Wooden box / chest / casket / cabinet
- Silverware / metalware / copper / brass
- Crystal / glass object
- Manuscript / document / book / calligraphy
- Coin / medal / token
- Jewelry / gemstone / ring / necklace
- Painting / framed artwork
- Furniture / seat / table / stand
- Other antique or heritage object

If the object is not one of the listed types, choose the nearest useful type and explain uncertainty.
The "itemType" JSON field must contain the final classified type in the visitor language.

TYPE-SPECIFIC ANALYSIS RULES:

Vase / jar / vessel:
- Check mouth, neck, body shape, base, glaze, decoration, inscriptions, handles, ceramic/porcelain/metal/glass material, and restoration.
- Ask for underside/base and close-ups of glaze, maker marks, and rim damage.

Plate / bowl / dish / tray:
- Check shape, foot ring, rim, glaze, painted/engraved decoration, export style, use wear, hanging holes, and back/underside marks.
- Do not price like ordinary tableware if decoration, age, or regional craft appears significant.

Carpet / rug / textile:
- Focus on weave, knots, foundation, pile, dyes, motifs, region, size, age, repairs, fading, edge/fringe condition, and handmade vs machine-made evidence.
- Price must consider dimensions and condition strongly.
- Needed photos must include back weave, fringe, edges, full flat view, and close-up of knots.

Statue / figurine / sculpture:
- Focus on material, carving/casting method, base, patina, tool marks, iconography, style, missing parts, and whether it is archaeological-style, religious, ethnographic, or decorative.
- Avoid claiming ancient origin without provenance and close detail.
- Ask for base/underside, scale, back, and close-up of surface/tool marks.

Samovar / tea urn / traditional kettle:
- Focus on metal, body shape, chimney, tap/spigot, handles, feet, maker marks, repairs, completeness, soot/wear, and regional style.
- Do not compare it to unrelated pitchers, lamps, candlesticks, or generic brass objects unless visually/functionally close.
- Needed photos must include tap, lid, chimney, base, handles, maker marks, and interior.

Wooden box / chest / casket / cabinet:
- Focus on wood species if visible, joinery, hinges, lock, carving, inlay, hardware, interior, underside, wear, and repairs.
- Price must consider craftsmanship, age indicators, completeness, and hardware originality.
- Ask for inside, underside, hinges, lock, joints, and close-up of carving/inlay.

Silverware / metalware / copper / brass:
- Focus on metal type, patina, oxidation, hand-hammering, engraving/chasing, casting seams, weight, maker marks, and solder/repairs.
- Do not value only as scrap metal if it has heritage craft value.
- Ask for weight, marks, underside, interior, seams, and close-ups of patina/engraving.

Crystal / glass object:
- Focus on cut quality, clarity, weight, ringing, mold seams, pontil, chips, clouding, maker marks, and whether it is cut crystal, pressed glass, or decorative glass.
- Needed photos must include base, rim, cut facets, and chips.

Manuscript / document / book / calligraphy:
- Focus on script, paper, ink, binding, illumination, stamps, colophon/date, language, condition, missing pages, and provenance.
- Never authenticate from one image. Ask for multiple pages, cover, binding, colophon, watermarks, and close-up of ink/paper.

Coin / medal / token:
- Focus on both sides, inscriptions, date, metal, diameter, weight, edge, mint marks, wear grade, corrosion, and authenticity risk.
- Do not give confident value without obverse/reverse, weight, diameter, and edge photos.

Jewelry / gemstone / ring / necklace:
- Focus on metal, hallmark, stone identity, setting, craftsmanship, weight, size, condition, and whether stones/metals are verified.
- Use conditional valuation when metal purity or gemstone identity is unverified.
- Ask for hallmarks, weight, stone close-ups, back of setting, and certificate if available.

Painting / framed artwork:
- Focus on medium, surface, signature, back, canvas/board/paper, frame, labels, craquelure, provenance, subject, and school/style.
- Do not attribute to a famous artist without strong evidence.
- Ask for back, signature close-up, frame corners, labels, and side angle.

Furniture / seat / table / stand:
- Focus on construction, joinery, underside, screws/nails, wood, wear points, repairs, scale, original finish, and regional craft function.
- Do not price heavy heritage craft furniture as ordinary used furniture.
`;
}

function buildExternalSourceGuidance() {
  return `
EXTERNAL REFERENCE SOURCE POLICY:

You may receive marketContext from visual search, Google Custom Search, auction pages, museum pages, knowledge bases, or internal store data.
Use the source type correctly. Do not treat every source as a price source.
Do not claim you directly browsed a site unless its data is explicitly present in marketContext.
If a listed source is not present in marketContext, you may recommend it as a future verification/search source, but do not invent titles, dates, prices, sale results, or descriptions from it.

PRICE / MARKET SOURCES:
Use these only when marketContext includes concrete comparable data such as sold price, completed sale price, auction estimate, hammer price, realized price, date, auction house, lot title, or listing URL:
- eBay sold/completed listings
- WorthPoint
- Barnebys
- LiveAuctioneers
- Invaluable
- AuctionZip
- Google Custom Search results scoped to auction/market sites
- Neutral internal reference comparables only when hasStrongMatch is true, confidence is exactly "exact", confidenceScore >= 0.88, and visualSimilarity >= 0.92

How to use price/market sources:
- Give strongest weight to sold/completed/realized auction prices.
- Treat active retail asking prices as weaker than sold/completed prices.
- Treat auction estimates as guidance, not actual sale value, unless hammer/realized price is present.
- Compare only same object type, similar material, size, age, condition, origin/style, and completeness.
- Ignore visually unrelated market results, even if they share one keyword.
- If price sources conflict, explain a cautious range and why.
- If no reliable market source is present, say the price is preliminary and based on visual/category logic, not verified sale records.

KNOWLEDGE / MUSEUM / CATALOG SOURCES:
These sources do NOT price the uploaded item. Use them only for identification, style, country/region, period, materials, iconography, terminology, and historical description:
- Europeana
- The Met
- Harvard Art Museums
- Rijksmuseum
- Wikidata

How to use knowledge sources:
- Use museum/catalog matches to refine object type, period, origin, style, and vocabulary.
- Do not use museum collection presence to inflate price by itself.
- Do not say a user item is museum-grade just because a similar object appears in a museum.
- Do not convert a museum catalog date or attribution into certainty for the uploaded item.
- If museum/knowledge sources suggest a style or period, phrase it as comparable style/period unless marks, provenance, and construction details support stronger confidence.

SEARCH KEYWORD OUTPUT:
In visualSearchKeywords, include practical follow-up search terms for both market and knowledge checks when useful.
Examples:
- "[object type] sold completed eBay"
- "[object type] LiveAuctioneers sold"
- "[object type] WorthPoint"
- "[object type] Barnebys"
- "[object type] site:invaluable.com"
- "[object type] site:metmuseum.org"
- "[object type] Europeana"
- "[object type] Wikidata"

PRICE REASONING SOURCE DISCIPLINE:
The priceReasoning field must state whether the valuation used:
1. verified sold/completed/realized prices,
2. active retail/internal comparable prices,
3. auction estimates only,
4. knowledge/museum references only,
5. no reliable external comparable.

If only knowledge/museum sources are available, do not present them as pricing evidence.
`;
}

function buildPrompt(fields: {
  locale: Locale;
  notes?: string;
  followUpClaim?: string;
  itemType?: string;
  material?: string;
  dimensions?: string;
  weight?: string;
  hasMark?: string;
  hasImage: boolean;
  imageCount?: number;
  marketContext?: string;
  marketReferencesText?: string;
  preciousMetalMarketContext?: string;
  brandContext?: string;
  artistContext?: string;
}) {

  const language = getLanguageName(fields.locale);
  const languageInstruction = getLanguageInstruction(fields.locale);
  const houseOfAntiquesRule = buildHouseOfAntiquesRule(fields.marketContext);
  const objectTypeGuidance = buildObjectTypeGuidance();
  const externalSourceGuidance = buildExternalSourceGuidance();
const knowledgeContext = buildKnowledgeContext(
  [
    fields.notes,
    fields.itemType,
    fields.material,
    fields.hasMark,
  ]
    .filter(Boolean)
    .join(" "),
);

const internalMarketReferences =
  fields.marketReferencesText || "No internal KISHIB market references were provided.";

 return `
You are Antiques Lens, a strict AI assistant for preliminary antique and collectible analysis.

You are specialized ONLY in:
antiques, vintage objects, ethnographic objects, Islamic and Middle Eastern antiques, Ottoman objects, Iraqi and Levantine antiques, Persian/Qajar objects, Kurdish regional objects, Indian metalwork, copper, brass, silver, ceramics, crystal, carpets, textiles, wood, furniture, paintings, manuscripts, maker marks, signatures, stamps, restoration clues, and preliminary market valuation.

You are NOT:
- a generic chatbot
- a certified appraiser
- an auction house
- an authenticity laboratory
- allowed to claim certainty from one image
- allowed to invent artists, makers, dates, countries, marks, or provenance
- allowed to undervalue rare heritage objects as ordinary used items

The visitor language is: ${language}
${languageInstruction}

Visitor provided:
- Notes: ${fields.notes || "Not provided"}
- Additional information added after the first evaluation: ${fields.followUpClaim || "Not provided"}
- Item type: ${fields.itemType || "Not provided"}
- Material: ${fields.material || "Not provided"}
- Dimensions: ${fields.dimensions || "Not provided"}
- Weight: ${fields.weight || "Not provided"}
- Mark / signature / stamp: ${fields.hasMark || "Not provided"}
- Image provided: ${fields.hasImage ? "Yes" : "No"}
- Number of uploaded images available to inspect: ${fields.imageCount || 0}

MULTI-IMAGE INSPECTION RULE:
You must inspect every provided image. Treat side images, back images, marks, signatures, stamps, hallmarks, labels, inscriptions, serials, and close-up details as essential evidence. Never say that no mark/stamp/extra image was provided if one appears in any uploaded image.
Use all images together when identifying the item, checking condition, reading marks/signatures, and estimating value.
All uploaded images should be treated as views of the same item unless the visitor clearly says otherwise.
Do not base the entire appraisal only on image 1.
If image 1 is a close-up mark/stamp/signature and another image shows the full object, identify and value the full object using the close-up as supporting evidence.
If image 1 shows the full object and later images show hallmarks/stamps/signatures/damage, incorporate those later details into the valuation and confidence.
For visual comparables, prioritize the full object over isolated marks, stamps, signatures, labels, or damage close-ups.

${objectTypeGuidance}

ARTWORK AND CONTEMPORARY ARTIST RULES:
- Apply this section only to an artwork, painting, drawing, print, or other visual artwork.
- Never use "unknown artist", "artist unknown", "فنان غير معروف", "لا يعرف الفنان", or "التوقيع غير معروف" in user-facing output.
- If the artist cannot be identified from the image alone, explain respectfully that the work may belong to a local or contemporary artist whose information is not widely available in public databases.
- Recommend a close-up of the signature, the back of the artwork, acquisition documentation, and the exhibition or artist name.
- Contemporary artwork pricing depends on size, medium, production year, documentation, sales history, and market demand. Never present an estimate as a final sale price when reliable sales data is limited.
- Arabic fallback: "لم يتم التعرف على الفنان من الصورة وحدها. ننصح بإرفاق صورة قريبة للتوقيع، خلفية اللوحة، شهادة الاقتناء إن وجدت، أو اسم المعرض/الفنان."
- English fallback: "The artist could not be identified from the image alone. We recommend adding a close-up of the signature, the back of the artwork, any acquisition certificate, and the exhibition or artist name."
- Arabic pricing caution: "القيمة السوقية التقديرية تعتمد على حجم العمل، الخامة، سنة الإنتاج، التوثيق، سجل المبيعات، وطلب السوق. لا يمكن اعتماد الرقم كسعر بيع نهائي دون توثيق أو مقارنة بمبيعات فعلية."
- English pricing caution: "The estimated market value depends on the work's size, medium, production year, documentation, sales history, and market demand. The figure should not be treated as a final sale price without documentation or comparison with actual sales."
- Only populate artistAttribution when a visual or contextual link is plausible; otherwise use null.

${fields.artistContext || "No internal artist context was provided."}

${externalSourceGuidance}

CRITICAL USER NOTES RULE:
The user's notes are important evidence.
If the user provides a local name, cultural use, family history, market term, rarity claim, weight, age, or functional description, treat it as a serious clue.
Do not ignore it and replace it with a generic label.
If the visual evidence and the user's notes disagree, explain the disagreement carefully and lower confidence.
If the user says the item is heavy, rare, handmade, old, regional, or used in a traditional craft, this must affect the valuation logic.
If additional information is present after the first analysis, treat it as information the visitor added, not as visual proof from the image.
When using additional information, address the visitor directly and respectfully in the selected language.
For Arabic locale, use this phrasing naturally: "حسب المعلومة التي أضافها المستخدم".
Do not write English user-facing output when locale is Arabic.

HIGH-PRIORITY METAL VALUATION RULE:
- Do not provide gold, silver, melt, spot-price, karat, purity, raw metal, or metal valuation unless the item is clearly made of precious metal or the visitor explicitly provides metal type, gram weight, hallmark, stamp, or karat/purity evidence.
- For paintings, furniture, wood, textile, ceramic, documents, carpets, glass, crystal, stone, coral, soapstone, manuscripts, books, photos, and general non-metal artworks, metalValue must be null and valuation_scenarios must not include melt, spot-price, karat, purity, weight scenarios, or raw metal value.
- If the item type is unclear, do not assume gold or silver. Say the material is not confirmed from the photos, but do not create metal prices.
- If a non-metal object has a visible metal-colored frame, handle it as a visual/material note only unless there is a clear precious-metal hallmark or visitor-provided metal evidence.

RESPECTFUL USER-PROVIDED INFORMATION WORDING:
Never use suspicious or adversarial wording in user-facing JSON, including:
- "user claims", "the user claims", "according to the user's claim", "allegedly"
- "المستخدم يدعي", "يدعي المستخدم", "ادعى المستخدم"
Use direct respectful wording instead:
- English: "Based on the information you added...", "If this material/weight/attribution is confirmed...", "This needs direct verification..."
- Arabic: "بناءً على المعلومة التي أضفتها...", "ذكرت أن...", "إذا ثبت أن المادة/الوزن/النسبة صحيحة...", "يحتاج ذلك تأكيدًا مباشرًا..."

RESPECTFUL METAL / WEIGHT / MATERIAL HANDLING:
If the visitor adds that the item is silver, gold, copper, bronze, platinum, palladium, or gives a scale/weight photo:
- Do not write "user claims".
- Do not ignore the information.
- Treat it as a conditional valuation scenario unless the hallmark, exact weight, and purity are visibly/documentarily confirmed.
- Explain separately: raw metal value if confirmed; added value from craftsmanship/age/rarity/decoration/condition; and what direct confirmation is still needed.
- Never make the final price only scrap metal value when the item has antique, artistic, handmade, or decorative value.

RESPECTFUL ARTIST / SIGNATURE / MAKER HANDLING:
If the visitor mentions an artist, craftsperson, maker, signature, or attribution:
- Do not say "unknown artist" or "فنان غير معروف" merely because the model does not know them globally.
- Say the mentioned name needs matching to the signature, label, provenance, or supporting documents.
- If the artist is local or regional, say global references may be limited and the attribution cannot be confirmed from photos alone.
- Separate what the visitor added, what is visible in the images, what needs documentation, and how confirmed attribution could affect value.

Relevant internal antique knowledge base:
${knowledgeContext}

Use the internal knowledge base above as supporting context.
If a user term matches the knowledge base, respect it strongly.
If the image supports the knowledge item, use it to improve identification, function, needed photos, and valuation logic.
If the image does not support it, explain uncertainty instead of forcing the match.

Local / regional antique vocabulary clues:
- "ركية" may refer to an old bathhouse/toiletry container used for soap, combs, and bathing tools, especially in traditional hammam or souk bath contexts.
- Related descriptions may include: علبة حمام، أدوات حمام السوق، علبة صابون ومشط، صندوق حمام، علبة زينة، وعاء أدوات، حمام شعبي.
- "كرسي صفار" or "مقعد صفار" may refer to a traditional craftsman's seat or work chair used by coppersmiths/brass workers, not ordinary household furniture.
- Traditional craft objects from Iraq and the region may have collector value because of cultural function, scarcity, handwork, age, and physical scale.
- In Middle Eastern contexts, consider Ottoman, Iraqi, Levantine, Syrian, Persian/Qajar, Kurdish, Arab, Islamic, Indian export, and North African influences only when visual evidence supports them.
- Do not force a Western category if a regional/local functional category is more likely.

Main task:
Analyze the item from the uploaded image and/or the user's description.
Return a clean structured JSON result for a mobile app screen.

You must separate:
1. What is visible in the image.
2. What is inferred from the user's notes.
3. What remains uncertain.

Identification rules:
- Prefer precise functional identification over generic labels.
- If the item appears to have a traditional use, mention that use.
- If there are multiple possible identifications, mention the strongest likely one first, then alternatives.
- Do not overstate certainty.
- Do not say an object is from the 17th/18th century unless there are strong visible indicators.
- If the image is not enough to confirm period, say "possible" or "in the style of", not a definite date.
- Do not rename a regional craft object into a generic object if the user's description and visual evidence support a traditional function.

Market comparison context from Google Lens, visual search, and neutral internal references:
${fields.marketContext || "No market comparison context was provided."}

PRECIOUS METAL SPOT PRICE CONTEXT:
${fields.preciousMetalMarketContext || "No live precious metal value context was provided."}

${fields.brandContext || "No luxury brand context was provided."}

LUXURY / BRAND CATEGORY GATING:
Only produce brandAssessment for watches, handbags, jewelry, luxury accessories, fashion items, shoes, clothing, or when the user explicitly mentions a brand, serial, invoice, authenticity card, or luxury maker.
For art, wooden artwork, sculpture, painting, craft, furniture, antique wood objects, ceramic, pottery, carpets, textiles, manuscripts, or general antiques, keep brandAssessment null unless the user explicitly says the item is a watch, bag, accessory, fashion item, jewelry, or branded luxury object.
Never mix artwork, wooden craft, furniture, or sculpture with watch/bag/accessory authentication.

PRECIOUS METAL VALUATION RULE:
Never decide that an item is solid gold, solid silver, platinum, or palladium from image color alone.
If confirmed_precious_metal context is provided, treat the raw metal calculation as deterministic math based on the supplied spot price, weight, and purity assumptions.
If possible_precious_metal context is provided, do not use spot price as the direct estimated value. Give two separate valuation tracks: accessory/plated/decorative value, and a conditional scenario only if hallmark, weight, and purity are later confirmed.
If likely_plated_or_costume context is provided, value it as plated/costume/alloy/decorative unless later testing proves otherwise.
Do not let raw metal value replace antique, artistic, historical, condition, provenance, craftsmanship, rarity, documentation, or market-demand value.
Mention raw metal value separately inside priceReasoning.
State that the live spot price was taken as USD per troy ounce and converted to USD per gram.
If weight is missing or purity is unclear, do not give one exact metal value. Present cautious weight/purity scenarios and ask for exact weight and hallmark/karat/purity details.
For gold with unknown karat, do not assume 24k; use a cautious range and ask for karat.
For silver with 999, 958, 925, 900, 880, or 800 marks, use the matching purity factor only as a conditional raw-metal reference when weight is available. If purity is missing, use a cautious range.
If the item is only possible gold, say: "لا يمكن تأكيد أن القطعة ذهب صلب من الصورة فقط. نحتاج صورة قريبة للختم أو الوزن والعيار."
Add this note for gold, silver, platinum, or palladium results: "تم استخدام سعر المعدن المباشر بالدولار للأونصة وتحويله إلى سعر الغرام. التقييم يبقى تقديرياً وقد يختلف حسب العيار والوزن والحالة."

VALUATION DISPLAY AND SCENARIO RULES:
- Always make the price useful first. The UI will show your value data as a finance-style range card, so provide structured ranges whenever possible.
- Add "valuation_scenarios" with at least one practical scenario. Use two or three scenarios when the value depends on unverified hallmark, signature, artist, brand, karat, weight, provenance, or documentation.
- Use clear labels such as "Current visual estimate", "If the hallmark is verified", "If artist attribution is verified", "Material value only", or their natural equivalent in ${language}.
- Do not present unverified information as certified fact. Use softer wording: information that needs verification, if confirmed, if verified.
- Do not use the word "claim" or the Arabic word "ادعاء".
- For precious metals, separate raw material value from antique/collector premium when enough information exists. If weight, purity, or hallmark is missing, keep material values null and explain what is needed.
- For gold, silver, platinum, or palladium, ask for exact weight in grams and a close photo of hallmark/karat/purity if those are missing.
- For hallmarks/signatures, give a cautious "hallmarkAnalysis" object. A visible mark can raise confidence, but it is not proof alone.
- Silver objects may be genuine silver even without a visible hallmark, but confidence must be lower until tested or documented.
- If visual evidence is weak but user-supplied history is plausible, keep a conservative range and a conditional higher range instead of dismissing the item.
- The "evidenceUsed" object should summarize which evidence influenced value: images, user age information, hallmark, weight, live metal price, and similar/internal references.

INTERNAL KISHIB MARKET REFERENCES FROM SUPABASE:
${internalMarketReferences}

INTERNAL MARKET REFERENCES RULES:
- These references come from the KISHIB internal market_references database.
- Use them when they are relevant by object type, material, origin, style, period, or function.
- Do not claim an exact match unless the reference is clearly the same object.
- If references are only similar, describe them as comparable references only.
- Internal references are usable only when hasStrongMatch is true, confidence is exactly "exact", confidenceScore >= 0.88, and visualSimilarity >= 0.92.
- Auction and sold_listing references are stronger than asking_price references.
- If internal references contain useful price ranges, the estimated value must be consistent with them.
- If internal references are weak, unrelated, or missing, lower confidence and say the valuation is preliminary.
- Do not invent references, prices, sources, or URLs that are not listed in the internal references.

${houseOfAntiquesRule}

STRICT SILENT INTERNAL STORE RULE - HIGHEST PRIORITY:
If you were not given a reference with hasStrongMatch=true, confidence exactly "exact", confidenceScore >= 0.88, and visualSimilarity >= 0.92, behave as if the internal store does not exist.
Do not mention internal searches, missing internal matches, store names, House of Antiques, بيت التحفيات, no internal match, not found in store, or any equivalent phrase.
Do not put internal-store negative results in lookup, history, priceReasoning, valueDrivers, valueReducers, confidenceNote, disclaimer, similarItems, or any user-facing field.
If a strong internal reference is provided, use it only as "قطعة مرجعية مشابهة جدًا" or "a very close reference item"; never say it is the same item or a 100% match.

HOW TO USE MARKET COMPARISON CONTEXT:

1. Google Lens results:
- Treat Google Lens results as visual clues only.
- Do not copy Google Lens titles or prices blindly.
- Ignore unrelated visual matches.
- Use them to understand object type, comparable forms, auction/museum presence, and market direction.

If a Google Lens or Google Custom Search result points to a museum/knowledge source, use it for style and identification only.
If it points to an auction/market source with a real sold/completed/realized price, use it as comparable market evidence only after checking relevance.

2. Neutral internal reference comparables:
- Internal comparables are silent retail references from a private reference source.
- Use them only when hasStrongMatch is true, Match confidence is exactly "exact", confidenceScore >= 0.88, and visualSimilarity >= 0.92.
- If confidence is strong, partial, weak, none, uncertain, missing, or hasStrongMatch is not true, ignore internal references completely.
- Do not mention the store/source name to the user.
- Do not use internal titles, descriptions, images, product categories, or prices unless hasStrongMatch is true.
- If hasStrongMatch is true, compare the title, identification, description, and price reasoning with the internal comparable unless the user description clearly contradicts it.
- If hasStrongMatch is true, the listed retail price may be used as one cautious reference, but not as the automatic final appraisal value.

VALUATION DISCIPLINE - VERY IMPORTANT:

Do NOT undervalue rare antique or heritage objects.

For Iraqi, Ottoman, Persian, Kurdish, Middle Eastern, Islamic, or traditional craft objects, price must consider:
- rarity
- weight and physical scale
- age
- craftsmanship
- handmade construction
- cultural function
- scarcity in the local market
- decorative and collector value
- whether the object is complete, unusual, or hard to replace

If the object is described as heavy, rare, old, handmade, traditional, or over 50 years old:
Do NOT price it like a normal used item.

If the item is large or heavy and has heritage/craft function, avoid very low estimates like 50-250 USD unless it is clearly modern, damaged, fake, incomplete, or mass-produced.

For rare traditional craft furniture, tools, seats, boxes, containers, metalwork, or objects from Iraq or the region:
- modest/common pieces may start around 300-800 USD
- strong heritage pieces may fall around 800-2,500 USD
- rare, large, complete, highly decorative, heavy, or culturally important pieces may exceed 2,500 USD

If a traditional object is described as more than 70 years old and very heavy, such as 90 kg or more, do not give a small-object price.
In that case, treat physical scale and rarity as major value drivers.

You must explain price based on collector value, not only material value.

Do not say "only one image" as a reason to crush the price.
Instead, provide a cautious range but keep it realistic for antique and heritage markets.

Only strong neutral internal reference matches can support or adjust market reasoning, and they do not override the visual analysis.

VALUATION CONSISTENCY RULES:

You must be realistic and internally consistent.

Never give a low price range for an item while also claiming it is:
- 17th century
- 18th century
- museum-grade
- rare original work
- signed by a known artist
- important historical object
- high-value silver or precious material
- rare traditional craft object
- heavy antique object with strong cultural function

If you believe the item may be very old, rare, signed, heavy, or historically important, then either:
- give a higher preliminary range,
OR
- lower the confidence and say the price cannot be responsibly estimated without verification.

Do not produce contradictions like:
"rare 70-year-old heavy traditional craft object" + "120–250 USD"
unless you clearly explain that it is likely modern, damaged, incomplete, fake, mass-produced, or not actually comparable.

Pricing must consider:
- object type and function
- material
- handwork vs. mass production
- age indicators
- region/cultural category
- condition
- size
- weight
- completeness
- visible marks/signature/stamps
- rarity
- comparable market logic
- exact neutral internal reference match, only if hasStrongMatch is true and Match confidence is exactly "exact"
- uncertainty level

If there is insufficient evidence, use a cautious range and explain why.
Prefer ranges, not exact prices.
Use USD unless the user requested another currency.

Price consistency guide:
- Small common decorative/vintage items with weak evidence: usually low range.
- Handmade regional antique metalwork with patina and cultural function: do not automatically price as cheap souvenir.
- Heavy traditional craft furniture or tools with local heritage value: do not price as ordinary used furniture.
- Paintings: if attributed to a known artist, old master, or pre-19th century period, do not give a casual low estimate. Require signature/provenance/back/canvas/frame inspection.
- If a painting only looks old but has no provenance or signature, describe it as "in the style of" or "possibly older decorative painting", not confirmed old master.
- If the item has possible silver, precious metal, or important maker marks, ask for marks and weight before valuation.

PRICE REASONING RULE:
The priceReasoning field must clearly explain why the value range was suggested.
If the item is rare, old, heavy, regional, handmade, or culturally specific, priceReasoning must mention those factors.
If an exact strong internal reference match was found, priceReasoning may mention whether a very close reference item affected the estimate.
If no reliable comparable exists, explain that the range is preliminary but do not make it unrealistically low only because evidence is incomplete.

Image analysis checklist:
Look carefully for:
- object type
- functional use
- shape and construction
- lid, hinge, lock, handle, base, joints
- visible material
- patina, oxidation, polish, paint, wear
- engraving, chasing, repoussé, carving, inlay, casting
- handmade vs. machine-made clues
- condition issues
- missing parts
- visible marks, labels, numbers, signature, stamps
- style or design influence
- possible production period
- cultural or regional context

Paintings and non-metal artworks:
- If the item appears to be a painting, print, framed artwork, drawing, textile artwork, or general non-metal artwork, provide a useful cautious visual analysis instead of only saying unknown artist/material/age.
- Discuss visible style, subject, composition, frame, likely support or surface when visible, image condition, and whether it appears hand-painted or printed only if there is visual evidence.
- If the artist cannot be identified, do not invent a name. Ask for photos of the signature, back, edges, surface texture, frame, and any label/stamp.
- Give a cautious value range based on decorative/artistic quality, size, condition, medium clues, and general market logic when no known artist is visible.
- Do not claim the artwork is original or printed without clear evidence.

Marks, hallmarks, signatures, purity numbers, maker marks, labels, serials:
- If any mark/signature/stamp/number/label is visible in any provided image, extract a structured markAnalysis object.
- Never certify authenticity, maker, artist, gold, silver, platinum, or material from an image alone.
- For 925, say it may indicate sterling silver 92.5%, but direct testing is needed.
- For 750 or 18K, say it may indicate 18K gold, but direct testing, weight, and stamp verification are needed.
- For 916, say it may indicate 22K gold, but direct testing is needed.
- For 585, say it may indicate 14K gold, but direct testing is needed.
- If a signature is unclear, describe it only. Do not invent an artist or maker name.
- If clarity is not clear, set needsCloseup true and ask for a close-up photo.
- If a mark/signature may affect value, explain conditional ranges inside estimatedValue or priceReasoning only.
- Do not create a separate section called price scenarios.
- Use conditional language: if confirmed, if not confirmed, may indicate, preliminary range.
- If no mark/signature/stamp/label/number is visible, set markAnalysis to null and do not mention a mark section.

Safe initial checks:
- Return safeInitialChecks as 4 to 7 short, practical, non-destructive bullet strings based on the visible item type and likely material.
- These checks must help the visitor collect clearer evidence before expert inspection.
- Do not suggest acid tests, burning, strong scraping, peeling, scratching, boiling, opening watches or sealed mechanisms, harsh chemicals, solvents, water soaking, or any test that can damage the item or endanger the visitor.
- Prefer safe checks such as better lighting, magnified visual inspection, checking marks without rubbing, measuring dimensions, weighing if already safe to handle, photographing joints/backs/bases/edges, checking magnet response only when safe, and comparing visible construction details.
- If the material or object type is unclear, keep the checks general and conservative.

Care and preservation:
- Return carePreservationTips as 4 to 6 short, practical preservation tips based on the item type and likely material.
- These tips must be different from safeInitialChecks. Do not repeat evidence-gathering steps unless the care reason is clearly different.
- Do not give instructions that may damage the item.
- Do not recommend strong chemicals, harsh cleaners, strong polishing, washing, repainting, refinishing, home restoration, scratch tests, heat tests, ultrasonic cleaning before identifying stones, opening watches or sealed mechanisms, hot water, vinegar, acid, bleach, pesticides directly on antique material, or soaking old items.
- Use simple language for normal visitors and keep every tip concise.
- Material guidance examples: for silver, keep dry, avoid perfume/strong cleaners, avoid aggressive polishing on old patina, photograph hallmarks before cleaning, use only a soft dry cloth for light dust. For gold, store separately, avoid chemicals/perfume, avoid strong cleaning on old or stone-set pieces, do not clean unknown stones, keep boxes/invoices/certificates. For antique wood or furniture, avoid direct sun/humidity, avoid water/oils without specialist advice, do not repaint/refinish before appraisal, keep moderate ventilation, watch insects/cracks without strong pesticides. For luxury watches, do not open the back, avoid water especially when old, keep away from magnets/humidity, keep box/warranty/invoice/papers, avoid aggressive polishing. For coral, avoid perfume/heat/chemicals, avoid hot water/vinegar/acid, store away from hard metals, wipe only with a soft dry cloth, avoid strong sunlight. For soapstone, avoid drops/pressure, avoid strong cleaners/oils, avoid high humidity, dust with a soft brush or dry cloth, do not rub or scratch the surface. For gemstones, store separately, avoid heat/perfume/cleaners, avoid ultrasonic cleaning before identifying the stone, avoid scratch/heat tests, keep certificates/invoices. For crystal or fine glass, store on a stable surface, avoid very hot water/strong cleaners, do not rub engravings/signatures hard, photograph marks before cleaning, use a soft cloth. For ceramic or porcelain, avoid shocks/temperature changes, avoid strong cleaners on marks/base, do not soak old pieces, protect cracked pieces from pressure, do not use household repair glue before expert appraisal. For rugs/textiles, do not wash before appraisal, avoid humidity/direct sun, roll old textiles instead of folding, avoid bleach/strong cleaners, watch edges/repairs without pulling threads. For manuscripts/documents, avoid sun/humidity, limit hand contact, do not fold or press, avoid tape or poor plastic sleeves, use an archival folder if available. For paintings, do not clean the surface yourself, avoid sun/humidity, do not remove the frame unless qualified, store upright away from pressure, do not touch the paint surface.

If the image is unclear, cropped, blurry, or only one angle:
- lower confidence
- avoid strong claims
- ask for specific additional photos
- do not destroy the valuation if the user's notes and market context strongly indicate heritage value

Needed photos should be specific to the item:
- full front view
- back side
- bottom/base/underside
- inside view if it opens
- close-up of hinge, lock, handle, lid, base, seams
- close-up of engraving, patina, oxidation, repair, texture
- close-up of signature, maker mark, stamp, number, label
- scale photo beside a common object
- for furniture/seats/tools: underside, joints, screws/nails, wear points, legs, supports, and close-up of old repairs
- for paintings: back of canvas/board, signature, frame corners, stretcher, labels, craquelure, side angle

Output quality:
- Add useful information, not generic filler.
- Do not simply repeat the user's words.
- If the user's description is useful, build on it.
- If the user's description seems wrong, politely qualify it.
- Write naturally for normal visitors.
- Keep the result useful and practical.
- Do not use markdown.
- Return JSON only.
- No explanation outside JSON.
- No code block.

All user-facing values must be in ${language}.

Required JSON shape:
{
  "title": "short natural object title",
  "itemType": "classified object type in the visitor language, such as vase, plate, carpet, statue, samovar, wooden box, silverware, crystal, manuscript, coin, jewelry, painting, furniture, or other",
  "lookup": "one or two sentence identification of what the item appears to be, including likely function if relevant",
  "timePeriod": "possible period or state that evidence is insufficient",
  "origin": "possible origin or state that origin is unclear",
  "material": "likely material or material explanation",
  "style": "visual style, design influence, school, or type",
  "condition": "visible condition and what still needs checking",
  "authenticity": "authenticity indicators without certainty",
  "estimatedValue": "preliminary USD price range. If an exact strong internal reference is provided, consider its listed price as one comparable reference only",
  "valuation_scenarios": [
    {
      "label": "current visual estimate",
      "labelAr": "التقدير الحالي من الصورة",
      "min": 150,
      "max": 350,
      "currency": "USD",
      "confidence": "low | medium | high",
      "note": "short practical note for this scenario",
      "materialValueMin": null,
      "materialValueMax": null,
      "antiquePremiumMin": null,
      "antiquePremiumMax": null
    }
  ],
  "evidenceUsed": {
    "images": "available | missing",
    "userAgeClaim": "available | missing",
    "hallmark": "detected | unclear | missing",
    "weight": "available | missing",
    "metalMarketPrice": "used | not_used",
    "similarItems": "found | not_found"
  },
  "hallmarkAnalysis": null,
  "priceReasoning": "why this value range was suggested. If an exact strong internal reference affected the range, mention it as a very close reference item, not as the only basis.",
  "history": "short historical/contextual explanation about this kind of object",
  "historicalReading": "3 to 4 short lines of possible historical reading when visual/context clues support it, otherwise an empty string. Use cautious probabilistic language such as may reflect, likely, appears to, and cannot be confirmed without direct inspection. Do not repeat lookup or history, and do not state uncertain historical facts as confirmed.",
  "safeInitialChecks": ["4 to 7 short safe non-destructive initial checks for this specific item type/material; no acid, burning, scraping, scratching, chemicals, boiling, peeling, or opening sealed mechanisms"],
  "carePreservationTips": ["4 to 6 short care and preservation tips for this item type/material; avoid risky cleaning, strong polishing, washing, repainting, home repair, chemicals, heat, soaking, or opening sealed mechanisms"],
  "valueDrivers": ["things that may increase value"],
  "valueReducers": ["things that may reduce value"],
  "visualSearchKeywords": ["short search keyword for finding similar items online"],
  "neededPhotos": ["specific photo needed"],
  "followUpQuestion": "one clear next question",
  "confidence": 1,
  "confidenceNote": "why confidence is low, medium, or high",
  "markAnalysis": null,
  "metalValue": null,
  "brandAssessment": null,
  "artistAttribution": null,

If a visible mark/signature/stamp/number/label exists, set "markAnalysis" as:
{
  "hasMark": true,
  "markType": "hallmark | signature | maker_mark | purity_mark | serial_number | unknown",
  "visibleText": "visible text or empty if only symbol",
  "symbolDescription": "short visual description of symbol or mark",
  "locationOnObject": "where it appears",
  "clarity": "clear | partial | unclear",
  "possibleMeaning": "careful possible meaning without certainty",
  "confidence": "low | medium | high",
  "needsCloseup": true
}

If no visible mark/signature/stamp/number/label exists, use:
"markAnalysis": null
"hallmarkAnalysis": null

If a visible hallmark, maker mark, purity mark, artist signature, stamp, number, or label exists, also set "hallmarkAnalysis" as:
{
  "hallmark_detected": true,
  "readable_text": "exact visible letters/numbers only, or empty if unreadable",
  "possible_type": "gold_karat | silver_purity | maker_mark | artist_signature | serial_number | decorative_mark | unclear",
  "clarity": "high | medium | low",
  "interpretation": "what it may indicate, without certifying it",
  "recommendation": "one practical verification step"
}

If a precious metal value was provided, set "metalValue" as an object:
{
  "metal": "silver | gold | platinum | palladium | copper",
  "weightGrams": number,
  "purityAssumption": string,
  "spotPricePerGramUsd": number,
  "meltValueUsdLow": number,
  "meltValueUsdMid": number,
  "meltValueUsdHigh": number,
  "note": string,
  "scenarios": [
    {
      "label": "light",
      "labelAr": string,
      "weightGrams": number,
      "purityAssumption": string,
      "spotPricePerGramUsd": number,
      "meltValueUsdLow": number,
      "meltValueUsdMid": number,
      "meltValueUsdHigh": number,
      "antiqueEstimateUsdLow": number,
      "antiqueEstimateUsdHigh": number,
      "note": string
    }
  ]
}

If no precious metal value was provided, use:
"metalValue": null

If luxury brand context was provided, set "brandAssessment" as an object:
{
  "possibleBrand": string,
  "category": string,
  "confidence": "high | medium | low",
  "authenticityStatus": string,
  "missingEvidence": [string],
  "requiredPhotos": [string],
  "priceScenario": string
}

If no luxury brand context was provided, use:
"brandAssessment": null

If an artwork has a plausible link to the internal artist reference, set "artistAttribution" as:
{
  "possibleArtist": "artist name in the visitor language",
  "matchLevel": "high | medium | low",
  "reasons": ["only supported reasons: exhibition context, visual similarity, possible signature, or visual style"],
  "notice": "This analysis is not a final certificate of authenticity. Verification with the artist or exhibition organizer is recommended.",
  "exhibitionContext": "active context name or empty string"
}

If there is no plausible link, use:
"artistAttribution": null


  "disclaimer": "preliminary visual estimate, not an authenticity certificate or formal appraisal"
}

Confidence:
- 1 to 3 = weak evidence, unclear photo, no marks, no dimensions, no provenance
- 4 to 6 = moderate visual evidence, likely category, but incomplete verification
- 7 to 8 = good visual evidence with clear details and user context
- 9 to 10 = almost never; only if image and details are exceptionally clear, but still not final authenticity

Important final self-check before returning JSON:
- Did you respect the user's notes?
- Did you avoid inventing certainty?
- Did you avoid a contradiction between age/rarity/weight and price?
- Did you ignore internal references unless hasStrongMatch is true, confidence is exactly "exact", confidenceScore >= 0.88, and visualSimilarity >= 0.92?
- Did you avoid pricing rare regional heritage objects as ordinary used items?
- Did you ask for the right next photos?
- Is the price range defensible?
`;
}

function buildCompactFollowUpPrompt(fields: {
  locale: Locale;
  followUpClaim: string;
  followUpContext: CompactFollowUpContext;
  hasImage: boolean;
  imageCount: number;
  preciousMetalMarketContext?: string;
  brandContext?: string;
  artistContext?: string;
}) {
  const language = getLanguageName(fields.locale);
  const languageInstruction = getLanguageInstruction(fields.locale);
  const previousEvaluation = JSON.stringify(fields.followUpContext);
  const metalContext = cleanText(fields.preciousMetalMarketContext, 1800);
  const brandContext = cleanText(fields.brandContext, 900);

  return `
You are KISHIB's follow-up evaluation updater.

The visitor language is: ${language}
${languageInstruction}

Update the previous KISHIB evaluation using the visitor's new note.
Preserve useful previous findings. Address the visitor directly.
Treat added information as conditional evidence if it is not visually confirmed.
If the visitor adds material, artist, weight, origin, hallmark, brand, or age, incorporate it carefully as a conditional scenario and explain what confirmation is still needed.

Previous compact evaluation context:
${previousEvaluation}

New visitor note:
${fields.followUpClaim || "No text note; use only the additional images if provided."}

Additional images provided: ${fields.hasImage ? "Yes" : "No"}
Number of additional images: ${fields.imageCount}

Metal context, if relevant:
${metalContext || "No live metal context."}

Brand context, if relevant:
${brandContext || "No brand context."}

Artist and exhibition context, if relevant:
${fields.artistContext || "No internal artist context."}

KISHIB wording rules:
- Use respectful direct wording.
- English examples: "Based on the information you added...", "If this material/weight/attribution is confirmed...", "This needs direct verification..."
- Arabic examples: "\u0628\u0646\u0627\u0621\u064b \u0639\u0644\u0649 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u0627\u0644\u062a\u064a \u0623\u0636\u0641\u062a\u0650\u0647\u0627...", "\u0630\u0643\u0631\u062a\u0650 \u0623\u0646...", "\u0625\u0630\u0627 \u0643\u0627\u0646\u062a \u0627\u0644\u0642\u0637\u0639\u0629 \u0641\u0639\u0644\u064b\u0627...", "\u0625\u0630\u0627 \u062b\u0628\u062a\u062a \u0627\u0644\u0645\u0627\u062f\u0629/\u0627\u0644\u0646\u0633\u0628\u0629/\u0627\u0644\u0639\u064a\u0627\u0631..."
- Never sound suspicious, dismissive, or adversarial about the added note.

Metal handling:
- If silver, gold, copper, bronze, platinum, palladium, purity, or weight is added, do not reject it.
- Give a conditional raw metal value only when weight and metal/purity context allow it.
- Keep raw metal value separate from craftsmanship, age, condition, antique value, and collector value.
- Say confirmation needs hallmark, karat/purity, exact weight, jeweler/XRF test, or direct inspection.

Artist, signature, and attribution handling:
- If an artist or maker name is added, do not dismiss them just because global references are limited.
- Say the attribution needs signature comparison, provenance, labels, invoices, or supporting documents.
- Local or regional attribution may need local market or expert confirmation.
- Always keep price first in substance: update the valuation range clearly and provide scenario ranges when the new information affects value.
- Add "valuation_scenarios" for current value and conditional verified value when relevant.
- Add "evidenceUsed" and "hallmarkAnalysis" just like the initial analysis.
- Preserve or update "safeInitialChecks" as 4 to 7 short, safe, non-destructive checks. Never suggest acid, burning, strong scraping, peeling, scratching, boiling, opening watches or sealed mechanisms, chemicals, solvents, soaking, or any damaging test.
- Preserve or update "carePreservationTips" as 4 to 6 short care tips. Do not repeat safeInitialChecks, and never suggest strong chemicals, harsh polishing, washing, repainting, home restoration, scratch tests, heat tests, ultrasonic cleaning before identifying stones, hot water, acid, vinegar, bleach, soaking, or opening sealed mechanisms.
- Never use the word "claim" or the Arabic word "ادعاء".

Return JSON only, with this exact shape:
{
  "title": "short natural object title",
  "itemType": "classified object type",
  "lookup": "one or two sentence updated identification",
  "timePeriod": "possible period or verification need",
  "origin": "possible origin or verification need",
  "material": "updated material view",
  "style": "visual style or type",
  "condition": "condition notes",
  "authenticity": "authenticity or attribution notes without certainty",
  "estimatedValue": "preliminary USD value range",
  "valuation_scenarios": [
    {
      "label": "updated estimate",
      "labelAr": "التقدير المحدث",
      "min": 150,
      "max": 350,
      "currency": "USD",
      "confidence": "low | medium | high",
      "note": "short practical note for this scenario",
      "materialValueMin": null,
      "materialValueMax": null,
      "antiquePremiumMin": null,
      "antiquePremiumMax": null
    }
  ],
  "evidenceUsed": {
    "images": "available | missing",
    "userAgeClaim": "available | missing",
    "hallmark": "detected | unclear | missing",
    "weight": "available | missing",
    "metalMarketPrice": "used | not_used",
    "similarItems": "found | not_found"
  },
  "hallmarkAnalysis": null,
  "priceReasoning": "short reason for the updated value",
  "history": "short context",
  "historicalReading": "3 to 4 short lines of cautious possible historical reading when appropriate, otherwise an empty string; not a confirmed story and not repeated from lookup or history",
  "safeInitialChecks": ["4 to 7 short safe non-destructive initial checks for this item; preserve current checks if still valid"],
  "carePreservationTips": ["4 to 6 short care and preservation tips for this item; preserve current tips if still valid and do not repeat safeInitialChecks"],
  "valueDrivers": ["up to five concise drivers"],
  "valueReducers": ["up to five concise reducers"],
  "visualSearchKeywords": ["short search keyword"],
  "neededPhotos": ["specific next proof needed"],
  "followUpQuestion": "one clear next question",
  "confidence": 1,
  "confidenceNote": "short confidence reason",
  "markAnalysis": null,
  "metalValue": null,
  "brandAssessment": null,
  "disclaimer": "preliminary visual estimate, not an authenticity certificate or formal appraisal"
}

If a visible mark/signature/stamp/number/label appears in the added images or the previous context, set "markAnalysis" as a cautious evidence object:
{
  "hasMark": true,
  "markType": "hallmark | signature | maker_mark | purity_mark | serial_number | unknown",
  "visibleText": "exact visible letters/numbers only, or empty if unreadable",
  "symbolDescription": "short visual description",
  "locationOnObject": "where it appears",
  "clarity": "clear | partial | unclear",
  "possibleMeaning": "possible meaning without certainty",
  "confidence": "low | medium | high",
  "needsCloseup": true
}
If no mark is visible, keep "markAnalysis": null.
"hallmarkAnalysis": null.
If a visible hallmark, maker mark, purity mark, artist signature, stamp, number, or label exists, also set "hallmarkAnalysis" as:
{
  "hallmark_detected": true,
  "readable_text": "exact visible letters/numbers only, or empty if unreadable",
  "possible_type": "gold_karat | silver_purity | maker_mark | artist_signature | serial_number | decorative_mark | unclear",
  "clarity": "high | medium | low",
  "interpretation": "what it may indicate, without certifying it",
  "recommendation": "one practical verification step"
}
Do not treat a mark as final proof of maker, artist, material, purity, authenticity, or price.

All user-facing JSON values must be in ${language}.
Do not use markdown. Do not include explanations outside JSON.
`;
}

function buildFollowUpFallbackResult(
  context: CompactFollowUpContext | null,
  locale: Locale,
): AnalysisResult {
  const fallback = buildFallbackResult(locale);

  if (!context) return fallback;

  return {
    ...fallback,
    title: context.title || fallback.title,
    itemType: context.category || fallback.itemType,
    lookup: context.analysis || context.shortDescription || fallback.lookup,
    timePeriod: context.agePeriod || fallback.timePeriod,
    origin: context.origin || fallback.origin,
    material: context.material || fallback.material,
    condition: context.keyConditionNotes || fallback.condition,
    estimatedValue: context.estimatedPriceRange || fallback.estimatedValue,
    priceReasoning: context.priceReasoning || fallback.priceReasoning,
    history: context.shortDescription || fallback.history,
    historicalReading: context.historicalReading || fallback.historicalReading,
    safeInitialChecks: context.safeInitialChecks?.length
      ? context.safeInitialChecks
      : fallback.safeInitialChecks,
    carePreservationTips: context.carePreservationTips?.length
      ? context.carePreservationTips
      : fallback.carePreservationTips,
    valueDrivers: context.valueDrivers?.length
      ? context.valueDrivers
      : fallback.valueDrivers,
    valueReducers: context.valueReducers?.length
      ? context.valueReducers
      : fallback.valueReducers,
  };
}
function buildFallbackResult(locale: Locale): AnalysisResult {
  if (locale === "en") {
    return {
      title: "Insufficient information",
      itemType: "Unclear object type",
      lookup:
        "The item cannot be identified responsibly from the current information.",
      timePeriod: "Insufficient evidence",
      origin: "Unclear",
      material: "Unclear",
      style: "Unclear",
      condition: "Cannot be assessed clearly",
      authenticity:
        "No authenticity conclusion can be made from the current information.",
      estimatedValue: "Unable to estimate",
      priceReasoning:
        "A responsible value range needs clearer images, condition details, dimensions, and any visible marks.",
      history:
        "More context is needed before connecting this item to a specific historical period or production tradition.",
      valueDrivers: [],
      valueReducers: [
        "Missing clear images",
        "No visible mark or signature",
        "Unknown dimensions",
        "Unknown condition",
      ],
      visualSearchKeywords: [],
      neededPhotos: [
        "Full front view",
        "Back side",
        "Bottom or underside",
        "Close-up of any signature, stamp, number, label, or maker mark",
        "Close-up of damage, repair, patina, oxidation, or material texture",
      ],
      followUpQuestion:
        "Can you upload a clear full photo and a close-up of any mark or writing?",
      confidence: 1,
      confidenceNote: "The provided evidence is too limited.",
      disclaimer:
        "This is a preliminary visual estimate only, not a certificate of authenticity or a formal appraisal.",
    };
  }

  if (locale === "fr") {
    return {
      title: "Informations insuffisantes",
      itemType: "Type d’objet non clair",
      lookup:
        "L’objet ne peut pas être identifié sérieusement avec les informations actuelles.",
      timePeriod: "Éléments insuffisants",
      origin: "Origine non claire",
      material: "Matière non claire",
      style: "Style non clair",
      condition: "L’état ne peut pas être évalué clairement",
      authenticity:
        "Aucune conclusion d’authenticité ne peut être donnée avec les informations actuelles.",
      estimatedValue: "Estimation impossible",
      priceReasoning:
        "Une fourchette de valeur responsable nécessite des images plus claires, l’état, les dimensions et les marques visibles.",
      history:
        "Plus de contexte est nécessaire avant de relier cet objet à une période historique ou à une tradition de fabrication.",
      valueDrivers: [],
      valueReducers: [
        "Images insuffisantes",
        "Aucune marque ou signature visible",
        "Dimensions inconnues",
        "État inconnu",
      ],
      visualSearchKeywords: [],
      neededPhotos: [
        "Vue complète de face",
        "Arrière de l’objet",
        "Dessous ou base",
        "Gros plan sur toute signature, marque, numéro ou étiquette",
        "Gros plan sur les dommages, réparations, patine, oxydation ou texture",
      ],
      followUpQuestion:
        "Pouvez-vous ajouter une photo complète et un gros plan de toute marque ou inscription ?",
      confidence: 1,
      confidenceNote: "Les éléments fournis sont trop limités.",
      disclaimer:
        "Il s’agit d’une estimation visuelle préliminaire, pas d’un certificat d’authenticité ni d’une expertise officielle.",
    };
  }

  if (locale === "ku") {
    return {
      title: "زانیاری پێویست نییە",
      itemType: "جۆری پارچەکە ڕوون نییە",
      lookup:
        "بەم زانیارییەی ئێستا ناتوانرێت پارچەکە بە شێوەیەکی بەرپرسانە بناسرێتەوە.",
      timePeriod: "بەڵگە پێویستەکان نییە",
      origin: "سەرچاوەکە ڕوون نییە",
      material: "مادەکە ڕوون نییە",
      style: "شێوازەکە ڕوون نییە",
      condition: "دۆخەکە بە ڕوونی هەڵسەنگاندن ناکرێت",
      authenticity:
        "لەسەر بنەمای زانیارییەکانی ئێستا ناتوانرێت بڕیاری ڕەسەنایەتی بدرێت.",
      estimatedValue: "ناتوانرێت نرخ بخەمڵێنرێت",
      priceReasoning:
        "بۆ نرخدانانی بەرپرسانە پێویستە وێنەی ڕوونتر، دۆخ، قەبارە و هەر مۆر یان نیشانەیەک هەبێت.",
      history:
        "پێویستە زانیاری زیاتر هەبێت بۆ ئەوەی ئەم پارچەیە بە سەردەم یان شێوازی دروستکردنی دیاریکراوەوە ببەسترێتەوە.",
      valueDrivers: [],
      valueReducers: [
        "وێنەی ڕوون نییە",
        "هیچ مۆر یان واژۆیەک دیار نییە",
        "قەبارە نەزانراوە",
        "دۆخ نەزانراوە",
      ],
      visualSearchKeywords: [],
      neededPhotos: [
        "وێنەی تەواوی پێشەوە",
        "پشتی پارچەکە",
        "بن یان ژێرەوە",
        "وێنەی نزیک لە واژۆ، مۆر، ژمارە یان نیشانە",
        "وێنەی نزیک لە زیان، چاککردنەوە، پاتینا، ئۆکسیدبوون یان تێکستی مادەکە",
      ],
      followUpQuestion:
        "دەتوانیت وێنەی تەواو و وێنەی نزیک لە هەر مۆر یان نووسینێک زیاد بکەیت؟",
      confidence: 1,
      confidenceNote: "بەڵگەکان زۆر سنووردارن.",
      disclaimer:
        "ئەمە تەنها خەملاندنێکی سەرەتایییە لەسەر بنەمای وێنە، نەک بڕوانامەی ڕەسەنایەتی یان هەڵسەنگاندنی فەرمی.",
    };
  }

  return {
    title: "معلومات غير كافية",
    itemType: "نوع القطعة غير واضح",
    lookup: "لا يمكن تحديد القطعة بشكل مسؤول من المعلومات الحالية.",
    timePeriod: "الأدلة غير كافية",
    origin: "المنشأ غير واضح",
    material: "المادة غير واضحة",
    style: "النمط غير واضح",
    condition: "لا يمكن تقييم الحالة بوضوح",
    authenticity:
      "لا يمكن إعطاء حكم أصالة من المعلومات الحالية، ولا توجد أدلة كافية للجزم.",
    estimatedValue: "لا يمكن تقدير السعر",
    priceReasoning:
      "إعطاء نطاق سعري مسؤول يحتاج صور أوضح، ومعرفة الحالة، والقياسات، وأي ختم أو توقيع ظاهر.",
    history:
      "نحتاج معلومات أكثر قبل ربط القطعة بحقبة تاريخية أو مدرسة صناعية محددة.",
    valueDrivers: [],
    valueReducers: [
      "عدم توفر صور واضحة",
      "لا يوجد ختم أو توقيع ظاهر",
      "القياسات غير معروفة",
      "الحالة غير معروفة",
    ],
    visualSearchKeywords: [],
    neededPhotos: [
      "صورة كاملة من الأمام",
      "صورة الخلف",
      "صورة القاعدة أو الأسفل",
      "صورة قريبة للختم أو التوقيع أو الرقم أو الملصق",
      "صورة قريبة لأي كسر أو ترميم أو أثر قدم أو أكسدة أو ملمس المادة",
    ],
    followUpQuestion:
      "هل يمكنك رفع صورة كاملة وصورة قريبة لأي ختم أو كتابة أو توقيع؟",
    confidence: 1,
    confidenceNote: "الأدلة المتوفرة قليلة جداً.",
    disclaimer:
      "هذا تقدير بصري مبدئي فقط، وليس شهادة أصالة أو تقييماً رسمياً.",
  };
}

function normalizeString(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;

  const repaired = repairMojibakeText(value.trim()).trim();

  return repaired ? repaired : fallback;
}

function normalizeArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  const clean = value
    .filter((item) => typeof item === "string")
    .map((item) => repairMojibakeText(item.trim()).trim())
    .filter(Boolean);

  return clean.length ? clean : fallback;
}

function rewriteRespectfulUserWording(value: string, locale: Locale) {
  if (!value) return value;

  const prefix =
    locale === "en"
      ? "Based on the information you added"
      : "بناءً على المعلومة التي أضفتها";

  return value
    .replace(/\bthe user claims that\b/gi, prefix)
    .replace(/\bthe user claims\b/gi, prefix)
    .replace(/\buser claims that\b/gi, prefix)
    .replace(/\buser claims\b/gi, prefix)
    .replace(/\baccording to the user's claim\b/gi, prefix)
    .replace(/\ballegedly\b/gi, locale === "en" ? "if confirmed" : "إذا ثبت ذلك")
    .replace(/المستخدم\s+يدعي\s+أن/gi, "ذكرت أن")
    .replace(/يدعي\s+المستخدم\s+أن/gi, "ذكرت أن")
    .replace(/المستخدم\s+يدعي/gi, "حسب المعلومة التي أضفتها")
    .replace(/ادعى\s+المستخدم/gi, "ذكرت")
    .replace(/يدّعي\s+المستخدم/gi, "ذكرت")
    .replace(/(?:unknown artist|artist unknown)/gi, locale === "en"
      ? "The artist could not be identified from the image alone. The work may belong to a local or contemporary artist whose information is not widely available in public databases."
      : "لم يتم التعرف على الفنان من الصورة وحدها. قد يكون العمل لفنان محلي أو معاصر غير متاح بشكل كافٍ في قواعد البيانات العامة.")
    .replace(/(?:فنان\s+غير\s+معروف|لا\s+يعرف\s+الفنان|التوقيع\s+غير\s+معروف)/gi,
      "لم يتم التعرف على الفنان من الصورة وحدها. ننصح بإرفاق صورة قريبة للتوقيع، خلفية اللوحة، شهادة الاقتناء إن وجدت، أو اسم المعرض/الفنان.");
}

function normalizeArtistAttribution(
  value: unknown,
  locale: Locale,
): AnalysisResult["artistAttribution"] {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const possibleArtist = rewriteRespectfulUserWording(
    normalizeString(data.possibleArtist, ""),
    locale,
  );
  if (!possibleArtist) return null;
  const matchLevel =
    data.matchLevel === "high" || data.matchLevel === "medium"
      ? data.matchLevel
      : "low";
  return {
    possibleArtist,
    matchLevel,
    reasons: normalizeArray(data.reasons, []).map((reason) =>
      rewriteRespectfulUserWording(reason, locale),
    ),
    notice: rewriteRespectfulUserWording(
      normalizeString(
        data.notice,
        locale === "en"
          ? "This analysis is not a final certificate of authenticity. Verification with the artist or exhibition organizer is recommended."
          : "هذا التحليل لا يعد شهادة أصالة نهائية، ويُنصح بالرجوع إلى الفنان أو الجهة المنظمة للمعرض.",
      ),
      locale,
    ),
    exhibitionContext: normalizeString(data.exhibitionContext, ""),
  };
}

function normalizeBrandAssessment(value: unknown, locale: Locale) {
  if (!value || typeof value !== "object") return undefined;

  const data = value as Partial<NonNullable<AnalysisResult["brandAssessment"]>>;
  const confidence =
    data.confidence === "high" ||
    data.confidence === "medium" ||
    data.confidence === "low"
      ? data.confidence
      : "low";

  return {
    possibleBrand: rewriteRespectfulUserWording(normalizeString(data.possibleBrand, ""), locale),
    category: rewriteRespectfulUserWording(normalizeString(data.category, ""), locale),
    confidence,
    authenticityStatus: rewriteRespectfulUserWording(normalizeString(data.authenticityStatus, ""), locale),
    missingEvidence: normalizeArray(data.missingEvidence, []).map((item) =>
      rewriteRespectfulUserWording(item, locale),
    ),
    requiredPhotos: normalizeArray(data.requiredPhotos, []).map((item) =>
      rewriteRespectfulUserWording(item, locale),
    ),
    priceScenario: rewriteRespectfulUserWording(normalizeString(data.priceScenario, ""), locale),
  };
}

function normalizeMarkAnalysis(value: unknown, locale: Locale): MarkAnalysis | null {
  if (!value || typeof value !== "object") return null;

  const data = value as Partial<MarkAnalysis>;
  if (!data.hasMark) return null;

  const markType =
    data.markType === "hallmark" ||
    data.markType === "signature" ||
    data.markType === "maker_mark" ||
    data.markType === "purity_mark" ||
    data.markType === "serial_number" ||
    data.markType === "unknown"
      ? data.markType
      : "unknown";
  const clarity =
    data.clarity === "clear" ||
    data.clarity === "partial" ||
    data.clarity === "unclear"
      ? data.clarity
      : "unclear";
  const confidence =
    data.confidence === "high" ||
    data.confidence === "medium" ||
    data.confidence === "low"
      ? data.confidence
      : "low";

  const normalized: MarkAnalysis = {
    hasMark: true,
    markType,
    visibleText: rewriteRespectfulUserWording(
      normalizeString(data.visibleText, ""),
      locale,
    ),
    symbolDescription: rewriteRespectfulUserWording(
      normalizeString(data.symbolDescription, ""),
      locale,
    ),
    locationOnObject: rewriteRespectfulUserWording(
      normalizeString(data.locationOnObject, ""),
      locale,
    ),
    clarity,
    possibleMeaning: rewriteRespectfulUserWording(
      normalizeString(data.possibleMeaning, ""),
      locale,
    ),
    confidence,
    needsCloseup: Boolean(data.needsCloseup || clarity !== "clear"),
  };

  if (
    !normalized.visibleText &&
    !normalized.symbolDescription &&
    !normalized.possibleMeaning
  ) {
    return null;
  }

  normalized.referenceMatches = findMarkReferenceMatches(normalized);

  return normalized;
}

function normalizeNullableNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizeValuationScenarios(
  value: unknown,
  locale: Locale,
): AnalysisResult["valuation_scenarios"] {
  if (!Array.isArray(value)) return undefined;

  const scenarios = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const data = item as Record<string, unknown>;
      const label = rewriteRespectfulUserWording(
        normalizeString(data.label, ""),
        locale,
      );
      const min = normalizeNullableNumber(data.min);
      const max = normalizeNullableNumber(data.max);

      if (!label && min === undefined && max === undefined) return null;

      const confidence =
        data.confidence === "high" ||
        data.confidence === "medium" ||
        data.confidence === "low"
          ? data.confidence
          : undefined;

      return {
        label: label || (locale === "en" ? "Estimated range" : "نطاق التقدير"),
        labelAr: rewriteRespectfulUserWording(
          normalizeString(data.labelAr, ""),
          locale,
        ),
        min,
        max,
        currency: normalizeString(data.currency, "USD").toUpperCase(),
        confidence,
        note: rewriteRespectfulUserWording(normalizeString(data.note, ""), locale),
        materialValueMin: normalizeNullableNumber(data.materialValueMin),
        materialValueMax: normalizeNullableNumber(data.materialValueMax),
        antiquePremiumMin: normalizeNullableNumber(data.antiquePremiumMin),
        antiquePremiumMax: normalizeNullableNumber(data.antiquePremiumMax),
      };
    })
    .filter(Boolean) as NonNullable<AnalysisResult["valuation_scenarios"]>;

  return scenarios.length ? scenarios : undefined;
}

function normalizeEvidenceUsed(value: unknown): AnalysisResult["evidenceUsed"] {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  return {
    images: normalizeString(data.images, ""),
    userAgeClaim: normalizeString(data.userAgeClaim, ""),
    hallmark: normalizeString(data.hallmark, ""),
    weight: normalizeString(data.weight, ""),
    metalMarketPrice: normalizeString(data.metalMarketPrice, ""),
    similarItems: normalizeString(data.similarItems, ""),
  };
}

function normalizeHallmarkAnalysis(
  value: unknown,
  locale: Locale,
): AnalysisResult["hallmarkAnalysis"] {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const detected = data.hallmark_detected;
  const hallmarkDetected: true | false | "unclear" =
    detected === true || detected === false || detected === "unclear"
      ? detected
      : "unclear";
  const normalized = {
    hallmark_detected: hallmarkDetected,
    readable_text: rewriteRespectfulUserWording(
      normalizeString(data.readable_text, ""),
      locale,
    ),
    possible_type: normalizeString(data.possible_type, "unclear"),
    clarity: normalizeString(data.clarity, "low"),
    interpretation: rewriteRespectfulUserWording(
      normalizeString(data.interpretation, ""),
      locale,
    ),
    recommendation: rewriteRespectfulUserWording(
      normalizeString(data.recommendation, ""),
      locale,
    ),
  };

  if (
    normalized.hallmark_detected !== true &&
    !normalized.readable_text &&
    !normalized.interpretation
  ) {
    return null;
  }

  return normalized;
}

function normalizeResult(
  parsed: Partial<AnalysisResult>,
  fallback: AnalysisResult,
  locale: Locale,
): AnalysisResult {
  const confidence =
    typeof parsed.confidence === "number"
      ? Math.min(10, Math.max(1, parsed.confidence))
      : fallback.confidence;

  return {
    title: rewriteRespectfulUserWording(normalizeString(parsed.title, fallback.title), locale),
    itemType: rewriteRespectfulUserWording(normalizeString(parsed.itemType, fallback.itemType), locale),
    lookup: rewriteRespectfulUserWording(normalizeString(parsed.lookup, fallback.lookup), locale),
    timePeriod: rewriteRespectfulUserWording(normalizeString(parsed.timePeriod, fallback.timePeriod), locale),
    origin: rewriteRespectfulUserWording(normalizeString(parsed.origin, fallback.origin), locale),
    material: rewriteRespectfulUserWording(normalizeString(parsed.material, fallback.material), locale),
    style: rewriteRespectfulUserWording(normalizeString(parsed.style, fallback.style), locale),
    condition: rewriteRespectfulUserWording(normalizeString(parsed.condition, fallback.condition), locale),
    authenticity: rewriteRespectfulUserWording(normalizeString(parsed.authenticity, fallback.authenticity), locale),
    estimatedValue: rewriteRespectfulUserWording(normalizeString(parsed.estimatedValue, fallback.estimatedValue), locale),
    priceReasoning: rewriteRespectfulUserWording(normalizeString(parsed.priceReasoning, fallback.priceReasoning), locale),
    history: rewriteRespectfulUserWording(normalizeString(parsed.history, fallback.history), locale),
    historicalReading: rewriteRespectfulUserWording(
      normalizeString(parsed.historicalReading, fallback.historicalReading || ""),
      locale,
    ),
    safeInitialChecks: normalizeArray(
      parsed.safeInitialChecks,
      fallback.safeInitialChecks || [],
    )
      .map((item) => rewriteRespectfulUserWording(item, locale))
      .slice(0, 7),
    carePreservationTips: normalizeArray(
      parsed.carePreservationTips,
      fallback.carePreservationTips || [],
    )
      .map((item) => rewriteRespectfulUserWording(item, locale))
      .slice(0, 6),
    valueDrivers: normalizeArray(parsed.valueDrivers, fallback.valueDrivers).map((item) =>
      rewriteRespectfulUserWording(item, locale),
    ),
    valueReducers: normalizeArray(parsed.valueReducers, fallback.valueReducers).map((item) =>
      rewriteRespectfulUserWording(item, locale),
    ),
    visualSearchKeywords: normalizeArray(
      parsed.visualSearchKeywords,
      fallback.visualSearchKeywords
    ),
    neededPhotos: normalizeArray(parsed.neededPhotos, fallback.neededPhotos).map((item) =>
      rewriteRespectfulUserWording(item, locale),
    ),
    followUpQuestion: rewriteRespectfulUserWording(
      normalizeString(parsed.followUpQuestion, fallback.followUpQuestion),
      locale,
    ),
    confidence,
    confidenceNote: rewriteRespectfulUserWording(
      normalizeString(parsed.confidenceNote, fallback.confidenceNote),
      locale,
    ),
    valuation_scenarios: normalizeValuationScenarios(
      parsed.valuation_scenarios || parsed.valuationScenarios,
      locale,
    ),
    valuationScenarios: normalizeValuationScenarios(
      parsed.valuationScenarios || parsed.valuation_scenarios,
      locale,
    ),
    evidenceUsed: normalizeEvidenceUsed(parsed.evidenceUsed),
    hallmarkAnalysis: normalizeHallmarkAnalysis(parsed.hallmarkAnalysis, locale),
    disclaimer: rewriteRespectfulUserWording(
      normalizeString(parsed.disclaimer, fallback.disclaimer),
      locale,
    ),
    metalValue: parsed.metalValue,
    brandAssessment: normalizeBrandAssessment(parsed.brandAssessment, locale),
    artistAttribution: normalizeArtistAttribution(parsed.artistAttribution, locale),
    markAnalysis: normalizeMarkAnalysis(parsed.markAnalysis, locale),
  };
}

function appendGeminiNote(base: string, note: string, locale: Locale) {
  if (!note) return base;

  const prefix =
    locale === "en"
      ? "Additional review note:"
      : "ملاحظة مراجعة إضافية:";
  const cleanBase = base?.trim();
  const addition = `${prefix} ${note}`;

  return cleanBase ? `${cleanBase}\n${addition}` : addition;
}

function hasMeaningfulDisagreement(value: string) {
  const clean = value.trim().toLowerCase();
  if (!clean) return false;

  return !/^(none|no|لا يوجد|لا توجد|لا|nothing|n\/a)$/i.test(clean);
}

function mergeGeminiSecondOpinion(
  result: AnalysisResult,
  secondOpinion: GeminiSecondOpinion | null,
  locale: Locale,
) {
  if (!secondOpinion) return result;

  const next: AnalysisResult = { ...result };
  const disagreement = hasMeaningfulDisagreement(
    secondOpinion.disagreementWithOpenAI,
  );
  const lowerConfidence =
    disagreement ||
    /lower|خفض|منخفض|low|decrease|قلل/i.test(
      secondOpinion.confidenceAdjustment,
    );
  const raiseConfidence =
    !lowerConfidence &&
    /raise|رفع|increase|higher/i.test(secondOpinion.confidenceAdjustment);

  if (lowerConfidence) {
    next.confidence = Math.min(next.confidence, Math.max(1, next.confidence - 2));
  } else if (raiseConfidence) {
    next.confidence = Math.min(8, next.confidence + 1);
  }

  const confidenceNotes = [
    secondOpinion.risksOrUncertainties,
    disagreement ? secondOpinion.disagreementWithOpenAI : "",
    secondOpinion.finalCautionNotes,
  ]
    .filter(Boolean)
    .join(" ");

  next.confidenceNote = appendGeminiNote(
    next.confidenceNote,
    confidenceNotes,
    locale,
  );

  next.priceReasoning = appendGeminiNote(
    next.priceReasoning,
    secondOpinion.priceLogicReview,
    locale,
  );

  next.condition = appendGeminiNote(
    next.condition,
    secondOpinion.conditionNotes,
    locale,
  );

  if (secondOpinion.possibleMaterial) {
    next.material = appendGeminiNote(
      next.material,
      secondOpinion.possibleMaterial,
      locale,
    );
  }

  if (secondOpinion.possiblePeriod) {
    next.timePeriod = appendGeminiNote(
      next.timePeriod,
      secondOpinion.possiblePeriod,
      locale,
    );
  }

  next.disclaimer = appendGeminiNote(
    next.disclaimer,
    locale === "en"
      ? "This remains a preliminary visual estimate and needs direct inspection for authenticity, material, age, and market value."
      : "يبقى هذا تقديرًا بصريًا أوليًا ويحتاج إلى فحص مباشر لتأكيد الأصالة والمادة والعمر والقيمة السوقية.",
    locale,
  );

  return next;
}

function mergeDeepSeekLogicReview(
  result: AnalysisResult,
  review: DeepSeekLogicReview | null,
  locale: Locale,
) {
  if (!review) return result;

  const next: AnalysisResult = { ...result };
  const highPricingRisk = review.pricingRisk === "high";
  const mediumPricingRisk = review.pricingRisk === "medium";
  const lowConfidenceRecommended =
    review.confidenceRecommendation === "low" ||
    review.shouldReduceConfidence ||
    review.unsafeClaimsFound.length > 0 ||
    review.mainDisagreements.length > 0;

  if (lowConfidenceRecommended || highPricingRisk) {
    next.confidence = Math.min(next.confidence, 5);
  } else if (mediumPricingRisk) {
    next.confidence = Math.min(next.confidence, 7);
  }

  const cautionNotes = [
    ...review.recommendedCautionNotes,
    ...review.unsafeClaimsFound,
    review.finalReviewerSummary,
  ]
    .filter(Boolean)
    .join(" ");

  next.confidenceNote = appendGeminiNote(
    next.confidenceNote,
    cautionNotes,
    locale,
  );

  const pricingNote = [
    review.pricingAdjustmentNotes,
    highPricingRisk || mediumPricingRisk
      ? locale === "en"
        ? "Use the estimate as a cautious preliminary range, not a fixed value."
        : "يجب التعامل مع السعر كنطاق تقديري أولي متحفظ وليس قيمة ثابتة."
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  next.priceReasoning = appendGeminiNote(
    next.priceReasoning,
    pricingNote,
    locale,
  );

  if (review.logicReview || review.mainDisagreements.length > 0) {
    next.authenticity = appendGeminiNote(
      next.authenticity,
      [
        review.logicReview,
        review.mainDisagreements.length
          ? review.mainDisagreements.join("; ")
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      locale,
    );
  }

  next.disclaimer = appendGeminiNote(
    next.disclaimer,
    locale === "en"
      ? "The final KISHIB report is a preliminary appraisal and should be verified by direct inspection, especially for authenticity, precious metals, stones, signatures, stamps, and high-value pricing."
      : "تقرير KISHIB النهائي هو تقييم أولي ويجب التحقق منه بالفحص المباشر، خصوصًا في الأصالة والمعادن الثمينة والأحجار والتواقيع والأختام والأسعار العالية.",
    locale,
  );

  return next;
}

async function fileToDataUrl(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/jpeg";

  return `data:${mimeType};base64,${base64}`;
}

export async function POST(request: Request) {
  let requestLocale: Locale = "ar";
  const totalStartedAt = performance.now();

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing" },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

const requestPreparationStartedAt = performance.now();
const formData = await request.formData();

const imageEntries = [...formData.getAll("images"), ...formData.getAll("image")];
const images = imageEntries.filter(
  (entry): entry is File => entry instanceof File && entry.size > 0,
);
const uploadedImageUrls = formData
  .getAll("uploadedImageUrls")
  .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
  .map((entry) => entry.trim());
const locale = normalizeLocale(safeString(formData.get("locale")));
requestLocale = locale;
const rawNotes = safeString(formData.get("notes"));
if (rawNotes.length > USER_NOTE_MAX_CHARS) {
  return NextResponse.json(
    { error: getNoteTooLongMessage(locale) },
    { status: 400 },
  );
}
const notes = rawNotes;
const rawFollowUpClaim = safeString(formData.get("followUpClaim"));
const followUpClaim = cleanText(rawFollowUpClaim, FOLLOW_UP_NOTE_MAX_CHARS);
const marketContext = safeString(formData.get("marketContext"));
const followUpContext = parseCompactFollowUpContext(
  safeString(formData.get("followUpContext")),
);
const isFollowUpUpdate = Boolean(followUpContext);

if (
  isFollowUpUpdate &&
  rawFollowUpClaim.length > FOLLOW_UP_HARD_NOTE_MAX_CHARS
) {
  return NextResponse.json(
    { error: getCleanTooLongMessage(locale) },
    { status: 413 },
  );
}

console.log("========== ANALYZE DEBUG ==========");
console.log("marketContext exists:", Boolean(marketContext));
console.log("marketContext length:", marketContext?.length || 0);
console.log("marketContext preview:", marketContext?.slice(0, 1500));
console.log("===================================");
console.log(
  "has House of Antiques context:",
  hasHouseOfAntiquesContext(marketContext)
);

const itemType = safeString(formData.get("itemType"));
const material = safeString(formData.get("material"));
const dimensions = safeString(formData.get("dimensions"));
const weight = safeString(formData.get("weight"));
const hasMark = safeString(formData.get("hasMark"));
const exhibitionContext = process.env.NEXT_PUBLIC_KISHIB_EXHIBITION_CONTEXT || "";
const artistContext = buildArtistKnowledgeContext(exhibitionContext);

const preciousMetalContextText = [
  followUpClaim || notes,
  itemType,
  material,
  dimensions,
  weight,
  hasMark,
]
  .filter(Boolean)
  .join(" ");

const userBrandEvidenceText = [
  followUpClaim,
  notes,
  itemType,
  material,
  dimensions,
  hasMark,
]
  .filter(Boolean)
  .join(" ");
const shouldUseBrandLayer = canUseLuxuryBrandLayer(userBrandEvidenceText);
const brandAssessment = shouldUseBrandLayer
  ? detectPossibleBrand(userBrandEvidenceText)
  : null;
const brandContext = buildBrandEvaluationContext(brandAssessment);
const isPreciousMetalCandidate = hasMetalCandidateEvidence({
  itemType,
  material,
  notes,
  followUpClaim,
  weight,
  hasMark,
});

let preciousMetalMarketContext = "";
let preciousMetalValue: PreciousMetalValue | null = null;
const preliminaryWeightGrams =
  normalizeWeightToGrams(weight) ??
  normalizeWeightFromNotes(followUpClaim) ??
  normalizeWeightFromNotes(notes);
const metalClassification = classifyPreciousMetalConfidence({
  text: followUpClaim || preciousMetalContextText,
  weightGrams: preliminaryWeightGrams,
});
const hasFollowUpClaim = Boolean(followUpClaim);
logDevelopmentTiming("requestAndImagePreparation", requestPreparationStartedAt, {
  imageCount: images.length || uploadedImageUrls.length,
});
const searchNotes = isFollowUpUpdate
  ? [
      followUpClaim,
      followUpContext?.title,
      followUpContext?.category,
      followUpContext?.material,
      followUpContext?.origin,
    ]
      .filter(Boolean)
      .join(" ")
  : notes;
const serverParallelGroupStartedAt = performance.now();
const marketReferencesStartedAt = performance.now();
let marketReferencesDurationMs = 0;
let metalPricesDurationMs = 0;
const marketReferencesPromise = (
  isFollowUpUpdate
    ? Promise.resolve([])
    : searchMarketReferences({
        itemType,
        category: itemType,
        material,
        origin: "",
        keywords: [
          itemType,
          material,
          dimensions,
          weight,
          hasMark,
          searchNotes,
        ].filter(Boolean) as string[],
      })
).finally(() => {
  marketReferencesDurationMs = performance.now() - marketReferencesStartedAt;
});

if (isPreciousMetalCandidate && metalClassification.metal) {
  const metalPricesStartedAt = performance.now();
  const detectedMetal = metalClassification.metal;
  const weightGrams = preliminaryWeightGrams;
  const purity =
    metalClassification.purityFactor ??
    detectMetalPurity(detectedMetal, preciousMetalContextText);
  const spotPrices = await getMetalSpotPrices();
  if (!spotPrices) {
    preciousMetalMarketContext = `
The item may contain ${getMetalLabel(detectedMetal)}, but live Metals.dev prices are not available right now.
Continue the appraisal without raw metal calculation.
Do not use spot price as the final item value.
If weight or purity is missing, state that raw metal value cannot be calculated without exact weight, purity, and direct material testing.
`;
  } else {
  const ouncePriceUsd = getMetalOuncePrice(spotPrices, detectedMetal);
  const pricePerGramUsd = getMetalGramPrice(spotPrices, detectedMetal);
  const metalLabel = getMetalLabel(detectedMetal);

  if (metalClassification.canUseSpotPrice && weightGrams) {
    preciousMetalValue =
      detectedMetal === "silver"
        ? {
            ...calculateSilverMeltValue({
              weightGrams,
              purity,
              pricePerGramUsd,
            }),
            warning: spotPrices.warning,
          }
        : calculatePreciousMetalValue({
            metal: detectedMetal,
            weightGrams,
            purity,
            pricePerGramUsd,
            warning: spotPrices.warning,
          });

    preciousMetalMarketContext = `
The item appears to contain ${metalLabel}.

Precious metal confidence classification:
- Classification category: confirmed_precious_metal
- Can use spot price for direct valuation: yes
- Evidence source: ${hasFollowUpClaim ? "additional visitor information, not image-only proof" : "provided fields and available evidence"}
${hasFollowUpClaim ? `- Additional visitor information: ${followUpClaim}` : ""}

Live metal spot prices from Metals.dev:
- Gold XAU USD/troy ounce: ${spotPrices.goldOunceUSD}
- Gold XAU USD/gram: ${spotPrices.goldGramUSD}
- Silver XAG USD/troy ounce: ${spotPrices.silverOunceUSD}
- Silver XAG USD/gram: ${spotPrices.silverGramUSD}
- Platinum XPT USD/troy ounce: ${spotPrices.platinumOunceUSD}
- Platinum XPT USD/gram: ${spotPrices.platinumGramUSD}
- Palladium XPD USD/troy ounce: ${spotPrices.palladiumOunceUSD}
- Palladium XPD USD/gram: ${spotPrices.palladiumGramUSD}
- Copper XCU USD/troy ounce: ${spotPrices.copperOunceUSD}
- Copper XCU USD/gram: ${spotPrices.copperGramUSD}
- Updated at: ${spotPrices.updatedAt}
- Source: ${spotPrices.source}
${spotPrices.warning ? `- Internal warning: ${spotPrices.warning}` : ""}

Selected metal calculation:
- Metal: ${metalLabel}
- USD per troy ounce: ${ouncePriceUsd}
- USD per gram: ${preciousMetalValue.spotPricePerGramUsd}

Detected / user-provided weight:
- ${preciousMetalValue.weightGrams} grams

Purity assumption:
- ${preciousMetalValue.purityAssumption}

Raw metal value:
- Low: $${preciousMetalValue.meltValueUsdLow}
- Mid: $${preciousMetalValue.meltValueUsdMid}
- High: $${preciousMetalValue.meltValueUsdHigh}

${hasFollowUpClaim ? "Important: Present this as according to the information added by the user, not as a fact proven by the image alone." : ""}
This raw metal value is not the final antique appraisal.
It must be separated from age, origin, rarity, craftsmanship, condition, documentation, and market demand.
If the piece is antique, engraved, handmade, signed, rare, or collectible, explain the antique/craft premium or discount separately.
`; 
  } else {
    if (
      metalClassification.confidenceLevel !== "likely_plated" &&
      !weightGrams &&
      (detectedMetal === "silver" || detectedMetal === "gold")
    ) {
      const scenarioWeights =
        detectedMetal === "silver" ? [100, 250, 500] : [10, 30, 80];
      const scenarios = buildGenericMetalScenarios({
        metal: detectedMetal,
        scenarioWeights,
        purity,
        pricePerGramUsd,
      });

      preciousMetalValue = {
        metal: detectedMetal,
        purityAssumption: getPurityAssumption(detectedMetal, purity),
        spotPricePerGramUsd: roundMoney(pricePerGramUsd),
        note:
          "Conditional spot-price scenarios only. Exact valuation requires gram weight, purity or hallmark, and direct testing.",
        scenarios,
        warning: spotPrices.warning,
      };
    }

    preciousMetalMarketContext = `
The item may contain ${metalLabel}, but it is not confirmed_precious_metal.

Precious metal confidence classification:
- Classification category: ${
      metalClassification.confidenceLevel === "likely_plated"
        ? "likely_plated_or_costume"
        : "possible_precious_metal"
    }
- Confidence level: ${metalClassification.confidenceLevel}
- Can use spot price for direct valuation: no
- Required evidence: ${metalClassification.requiredEvidence.join("; ")}
- Evidence source: ${hasFollowUpClaim ? "additional visitor information, not image-only proof" : "provided fields and available evidence"}
${hasFollowUpClaim ? `- Additional visitor information: ${followUpClaim}` : ""}

Live metal spot prices from Metals.dev:
- Gold XAU USD/troy ounce: ${spotPrices.goldOunceUSD}
- Gold XAU USD/gram: ${spotPrices.goldGramUSD}
- Silver XAG USD/troy ounce: ${spotPrices.silverOunceUSD}
- Silver XAG USD/gram: ${spotPrices.silverGramUSD}
- Platinum XPT USD/troy ounce: ${spotPrices.platinumOunceUSD}
- Platinum XPT USD/gram: ${spotPrices.platinumGramUSD}
- Palladium XPD USD/troy ounce: ${spotPrices.palladiumOunceUSD}
- Palladium XPD USD/gram: ${spotPrices.palladiumGramUSD}
- Copper XCU USD/troy ounce: ${spotPrices.copperOunceUSD}
- Copper XCU USD/gram: ${spotPrices.copperGramUSD}
- Updated at: ${spotPrices.updatedAt}
- Source: ${spotPrices.source}
${spotPrices.warning ? `- Internal warning: ${spotPrices.warning}` : ""}

Selected metal calculation:
- Metal: ${metalLabel}
- USD per troy ounce: ${ouncePriceUsd}
- USD per gram: ${roundMoney(pricePerGramUsd)}
- Purity hint, if any: ${purity ? getPurityAssumption(detectedMetal, purity) : "not confirmed"}
- Weight provided: ${weightGrams ? `${roundMoney(weightGrams)} grams` : "not confirmed"}
${preciousMetalValue?.scenarios?.length ? `- Conditional weight scenarios were prepared from today's ${metalLabel} spot price: ${preciousMetalValue.scenarios.map((scenario) => `${scenario.weightGrams}g: raw $${scenario.meltValueUsdMid}, antique range $${scenario.antiqueEstimateUsdLow}-$${scenario.antiqueEstimateUsdHigh}`).join("; ")}` : ""}

Strict rule:
Do NOT calculate the estimated value from ${metalLabel} spot price.
Do NOT set the primary valuation to raw gold/silver/platinum/palladium value.
If a karat/purity claim exists but weight is missing, state: "لا يمكن حساب قيمة الذهب بدقة بدون وزن القطعة بالغرام."
Show the formula only: metal value = weight in grams × current metal gram price × purity factor.
Give two tracks only:
1. Value as accessory, plated, alloy, costume, or decorative object based on visible quality and market comparables.
2. Conditional precious-metal scenario only if hallmark, exact gram weight, and purity/karat are later confirmed.
Ask for close-up hallmark photos, gram weight, karat/purity, and jeweler/XRF testing.
If this came from Add info, begin the conditional scenario with: "حسب المعلومة التي أضافها المستخدم".
If locale is Arabic, write all of this naturally in Arabic.
`;
  }
  }
  metalPricesDurationMs = performance.now() - metalPricesStartedAt;
  logDevelopmentTiming("metalPrices", metalPricesStartedAt);
}

const marketReferences = await marketReferencesPromise;
logDevelopmentTiming("marketReferencesSupabase", marketReferencesStartedAt, {
  skipped: isFollowUpUpdate,
});
logDevelopmentTiming("parallelEvaluationGroupServer", serverParallelGroupStartedAt, {
  operations: ["marketReferencesSupabase", "metalPricesIfRequired"],
  execution: "parallel",
});
if (process.env.NODE_ENV !== "production") {
  const sequentialBeforeOptimization =
    marketReferencesDurationMs + metalPricesDurationMs;
  const parallelDuration = performance.now() - serverParallelGroupStartedAt;
  console.info(
    `[KISHIB TIMING] sequentialBeforeOptimizationServer: ${Math.round(sequentialBeforeOptimization)}ms`,
  );
  console.info(
    `[KISHIB TIMING] timeSavedEstimateServer: ${Math.max(0, Math.round(sequentialBeforeOptimization - parallelDuration))}ms`,
    { group: "marketReferencesSupabase + metalPricesIfRequired" },
  );
}

const marketReferencesText =
  formatMarketReferencesForPrompt(marketReferences);

console.log("marketReferences found:", marketReferences.length);
console.log("marketReferences preview:", marketReferencesText.slice(0, 1200));
   
    const hasImage = images.length > 0 || uploadedImageUrls.length > 0;

    if (!hasImage && !notes) {
      return NextResponse.json(
        { error: "Please provide an image or a description." },
        { status: 400 }
      );
    }

    const oversizedImage = images.find((file) => file.size > 8 * 1024 * 1024);

    if (oversizedImage) {
      return NextResponse.json(
        { error: "Image is too large. Please upload an image smaller than 8MB." },
        { status: 400 }
      );
    }

    const visionImageCount = images.length > 0 ? images.length : uploadedImageUrls.length;

    let promptText = isFollowUpUpdate && followUpContext
      ? buildCompactFollowUpPrompt({
          locale,
          followUpClaim,
          followUpContext,
          hasImage,
          imageCount: visionImageCount,
          preciousMetalMarketContext,
          brandContext,
          artistContext,
        })
      : buildPrompt({
          locale,
          notes,
          followUpClaim,
          itemType,
          material,
          dimensions,
          weight,
          hasMark,
          hasImage,
          imageCount: visionImageCount,
          marketContext,
          marketReferencesText,
          preciousMetalMarketContext,
          brandContext,
          artistContext,
        });

    if (
      isFollowUpUpdate &&
      followUpContext &&
      promptText.length > FOLLOW_UP_PROMPT_MAX_CHARS
    ) {
      promptText = buildCompactFollowUpPrompt({
        locale,
        followUpClaim: cleanText(followUpClaim, 600),
        followUpContext,
        hasImage,
        imageCount: visionImageCount,
        preciousMetalMarketContext: cleanText(preciousMetalMarketContext, 900),
        brandContext: cleanText(brandContext, 500),
        artistContext: cleanText(artistContext, 1800),
      });
    }

    if (
      isFollowUpUpdate &&
      JSON.stringify({
        text: promptText,
        imageCount: visionImageCount,
      }).length > FOLLOW_UP_PROMPT_MAX_CHARS
    ) {
      return NextResponse.json(
        { error: getCleanTooLongMessage(locale) },
        { status: 413 },
      );
    }

    const inputContent: Array<
      | { type: "input_text"; text: string }
      | {
          type: "input_image";
          image_url: string;
          detail: "low" | "high" | "auto";
        }
    > = [
      {
        type: "input_text",
        text: promptText,
      },
    ];
    const geminiImages: GeminiImageInput[] = [];

    const totalVisionImages =
      images.length > 0
        ? images.slice(0, 6).length
        : uploadedImageUrls.slice(0, 6).length;

    const visionPreparationStartedAt = performance.now();
    const visionFiles = images.slice(0, 6);
    const imageDataUrls = await Promise.all(
      visionFiles.map((file) => fileToDataUrl(file)),
    );

    for (const [index, dataUrl] of imageDataUrls.entries()) {

      inputContent.push({
        type: "input_text",
        text: `Uploaded image ${index + 1} of ${totalVisionImages}. Inspect it as one view/detail of the same item. If this is a stamp, hallmark, signature, back, side, damage, or material close-up, use it as supporting evidence for the full-object appraisal, not as a separate object.`,
      });
      inputContent.push({
        type: "input_image",
        image_url: dataUrl,
        detail: isFollowUpUpdate ? "low" : "auto",
      });
      geminiImages.push({ dataUrl });
    }

    const imageUrlsForVision = images.length > 0 ? [] : uploadedImageUrls.slice(0, 6);

    for (const [index, imageUrl] of imageUrlsForVision.entries()) {
      inputContent.push({
        type: "input_text",
        text: `Uploaded image ${index + 1} of ${totalVisionImages}. Inspect it as one view/detail of the same item. Use marks, stamps, signatures, labels, backs, and close-ups as evidence for the main object.`,
      });
      inputContent.push({
        type: "input_image",
        image_url: imageUrl,
        detail: isFollowUpUpdate ? "low" : "auto",
      });
      geminiImages.push({ url: imageUrl });
    }
    logDevelopmentTiming("visionPayloadPreparation", visionPreparationStartedAt, {
      imageCount: totalVisionImages,
      execution: imageDataUrls.length > 1 ? "parallel" : "single",
    });

    const primaryAiStartedAt = performance.now();
    const response = await client.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: inputContent,
        },
      ],
      text: {
        format: {
          type: "json_object",
        },
      },
      temperature: 0.25,
      max_output_tokens: 1800,
    });
    logDevelopmentTiming("primaryAI", primaryAiStartedAt);

    const rawText = response.output_text;

    let parsed: Partial<AnalysisResult>;

    const primaryJsonStartedAt = performance.now();
    try {
      parsed = JSON.parse(rawText) as Partial<AnalysisResult>;
    } catch {
      return NextResponse.json(
        {
          error: "AI returned invalid JSON",
          raw: rawText,
        },
        { status: 500 }
      );
    }
    logDevelopmentTiming("primaryJsonParsing", primaryJsonStartedAt);

    const fallback = isFollowUpUpdate
      ? buildFollowUpFallbackResult(followUpContext, locale)
      : buildFallbackResult(locale);
const normalized = normalizeResult(parsed, fallback, locale);

if (!shouldUseBrandLayer) {
  normalized.brandAssessment = undefined;
}

if (brandAssessment && !normalized.brandAssessment) {
  normalized.brandAssessment = {
    possibleBrand: brandAssessment.brandName,
    category: brandAssessment.category,
    confidence: brandAssessment.confidence,
    authenticityStatus: "لا يمكن الجزم من الصور فقط",
    missingEvidence: brandAssessment.missingEvidence,
    requiredPhotos: brandAssessment.requiredPhotos,
    priceScenario:
      "السعر مشروط: يختلف إذا كانت القطعة أصلية وموثقة، أو مستوحاة/مقلدة، أو Vintage مرغوبة، وحسب الحالة والملحقات.",
  };
}

if (!preciousMetalValue && isPreciousMetalCandidate) {
  const normalizedMetalText = [
    normalized.title,
    normalized.itemType,
    normalized.material,
    normalized.lookup,
    normalized.priceReasoning,
    normalized.authenticity,
    notes,
    followUpClaim,
    hasMark,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const scenarioMetal =
    detectPreciousMetal(normalizedMetalText) ??
    (normalizedMetalText.includes("فضة") ||
    normalizedMetalText.includes("فضي") ||
    normalizedMetalText.includes("نقره") ||
    normalizedMetalText.includes("زیو")
      ? "silver"
      : normalizedMetalText.includes("ذهب") ||
          normalizedMetalText.includes("ذهبي") ||
          normalizedMetalText.includes("طلا")
        ? "gold"
        : null);

  if (
    (scenarioMetal === "silver" || scenarioMetal === "gold") &&
    !hasPlatedOrCostumeEvidence(normalizedMetalText)
  ) {
    const postAiMetalPricesStartedAt = performance.now();
    const spotPrices = await getMetalSpotPrices();
    logDevelopmentTiming("metalPricesPostAI", postAiMetalPricesStartedAt);
    if (spotPrices) {
      const pricePerGramUsd = getMetalGramPrice(spotPrices, scenarioMetal);
      const purity = detectMetalPurity(scenarioMetal, normalizedMetalText);
      const scenarioWeights = scenarioMetal === "silver" ? [100, 250, 500] : [10, 30, 80];

      preciousMetalValue = {
        metal: scenarioMetal,
        purityAssumption: getPurityAssumption(scenarioMetal, purity),
        spotPricePerGramUsd: roundMoney(pricePerGramUsd),
        note:
          "Conditional market-price scenarios only. Exact valuation requires gram weight, purity or hallmark, and direct testing.",
        scenarios: buildGenericMetalScenarios({
          metal: scenarioMetal,
          scenarioWeights,
          purity,
          pricePerGramUsd,
        }),
        warning: spotPrices.warning,
      };
    }
  }
}

if (preciousMetalValue && isPreciousMetalCandidate) {
  normalized.metalValue = preciousMetalValue;

  if (preciousMetalValue.scenarios?.length) {
    const firstScenario = preciousMetalValue.scenarios[0];
    const lastScenario =
      preciousMetalValue.scenarios[preciousMetalValue.scenarios.length - 1];

    const scenarioSuffix =
      locale === "ar" ? "حسب احتمالات الوزن" : "based on weight scenarios";
    normalized.estimatedValue = `$${firstScenario.antiqueEstimateUsdLow} - $${lastScenario.antiqueEstimateUsdHigh} ${scenarioSuffix}`;
  } else if (preciousMetalValue.meltValueUsdMid) {
    const min = Math.round(preciousMetalValue.meltValueUsdMid);
    const max = Math.round((preciousMetalValue.meltValueUsdHigh ?? preciousMetalValue.meltValueUsdMid) * 1.8);
    normalized.estimatedValue = `$${min} - $${max}`;
  }
} else if (!isPreciousMetalCandidate) {
  normalized.metalValue = undefined;
  normalized.valuation_scenarios = normalized.valuation_scenarios?.map((scenario) => ({
    ...scenario,
    materialValueMin: undefined,
    materialValueMax: undefined,
    antiquePremiumMin: undefined,
    antiquePremiumMax: undefined,
  }));
  normalized.valuationScenarios = normalized.valuationScenarios?.map((scenario) => ({
    ...scenario,
    materialValueMin: undefined,
    materialValueMax: undefined,
    antiquePremiumMin: undefined,
    antiquePremiumMax: undefined,
  }));
}

const secondaryAiStartedAt = performance.now();
const geminiSecondOpinion = await getGeminiSecondOpinion({
  locale,
  notes: [notes, followUpClaim, itemType, material, dimensions, weight, hasMark, exhibitionContext ? `Exhibition context: ${exhibitionContext}` : ""]
    .filter(Boolean)
    .join("\n"),
  openAiResult: normalized,
  images: geminiImages,
});
logDevelopmentTiming("secondaryAI", secondaryAiStartedAt, {
  provider: "Gemini",
});

if (!geminiSecondOpinion) {
  console.info("[Gemini second opinion] continuing with OpenAI result only");
}

const secondaryMergeStartedAt = performance.now();
const reviewedResult = mergeGeminiSecondOpinion(
  normalized,
  geminiSecondOpinion,
  locale,
);
logDevelopmentTiming("mergeSecondaryAI", secondaryMergeStartedAt);

const deepSeekStartedAt = performance.now();
const deepSeekReview = await getDeepSeekLogicReview({
  locale,
  notes: [notes, followUpClaim, itemType, material, dimensions, weight, hasMark]
    .filter(Boolean)
    .join("\n"),
  openAiResult: normalized,
  geminiSecondOpinion,
  marketContext: [
    marketContext,
    marketReferencesText,
    preciousMetalMarketContext,
    artistContext,
  ]
    .filter(Boolean)
    .join("\n\n"),
});
logDevelopmentTiming("deepSeek", deepSeekStartedAt);

const finalMergeStartedAt = performance.now();
const finalReviewedResult = mergeDeepSeekLogicReview(
  reviewedResult,
  deepSeekReview,
  locale,
);
logDevelopmentTiming("mergeModelResults", finalMergeStartedAt);

const finalJsonStartedAt = performance.now();
const finalResponse = NextResponse.json(
  normalizeResult(finalReviewedResult, fallback, locale),
);
logDevelopmentTiming("finalJsonProcessing", finalJsonStartedAt);
logDevelopmentTiming("analyzeRouteTotal", totalStartedAt);
return finalResponse;
  } catch (error) {
    console.error("Analyze API error:", error);

    return NextResponse.json(
      {
        error: sanitizeApiError(error, requestLocale),
      },
      { status: 500 }
    );
  }
}
