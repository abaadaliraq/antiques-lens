import { NextResponse } from "next/server";
import { getMetalSpotPrices } from "@/lib/metalPrices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 21600;

export async function GET() {
  try {
    const prices = await getMetalSpotPrices();

    if (!prices) {
      return NextResponse.json(
        {
          error: "Metal prices are not available right now.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(prices, {
      headers: {
        "Cache-Control": "s-maxage=21600, stale-while-revalidate=43200",
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
