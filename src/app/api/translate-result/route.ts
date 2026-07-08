import OpenAI from "openai";
import { NextResponse } from "next/server";

type Locale = "ar" | "en" | "fr" | "hi" | "fa" | "tr" | "ru" | "ku" | "es";

function normalizeLocale(value: unknown): Locale {
  const locale = String(value || "").toLowerCase();

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
  if (locale === "en") return "English";
  if (locale === "fr") return "French";
  if (locale === "hi") return "Hindi";
  if (locale === "fa") return "Persian";
  if (locale === "tr") return "Turkish";
  if (locale === "ru") return "Russian";
  if (locale === "ku") return "Kurdish Sorani";
  if (locale === "es") return "Spanish";
  return "Arabic";
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

    const body = await request.json();

    const locale = normalizeLocale(body.locale);
    const result = body.result;

    if (!result) {
      return NextResponse.json(
        { error: "Missing result to translate" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey });

    const language = getLanguageName(locale);

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `
You translate antique evaluation JSON results.

Translate all user-facing text into ${language}.

Rules:
- Return JSON only.
- Keep the same JSON keys exactly.
- Do not remove fields.
- Do not add new fields.
- Do not change prices.
- Do not change numbers.
- Do not change URLs.
- Do not change image links.
- Do not reinterpret or re-evaluate the antique.
- Translate text only.
- Arrays must remain arrays.
- If a value is already a number, keep it as number.
- If a value is null, keep it null.
`,
        },
        {
          role: "user",
          content: JSON.stringify(result),
        },
      ],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content;

    if (!text) {
      return NextResponse.json(
        { error: "No translation returned" },
        { status: 500 }
      );
    }

    const translated = JSON.parse(text);

    return NextResponse.json({ result: translated });
  } catch (error) {
    console.error("translate-result error:", error);

    return NextResponse.json(
      { error: "Failed to translate result" },
      { status: 500 }
    );
  }
}
