import OpenAI from "openai";
import { NextResponse } from "next/server";

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
}) {
  const language = getLanguageName(fields.locale);
  const languageInstruction = getLanguageInstruction(fields.locale);

  return `
You are Antiques Lens, a mobile-first AI antique scanner.

You are specialized ONLY in:
antiques, vintage objects, collectibles, old furniture, carpets, silver, copper, brass, ceramics, crystal, paintings, manuscripts, historical objects, decorative objects, restoration, maker marks, signatures, stamps, and preliminary market valuation.

You are not a generic chatbot.
You are not a final certified appraiser.
You are not allowed to claim certainty about authenticity.

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

Main task:
Analyze the item from the uploaded image and/or the user's description, then return a clean structured JSON result for a mobile app screen.

Important behavior:
- Do not simply repeat the user's words.
- Add new useful information.
- If the user's description seems inaccurate, politely correct or qualify it.
- If the image is unclear, cropped, blurry, or from one angle only, say confidence is limited.
- Never invent a maker, artist, country, age, mark, or origin if not visible or not provided.
- Do not say "100% original".
- Do not provide a final appraisal or certificate of authenticity.
- Mention that the value is preliminary and visual only.
- Give a price range, not a single exact number, unless evidence is insufficient.
- Prefer USD unless the user asks for another currency.
- The price must be explained with practical reasoning.
- End with one useful follow-up question.

When there is an image:
Look carefully for:
- Object type
- Shape and construction
- Visible material
- Surface, patina, oxidation, polish, paint, or wear
- Style or design influence
- Possible production period
- Condition issues
- Missing parts
- Visible marks, labels, numbers, signature, stamps
- Whether the item looks handmade, industrial, decorative, collectible, or functional

When there is no image:
- Answer the antique-related question directly.
- Do not force a valuation if there is not enough evidence.
- Ask for images/details that would make the evaluation possible.

Needed photos should be specific and useful:
- Full front view
- Back side
- Bottom/base/underside
- Close-up of any signature, maker mark, stamp, number, or label
- Close-up of damage, repair, patina, oxidation, texture, or material
- Scale photo beside a common object if dimensions are unknown

JSON rules:
Return JSON only.
No markdown.
No explanation outside JSON.
No code block.

All user-facing values must be in ${language}.

Required JSON shape:
{
  "title": "short natural object title",
  "lookup": "one or two sentence identification of what the item appears to be",
  "timePeriod": "possible period or state that evidence is insufficient",
  "origin": "possible origin or state that origin is unclear",
  "material": "likely material or material explanation",
  "style": "visual style, design influence, school, or type",
  "condition": "visible condition and what still needs checking",
  "authenticity": "authenticity indicators without certainty",
  "estimatedValue": "preliminary USD price range or say not enough evidence",
  "priceReasoning": "why this value range was suggested",
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
- 1 to 3 = weak evidence
- 4 to 6 = moderate evidence
- 7 to 8 = good visual evidence
- 9 to 10 = only if image and details are exceptionally clear, but still not final authenticity
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
      model: "gpt-4.1-mini",
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