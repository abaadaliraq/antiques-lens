import { NextResponse } from "next/server";
import { getMetalSpotPrices } from "@/lib/metalPrices";

export const runtime = "nodejs";

export async function GET() {
  try {
    const prices = await getMetalSpotPrices();

    return NextResponse.json(prices, {
      headers: {
        "Cache-Control": "s-maxage=2700, stale-while-revalidate=900",
      },
    });
  } catch (error) {
    console.warn("Metal prices route fallback response used:", error);

    return NextResponse.json(
      {
        goldOunceUSD: 2300,
        goldGramUSD: 73.95,
        silverOunceUSD: 29,
        silverGramUSD: 0.93,
        platinumOunceUSD: 1000,
        platinumGramUSD: 32.15,
        palladiumOunceUSD: 950,
        palladiumGramUSD: 30.54,
        updatedAt: new Date().toISOString(),
        source: "fallback",
        warning: "Live metal price unavailable, using fallback estimate",
      },
      { status: 200 },
    );
  }
}
