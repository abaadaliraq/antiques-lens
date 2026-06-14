import { NextResponse } from "next/server";
import {
  hasHouseSupabaseConfig,
  houseSupabase,
} from "../../../lib/houseSupabase";

export const runtime = "nodejs";

const STRONG_MATCH_CONFIDENCE_THRESHOLD = 0.88;
const VISIBLE_IMAGE_SIMILARITY_THRESHOLD = 0.92;

type MatchConfidence = "exact" | "strong" | "partial" | "weak" | "none";

type HouseComparable = {
  id: string;
  slug: string;
  sku: string;
  title: string;
  description: string;
  category: string;
  material: string;
  period: string;
  origin: string;
  price: string;
  currency: string;
  imageUrl: string;
  images: string[];
  url: string;
  source: string;
  score: number;
  confidence: MatchConfidence;
  confidenceScore: number;
  visualSimilarity: number;
  matchReason: string;
  hasStrongMatch: boolean;
  sameObjectType: boolean;
  categoryMatch: boolean;
  materialOrFinishCompatible: boolean;
  shapeMatch: boolean;
  decorativeMotifMatch: boolean;
  structuralMatch: boolean;
};

type HouseOfAntiquesContext = {
  found: boolean;
  confidence: MatchConfidence;
  matches: HouseComparable[];
  contextText: string;
};

type ProductImageRow = {
  product_id: string;
  image_url: string;
  sort_order: number | null;
};

type ProductRow = Record<string, unknown>;

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArabic(text: string) {
  return text
    .toLowerCase()
    .replace(/[Ø£Ø¥Ø¢Ø§]/g, "Ø§")
    .replace(/[Ù‰]/g, "ÙŠ")
    .replace(/[Ø©]/g, "Ù‡")
    .replace(/[Ø¤]/g, "Ùˆ")
    .replace(/[Ø¦]/g, "ÙŠ")
    .replace(/[Ú¯]/g, "Ùƒ")
    .replace(/[Ù‚]/g, "Ù‚")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}\s\-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: unknown) {
  return normalizeArabic(safeText(value));
}

function uniqueList(values: string[]) {
  const seen = new Set<string>();

  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
}

function buildSearchTerms(input: string) {
  const normalized = normalizeArabic(input);

  const words = normalized
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => word.length >= 2);

  const phrases: string[] = [];

  for (let i = 0; i < words.length; i += 1) {
    const two = [words[i], words[i + 1]].filter(Boolean).join(" ");
    const three = [words[i], words[i + 1], words[i + 2]].filter(Boolean).join(" ");

    if (two.split(" ").length === 2) phrases.push(two);
    if (three.split(" ").length === 3) phrases.push(three);
  }

  return uniqueList([...words, ...phrases]).slice(0, 80);
}

function addMany(set: Set<string>, values: string[]) {
  values.forEach((value) => {
    const normalized = normalizeArabic(value);
    if (normalized) set.add(normalized);
  });
}

const ITEM_FAMILY_TERMS: Record<string, string[]> = {
  samovar: ["samovar", "semaver", "Ø³Ù…Ø§ÙˆØ±"],
  statue: [
    "statue",
    "figurine",
    "sculpture",
    "idol",
    "heykel",
    "figÃ¼r",
    "figÃ¼rin",
    "ØªÙ…Ø«Ø§Ù„",
  ],
  painting: ["painting", "artwork", "canvas", "watercolor", "Ù„ÙˆØ­Ø©", "resim", "tablo"],
  table: ["table", "stand", "Ø·Ø§ÙˆÙ„Ø©", "masa"],
  lamp: ["lamp", "Ù…ØµØ¨Ø§Ø­", "lamba"],
  candlestick: ["candlestick", "candle", "Ø´Ù…Ø¹Ø¯Ø§Ù†", "ÅŸamdan"],
  ewer: ["ewer", "pitcher", "jug", "Ø¥Ø¨Ø±ÙŠÙ‚", "ibrik", "sÃ¼rahi"],
  vase: ["vase", "jar", "vessel", "Ù…Ø²Ù‡Ø±ÙŠØ©", "ÙØ§Ø²Ø©", "vazo"],
  box: ["box", "chest", "case", "Ø¹Ù„Ø¨Ø©", "ØµÙ†Ø¯ÙˆÙ‚", "kutu"],
  cabinet: ["cabinet", "showcase", "display", "Ø®Ø²Ø§Ù†Ø©", "dolap", "vitrin"],
  tray: ["tray", "ØµÙŠÙ†ÙŠØ©", "tepsi"],
  bowl: ["bowl", "dish", "ÙˆØ¹Ø§Ø¡", "Ø·Ø¨Ù‚", "kase"],
  bucket: ["bucket", "pail", "coal bucket", "coal scuttle", "bin", "Ã˜Â¯Ã™â€žÃ™Ë†", "Ã˜Â³Ã˜Â·Ã™â€ž"],
};

function detectItemFamilies(text: string) {
  const normalized = normalizeArabic(text);
  const families = new Set<string>();

  for (const [family, terms] of Object.entries(ITEM_FAMILY_TERMS)) {
    if (terms.some((term) => normalized.includes(normalizeArabic(term)))) {
      families.add(family);
    }
  }

  return families;
}

function hasFamilyOverlap(queryFamilies: Set<string>, product: ProductRow) {
  if (queryFamilies.size === 0) return false;

  const productFamilies = detectItemFamilies(
    [productTitleText(product), productHaystack(product)].join(" "),
  );

  if (productFamilies.size === 0) return false;

  return Array.from(queryFamilies).some((family) => productFamilies.has(family));
}

function getProductFamilies(product: ProductRow) {
  return detectItemFamilies(
    [productTitleText(product), productHaystack(product)].join(" "),
  );
}

function hasAnyTerm(text: string, values: string[]) {
  const normalizedText = normalizeArabic(text);

  return values.some((value) => normalizedText.includes(normalizeArabic(value)));
}

function hasMaterialOrFinishCompatible(terms: string[], product: ProductRow) {
  const queryText = terms.join(" ");
  const productText = productAttributeText(product);
  const materialGroups = [
    ["brass", "copper", "bronze", "metal", "Ã™â€ Ã˜Â­Ã˜Â§Ã˜Â³", "Ã˜Â¨Ã˜Â±Ã™Ë†Ã™â€ Ã˜Â²", "Ã˜ÂµÃ™ÂÃ˜Â±"],
    ["silver", "sterling", "925", "Ã™ÂÃ˜Â¶Ã˜Â©"],
    ["gold", "gilded", "Ã™â€¦Ã˜Â°Ã™â€¡Ã˜Â¨", "Ã˜Â°Ã™â€¡Ã˜Â¨"],
    ["wood", "wooden", "Ã˜Â®Ã˜Â´Ã˜Â¨"],
    ["ceramic", "pottery", "porcelain", "Ã˜Â®Ã˜Â²Ã™Â", "Ã™ÂÃ˜Â®Ã˜Â§Ã˜Â±"],
    ["glass", "crystal", "Ã˜Â²Ã˜Â¬Ã˜Â§Ã˜Â¬", "Ã™Æ’Ã˜Â±Ã™Å Ã˜Â³Ã˜ÂªÃ˜Â§Ã™â€ž"],
    ["textile", "rug", "carpet", "Ã˜Â³Ã˜Â¬Ã˜Â§Ã˜Â¯", "Ã™â€šÃ™â€¦Ã˜Â§Ã˜Â´"],
  ];
  const queryGroups = materialGroups.filter((group) => hasAnyTerm(queryText, group));

  if (queryGroups.length === 0) return false;

  return queryGroups.some((group) => hasAnyTerm(productText, group));
}

function hasDecorativeMotifOrStructuralMatch(terms: string[], product: ProductRow) {
  const queryText = terms.join(" ");
  const productText = productHaystack(product);
  const motifTerms = [
    "engraved",
    "etched",
    "ornate",
    "decorated",
    "islamic",
    "ottoman",
    "calligraphy",
    "quranic",
    "handmade",
    "Ã™â€¦Ã˜Â²Ã˜Â®Ã˜Â±Ã™Â",
    "Ã˜Â²Ã˜Â®Ã˜Â±Ã™ÂÃ˜Â©",
    "Ã˜Â­Ã™ÂÃ˜Â±",
    "Ã™â€¦Ã˜Â­Ã™ÂÃ™Ë†Ã˜Â±",
    "Ã˜Â¹Ã˜Â«Ã™â€¦Ã˜Â§Ã™â€ Ã™Å ",
    "Ã˜Â§Ã˜Â³Ã™â€žÃ˜Â§Ã™â€¦Ã™Å ",
  ];

  return hasAnyTerm(queryText, motifTerms) && hasAnyTerm(productText, motifTerms);
}

function expandTerms(rawTerms: string[]) {
  const expanded = new Set<string>();

  for (const term of rawTerms) {
    const normalizedTerm = normalizeArabic(term);
    if (!normalizedTerm) continue;

    expanded.add(normalizedTerm);

    if (
      [
        "ÙØ§Ø²Ù‡",
        "ÙØ§Ø²Ø©",
        "Ù…Ø²Ù‡Ø±ÙŠØ©",
        "Ù…Ø²Ù‡Ø±Ù‡",
        "Ø¬Ø±Ù‡",
        "Ø¬Ø±Ø©",
        "Ø§Ù†Ø§Ø¡",
        "Ø§Ù†ÙŠÙ‡",
        "vase",
        "jar",
      ].includes(normalizedTerm)
    ) {
      addMany(expanded, [
        "ÙØ§Ø²Ø©",
        "ÙØ§Ø²Ù‡",
        "Ù…Ø²Ù‡Ø±ÙŠØ©",
        "Ù…Ø²Ù‡Ø±Ù‡",
        "Ø¬Ø±Ø©",
        "Ø¬Ø±Ù‡",
        "Ø¥Ù†Ø§Ø¡",
        "Ø§Ù†Ø§Ø¡",
        "Ø¢Ù†ÙŠØ©",
        "Ø§Ù†ÙŠÙ‡",
        "vase",
        "jar",
        "vessel",
        "pot",
      ]);
    }

    if (
      [
        "Ø®Ø²Ù",
        "Ø®Ø²ÙÙŠ",
        "Ø®Ø²ÙÙŠÙ‡",
        "Ø®Ø²ÙÙŠØ©",
        "Ø³ÙŠØ±Ø§Ù…ÙŠÙƒ",
        "ÙØ®Ø§Ø±",
        "ceramic",
        "pottery",
      ].includes(normalizedTerm)
    ) {
      addMany(expanded, [
        "Ø®Ø²Ù",
        "Ø®Ø²ÙÙŠ",
        "Ø®Ø²ÙÙŠØ©",
        "Ø®Ø²ÙÙŠÙ‡",
        "Ø³ÙŠØ±Ø§Ù…ÙŠÙƒ",
        "ÙØ®Ø§Ø±",
        "ceramic",
        "pottery",
        "porcelain",
      ]);
    }

    if (
      [
        "Ù‚Ø±Ø§Ù†",
        "Ù‚Ø±Ø¢Ù†",
        "Ù‚Ø±Ø§Ù†ÙŠÙ‡",
        "Ù‚Ø±Ø¢Ù†ÙŠØ©",
        "Ø§ÙŠØ§Øª",
        "Ø¢ÙŠØ§Øª",
        "Ø§ÙŠÙ‡",
        "Ø¢ÙŠØ©",
        "ÙƒØªØ§Ø¨Ù‡",
        "ÙƒØªØ§Ø¨Ø©",
        "ÙƒØªØ§Ø¨ÙŠÙ‡",
        "ÙƒØªØ§Ø¨ÙŠØ©",
        "Ø®Ø·",
        "calligraphy",
        "quranic",
        "islamic",
      ].includes(normalizedTerm)
    ) {
      addMany(expanded, [
        "Ù‚Ø±Ø¢Ù†",
        "Ù‚Ø±Ø§Ù†",
        "Ù‚Ø±Ø¢Ù†ÙŠØ©",
        "Ù‚Ø±Ø§Ù†ÙŠÙ‡",
        "Ø¢ÙŠØ§Øª",
        "Ø§ÙŠØ§Øª",
        "Ø¢ÙŠØ©",
        "Ø§ÙŠÙ‡",
        "ÙƒØªØ§Ø¨Ø©",
        "ÙƒØªØ§Ø¨Ù‡",
        "ÙƒØªØ§Ø¨ÙŠØ©",
        "ÙƒØªØ§Ø¨ÙŠÙ‡",
        "Ø®Ø·",
        "Ø¹Ø±Ø¨ÙŠ",
        "Ø§Ø³Ù„Ø§Ù…ÙŠ",
        "Ø¥Ø³Ù„Ø§Ù…ÙŠ",
        "calligraphy",
        "quranic",
        "islamic",
        "arabic writing",
      ]);
    }

    if (
      [
        "Ø´ÙŠØ´Ù‡",
        "Ø´ÙŠØ´Ø©",
        "Ù†Ø±ÙƒÙŠÙ„Ù‡",
        "Ù†Ø±ÙƒÙŠÙ„Ø©",
        "Ø§Ø±ÙƒÙŠÙ„Ù‡",
        "Ø£Ø±ÙƒÙŠÙ„Ø©",
        "hookah",
        "shisha",
      ].includes(normalizedTerm)
    ) {
      addMany(expanded, [
        "Ø´ÙŠØ´Ø©",
        "Ø´ÙŠØ´Ù‡",
        "Ù†Ø±ÙƒÙŠÙ„Ø©",
        "Ù†Ø±ÙƒÙŠÙ„Ù‡",
        "Ø£Ø±ÙƒÙŠÙ„Ø©",
        "Ø§Ø±ÙƒÙŠÙ„Ù‡",
        "hookah",
        "shisha",
        "water pipe",
      ]);
    }

    if (["Ø³Ù…Ø§ÙˆØ±", "samovar"].includes(normalizedTerm)) {
      addMany(expanded, [
        "Ø³Ù…Ø§ÙˆØ±",
        "samovar",
        "tea",
        "brass",
        "copper",
        "Ù†Ø­Ø§Ø³",
      ]);
    }

    if (["Ù†Ø­Ø§Ø³", "Ù†Ø­Ø§Ø³ÙŠ", "Ù†Ø­Ø§Ø³ÙŠÙ‡", "brass", "copper"].includes(normalizedTerm)) {
      addMany(expanded, [
        "Ù†Ø­Ø§Ø³",
        "Ù†Ø­Ø§Ø³ÙŠ",
        "Ù†Ø­Ø§Ø³ÙŠØ©",
        "Ù†Ø­Ø§Ø³ÙŠÙ‡",
        "brass",
        "copper",
        "metal",
      ]);
    }

    if (["Ù„ÙˆØ­Ù‡", "Ù„ÙˆØ­Ø©", "Ø±Ø³Ù…", "ÙÙ†Ø§Ù†", "painting", "art"].includes(normalizedTerm)) {
      addMany(expanded, [
        "Ù„ÙˆØ­Ø©",
        "Ù„ÙˆØ­Ù‡",
        "Ø±Ø³Ù…",
        "ÙÙ†Ø§Ù†",
        "painting",
        "art",
        "artist",
        "signed",
      ]);
    }

    if (
      ["Ø®Ø²Ø§Ù†Ù‡", "Ø®Ø²Ø§Ù†Ø©", "Ø¹Ø±Ø¶", "ÙØ§ØªØ±ÙŠÙ†Ø§", "ÙƒØ§Ø¨ÙŠÙ†Ù‡", "cabinet", "display"].includes(
        normalizedTerm,
      )
    ) {
      addMany(expanded, [
        "Ø®Ø²Ø§Ù†Ø©",
        "Ø®Ø²Ø§Ù†Ù‡",
        "Ø¹Ø±Ø¶",
        "ÙØ§ØªØ±ÙŠÙ†Ø§",
        "ÙƒØ§Ø¨ÙŠÙ†Ø©",
        "ÙƒØ§Ø¨ÙŠÙ†Ù‡",
        "Ø®Ø´Ø¨",
        "Ø²Ø¬Ø§Ø¬",
        "cabinet",
        "display",
        "showcase",
        "wood",
        "glass",
      ]);
    }
  }

  return Array.from(expanded).slice(0, 120);
}

function productHaystack(product: ProductRow) {
  return [
    product.id,
    product.slug,
    product.sku,
    product.source_category,
    product.name_ar,
    product.name_en,
    product.name_ku,
    product.description_ar,
    product.description_en,
    product.description_ku,
    product.material_ar,
    product.material_en,
    product.material_ku,
    product.period_ar,
    product.period_en,
    product.period_ku,
    product.condition_ar,
    product.condition_en,
    product.condition_ku,
    product.origin_country,
    product.artist_name,
    product.keywords_ar,
    product.keywords_en,
    product.keywords_ku,
    product.seo_title,
    product.seo_description,
    product.price_amount,
    product.currency_code,
  ]
    .map(normalizeText)
    .join(" ");
}

function productAttributeText(product: ProductRow) {
  return [
    product.description_ar,
    product.description_en,
    product.description_ku,
    product.material_ar,
    product.material_en,
    product.material_ku,
    product.period_ar,
    product.period_en,
    product.period_ku,
    product.origin_country,
    product.artist_name,
    product.keywords_ar,
    product.keywords_en,
    product.keywords_ku,
    product.seo_title,
    product.seo_description,
    product.price_amount,
    product.currency_code,
  ]
    .map(normalizeText)
    .join(" ");
}

function productTitleText(product: ProductRow) {
  return [
    product.name_ar,
    product.name_en,
    product.name_ku,
    product.slug,
    product.sku,
    product.source_category,
  ]
    .map(normalizeText)
    .join(" ");
}

function productIdentityFields(product: ProductRow) {
  return [
    product.id,
    product.slug,
    product.sku,
    product.name_ar,
    product.name_en,
    product.name_ku,
  ]
    .map(normalizeText)
    .filter(Boolean);
}

function hasExactProductIdentityMatch(product: ProductRow, terms: string[]) {
  const identityFields = productIdentityFields(product);

  return terms.some((term) => {
    const normalizedTerm = normalizeArabic(term);

    if (normalizedTerm.length < 4) return false;

    return identityFields.some((field) => field === normalizedTerm);
  });
}

function getMatchReason(product: ProductRow, terms: string[]) {
  const titleText = productTitleText(product);
  const haystack = productHaystack(product);
  const attributeText = productAttributeText(product);

  const titleHits = terms.filter((term) => titleText.includes(term)).slice(0, 5);
  const attributeHits = terms
    .filter((term) => attributeText.includes(term))
    .slice(0, 5);
  const textHits = terms.filter((term) => haystack.includes(term)).slice(0, 5);

  if (titleHits.length > 0) {
    return `Matched reference title/SKU/category terms: ${titleHits.join(", ")}`;
  }

  if (attributeHits.length > 0) {
    return `Matched reference material/origin/period/keyword/price terms: ${attributeHits.join(", ")}`;
  }

  if (textHits.length > 0) {
    return `Matched reference description/material/keywords terms: ${textHits.join(", ")}`;
  }

  return "Weak internal store text match";
}

function scoreProduct(product: ProductRow, terms: string[]) {
  const haystack = productHaystack(product);
  const titleText = productTitleText(product);
  const attributeText = productAttributeText(product);

  let score = 0;

  for (const term of terms) {
    if (!term) continue;

    if (titleText === term) score += 80;
    if (titleText.includes(term)) score += 18;
    if (attributeText.includes(term)) score += 10;
    if (haystack.includes(term)) score += 6;

    const sku = normalizeText(product.sku);
    const slug = normalizeText(product.slug);
    const id = normalizeText(product.id);

    if (sku && sku.includes(term)) score += 40;
    if (slug && slug.includes(term)) score += 36;
    if (id && id.includes(term)) score += 45;
  }

  const isVaseQuery = terms.some((term) =>
    ["ÙØ§Ø²Ù‡", "ÙØ§Ø²Ø©", "Ù…Ø²Ù‡Ø±ÙŠØ©", "Ù…Ø²Ù‡Ø±Ù‡", "Ø¬Ø±Ù‡", "Ø¬Ø±Ø©", "vase", "jar"].includes(term),
  );

  const isQuranicQuery = terms.some((term) =>
    [
      "Ù‚Ø±Ø§Ù†",
      "Ù‚Ø±Ø¢Ù†",
      "Ù‚Ø±Ø§Ù†ÙŠÙ‡",
      "Ù‚Ø±Ø¢Ù†ÙŠØ©",
      "Ø§ÙŠØ§Øª",
      "Ø¢ÙŠØ§Øª",
      "ÙƒØªØ§Ø¨Ù‡",
      "ÙƒØªØ§Ø¨ÙŠØ©",
      "Ø®Ø·",
      "quranic",
      "calligraphy",
      "islamic",
    ].includes(term),
  );

  const isCeramicQuery = terms.some((term) =>
    ["Ø®Ø²Ù", "Ø®Ø²ÙÙŠ", "Ø®Ø²ÙÙŠÙ‡", "Ø®Ø²ÙÙŠØ©", "Ø³ÙŠØ±Ø§Ù…ÙŠÙƒ", "ÙØ®Ø§Ø±", "ceramic", "pottery"].includes(
      term,
    ),
  );

  const isCabinetQuery = terms.some((term) =>
    ["Ø®Ø²Ø§Ù†Ù‡", "Ø®Ø²Ø§Ù†Ø©", "ÙØ§ØªØ±ÙŠÙ†Ø§", "Ø¹Ø±Ø¶", "cabinet", "display", "showcase"].includes(
      term,
    ),
  );

  if (isVaseQuery && titleText.includes("ÙØ§Ø²Ù‡")) score += 35;
  if (isVaseQuery && titleText.includes("ÙØ§Ø²Ø©")) score += 35;
  if (isVaseQuery && titleText.includes("vase")) score += 35;
  if (isVaseQuery && haystack.includes("Ù…Ø²Ù‡Ø±")) score += 18;

  if (isQuranicQuery && haystack.includes("Ù‚Ø±Ø§Ù†")) score += 35;
  if (isQuranicQuery && haystack.includes("Ù‚Ø±Ø¢")) score += 35;
  if (isQuranicQuery && haystack.includes("Ø§ÙŠØ§Øª")) score += 26;
  if (isQuranicQuery && haystack.includes("Ø®Ø·")) score += 18;
  if (isQuranicQuery && haystack.includes("calligraphy")) score += 26;

  if (isCeramicQuery && haystack.includes("Ø®Ø²Ù")) score += 24;
  if (isCeramicQuery && haystack.includes("ceramic")) score += 24;
  if (isCeramicQuery && haystack.includes("pottery")) score += 20;

  if (isCabinetQuery && haystack.includes("Ø®Ø²Ø§Ù†Ù‡")) score += 30;
  if (isCabinetQuery && haystack.includes("Ø®Ø²Ø§Ù†Ø©")) score += 30;
  if (isCabinetQuery && haystack.includes("ÙØ§ØªØ±ÙŠÙ†Ø§")) score += 28;
  if (isCabinetQuery && haystack.includes("cabinet")) score += 30;
  if (isCabinetQuery && haystack.includes("display")) score += 20;

  if (product.featured_image) score += 3;
  if (product.status === "available") score += 4;
  if (product.is_available) score += 4;
  if (product.is_featured) score += 2;
  if (product.signed) score += 2;

  return score;
}

function getConfidence(
  score: number,
  product: ProductRow,
  terms: string[],
): MatchConfidence {
  const confidenceScore = getConfidenceScore(score, product, terms);
  const visualSimilarity = getVisualSimilarity(score, product, terms);

  if (
    confidenceScore >= STRONG_MATCH_CONFIDENCE_THRESHOLD &&
    visualSimilarity >= VISIBLE_IMAGE_SIMILARITY_THRESHOLD
  ) {
    return "exact";
  }

  if (score >= 80) return "strong";
  if (score >= 35) return "partial";
  if (score > 0) return "weak";
  return "none";
}

function getConfidenceScore(
  score: number,
  product: ProductRow,
  terms: string[],
) {
  const exactIdentityBoost = hasExactProductIdentityMatch(product, terms) ? 0.08 : 0;
  const base = Math.min(0.96, score / 170);

  return Math.round(Math.min(0.99, base + exactIdentityBoost) * 100) / 100;
}

function getVisualSimilarity(
  score: number,
  product: ProductRow,
  terms: string[],
) {
  const titleText = productTitleText(product);
  const attributeText = productAttributeText(product);
  const titleHits = terms.filter((term) => term && titleText.includes(term)).length;
  const attributeHits = terms.filter((term) => term && attributeText.includes(term)).length;
  const hasIdentity = hasExactProductIdentityMatch(product, terms);
  const base = Math.min(0.94, score / 180);
  const boost = (titleHits >= 2 ? 0.04 : 0) + (attributeHits >= 3 ? 0.03 : 0) + (hasIdentity ? 0.08 : 0);

  return Math.round(Math.min(0.99, base + boost) * 100) / 100;
}

function getBestConfidence(items: HouseComparable[]): MatchConfidence {
  return items[0]?.confidence || "none";
}

function buildProductUrl(product: ProductRow) {
  const productKey = safeText(product.slug) || safeText(product.id);

  return productKey
    ? `https://www.houseofantiques.store/product/${productKey}`
    : "https://www.houseofantiques.store/";
}

function buildImages(product: ProductRow, imageMap: Map<string, string[]>) {
  const productId = String(product.id);
  const galleryImages = imageMap.get(productId) || [];

  return uniqueList([
    safeText(product.featured_image),
    ...galleryImages,
  ]);
}

function toComparable(
  product: ProductRow,
  score: number,
  imageMap: Map<string, string[]>,
  terms: string[],
  queryFamilies: Set<string>,
): HouseComparable {
  const confidenceScore = getConfidenceScore(score, product, terms);
  const visualSimilarity = getVisualSimilarity(score, product, terms);
  const productFamilies = getProductFamilies(product);
  const sameObjectType =
    queryFamilies.size > 0 &&
    Array.from(queryFamilies).some((family) => productFamilies.has(family));
  const categoryMatch = sameObjectType;
  const materialOrFinishCompatible = hasMaterialOrFinishCompatible(terms, product);
  const shapeMatch = sameObjectType;
  const decorativeMotifMatch = hasDecorativeMotifOrStructuralMatch(terms, product);
  const structuralMatch = productFamilies.size > 0 && sameObjectType;
  const hasStrongMatch =
    sameObjectType &&
    visualSimilarity >= VISIBLE_IMAGE_SIMILARITY_THRESHOLD &&
    confidenceScore >= STRONG_MATCH_CONFIDENCE_THRESHOLD &&
    categoryMatch &&
    materialOrFinishCompatible &&
    shapeMatch &&
    (decorativeMotifMatch || structuralMatch);
  let title =
    [product.name_ar, product.name_en, product.name_ku]
      .map(safeText)
      .find(Boolean) || "قطعة مرجعية مشابهة جدًا";

  if (/house of antiques|Ø¨ÙŠØª Ø§Ù„ØªØ­ÙÙŠØ§Øª|Ã˜Â¨Ã™Å Ã˜Âª Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â­Ã™ÂÃ™Å Ã˜Â§Ã˜Âª/i.test(title)) {
    title = "Very close reference item";
  }

  const description =
    safeText(product.description_ar) ||
    safeText(product.description_en) ||
    safeText(product.description_ku);

  const priceAmount =
    typeof product.price_amount === "number"
      ? product.price_amount
      : product.price_amount
        ? Number(product.price_amount)
        : null;

  const currency = safeText(product.currency_code) || "USD";
  const images = buildImages(product, imageMap);

  return {
    id: String(product.id),
    slug: safeText(product.slug),
    sku: safeText(product.sku),
    title,
    description,
    category: safeText(product.source_category),
    material:
      safeText(product.material_ar) ||
      safeText(product.material_en) ||
      safeText(product.material_ku),
    period:
      safeText(product.period_ar) ||
      safeText(product.period_en) ||
      safeText(product.period_ku),
    origin: safeText(product.origin_country),
    price: priceAmount ? `${priceAmount}` : "No listed price",
    currency,
    imageUrl: images[0] || "",
    images,
    url: buildProductUrl(product),
    source: "house_store",
    score,
    confidence: hasStrongMatch ? "exact" : getConfidence(score, product, terms),
    confidenceScore,
    visualSimilarity,
    matchReason: getMatchReason(product, terms),
    hasStrongMatch,
    sameObjectType,
    categoryMatch,
    materialOrFinishCompatible,
    shapeMatch,
    decorativeMotifMatch,
    structuralMatch,
  };
}

function buildStoreContext(items: HouseComparable[]) {
  if (items.length === 0) return "";

  return items
    .slice(0, 2)
    .map((item, index) => {
      return `
NEUTRAL INTERNAL REFERENCE MATCH ${index + 1}
Title: ${item.title}
SKU: ${item.sku || "N/A"}
Product ID: ${item.id}
Category: ${item.category || "N/A"}
Material: ${item.material || "N/A"}
Period: ${item.period || "N/A"}
Origin: ${item.origin || "N/A"}
Exact listed price: ${item.price} ${item.currency}
Match score: ${item.score}
Match confidence score: ${item.confidenceScore}
Visual similarity estimate: ${item.visualSimilarity}
Strict match confidence: ${item.confidence}
hasStrongMatch: ${item.hasStrongMatch}
sameObjectType: ${item.sameObjectType}
categoryMatch: ${item.categoryMatch}
materialOrFinishCompatible: ${item.materialOrFinishCompatible}
shapeMatch: ${item.shapeMatch}
decorativeMotifMatch: ${item.decorativeMotifMatch}
structuralMatch: ${item.structuralMatch}
Match reason: ${item.matchReason}
Description: ${item.description || "N/A"}
`;
    })
    .join("\n");
}

function getHouseOfAntiquesContext(items: HouseComparable[]): HouseOfAntiquesContext {
  const matches = items.filter((item) =>
    item.hasStrongMatch === true &&
    item.sameObjectType === true &&
    item.categoryMatch === true &&
    item.materialOrFinishCompatible === true &&
    item.shapeMatch === true &&
    (item.decorativeMotifMatch === true || item.structuralMatch === true) &&
    item.confidenceScore >= STRONG_MATCH_CONFIDENCE_THRESHOLD &&
    item.visualSimilarity >= VISIBLE_IMAGE_SIMILARITY_THRESHOLD,
  );

  return {
    found: matches.length > 0,
    confidence: getBestConfidence(matches),
    matches,
    contextText: buildStoreContext(matches),
  };
}

function findHouseOfAntiquesMatches(
  products: ProductRow[],
  terms: string[],
  imageMap: Map<string, string[]>,
  queryFamilies: Set<string>,
) {
  const scored = products
    .filter((product) => hasFamilyOverlap(queryFamilies, product))
    .map((product) => ({
      product,
      score: scoreProduct(product, terms),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const items = scored.map(({ product, score }) =>
    toComparable(product, score, imageMap, terms, queryFamilies),
  );

  return getHouseOfAntiquesContext(items);
}

export async function POST(request: Request) {
  try {
    if (!hasHouseSupabaseConfig() || !houseSupabase) {
      console.info("houseStoreReference: skipped no env");
      return NextResponse.json({
        found: false,
        confidence: "none",
        items: [],
        matches: [],
        contextText: "",
        storeContext: "",
      });
    }

    const body = await request.json();

    const query = safeText(body?.query);
    const title = safeText(body?.title);
    const material = safeText(body?.material);
    const origin = safeText(body?.origin);
    const itemType = safeText(body?.itemType);
    const description = safeText(body?.description);
    const notes = safeText(body?.notes);
    const sku = safeText(body?.sku);
    const slug = safeText(body?.slug);
    const productId = safeText(body?.id) || safeText(body?.productId);

   const searchText = [
  productId,
  sku,
  slug,
  query,
  title,
  material,
  origin,
  itemType,
  description,
  notes,
]
  .filter(Boolean)
  .join(" ");

const knowledgeContext = "";
const expandedSearchText = searchText;

    if (!searchText) {
      return NextResponse.json(
        { error: "Missing search query." },
        { status: 400 },
      );
    }

    const terms = expandTerms(buildSearchTerms(expandedSearchText));
    const queryFamilies = detectItemFamilies(expandedSearchText);

    const selectFields = `
      id,
      slug,
      sku,
      source_category,
      name_ar,
      name_en,
      name_ku,
      description_ar,
      description_en,
      description_ku,
      price_amount,
      currency_code,
      status,
      is_available,
      is_featured,
      artist_name,
      material_ar,
      material_en,
      material_ku,
      condition_ar,
      condition_en,
      condition_ku,
      period_ar,
      period_en,
      period_ku,
      origin_country,
      signed,
      featured_image,
      keywords_ar,
      keywords_en,
      keywords_ku,
      seo_title,
      seo_description,
      created_at
    `;

    const { data, error } = await houseSupabase
      .from("products")
      .select(selectFields)
      .limit(2000);

    if (error) {
      console.warn("houseStoreReference: Supabase products read failed");
      return NextResponse.json({
        found: false,
        confidence: "none",
        items: [],
        matches: [],
        contextText: "",
        storeContext: "",
      });
    }

    const products = Array.isArray(data) ? data : [];

    const productIds = products.map((product) => String(product.id)).filter(Boolean);

    const imageMap = new Map<string, string[]>();

    if (productIds.length > 0) {
      const { data: imageRows, error: imageError } = await houseSupabase
        .from("product_images")
        .select("product_id,image_url,sort_order")
        .in("product_id", productIds)
        .order("sort_order", { ascending: true });

      if (imageError) {
        console.warn("houseStoreReference: product images read skipped");
      }

      const rows = Array.isArray(imageRows) ? (imageRows as ProductImageRow[]) : [];

      for (const row of rows) {
        const productIdKey = String(row.product_id);
        const imageUrl = safeText(row.image_url);

        if (!productIdKey || !imageUrl) continue;

        const current = imageMap.get(productIdKey) || [];
        current.push(imageUrl);
        imageMap.set(productIdKey, current);
      }
    }

    const houseContext = findHouseOfAntiquesMatches(
      products,
      terms,
      imageMap,
      queryFamilies,
    );
    const items = houseContext.matches;

    if (items.length > 0) {
      console.info(`houseStoreReference: strong matches count ${items.length}`);
    } else {
      console.info("houseStoreReference: no strong match");
    }

    return NextResponse.json({
      found: houseContext.found,
      confidence: houseContext.confidence,
      items,
      matches: items,
      contextText: houseContext.contextText,
      query: searchText,
      terms,
      knowledgeContext,
      storeContext: houseContext.contextText,
    });
  } catch (error) {
    console.warn("houseStoreReference: route skipped after error");
    return NextResponse.json({
      found: false,
      confidence: "none",
      items: [],
      matches: [],
      contextText: "",
      storeContext: "",
    });
  }
}
