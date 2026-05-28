import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GoogleLensItem = {
  title: string;
  imageUrl: string;
  link: string;
  source: string;
  price?: string;
};

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

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || "Google Lens search failed." },
        { status: response.status }
      );
    }

    const visualMatches = Array.isArray(data?.visual_matches)
      ? data.visual_matches
      : [];

    const items: GoogleLensItem[] = visualMatches
      .slice(0, 16)
      .map((item: any) => {
        const price =
          typeof item?.price === "string"
            ? item.price
            : item?.price?.extracted_value
              ? String(item.price.extracted_value)
              : item?.price?.value
                ? String(item.price.value)
                : undefined;

        return {
          title: String(item?.title || "Similar antique item"),
          imageUrl: String(item?.thumbnail || item?.image || ""),
          link: String(item?.link || ""),
          source: String(item?.source || "Google Lens"),
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