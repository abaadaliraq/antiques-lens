import type { AnalysisResult, Locale } from "@/components/antique-ai/types";

export type GeminiImageInput = {
  dataUrl?: string;
  url?: string;
};

export type GeminiSecondOpinion = {
  visualSecondOpinion: string;
  possibleMaterial: string;
  possiblePeriod: string;
  conditionNotes: string;
  risksOrUncertainties: string;
  priceLogicReview: string;
  disagreementWithOpenAI: string;
  confidenceAdjustment: string;
  finalCautionNotes: string;
};

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash";
const KNOWN_UNAVAILABLE_GEMINI_MODELS = new Set(["gemini-1.5-flash"]);
const GEMINI_TIMEOUT_MS = 10000;
const GEMINI_IMAGE_FETCH_TIMEOUT_MS = 4500;

function cleanText(value: unknown, maxLength = 700) {
  if (typeof value !== "string") return "";
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? clean.slice(0, maxLength).trim() : clean;
}

function parseDataUrl(value: string) {
  const match = value.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;

  return {
    mimeType: match[1] || "image/jpeg",
    data: match[2] || "",
  };
}

async function imageUrlToInlineData(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(GEMINI_IMAGE_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) return null;

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    mimeType: contentType.split(";")[0] || "image/jpeg",
    data: base64,
  };
}

async function buildImageParts(images: GeminiImageInput[]) {
  const parts: Array<{ inlineData: { mimeType: string; data: string } }> = [];

  for (const image of images.slice(0, 4)) {
    try {
      const inlineData = image.dataUrl
        ? parseDataUrl(image.dataUrl)
        : image.url
          ? await imageUrlToInlineData(image.url)
          : null;

      if (inlineData?.data) {
        parts.push({ inlineData });
      }
    } catch (error) {
      console.warn("[Gemini second opinion] skipped image input", error);
    }
  }

  return parts;
}

function parseGeminiJson(text: string): GeminiSecondOpinion | null {
  const jsonText =
    text.match(/```json\s*([\s\S]*?)```/i)?.[1] ||
    text.match(/```\s*([\s\S]*?)```/)?.[1] ||
    text;

  try {
    const parsed = JSON.parse(jsonText) as Partial<GeminiSecondOpinion>;

    return {
      visualSecondOpinion: cleanText(parsed.visualSecondOpinion),
      possibleMaterial: cleanText(parsed.possibleMaterial, 320),
      possiblePeriod: cleanText(parsed.possiblePeriod, 320),
      conditionNotes: cleanText(parsed.conditionNotes),
      risksOrUncertainties: cleanText(parsed.risksOrUncertainties),
      priceLogicReview: cleanText(parsed.priceLogicReview),
      disagreementWithOpenAI: cleanText(parsed.disagreementWithOpenAI),
      confidenceAdjustment: cleanText(parsed.confidenceAdjustment, 160),
      finalCautionNotes: cleanText(parsed.finalCautionNotes),
    };
  } catch {
    return null;
  }
}

export async function getGeminiSecondOpinion({
  locale,
  notes,
  openAiResult,
  images,
}: {
  locale: Locale;
  notes: string;
  openAiResult: AnalysisResult;
  images: GeminiImageInput[];
}): Promise<GeminiSecondOpinion | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.info("[Gemini second opinion] GEMINI_API_KEY is not configured");
    return null;
  }

  if (KNOWN_UNAVAILABLE_GEMINI_MODELS.has(GEMINI_MODEL)) {
    console.info(
      `[Gemini second opinion skipped] configured model ${GEMINI_MODEL} is known to be unavailable; set GEMINI_MODEL to a supported model to re-enable it`,
    );
    return null;
  }

  try {
    const imageParts = await buildImageParts(images);
    const language =
      locale === "en"
        ? "English"
        : locale === "ar"
          ? "Arabic"
          : "the same language used in the OpenAI result";
    const prompt = `
You are a cautious antique appraisal reviewer for KISHIB.
Return JSON only. Do not write a separate user report.
Write user-facing values in ${language}.

Review the images, visitor notes, and OpenAI preliminary result.
Never certify authenticity, precious metal, age, or origin from images only.
Use cautious wording: preliminary estimate, possible, likely, needs direct inspection, cannot confirm material from image only.
Inspect every provided image for stamps, signatures, hallmarks, labels, serials, inscriptions, and close-up details.
If a stamp, signature, hallmark, label, serial, or inscription appears, describe it only. Do not confirm maker identity, artist attribution, material, purity, or authenticity unless supported by direct documentation/testing.
If a visible mark is unclear, recommend a close-up image and lower confidence instead of guessing.
Keep price as an approximate range logic review, never a single exact value.

Visitor notes:
${cleanText(notes, 1200) || "No notes provided."}

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
  },
  null,
  2,
)}

Return exactly this JSON shape:
{
  "visualSecondOpinion": "",
  "possibleMaterial": "",
  "possiblePeriod": "",
  "conditionNotes": "",
  "risksOrUncertainties": "",
  "priceLogicReview": "",
  "disagreementWithOpenAI": "",
  "confidenceAdjustment": "raise | keep | lower",
  "finalCautionNotes": ""
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }, ...imageParts],
            },
          ],
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 1200,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      console.warn("[Gemini second opinion] request failed", response.status);
      return null;
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n")
      .trim();

    return text ? parseGeminiJson(text) : null;
  } catch (error) {
    console.warn("[Gemini second opinion] unavailable", error);
    return null;
  }
}
