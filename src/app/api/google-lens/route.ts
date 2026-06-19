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

function debugGoogleLens(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[KISHIB similar][google-lens] ${message}`, details || {});
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.SERPAPI_KEY;

    debugGoogleLens("request start", {
      hasSerpApiKey: Boolean(apiKey),
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing SERPAPI_KEY environment variable." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const imageUrl =
      typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";

    if (!imageUrl) {
      debugGoogleLens("request rejected", {
        reason: "missing_image_url",
      });

      return NextResponse.json(
        { error: "Missing imageUrl for Google Lens search." },
        { status: 400 }
      );
    }

    debugGoogleLens("search query", {
      imageUrlHost: (() => {
        try {
          return new URL(imageUrl).host;
        } catch {
          return "invalid-url";
        }
      })(),
    });

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

    debugGoogleLens("provider response", {
      status: response.status,
      ok: response.ok,
      hasError: Boolean(data?.error),
    });

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

    let excludedMissingImageOrLink = 0;

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
      .filter((item: GoogleLensItem) => {
        const keep = Boolean(item.imageUrl && item.link);
        if (!keep) excludedMissingImageOrLink += 1;
        return keep;
      });

    debugGoogleLens("mapped results", {
      rawCount: visualMatches.length,
      returnedCount: items.length,
      excludedMissingImageOrLink,
    });

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
