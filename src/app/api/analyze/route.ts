import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Locale = "ar" | "en" | "ku" | "fr";

type AnalysisResult = {
  itemType: string;
  material: string;
  style: string;
  period: string;
  condition: string;
  authenticity: string;
  priceRange: string;
  priceReasoning: string;
  valueDrivers: string[];
  valueReducers: string[];
  confidence: number;
  confidenceNote: string;
  title: string;
  description: string;
  conversationReply: string;
  keywords: string[];
  neededPhotos: string[];
  followUpQuestion: string;
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
      return "Kurdish Sorani";
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
Do not use Arabic, Kurdish, or French in the response.
`;
    case "ku":
      return `
The visitor selected Kurdish Sorani.
All user-facing JSON values must be written in Kurdish Sorani.
Use clear, natural Kurdish Sorani suitable for general visitors.
Do not answer in Arabic, English, or French unless a necessary antique term has no natural Kurdish equivalent.
`;
    case "fr":
      return `
The visitor selected French.
All user-facing JSON values must be written in French.
Use clear, natural French suitable for general visitors.
Do not use Arabic, Kurdish, or English except for necessary antique terms.
`;
    case "ar":
    default:
      return `
The visitor selected Arabic.
All user-facing JSON values must be written in Arabic.
Use clear, natural Arabic. Avoid stiff wording.
Do not use English, Kurdish, or French except for necessary antique terms.
`;
  }
}

function buildPrompt(fields: {
  notes?: string;
  locale: Locale;
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
You are Antiques Lens, a conversational AI specialist in antiques, collectibles, artworks, old objects, materials, styles, marks, stamps, restoration, and preliminary valuation.

You are not a generic chatbot.
You are not a product listing writer.
You are not a final certified appraiser.

The visitor language is: ${language}.

${languageInstruction}

The visitor may:
- Upload an image and ask for evaluation.
- Ask about an antique type without uploading an image.
- Ask about a material, style, age, mark, stamp, signature, restoration, or selling advice.
- Ask whether something looks old, modern, handmade, factory-made, decorative, collectible, or valuable.
- Continue the conversation with follow-up questions.

User input:
- Notes: ${fields.notes || "Not provided"}
- Item type if provided: ${fields.itemType || "Not provided"}
- Material if provided: ${fields.material || "Not provided"}
- Dimensions if provided: ${fields.dimensions || "Not provided"}
- Weight if provided: ${fields.weight || "Not provided"}
- Signature / stamp / maker mark if provided: ${fields.hasMark || "Not provided"}
- Image provided: ${fields.hasImage ? "Yes" : "No"}

Core behavior:
- Do not simply repeat what the visitor wrote.
- Add new useful information based on visible clues, antique knowledge, material knowledge, and market reasoning.
- If the visitor's assumption seems wrong, uncertain, or incomplete, politely correct or qualify it.
- Speak like a helpful antique expert in a conversation.
- Do not sound like a rigid report, product card, sales description, or catalog entry.
- Do not give only a price.
- Always explain why the price range was suggested.
- If evidence is weak, say the estimate is uncertain and explain what is missing.
- Ask for the next useful photo or detail.
- Keep the conversation open.
- Give practical next steps.

When evaluating an uploaded item:
1. Start with what is actually visible.
2. Explain what can and cannot be concluded from the current image.
3. Discuss possible item type, material, style, age indicators, craftsmanship, and condition.
4. If the visitor gave wrong or incomplete information, correct it carefully.
5. Give a preliminary USD price range only if there is enough evidence.
6. Explain the price range using material, age indicators, condition, craftsmanship, rarity, subject, size, visible marks, market demand, and missing evidence.
7. Explain what could increase the value.
8. Explain what could decrease the value.
9. Ask for useful additional photos from specific angles:
   - Full front view.
   - Back side.
   - Bottom/base.
   - Close-up of any stamp, signature, number, label, or maker’s mark.
   - Close-up of cracks, chips, repairs, paint loss, patina, oxidation, or material texture.
   - A photo beside a common object for scale if dimensions are unknown.
10. End with one natural follow-up question.

When answering a general antique question without image:
- Answer directly and naturally.
- Explain the concept clearly.
- Give examples when useful.
- Suggest what photos or details would help if the visitor wants an evaluation.
- Do not force a price estimate if no actual item is shown.

Strict rules:
- Never claim authenticity with certainty.
- Never say “100% original”.
- Never give a final official appraisal.
- Never invent a maker, artist, period, country, or origin if not visible or not provided.
- If there is no visible mark, signature, or maker stamp, say that this limits the valuation.
- If the photo is from only one angle, say the estimate may change after seeing other angles.
- If the image is weak, blurred, cropped, or too dark, say confidence is low.
- Always be honest about uncertainty.
- Use USD for price range unless the visitor asks otherwise.
- The answer should be valuable enough that a visitor feels they are talking to a real specialist.

Return JSON only.
No markdown.
No text outside JSON.

Important JSON language rule:
Every user-facing value inside the JSON must be written in ${language}.
This includes:
- itemType
- material
- style
- period
- condition
- authenticity
- priceRange
- priceReasoning
- valueDrivers
- valueReducers
- confidenceNote
- title
- description
- conversationReply
- keywords
- neededPhotos
- followUpQuestion

JSON shape:
{
  "itemType": "likely item type or the topic being discussed",
  "material": "likely material or relevant material explanation",
  "style": "visual style, cultural influence, school, or design type",
  "period": "careful estimated period, or say evidence is insufficient",
  "condition": "visible condition or what needs checking",
  "authenticity": "authenticity notes without certainty",
  "priceRange": "preliminary USD price range, or say not enough evidence",
  "priceReasoning": "why this range was suggested, based on material, age, condition, craftsmanship, rarity, marks, demand, and missing evidence",
  "valueDrivers": ["things that may increase the value"],
  "valueReducers": ["things that may reduce the value"],
  "confidence": 1,
  "confidenceNote": "why the confidence is low, medium, or high",
  "title": "short natural title, not a marketing title",
  "description": "short neutral summary",
  "conversationReply": "the main answer. It must feel like a conversation, add new information, correct assumptions if needed, explain the price, mention missing photos/details, and end with a follow-up question.",
  "keywords": ["keyword"],
  "neededPhotos": ["specific photo needed"],
  "followUpQuestion": "one clear next question"
}

Make conversationReply the strongest and most useful part of the response.
`;
}

function safeString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function buildFallbackResult(locale: Locale): AnalysisResult {
  if (locale === "en") {
    return {
      itemType: "Unclear item",
      material: "Unclear",
      style: "Unclear",
      period: "Insufficient evidence",
      condition: "Cannot be assessed clearly",
      authenticity:
        "No authenticity conclusion can be made from the provided information.",
      priceRange: "Unable to estimate",
      priceReasoning:
        "The image or description is not sufficient to support a responsible price estimate.",
      valueDrivers: [],
      valueReducers: ["Missing clear images", "No visible mark or signature"],
      confidence: 1,
      confidenceNote: "The provided evidence is too limited.",
      title: "Insufficient information for evaluation",
      description:
        "More images and details are needed before giving a useful preliminary evaluation.",
      conversationReply:
        "I do not have enough information to evaluate this item responsibly yet. A price estimate would be weak without clearer evidence. Please upload a full image, the base or back side, and any signature, stamp, number, or maker’s mark if available. Is there any writing, mark, or label on the base or back?",
      keywords: [],
      neededPhotos: [
        "Full front image",
        "Back side",
        "Bottom or base",
        "Close-up of any signature, stamp, number, label, or maker’s mark",
        "Close-up of damage, repair, patina, or material texture",
      ],
      followUpQuestion:
        "Is there any signature, stamp, number, label, or writing on the base or back?",
    };
  }

  if (locale === "fr") {
    return {
      itemType: "Objet non identifié",
      material: "Matière non claire",
      style: "Style non clair",
      period: "Éléments insuffisants",
      condition: "L’état ne peut pas être évalué clairement",
      authenticity:
        "Aucune conclusion d’authenticité ne peut être donnée avec les informations actuelles.",
      priceRange: "Estimation impossible",
      priceReasoning:
        "L’image ou la description ne suffit pas pour proposer une fourchette de prix responsable.",
      valueDrivers: [],
      valueReducers: [
        "Images insuffisantes",
        "Aucune marque ou signature visible",
      ],
      confidence: 1,
      confidenceNote: "Les éléments fournis sont trop limités.",
      title: "Informations insuffisantes pour l’évaluation",
      description:
        "Des images et détails supplémentaires sont nécessaires pour une première évaluation utile.",
      conversationReply:
        "Je n’ai pas encore assez d’éléments pour évaluer cet objet sérieusement. Une estimation de prix serait trop fragile sans images plus précises. Il faudrait une vue complète, l’arrière ou la base, et un gros plan sur toute signature, marque, numéro ou étiquette éventuelle. Y a-t-il une inscription, une marque ou un cachet sous l’objet ou à l’arrière ?",
      keywords: [],
      neededPhotos: [
        "Vue complète de face",
        "Arrière de l’objet",
        "Dessous ou base",
        "Gros plan sur toute signature, marque, numéro ou étiquette",
        "Gros plan sur les dommages, réparations, patine ou texture de la matière",
      ],
      followUpQuestion:
        "Y a-t-il une signature, une marque, un numéro ou une inscription sous l’objet ou à l’arrière ?",
    };
  }

  if (locale === "ku") {
    return {
      itemType: "پارچەیەکی نەناسراو",
      material: "مادەکە ڕوون نییە",
      style: "شێوازەکە ڕوون نییە",
      period: "بەڵگە پێویستەکان نییە",
      condition: "دۆخەکە بە ڕوونی هەڵسەنگاندن ناکرێت",
      authenticity:
        "لەسەر بنەمای زانیارییەکانی ئێستا ناتوانرێت بڕیاری ڕەسەنایەتی بدرێت.",
      priceRange: "ناتوانرێت نرخ بخەمڵێنرێت",
      priceReasoning:
        "وێنە یان وەسفەکە بەس نییە بۆ ئەوەی نرخێکی بەرپرسانە پێشنیار بکرێت.",
      valueDrivers: [],
      valueReducers: ["وێنەی ڕوون نییە", "هیچ مۆر یان واژۆیەک دیار نییە"],
      confidence: 1,
      confidenceNote: "بەڵگەکان زۆر سنووردارن.",
      title: "زانیاری پێویست نییە بۆ هەڵسەنگاندن",
      description:
        "پێویستە وێنە و وردەکاری زیاتر هەبێت بۆ هەڵسەنگاندنێکی سەرەتایی باشتر.",
      conversationReply:
        "هێشتا زانیاری پێویست نییە بۆ ئەوەی ئەم پارچەیە بە شێوەیەکی بەرپرسانە هەڵسەنگێنم. نرخدانان بەبێ وێنەی ڕوون زۆر لاواز دەبێت. تکایە وێنەی تەواوی پارچەکە، پشت یان بنەکە، و وێنەی نزیک لە هەر مۆر، واژۆ، ژمارە یان نیشانەیەک بنێرە. هیچ نووسین یان مۆرێک لە بن یان پشتەوە هەیە؟",
      keywords: [],
      neededPhotos: [
        "وێنەی تەواوی پێشەوە",
        "پشتی پارچەکە",
        "بنەکە یان ژێرەوە",
        "وێنەی نزیک لە واژۆ، مۆر، ژمارە یان نیشانە",
        "وێنەی نزیک لە زیان، چاککردنەوە، پاتینا یان تێکستی مادەکە",
      ],
      followUpQuestion:
        "هیچ واژۆ، مۆر، ژمارە، نیشانە یان نووسینێک لە بن یان پشتی پارچەکە هەیە؟",
    };
  }

  return {
    itemType: "قطعة غير واضحة",
    material: "المادة غير واضحة",
    style: "النمط غير واضح",
    period: "الأدلة غير كافية",
    condition: "لا يمكن تقييم الحالة بوضوح",
    authenticity: "لا يمكن إعطاء ملاحظة أصالة مسؤولة من المعلومات الحالية.",
    priceRange: "لا يمكن تقدير السعر",
    priceReasoning:
      "الصورة أو الوصف غير كافيين لإعطاء نطاق سعري مسؤول.",
    valueDrivers: [],
    valueReducers: ["عدم توفر صور واضحة", "لا يوجد ختم أو توقيع ظاهر"],
    confidence: 1,
    confidenceNote: "الأدلة المتوفرة قليلة جداً.",
    title: "معلومات غير كافية للتقييم",
    description:
      "تحتاج القطعة إلى صور وتفاصيل إضافية قبل إعطاء تقييم أولي مفيد.",
    conversationReply:
      "لا أملك معلومات كافية لتقييم القطعة بشكل مسؤول. إعطاء سعر الآن سيكون ضعيفاً لأن الصورة أو الوصف لا يوضحان التفاصيل المهمة. أحتاج صورة كاملة، وصورة للخلف أو القاعدة، وصورة قريبة لأي توقيع أو ختم أو رقم أو ملصق إن وجد. هل توجد أي كتابة أو علامة أسفل القطعة أو خلفها؟",
    keywords: [],
    neededPhotos: [
      "صورة كاملة من الأمام",
      "صورة الخلف",
      "صورة القاعدة أو الأسفل",
      "صورة قريبة للختم أو التوقيع أو الرقم أو الملصق",
      "صورة قريبة لأي كسر أو ترميم أو أثر قدم أو ملمس المادة",
    ],
    followUpQuestion: "هل توجد أي كتابة أو ختم أو توقيع أسفل القطعة أو خلفها؟",
  };
}

function normalizeResult(parsed: Partial<AnalysisResult>, fallback: AnalysisResult) {
  const confidence =
    typeof parsed.confidence === "number"
      ? Math.min(10, Math.max(1, parsed.confidence))
      : fallback.confidence;

  return {
    ...fallback,
    ...parsed,
    confidence,
    valueDrivers: Array.isArray(parsed.valueDrivers)
      ? parsed.valueDrivers
      : fallback.valueDrivers,
    valueReducers: Array.isArray(parsed.valueReducers)
      ? parsed.valueReducers
      : fallback.valueReducers,
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : fallback.keywords,
    neededPhotos: Array.isArray(parsed.neededPhotos)
      ? parsed.neededPhotos
      : fallback.neededPhotos,
  };
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing" },
        { status: 500 }
      );
    }

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
          notes,
          locale,
          itemType,
          material,
          dimensions,
          weight,
          hasMark,
          hasImage,
        }),
      },
    ];

    if (hasImage) {
      const uploadedImage = image as File;
      const arrayBuffer = await uploadedImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = buffer.toString("base64");
      const mimeType = uploadedImage.type || "image/jpeg";
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      inputContent.push({
        type: "input_image",
        image_url: dataUrl,
        detail: "high",
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
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to analyze item",
      },
      { status: 500 }
    );
  }
}