import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildKnowledgeContext } from "../../../lib/antiqueKnowledge";
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

type Locale = "ar" | "en" | "fr" | "hi" | "fa" | "tr" | "ru" | "ku";

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
    metalValue?: {
    metal: "silver" | "gold" | "platinum" | "palladium" | "unknown";
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

type PreciousMetal = "gold" | "silver" | "platinum" | "palladium";
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

function normalizeLocale(locale: string): Locale {
  if (
    locale === "ar" ||
    locale === "en" ||
    locale === "fr" ||
    locale === "hi" ||
    locale === "fa" ||
    locale === "tr" ||
    locale === "ru" ||
    locale === "ku"
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
    text.includes("exact listed price")
  );
}

function buildHouseOfAntiquesRule(marketContext?: string) {
  if (!hasHouseOfAntiquesContext(marketContext)) {
    return `
HOUSE OF ANTIQUES STORE STATUS:
No verified House of Antiques store context was provided.
Do not claim the item exists in House of Antiques store unless the market context explicitly says so.
`;
  }

  return `
HOUSE OF ANTIQUES STORE COMPARISON RULE:

The market comparison context includes House of Antiques internal store data.
This is not a random internet result, but it is still only a comparable reference.
Use House of Antiques only when the provided Match confidence is exactly "exact".
If confidence is strong, partial, weak, none, or missing, ignore House of Antiques completely for identification, price, description, similar items, and user-facing wording.
Do not make House of Antiques the basis of identification or valuation unless the uploaded item is clearly the same object.

If the House of Antiques context includes a title, description, material, price, product URL, SKU, or product ID:
- Read the provided Match confidence value as exact, strong, partial, weak, or none.
- If confidence is exact and the image strongly supports it, you may use the store listing as a direct internal match.
- If confidence is not exact, do not use the store listing at all.
- Do NOT say "لم يتم العثور على مقارنة مباشرة" or "no direct comparison was found".
- Do NOT say there is a store match unless confidence is exact.
- Do NOT use a store price unless confidence is exact.
- Do NOT replace the item with a generic category if the store data is specific.
- In priceReasoning, mention House of Antiques only when confidence is exact and it actually affected the range.
- The final estimate must still be based on the uploaded image, visible condition, material, age clues, user notes, and overall market logic.

Arabic wording rule:
If answering in Arabic and House of Antiques data exists, do not write:
"لم يتم العثور على مقارنة مباشرة"
"لم يتم العثور على القطعة في المتجر"
"لا توجد مقارنة موثوقة"
unless the context explicitly says the match failed.

Only if confidence is exact, write that an exact internal House of Antiques match was used as one pricing reference.
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
- House of Antiques internal store comparables only when Match confidence is exactly "exact"

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

User provided:
- Notes: ${fields.notes || "Not provided"}
- User-provided follow-up claim: ${fields.followUpClaim || "Not provided"}
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

${objectTypeGuidance}

${externalSourceGuidance}

CRITICAL USER NOTES RULE:
The user's notes are important evidence.
If the user provides a local name, cultural use, family history, market term, rarity claim, weight, age, or functional description, treat it as a serious clue.
Do not ignore it and replace it with a generic label.
If the visual evidence and the user's notes disagree, explain the disagreement carefully and lower confidence.
If the user says the item is heavy, rare, handmade, old, regional, or used in a traditional craft, this must affect the valuation logic.
If a User-provided follow-up claim is present, treat it as a claim added by the user after the first analysis, not as visual evidence.
When using a follow-up claim, explicitly say "according to the information added by the user" in the selected language.
For Arabic locale, use this phrasing naturally: "حسب المعلومة التي أضافها المستخدم".
Do not write English user-facing output when locale is Arabic.

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

Market comparison context from Google Lens, visual search, and internal House of Antiques store:
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
For silver with 925 or sterling, use 0.925 purity. If purity is missing, use a cautious range.
If the item is only possible gold, say: "لا يمكن تأكيد أن القطعة ذهب صلب من الصورة فقط. نحتاج صورة قريبة للختم أو الوزن والعيار."
Add this note for gold, silver, platinum, or palladium results: "تم استخدام سعر المعدن المباشر بالدولار للأونصة وتحويله إلى سعر الغرام. التقييم يبقى تقديرياً وقد يختلف حسب العيار والوزن والحالة."

INTERNAL KISHIB MARKET REFERENCES FROM SUPABASE:
${internalMarketReferences}

INTERNAL MARKET REFERENCES RULES:
- These references come from the KISHIB internal market_references database.
- Use them when they are relevant by object type, material, origin, style, period, or function.
- Do not claim an exact match unless the reference is clearly the same object.
- If references are only similar, describe them as comparable references only.
- House of Antiques references are usable only when the match confidence is exactly "exact".
- Auction and sold_listing references are stronger than asking_price references.
- If internal references contain useful price ranges, the estimated value must be consistent with them.
- If internal references are weak, unrelated, or missing, lower confidence and say the valuation is preliminary.
- Do not invent references, prices, sources, or URLs that are not listed in the internal references.

${houseOfAntiquesRule}

HOW TO USE MARKET COMPARISON CONTEXT:

1. Google Lens results:
- Treat Google Lens results as visual clues only.
- Do not copy Google Lens titles or prices blindly.
- Ignore unrelated visual matches.
- Use them to understand object type, comparable forms, auction/museum presence, and market direction.

If a Google Lens or Google Custom Search result points to a museum/knowledge source, use it for style and identification only.
If it points to an auction/market source with a real sold/completed/realized price, use it as comparable market evidence only after checking relevance.

2. House of Antiques internal comparables:
- House of Antiques Store comparables are internal retail references from the owner's real antiques inventory.
- Use them only when Match confidence is exactly "exact".
- If confidence is strong, partial, weak, none, uncertain, or missing, ignore House of Antiques completely.
- Do not mention House of Antiques to the user unless confidence is exactly "exact".
- Do not use House of Antiques titles, descriptions, images, product categories, or prices unless confidence is exactly "exact".
- If confidence is exactly "exact", compare the title, identification, description, and price reasoning with the internal comparable unless the user description clearly contradicts it.
- If confidence is exactly "exact", the listed retail price may be used as one serious internal reference, but not as the automatic final appraisal value.

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

Only exact House of Antiques matches can support or adjust market reasoning, and they do not override the visual analysis.

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
- exact House of Antiques internal match, only if Match confidence is exactly "exact"
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
If an exact House of Antiques internal match was found, priceReasoning must mention whether it affected the estimate.
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
  "estimatedValue": "preliminary USD price range. If an exact House of Antiques match is provided, consider its listed price as one comparable reference only",
"priceReasoning": "why this value range was suggested. If an exact House of Antiques match affected the range, mention it as a matched internal reference, not as the only basis.",  "history": "short historical/contextual explanation about this kind of object",
  "valueDrivers": ["things that may increase value"],
  "valueReducers": ["things that may reduce value"],
  "visualSearchKeywords": ["short search keyword for finding similar items online"],
  "neededPhotos": ["specific photo needed"],
  "followUpQuestion": "one clear next question",
  "confidence": 1,
  "confidenceNote": "why confidence is low, medium, or high",
    "metalValue": null,
    "brandAssessment": null,

If a precious metal value was provided, set "metalValue" as an object:
{
  "metal": "silver | gold | platinum | palladium",
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
- Did you ignore House of Antiques unless confidence is exactly "exact"?
- Did you avoid pricing rare regional heritage objects as ordinary used items?
- Did you ask for the right next photos?
- Is the price range defensible?
`;
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

function normalizeBrandAssessment(value: unknown) {
  if (!value || typeof value !== "object") return undefined;

  const data = value as Partial<NonNullable<AnalysisResult["brandAssessment"]>>;
  const confidence =
    data.confidence === "high" ||
    data.confidence === "medium" ||
    data.confidence === "low"
      ? data.confidence
      : "low";

  return {
    possibleBrand: normalizeString(data.possibleBrand, ""),
    category: normalizeString(data.category, ""),
    confidence,
    authenticityStatus: normalizeString(data.authenticityStatus, ""),
    missingEvidence: normalizeArray(data.missingEvidence, []),
    requiredPhotos: normalizeArray(data.requiredPhotos, []),
    priceScenario: normalizeString(data.priceScenario, ""),
  };
}

function normalizeResult(
  parsed: Partial<AnalysisResult>,
  fallback: AnalysisResult
): AnalysisResult {
  const confidence =
    typeof parsed.confidence === "number"
      ? Math.min(10, Math.max(1, parsed.confidence))
      : fallback.confidence;

  return {
    title: normalizeString(parsed.title, fallback.title),
    itemType: normalizeString(parsed.itemType, fallback.itemType),
    lookup: normalizeString(parsed.lookup, fallback.lookup),
    timePeriod: normalizeString(parsed.timePeriod, fallback.timePeriod),
    origin: normalizeString(parsed.origin, fallback.origin),
    material: normalizeString(parsed.material, fallback.material),
    style: normalizeString(parsed.style, fallback.style),
    condition: normalizeString(parsed.condition, fallback.condition),
    authenticity: normalizeString(parsed.authenticity, fallback.authenticity),
    estimatedValue: normalizeString(parsed.estimatedValue, fallback.estimatedValue),
    priceReasoning: normalizeString(parsed.priceReasoning, fallback.priceReasoning),
    history: normalizeString(parsed.history, fallback.history),
    valueDrivers: normalizeArray(parsed.valueDrivers, fallback.valueDrivers),
    valueReducers: normalizeArray(parsed.valueReducers, fallback.valueReducers),
    visualSearchKeywords: normalizeArray(
      parsed.visualSearchKeywords,
      fallback.visualSearchKeywords
    ),
    neededPhotos: normalizeArray(parsed.neededPhotos, fallback.neededPhotos),
    followUpQuestion: normalizeString(
      parsed.followUpQuestion,
      fallback.followUpQuestion
    ),
    confidence,
    confidenceNote: normalizeString(parsed.confidenceNote, fallback.confidenceNote),
    disclaimer: normalizeString(parsed.disclaimer, fallback.disclaimer),
        metalValue: parsed.metalValue,
    brandAssessment: normalizeBrandAssessment(parsed.brandAssessment),
  };
}

async function fileToDataUrl(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/jpeg";

  return `data:${mimeType};base64,${base64}`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing" },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

const formData = await request.formData();

const imageEntries = [...formData.getAll("images"), ...formData.getAll("image")];
const images = imageEntries.filter(
  (entry): entry is File => entry instanceof File && entry.size > 0,
);
const uploadedImageUrls = formData
  .getAll("uploadedImageUrls")
  .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
  .map((entry) => entry.trim());
const notes = safeString(formData.get("notes"));
const followUpClaim = safeString(formData.get("followUpClaim"));
const locale = normalizeLocale(safeString(formData.get("locale")));
const marketContext = safeString(formData.get("marketContext"));

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

const preciousMetalContextText = [
  followUpClaim || notes,
  itemType,
  material,
  dimensions,
  weight,
  hasMark,
  marketContext,
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

if (metalClassification.metal) {
  const detectedMetal = metalClassification.metal;
  const weightGrams = preliminaryWeightGrams;
  const purity =
    metalClassification.purityFactor ??
    detectMetalPurity(detectedMetal, preciousMetalContextText);
  const spotPrices = await getMetalSpotPrices();
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
- Evidence source: ${hasFollowUpClaim ? "user-provided follow-up claim, not image-only proof" : "provided fields and available evidence"}
${hasFollowUpClaim ? `- User-provided claim: ${followUpClaim}` : ""}

Live precious metal spot prices from Gold API:
- Gold XAU USD/troy ounce: ${spotPrices.goldOunceUSD}
- Gold XAU USD/gram: ${spotPrices.goldGramUSD}
- Silver XAG USD/troy ounce: ${spotPrices.silverOunceUSD}
- Silver XAG USD/gram: ${spotPrices.silverGramUSD}
- Platinum XPT USD/troy ounce: ${spotPrices.platinumOunceUSD}
- Platinum XPT USD/gram: ${spotPrices.platinumGramUSD}
- Palladium XPD USD/troy ounce: ${spotPrices.palladiumOunceUSD}
- Palladium XPD USD/gram: ${spotPrices.palladiumGramUSD}
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
- Evidence source: ${hasFollowUpClaim ? "user-provided follow-up claim, not image-only proof" : "provided fields and available evidence"}
${hasFollowUpClaim ? `- User-provided claim: ${followUpClaim}` : ""}

Live precious metal spot prices from Gold API:
- Gold XAU USD/troy ounce: ${spotPrices.goldOunceUSD}
- Gold XAU USD/gram: ${spotPrices.goldGramUSD}
- Silver XAG USD/troy ounce: ${spotPrices.silverOunceUSD}
- Silver XAG USD/gram: ${spotPrices.silverGramUSD}
- Platinum XPT USD/troy ounce: ${spotPrices.platinumOunceUSD}
- Platinum XPT USD/gram: ${spotPrices.platinumGramUSD}
- Palladium XPD USD/troy ounce: ${spotPrices.palladiumOunceUSD}
- Palladium XPD USD/gram: ${spotPrices.palladiumGramUSD}
- Updated at: ${spotPrices.updatedAt}
- Source: ${spotPrices.source}
${spotPrices.warning ? `- Internal warning: ${spotPrices.warning}` : ""}

Selected metal calculation:
- Metal: ${metalLabel}
- USD per troy ounce: ${ouncePriceUsd}
- USD per gram: ${roundMoney(pricePerGramUsd)}
- Purity hint, if any: ${purity ? getPurityAssumption(detectedMetal, purity) : "not confirmed"}
- Weight provided: ${weightGrams ? `${roundMoney(weightGrams)} grams` : "not confirmed"}

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

const marketReferences = await searchMarketReferences({
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
    notes,
  ].filter(Boolean) as string[],
});

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
text: buildPrompt({
  locale,
  notes,
  followUpClaim,
  itemType,
  material,
  dimensions,
  weight,
  hasMark,
  hasImage,
  imageCount: images.length + uploadedImageUrls.length,
  marketContext,
  marketReferencesText,
  preciousMetalMarketContext,
  brandContext,
}),
      },
    ];

    for (const file of images.slice(0, 6)) {
      const dataUrl = await fileToDataUrl(file);

      inputContent.push({
        type: "input_image",
        image_url: dataUrl,
        detail: "auto",
      });
    }

    for (const imageUrl of uploadedImageUrls.slice(0, Math.max(0, 6 - images.length))) {
      inputContent.push({
        type: "input_image",
        image_url: imageUrl,
        detail: "auto",
      });
    }

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

    const rawText = response.output_text;

    let parsed: Partial<AnalysisResult>;

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

    const fallback = buildFallbackResult(locale);
const normalized = normalizeResult(parsed, fallback);

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

if (preciousMetalValue) {
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
}

return NextResponse.json(normalized);
  } catch (error) {
    console.error("Analyze API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to analyze item",
      },
      { status: 500 }
    );
  }
}
