import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GoogleLensItem = {
  title: string;
  imageUrl: string;
  link: string;
  source: string;
  price?: string;
};

type GoogleLensVisualMatch = {
  title?: unknown;
  thumbnail?: unknown;
  image?: unknown;
  link?: unknown;
  source?: unknown;
  price?: unknown;
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing SERPAPI_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const imageUrl =
      typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing imageUrl for Google Lens search." },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      engine: "google_lens",
      url: imageUrl,
      api_key: apiKey,
    });

    const response = await fetch(
      `https://serpapi.com/search.json?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || "Google Lens search failed." },
        { status: response.status }
      );
    }

    const visualMatches: GoogleLensVisualMatch[] = Array.isArray(
      data.visual_matches,
    )
      ? data.visual_matches
      : [];

    const items: GoogleLensItem[] = visualMatches
      .slice(0, 32)
      .map((item) => {
        const priceObject =
          item.price && typeof item.price === "object"
            ? (item.price as Record<string, unknown>)
            : null;
        const price =
          typeof item?.price === "string"
            ? item.price
            : priceObject?.extracted_value
              ? String(priceObject.extracted_value)
              : priceObject?.value
                ? String(priceObject.value)
                : undefined;

        return {
          title: text(item.title, "Similar antique item"),
          imageUrl: text(item.thumbnail) || text(item.image),
          link: text(item.link),
          source: text(item.source, "Google Lens"),
          price,
        };
      })
      .filter((item: GoogleLensItem) => item.imageUrl && item.link);

    return NextResponse.json({
      items,
      rawCount: visualMatches.length,
    });
 } catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  console.error("Google Lens route error:", error);

  return NextResponse.json(
    {
      error: "Unexpected Google Lens error.",
      details: message,
    },
    { status: 500 }
  );
}
}
