import { NextResponse } from "next/server";
import { TROY_OUNCE_GRAMS } from "@/lib/metalValue";

export const runtime = "nodejs";

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export async function GET() {
  const apiKey = process.env.METALS_API_KEY;
  const fallbackGram = toNumber(process.env.SILVER_PRICE_PER_GRAM_USD);

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

    const directUsdXag = toNumber(rates.USDXAG);
    const invertedXag = toNumber(rates.XAG);

    const pricePerOz = directUsdXag ?? (invertedXag ? 1 / invertedXag : null);

    if (!pricePerOz) {
      throw new Error("Missing XAG price");
    }

    const pricePerGram = pricePerOz / TROY_OUNCE_GRAMS;
    const pricePerKg = pricePerGram * 1000;

    return NextResponse.json({
      metal: "silver",
      currency: "USD",
      pricePerOz: roundMoney(pricePerOz),
      pricePerGram: roundMoney(pricePerGram),
      pricePerKg: roundMoney(pricePerKg),
      source: directUsdXag ? "api:USDXAG" : "api:inverted-XAG",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (!fallbackGram) {
      return NextResponse.json(
        {
          metal: "silver",
          currency: "USD",
          error:
            error instanceof Error
              ? error.message
              : "Unable to fetch silver price",
          source: "none",
          updatedAt: new Date().toISOString(),
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      metal: "silver",
      currency: "USD",
      pricePerOz: roundMoney(fallbackGram * TROY_OUNCE_GRAMS),
      pricePerGram: roundMoney(fallbackGram),
      pricePerKg: roundMoney(fallbackGram * 1000),
      source: "env_fallback",
      updatedAt: new Date().toISOString(),
    });
  }
}