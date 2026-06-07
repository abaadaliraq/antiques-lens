import { NextResponse } from "next/server";
import { getMetalSpotPrices } from "@/lib/metalPrices";

export const runtime = "nodejs";
export const revalidate = 900;

export async function GET() {
  try {
    const prices = await getMetalSpotPrices();

    return NextResponse.json(prices, {
      headers: {
        "Cache-Control": "s-maxage=900, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.warn("Metal prices route failed:", error);

    return NextResponse.json(
      {
        error: "Metal prices could not be loaded right now.",
      },
      { status: 503 },
    );
  }
}
