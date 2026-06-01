import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildKnowledgeContext } from "../../../lib/antiqueKnowledge";
export const runtime = "nodejs";
import {
  calculateSilverMeltValue,
  calculateSilverScenarioValues,
  detectSilver,
  detectSilverPurity,
  getSilverWeightScenarios,
  normalizeWeightToGrams,
  TROY_OUNCE_GRAMS,
  type SilverMeltValue,
  type SilverScenario,
} from "@/lib/metalValue";
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
    metalValue?: {
    metal: "silver" | "gold" | "unknown";
    weightGrams?: number;
    purityAssumption?: string;
    spotPricePerGramUsd?: number;
    meltValueUsdLow?: number;
    meltValueUsdMid?: number;
    meltValueUsdHigh?: number;
    note?: string;
    scenarios?: SilverScenario[];
  };
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


function safeString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}
function toPositiveNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
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

async function fetchSilverPricePerGramUsd() {
  const fallback = toPositiveNumber(process.env.SILVER_PRICE_PER_GRAM_USD);
  const apiKey = process.env.METALS_API_KEY;

  try {
    if (!apiKey) {
      throw new Error("Missing METALS_API_KEY");
    }

    const url = new URL("https://metals-api.com/api/latest");
    url.searchParams.set("access_key", apiKey);
    url.searchParams.set("base", "USD");
    url.searchParams.set("symbols", "XAG");

    const response = await fetch(url.toString(), {
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      throw new Error(`Metals API failed: ${response.status}`);
    }

    const data = await response.json();
    const rates = data?.rates ?? {};

    const directUsdXag = toPositiveNumber(rates.USDXAG);
    const invertedXag = toPositiveNumber(rates.XAG);

    const pricePerOz =
      directUsdXag ?? (invertedXag ? 1 / invertedXag : null);

    if (!pricePerOz) {
      throw new Error("Missing silver XAG price");
    }

    return pricePerOz / TROY_OUNCE_GRAMS;
  } catch (error) {
    console.warn("Silver price fallback used:", error);

    if (fallback) return fallback;

    return null;
  }
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
  itemType?: string;
  material?: string;
  dimensions?: string;
  weight?: string;
  hasMark?: string;
  hasImage: boolean;
  marketContext?: string;
  marketReferencesText?: string;
  silverMarketContext?: string;
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
- Item type: ${fields.itemType || "Not provided"}
- Material: ${fields.material || "Not provided"}
- Dimensions: ${fields.dimensions || "Not provided"}
- Weight: ${fields.weight || "Not provided"}
- Mark / signature / stamp: ${fields.hasMark || "Not provided"}
- Image provided: ${fields.hasImage ? "Yes" : "No"}

${objectTypeGuidance}

${externalSourceGuidance}

CRITICAL USER NOTES RULE:
The user's notes are important evidence.
If the user provides a local name, cultural use, family history, market term, rarity claim, weight, age, or functional description, treat it as a serious clue.
Do not ignore it and replace it with a generic label.
If the visual evidence and the user's notes disagree, explain the disagreement carefully and lower confidence.
If the user says the item is heavy, rare, handmade, old, regional, or used in a traditional craft, this must affect the valuation logic.

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

SILVER MARKET FLOOR CONTEXT:
${fields.silverMarketContext || "No silver floor value context was provided."}

SILVER VALUATION RULE:
If silver floor value context is provided, you must treat it as deterministic calculation, not opinion.
Do not estimate a silver item below its raw metal floor value unless weight or purity is uncertain.
For antique, handmade, engraved, or collectible silver, the valuation should be the metal floor value plus craftsmanship, age, rarity, condition, provenance, and market premium.
Mention raw silver value separately inside priceReasoning.
If weight is missing, ask for weight and purity marks such as 800, 925, sterling, or 999.
If silver scenarios are provided, do not provide a single confident valuation. Present the valuation as light, medium, and heavy weight scenarios. Explain that the final value depends on actual weight and purity. Never ignore the silver floor value.

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

If a silver floor value was provided, set "metalValue" as an object:
{
  "metal": "silver",
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

If no silver floor value was provided, use:
"metalValue": null


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
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  const clean = value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return clean.length ? clean : fallback;
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

const image = formData.get("image");
const notes = safeString(formData.get("notes"));
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

const silverContextText = [
  notes,
  itemType,
  material,
  dimensions,
  weight,
  hasMark,
  marketContext,
]
  .filter(Boolean)
  .join(" ");

let silverMarketContext = "";
let silverMetalValue: (SilverMeltValue & { scenarios?: SilverScenario[] }) | null = null;

if (detectSilver(silverContextText)) {
  const weightGrams =
    normalizeWeightToGrams(weight) ?? normalizeWeightFromNotes(notes);
  const purity = detectSilverPurity(silverContextText);
  const pricePerGramUsd = await fetchSilverPricePerGramUsd();

  if (weightGrams && pricePerGramUsd) {
    silverMetalValue = calculateSilverMeltValue({
      weightGrams,
      purity,
      pricePerGramUsd,
    });

    silverMarketContext = `
The item appears to be silver.

Current silver spot price:
- USD per gram: ${silverMetalValue.spotPricePerGramUsd}

Detected / user-provided weight:
- ${silverMetalValue.weightGrams} grams

Purity assumption:
- ${silverMetalValue.purityAssumption}

Raw silver melt / floor value:
- Low: $${silverMetalValue.meltValueUsdLow}
- Mid: $${silverMetalValue.meltValueUsdMid}
- High: $${silverMetalValue.meltValueUsdHigh}

This raw metal value is a hard valuation floor.
Do not estimate the item below this raw silver value unless the weight or purity is uncertain.
If the piece is antique, engraved, handmade, or collectible, add antique/craft premium above the metal value.
`;
  } else if (pricePerGramUsd) {
    const scenarioWeights = getSilverWeightScenarios(silverContextText);
    const scenarios = calculateSilverScenarioValues({
      scenarioWeights,
      purity,
      pricePerGramUsd,
    });

    silverMetalValue = {
      metal: "silver",
      weightGrams: scenarios[1]?.weightGrams ?? scenarioWeights[1],
      purityAssumption: purity
        ? `${Math.round(purity * 1000)}/1000`
        : "range: 800 / 925 / 999",
      spotPricePerGramUsd: Math.round(pricePerGramUsd * 100) / 100,
      meltValueUsdLow: scenarios[0]?.meltValueUsdMid ?? 0,
      meltValueUsdMid: scenarios[1]?.meltValueUsdMid ?? 0,
      meltValueUsdHigh: scenarios[2]?.meltValueUsdMid ?? 0,
      note:
        "Weight was not provided. These are scenario estimates based on likely object weight ranges. Final valuation requires weighing the item.",
      scenarios,
    };

    silverMarketContext = `
The item appears to be silver, but no usable weight was provided.

Do NOT give one fixed valuation.
Use these three weight scenarios:

${scenarios
  .map(
    (scenario) => `
${scenario.label.toUpperCase()} / ${scenario.labelAr}
- Assumed weight: ${scenario.weightGrams}g
- Silver floor value low/mid/high: $${scenario.meltValueUsdLow} / $${scenario.meltValueUsdMid} / $${scenario.meltValueUsdHigh}
- Suggested antique estimate: $${scenario.antiqueEstimateUsdLow} - $${scenario.antiqueEstimateUsdHigh}
`,
  )
  .join("\n")}

Strict rule:
Explain that weight is not confirmed from image alone.
Present valuation as scenarios, not a single final number.
Ask the user to weigh the item for a precise valuation.
If the piece is handmade, engraved, antique, or rare, explain that value can exceed melt value.
`;
  } else {
    silverMarketContext = `
The item appears to be silver, but live silver price could not be fetched.
Do not undervalue silver. Ask for weight and purity and explain that silver price must be checked.
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
   
    const hasImage = image instanceof File && image.size > 0;

    if (!hasImage && !notes) {
      return NextResponse.json(
        { error: "Please provide an image or a description." },
        { status: 400 }
      );
    }

    if (hasImage && image instanceof File && image.size > 8 * 1024 * 1024) {
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
  itemType,
  material,
  dimensions,
  weight,
  hasMark,
  hasImage,
  marketContext,
  marketReferencesText,
  silverMarketContext,
}),
      },
    ];

    if (hasImage && image instanceof File) {
      const dataUrl = await fileToDataUrl(image);

      inputContent.push({
        type: "input_image",
        image_url: dataUrl,
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

if (silverMetalValue) {
  normalized.metalValue = silverMetalValue;

  if (silverMetalValue.scenarios?.length) {
    const firstScenario = silverMetalValue.scenarios[0];
    const lastScenario =
      silverMetalValue.scenarios[silverMetalValue.scenarios.length - 1];

    const scenarioSuffix =
      locale === "ar" ? "حسب احتمالات الوزن" : "based on weight scenarios";
    normalized.estimatedValue = `$${firstScenario.antiqueEstimateUsdLow} - $${lastScenario.antiqueEstimateUsdHigh} ${scenarioSuffix}`;
  } else if (silverMetalValue.meltValueUsdMid) {
    const min = Math.round(silverMetalValue.meltValueUsdMid);
    const max = Math.round(silverMetalValue.meltValueUsdHigh * 1.8);
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
