import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildKnowledgeContext } from "../../../lib/antiqueKnowledge";
export const runtime = "nodejs";


type Locale = "ar" | "en" | "ku" | "fr";

type AnalysisResult = {
  title: string;
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
};

function normalizeLocale(locale: string): Locale {
  if (locale === "en" || locale === "ku" || locale === "fr" || locale === "ar") {
    return locale;
  }

  return "ar";
}

function getLanguageName(locale: Locale) {
  switch (locale) {
    case "en":
      return "English";
    case "ku":
      return "Sorani Kurdish";
    case "fr":
      return "French";
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
Do not use Arabic, Kurdish, or French.
`;
    case "ku":
      return `
The visitor selected Sorani Kurdish.
All user-facing JSON values must be written in Sorani Kurdish.
Use clear, natural Sorani Kurdish for normal visitors.
Do not answer in Arabic, English, or French except for necessary antique terms.
`;
    case "fr":
      return `
The visitor selected French.
All user-facing JSON values must be written in French.
Do not use Arabic, Kurdish, or English except for necessary antique terms.
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
}) {

  const language = getLanguageName(fields.locale);
  const languageInstruction = getLanguageInstruction(fields.locale);
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

HOW TO USE MARKET COMPARISON CONTEXT:

1. Google Lens results:
- Treat Google Lens results as visual clues only.
- Do not copy Google Lens titles or prices blindly.
- Ignore unrelated visual matches.
- Use them to understand object type, comparable forms, auction/museum presence, and market direction.

2. House of Antiques internal comparables:
- House of Antiques Store comparables are internal retail references from the owner's real antiques inventory.
- These internal comparables are stronger than generic AI assumptions.
- If a House of Antiques comparable appears visually, materially, culturally, or functionally close to the uploaded item, treat it as a strong local market reference.
- If the uploaded image appears to be the same object or nearly the same object as a House of Antiques comparable, do NOT invent a different title, use, or very different price.
- In that case, align the title, identification, and price reasoning with the internal comparable unless the user description clearly contradicts it.
- The listed retail price is not automatically the final appraisal value, but it is a serious reference.
- The estimate should normally stay in a realistic range around that listed price, not collapse to a very low generic value.
- If an internal comparable is listed at 1,200 USD, do not estimate the uploaded item at 50–150 USD unless you clearly explain why it is not the same type, not the same condition, not the same scale, or not comparable.
- If the store comparable has strong similarity, mention that the valuation is influenced by a House of Antiques internal comparable.
- If the store comparable is weak or unrelated, ignore it and say the match is weak.

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

If House of Antiques internal comparables exist, they override generic conservative pricing.

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
- House of Antiques internal comparables
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
If House of Antiques internal comparables were found, priceReasoning must mention whether they affected the estimate.
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
  "lookup": "one or two sentence identification of what the item appears to be, including likely function if relevant",
  "timePeriod": "possible period or state that evidence is insufficient",
  "origin": "possible origin or state that origin is unclear",
  "material": "likely material or material explanation",
  "style": "visual style, design influence, school, or type",
  "condition": "visible condition and what still needs checking",
  "authenticity": "authenticity indicators without certainty",
  "estimatedValue": "preliminary USD price range or say not enough evidence",
  "priceReasoning": "why this value range was suggested, with no contradiction between claimed age/importance and price. Mention House of Antiques internal comparables if present and relevant.",
  "history": "short historical/contextual explanation about this kind of object",
  "valueDrivers": ["things that may increase value"],
  "valueReducers": ["things that may reduce value"],
  "visualSearchKeywords": ["short search keyword for finding similar items online"],
  "neededPhotos": ["specific photo needed"],
  "followUpQuestion": "one clear next question",
  "confidence": 1,
  "confidenceNote": "why confidence is low, medium, or high",
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
- Did you consider House of Antiques internal comparables if present?
- Did you avoid pricing rare regional heritage objects as ordinary used items?
- Did you ask for the right next photos?
- Is the price range defensible?
`;
}
function buildFallbackResult(locale: Locale): AnalysisResult {
  if (locale === "en") {
    return {
      title: "Insufficient information",
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

const itemType = safeString(formData.get("itemType"));
const material = safeString(formData.get("material"));
const dimensions = safeString(formData.get("dimensions"));
const weight = safeString(formData.get("weight"));
const hasMark = safeString(formData.get("hasMark"));
   
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