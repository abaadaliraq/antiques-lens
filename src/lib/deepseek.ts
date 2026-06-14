import type { AnalysisResult, Locale } from "@/components/antique-ai/types";
import type { GeminiSecondOpinion } from "@/lib/gemini";

export type DeepSeekLogicReview = {
  logicReview: string;
  pricingRisk: "low" | "medium" | "high";
  confidenceRecommendation: "low" | "medium" | "high";
  shouldReduceConfidence: boolean;
  mainDisagreements: string[];
  unsafeClaimsFound: string[];
  recommendedCautionNotes: string[];
  pricingAdjustmentNotes: string;
  finalReviewerSummary: string;
};

const DEEPSEEK_MODEL = "deepseek-chat";
const DEEPSEEK_TIMEOUT_MS = 10000;

function cleanText(value: unknown, maxLength = 900) {
  if (typeof value !== "string") return "";
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? clean.slice(0, maxLength).trim() : clean;
}

function cleanStringArray(value: unknown, maxItems = 6, maxLength = 260) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => cleanText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeRisk(value: unknown): "low" | "medium" | "high" {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : "medium";
}

function parseDeepSeekJson(text: string): DeepSeekLogicReview | null {
  const jsonText =
    text.match(/```json\s*([\s\S]*?)```/i)?.[1] ||
    text.match(/```\s*([\s\S]*?)```/)?.[1] ||
    text;

  try {
    const parsed = JSON.parse(jsonText) as Partial<DeepSeekLogicReview>;

    return {
      logicReview: cleanText(parsed.logicReview),
      pricingRisk: normalizeRisk(parsed.pricingRisk),
      confidenceRecommendation: normalizeRisk(parsed.confidenceRecommendation),
      shouldReduceConfidence: Boolean(parsed.shouldReduceConfidence),
      mainDisagreements: cleanStringArray(parsed.mainDisagreements),
      unsafeClaimsFound: cleanStringArray(parsed.unsafeClaimsFound),
      recommendedCautionNotes: cleanStringArray(parsed.recommendedCautionNotes),
      pricingAdjustmentNotes: cleanText(parsed.pricingAdjustmentNotes),
      finalReviewerSummary: cleanText(parsed.finalReviewerSummary),
    };
  } catch {
    return null;
  }
}

export async function getDeepSeekLogicReview({
  locale,
  notes,
  openAiResult,
  geminiSecondOpinion,
  marketContext,
}: {
  locale: Locale;
  notes: string;
  openAiResult: AnalysisResult;
  geminiSecondOpinion: GeminiSecondOpinion | null;
  marketContext: string;
}): Promise<DeepSeekLogicReview | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.info("[DeepSeek review skipped] DEEPSEEK_API_KEY is not configured");
    return null;
  }

  try {
    const language =
      locale === "en"
        ? "English"
        : locale === "ar"
          ? "Arabic"
          : "the same language used in the OpenAI result";
    const prompt = `
You are KISHIB's internal logic and pricing reviewer.
You do not see images. Review only the text data, market context, OpenAI result, and Gemini reviewer notes.
Return JSON only. Do not mention model names to the user.
Write user-facing values in ${language}.

Strict rules:
- Never allow claims like "100% authentic", "guaranteed", "documented", "confirmed gold", "confirmed silver", or "confirmed diamond" unless direct testing/documentation is explicitly provided.
- If evidence is image-only, authenticity, material, age, origin, maker, hallmark, and market value must remain cautious.
- If OpenAI and Gemini disagree, recommend medium or low confidence.
- Price must remain an approximate range, not a fixed exact number.
- If the price logic jumps too far beyond visible evidence or market data, mark pricingRisk medium/high and recommend more cautious wording.
- If stamps/signatures/hallmarks are mentioned, they may be described but not treated as maker proof without strong evidence.
- If a stamp/signature/hallmark is unclear or only visually inferred, do not let it drive a high price or high confidence by itself.

Visitor data:
${cleanText(notes, 1500) || "No visitor notes."}

Market / metal / auction context, if any:
${cleanText(marketContext, 2500) || "No market context."}

OpenAI preliminary result:
${JSON.stringify(
  {
    title: openAiResult.title,
    itemType: openAiResult.itemType,
    lookup: openAiResult.lookup,
    material: openAiResult.material,
    timePeriod: openAiResult.timePeriod,
    condition: openAiResult.condition,
    authenticity: openAiResult.authenticity,
    estimatedValue: openAiResult.estimatedValue,
    priceReasoning: openAiResult.priceReasoning,
    confidence: openAiResult.confidence,
    confidenceNote: openAiResult.confidenceNote,
    markAnalysis: openAiResult.markAnalysis,
    disclaimer: openAiResult.disclaimer,
  },
  null,
  2,
)}

Gemini second opinion:
${JSON.stringify(geminiSecondOpinion ?? { unavailable: true }, null, 2)}

Return exactly this JSON shape:
{
  "logicReview": "",
  "pricingRisk": "low | medium | high",
  "confidenceRecommendation": "low | medium | high",
  "shouldReduceConfidence": true,
  "mainDisagreements": [],
  "unsafeClaimsFound": [],
  "recommendedCautionNotes": [],
  "pricingAdjustmentNotes": "",
  "finalReviewerSummary": ""
}
`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT_MS),
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a strict antique appraisal logic checker. Return valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 1100,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.warn("[DeepSeek review skipped] request failed", response.status);
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();

    return text ? parseDeepSeekJson(text) : null;
  } catch (error) {
    console.warn("[DeepSeek review skipped]", error);
    return null;
  }
}
