import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Locale = "ar" | "en" | "fr" | "hi" | "fa" | "tr" | "ru" | "ku" | "es";

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
  if (locale === "en") return "Write all user-facing values in English.";
  if (locale === "fr") return "Write all user-facing values in French.";
  if (locale === "hi") return "Write all user-facing values in Hindi.";
  if (locale === "fa") return "Write all user-facing values in natural Persian.";
  if (locale === "tr") return "Write all user-facing values in Turkish.";
  if (locale === "ru") return "Write all user-facing values in Russian.";
  if (locale === "ku") return "Write all user-facing values in Sorani Kurdish.";
  if (locale === "es") return "Write all user-facing values in natural, professional Spanish.";
  return "Write all user-facing values in clear, natural Arabic.";
}

function safeString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";

  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= maxLength ? clean : clean.slice(0, maxLength).trim();
}

function safeJson<T>(value: string, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseModelJson(value: string) {
  const parsed = safeJson<{
    assistantMessage?: string;
    updatedResult?: Record<string, unknown>;
  }>(value, {});

  if (parsed.assistantMessage && parsed.updatedResult) return parsed;

  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return safeJson<{
      assistantMessage?: string;
      updatedResult?: Record<string, unknown>;
    }>(value.slice(firstBrace, lastBrace + 1), {});
  }

  return parsed;
}

function compactResult(value: Record<string, unknown>) {
  return {
    title: cleanText(value.title, 180),
    itemType: cleanText(value.itemType || value.lookup, 160),
    lookup: cleanText(value.lookup, 900),
    timePeriod: cleanText(value.timePeriod || value.period, 180),
    origin: cleanText(value.origin, 180),
    material: cleanText(value.material, 180),
    style: cleanText(value.style, 180),
    condition: cleanText(value.condition, 800),
    authenticity: cleanText(value.authenticity, 900),
    estimatedValue: cleanText(value.estimatedValue || value.priceRange, 220),
    priceReasoning: cleanText(value.priceReasoning, 900),
    history: cleanText(value.history || value.description, 900),
    historicalReading: cleanText(value.historicalReading, 700),
    safeInitialChecks: Array.isArray(value.safeInitialChecks)
      ? value.safeInitialChecks.filter((item) => typeof item === "string").slice(0, 7)
      : [],
    carePreservationTips: Array.isArray(value.carePreservationTips)
      ? value.carePreservationTips.filter((item) => typeof item === "string").slice(0, 6)
      : [],
    valueDrivers: Array.isArray(value.valueDrivers)
      ? value.valueDrivers.filter((item) => typeof item === "string").slice(0, 6)
      : [],
    valueReducers: Array.isArray(value.valueReducers)
      ? value.valueReducers.filter((item) => typeof item === "string").slice(0, 6)
      : [],
    neededPhotos: Array.isArray(value.neededPhotos)
      ? value.neededPhotos.filter((item) => typeof item === "string").slice(0, 6)
      : [],
    followUpQuestion: cleanText(value.followUpQuestion, 240),
    confidence: typeof value.confidence === "number" ? value.confidence : undefined,
    confidenceNote: cleanText(value.confidenceNote, 600),
    brandAssessment: value.brandAssessment || null,
    markAnalysis: value.markAnalysis || null,
    metalValue: value.metalValue || null,
  };
}

async function fileToDataUrl(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/jpeg";

  return `data:${mimeType};base64,${base64}`;
}

function softenWording(value: string) {
  return value
    .replace(/\bclaims?\b/gi, "information that needs verification")
    .replace(/\bclaimed\b/gi, "mentioned but not yet verified")
    .replace(/ادعاء/g, "معلومة تحتاج تحقق")
    .replace(/يدعي/g, "يذكر")
    .replace(/تزعم/g, "تذكر")
    .replace(/زعم/g, "ذكر");
}

function startsWithPrice(value: string, locale: Locale) {
  const clean = value.trim().toLowerCase();

  if (locale === "ar" || locale === "fa" || locale === "ku") {
    return /^(التقدير|بعد المعلومة|إذا تأكدت|السعر|النطاق|القيمة)/.test(clean);
  }

  return /^(current estimate|estimated range|price range|if this information|after this information|valuation)/i.test(
    clean,
  );
}

function ensurePriceFirst(message: string, result: Record<string, unknown>, locale: Locale) {
  const cleanMessage = softenWording(message).trim();

  if (startsWithPrice(cleanMessage, locale)) return cleanMessage;

  const range = cleanText(result.estimatedValue || result.priceRange, 220);

  if (!range) return cleanMessage;

  const prefix =
    locale === "en"
      ? `Current estimate: ${range}.`
      : `التقدير الحالي: ${range}.`;

  return `${prefix} ${cleanMessage}`;
}

function buildFallbackAssistantMessage(result: Record<string, unknown>, locale: Locale) {
  const range = cleanText(result.estimatedValue || result.priceRange, 220);

  if (locale === "en") {
    return range
      ? `Current estimate: ${range}. The new information is useful, but I could not complete the deeper chat update in this attempt. Send the signature or provenance detail once more and I will update the conditional range.`
      : "Current estimate: not enough pricing data yet. The new information is useful, but I could not complete the deeper chat update in this attempt. What is the clearest proof you have for the attribution?";
  }

  return range
    ? `التقدير الحالي: ${range}. المعلومة الجديدة مفيدة، لكن لم يكتمل تحديث المحادثة العميق في هذه المحاولة. أرسل التوقيع أو دليل المصدر مرة أخرى وسأحدث النطاق المشروط مباشرة.`
    : "التقدير الحالي: لا توجد بيانات سعر كافية بعد. المعلومة الجديدة مفيدة، لكن لم يكتمل تحديث المحادثة العميق في هذه المحاولة. ما أوضح دليل لديك على النسبة؟";
}

function buildPrompt(fields: {
  locale: Locale;
  originalAnalysis: Record<string, unknown>;
  currentResult: Record<string, unknown>;
  previousChatMessages: unknown[];
  newUserMessage: string;
  newUploadedImages: string[];
  hasImages: boolean;
  remainingTurns: number;
  isFinalSummary: boolean;
}) {
  const language = getLanguageName(fields.locale);
  const finalSummaryRules = fields.isFinalSummary
    ? `
The user requested the final summary. The assistantMessage must be a compact report containing:
- Closest classification
- Strongest evidence
- Uncertain points
- Conservative price range
- Conditional price range if the important unverified information is confirmed
- Selling advice
- Auction suitability versus direct sale
- Confidence score
- Last recommended step before sale
Do not ask a follow-up question in the final summary unless one last verification step is absolutely necessary.
`
    : `
Every assistantMessage must naturally cover:
- What KISHIB understood from the new information or image.
- What changed in the evaluation.
- Whether the price range changed.
- What this means practically for the user.
- The best next step.
- Exactly one smart follow-up question.
`;

  return `
You are KISHIB Interactive Valuation Expert.

Your main goal is to help the user understand the value of the item clearly and quickly.

Visitor language: ${language}
${getLanguageInstruction(fields.locale)}

This is a continuing conversation tied to one item. Re-read the original analysis, the current result, prior messages, and the new message/images. Update the actual appraisal, not merely a chat summary.

Payload received:
- originalAnalysis: ${JSON.stringify(compactResult(fields.originalAnalysis))}
- currentResult: ${JSON.stringify(compactResult(fields.currentResult))}
- previousChatMessages: ${JSON.stringify(fields.previousChatMessages).slice(0, 7000)}
- newUserMessage: ${fields.newUserMessage || "No text; use the uploaded image(s)."}
- newUploadedImages count: ${fields.newUploadedImages.length}
- remainingTurns after this request: ${fields.remainingTurns}

Important style rules:
1. Always start assistantMessage with a clear price range.
2. Do not use the word "claim" or its Arabic equivalent "ادعاء".
3. Use softer wording like "unverified information", "information that needs verification", "if this information is confirmed", "معلومة تحتاج تحقق", "معلومة غير مثبتة بعد", or "إذا تأكدت هذه المعلومة".
4. The user wants valuation, so price must be the focus.
5. Do not give long theoretical explanations.
6. Keep the answer practical and conversational.
7. If the new information affects value, show the current range without verification and the higher or lower range if verified.
8. If the new information does not affect value, say the price did not change and briefly explain why.
9. Ask only one follow-up question.
10. Keep the answer in the user's language.
11. Never present unverified information as certified fact.
12. Never say only "the user said..." without valuation impact.
13. Keep assistantMessage to 4 short sentences maximum.
14. Do not repeat authenticity warnings. Mention the verification caveat once, then move to price and action.
15. Do not ask again for a signature close-up if the new image already clearly shows a signature. Ask for the next most useful evidence instead.
16. Avoid irritating phrases such as "this is not enough" repeated several times. Prefer "this raises confidence, but the higher range needs one more supporting proof."
17. Preserve or update safeInitialChecks as safe, non-destructive checks only. Never suggest acid, burning, strong scraping, peeling, scratching, boiling, opening watches or sealed mechanisms, chemicals, solvents, soaking, or any damaging test.
18. Preserve or update carePreservationTips as 4 to 6 short care tips based on item type/material. Do not repeat safeInitialChecks, and never suggest strong chemicals, harsh polishing, washing, repainting, home restoration, scratch tests, heat tests, ultrasonic cleaning before identifying stones, hot water, acid, vinegar, bleach, soaking, or opening sealed mechanisms.
19. Do not provide gold, silver, melt, spot-price, karat, purity, raw metal, or metal valuation unless the item is clearly a metal/precious-metal item or the visitor explicitly provides metal type, gram weight, hallmark, stamp, or karat/purity evidence. For paintings, furniture, wood, textile, ceramic, documents, carpets, glass, stone, coral, soapstone, and general non-metal artworks, keep metalValue null and do not add metal scenarios.

Artist and signed artwork handling:
- If the user names a known artist and provides a visible signature or date, treat that as a positive attribution signal, not as something to dismiss.
- Use a working-attribution valuation: give one range as-is, and one higher range if the signature/style/provenance is matched.
- You may use your general art-history and market knowledge if you recognize the artist, but do not say you performed a live internet search unless a browsing tool was actually used.
- If you do not confidently know the artist, still give a practical conditional range based on the named artist, medium, visible style, date, condition, and regional market.
- Do not require only official certificates. Helpful evidence can include signature comparison with known works, provenance, back-of-frame labels, gallery/collection records, invoices, old photos, or museum/collector documentation.
- For a visible signature, explain its valuation impact in one short sentence. Do not turn the reply into a lecture about authentication.

Preferred assistantMessage structure:
- Price range first.
- What changed.
- Practical advice.
- Next best question.

Arabic style example:
"التقدير الحالي: من 300 إلى 600 دولار. إذا تأكد أن التوقيع يعود للفنان المذكور، قد يرتفع النطاق إلى 1,500 – 3,000 دولار. الصورة الجديدة تساعد، لكنها لا تكفي وحدها لاعتماد السعر الأعلى. لا أنصح ببيعها قبل صورة أوضح للتوقيع والظهر. هل تستطيع إرسال صورة قريبة للتوقيع بإضاءة جانبية؟"

Evidence rules:
- Separate clear visual evidence from information that needs verification and details that do not affect price.
- If an image is added, analyze it in the context of the item. Do not treat the image alone as final proof. Explain whether it raises or lowers confidence.
- Treat all newly uploaded images as additional views/details of the same item unless the user clearly says otherwise.
- If the image is a stamp, hallmark, signature, back, side, invoice, damage, material, or measurement close-up, use it to update the full-object valuation instead of valuing the close-up as a separate object.
- Ask for another angle/photo only if necessary.
- If the user mentions an artist, brand, period, material, signature, hallmark, provenance, or invoice, do not accept it as certified fact. Use "if this information is confirmed" language and give the most important evidence needed.
- If a detail does not change price, say so briefly and explain why.
- Be decisive and practical. Avoid long generic possibilities.
- Keep the assistantMessage concise, reassuring, and useful.
${finalSummaryRules}

Return JSON only:
{
  "assistantMessage": "short practical expert reply",
  "updatedResult": {
    "title": "updated title",
    "itemType": "updated classification",
    "lookup": "updated identification",
    "timePeriod": "updated period view",
    "origin": "updated origin view",
    "material": "updated material view",
    "style": "updated style",
    "condition": "updated condition",
    "authenticity": "updated authenticity/attribution view in one concise sentence; for signed artwork, state working attribution and avoid repeating certificate warnings",
    "estimatedValue": "updated USD range, or unchanged range with reason",
    "priceReasoning": "short practical price reasoning after the new information; include current range and verified-attribution range when relevant",
    "history": "short updated context",
    "historicalReading": "3 to 4 short lines of cautious possible historical reading when appropriate, otherwise an empty string; use probabilistic wording and do not confirm uncertain history",
    "safeInitialChecks": ["4 to 7 short safe non-destructive initial checks for this item; no acid, burning, scraping, scratching, chemicals, boiling, peeling, opening sealed mechanisms, or damaging tests"],
    "carePreservationTips": ["4 to 6 short care and preservation tips for this item type/material; avoid risky cleaning, strong polishing, washing, repainting, home repair, chemicals, heat, soaking, or opening sealed mechanisms"],
    "valueDrivers": ["up to six concise drivers"],
    "valueReducers": ["up to six concise reducers"],
    "visualSearchKeywords": ["search keywords"],
    "neededPhotos": ["only necessary next evidence"],
    "followUpQuestion": "one smart follow-up question, empty for final summary if not needed",
    "confidence": 1,
    "confidenceNote": "why confidence rose, fell, or stayed the same, without repeating the same warning",
    "disclaimer": "preliminary visual appraisal, not a certificate",
    "brandAssessment": null,
    "markAnalysis": null,
    "metalValue": null
  }
}
Use the currentResult as the base. Preserve fields that are still valid. Use ${language} for every user-facing string.
`;
}

export async function POST(request: Request) {
  let locale: Locale = "ar";

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    locale = normalizeLocale(safeString(formData.get("locale")));
    const originalAnalysis = safeJson<Record<string, unknown>>(
      safeString(formData.get("originalAnalysis")),
      {},
    );
    const currentResult = safeJson<Record<string, unknown>>(
      safeString(formData.get("currentResult")),
      {},
    );
    const previousChatMessages = safeJson<unknown[]>(
      safeString(formData.get("previousChatMessages")),
      [],
    );
    const newUploadedImages = safeJson<string[]>(
      safeString(formData.get("newUploadedImages")),
      [],
    ).filter((image) => typeof image === "string");
    const newUserMessage = cleanText(safeString(formData.get("newUserMessage")), 1600);
    const remainingTurns = Number(safeString(formData.get("remainingTurns")) || "0");
    const isFinalSummary = safeString(formData.get("isFinalSummary")) === "true";
    const imageEntries = formData
      .getAll("images")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)
      .slice(0, 4);

    if (!newUserMessage && imageEntries.length === 0 && !isFinalSummary) {
      return NextResponse.json(
        {
          error:
            locale === "en"
              ? "Add a message or an image."
              : "أضف رسالة أو صورة.",
        },
        { status: 400 },
      );
    }

    const oversizedImage = imageEntries.find((file) => file.size > 8 * 1024 * 1024);

    if (oversizedImage) {
      return NextResponse.json(
        {
          error:
            locale === "en"
              ? "Image is too large. Please upload an image smaller than 8MB."
              : "الصورة كبيرة جدًا. ارفع صورة أصغر من 8MB.",
        },
        { status: 400 },
      );
    }

    const promptText = buildPrompt({
      locale,
      originalAnalysis,
      currentResult,
      previousChatMessages,
      newUserMessage,
      newUploadedImages,
      hasImages: imageEntries.length > 0 || newUploadedImages.length > 0,
      remainingTurns: Number.isFinite(remainingTurns) ? remainingTurns : 0,
      isFinalSummary,
    });
    const inputContent: Array<
      | { type: "input_text"; text: string }
      | { type: "input_image"; image_url: string; detail: "low" | "high" | "auto" }
    > = [{ type: "input_text", text: promptText }];

    const imageUrlsForVision = imageEntries.length > 0 ? [] : newUploadedImages.slice(0, 4);
    const totalVisionImages = imageEntries.length + imageUrlsForVision.length;

    for (const [index, file] of imageEntries.entries()) {
      inputContent.push({
        type: "input_text",
        text: `New chat image ${index + 1} of ${totalVisionImages}. Inspect it as an additional view/detail of the same item. Use stamps, hallmarks, signatures, backs, sides, invoices, damage, materials, or measurements as supporting evidence for the full-object valuation.`,
      });
      inputContent.push({
        type: "input_image",
        image_url: await fileToDataUrl(file),
        detail: "auto",
      });
    }

    for (const [index, imageUrl] of imageUrlsForVision.entries()) {
      inputContent.push({
        type: "input_text",
        text: `New chat image ${index + 1} of ${totalVisionImages}. Inspect it as an additional view/detail of the same item and update the main appraisal.`,
      });
      inputContent.push({
        type: "input_image",
        image_url: imageUrl,
        detail: "low",
      });
    }

    const client = new OpenAI({ apiKey });
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
      max_output_tokens: isFinalSummary ? 1600 : 1200,
    });
    const rawText = response.output_text;
    let parsed = parseModelJson(rawText);

    if (!parsed.assistantMessage || !parsed.updatedResult) {
      parsed = {
        assistantMessage: buildFallbackAssistantMessage(currentResult, locale),
        updatedResult: currentResult,
      };
    }

    const updatedResult = {
        ...currentResult,
        ...parsed.updatedResult,
      };
    const assistantMessage =
      parsed.assistantMessage || buildFallbackAssistantMessage(updatedResult, locale);

    return NextResponse.json({
      assistantMessage: ensurePriceFirst(
        assistantMessage,
        updatedResult,
        locale,
      ),
      updatedResult,
    });
  } catch (error) {
    console.error("Antique chat API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : locale === "en"
              ? "Failed to update the evaluation session."
              : "تعذر تحديث جلسة التقييم.",
      },
      { status: 500 },
    );
  }
}
