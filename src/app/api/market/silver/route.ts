import { NextResponse } from "next/server";
import { TROY_OUNCE_GRAMS } from "@/lib/metalValue";
import { getMetalSpotPrices } from "@/lib/metalPrices";

export const runtime = "nodejs";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export async function GET() {
  const prices = await getMetalSpotPrices();

  if (!prices) {
    return NextResponse.json(
      { error: "Silver price is not available right now." },
      { status: 503 },
    );
  }

  const pricePerGram = prices.silverGramUSD;

  return NextResponse.json({
    metal: "silver",
    currency: "USD",
    pricePerOz: prices.silverOunceUSD,
    pricePerGram,
    pricePerKg: roundMoney(pricePerGram * 1000),
    source: prices.source,
    warning: prices.warning,
    updatedAt: prices.updatedAt,
    conversion: "pricePerGram = pricePerOz / 31.1035",
    troyOunceGrams: TROY_OUNCE_GRAMS,
  });
}
