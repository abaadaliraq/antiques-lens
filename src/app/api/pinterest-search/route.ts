import { NextResponse } from "next/server";

type PinterestItem = {
  title: string;
  imageUrl: string;
  link: string;
  source?: string;
};

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Missing Pinterest search query." },
        { status: 400 },
      );
    }

    const apiKey = process.env.SCRAPECREATORS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing SCRAPECREATORS_API_KEY." },
        { status: 500 },
      );
    }

    const url = new URL("https://api.scrapecreators.com/v1/pinterest/search");
    url.searchParams.set("query", query);
    url.searchParams.set("trim", "true");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
      next: {
        revalidate: 60 * 60 * 12,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Pinterest search failed.",
          details: data,
        },
        { status: response.status },
      );
    }

    const rawItems = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.pins)
        ? data.pins
        : Array.isArray(data)
          ? data
          : [];

    const items: PinterestItem[] = rawItems
      .map((item: any) => {
        const imageUrl =
          item.image ||
          item.imageUrl ||
          item.image_url ||
          item.thumbnail ||
          item.thumbnailUrl ||
          item.media?.images?.orig?.url ||
          item.images?.orig?.url ||
          "";

        const link =
          item.url ||
          item.link ||
          item.pinUrl ||
          item.pin_url ||
          item.domain ||
          "";

        return {
          title: item.title || item.description || "Pinterest result",
          imageUrl,
          link,
          source: "Pinterest",
        };
      })
      .filter((item: PinterestItem) => item.imageUrl)
      .slice(0, 12);

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected Pinterest search error.",
      },
      { status: 500 },
    );
  }
}