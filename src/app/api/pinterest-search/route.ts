import { NextResponse } from "next/server";

type PinterestItem = {
  title: string;
  imageUrl: string;
  link: string;
  source?: string;
};

type PinterestRawItem = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNestedText(item: PinterestRawItem, path: string[]) {
  let current: unknown = item;

  for (const key of path) {
    if (!current || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[key];
  }

  return text(current);
}

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

    const data = (await response.json()) as
      | Record<string, unknown>
      | unknown[];

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Pinterest search failed.",
          details: data,
        },
        { status: response.status },
      );
    }

    const dataRecord =
      data && !Array.isArray(data) && typeof data === "object"
        ? (data as Record<string, unknown>)
        : {};

    const rawItems: PinterestRawItem[] = Array.isArray(dataRecord.results)
      ? (dataRecord.results as PinterestRawItem[])
      : Array.isArray(dataRecord.pins)
        ? (dataRecord.pins as PinterestRawItem[])
        : Array.isArray(data)
          ? (data as PinterestRawItem[])
          : [];

    const items: PinterestItem[] = rawItems
      .map((item) => {
        const imageUrl =
          text(item.image) ||
          text(item.imageUrl) ||
          text(item.image_url) ||
          text(item.thumbnail) ||
          text(item.thumbnailUrl) ||
          getNestedText(item, ["media", "images", "orig", "url"]) ||
          getNestedText(item, ["images", "orig", "url"]);

        const link =
          text(item.url) ||
          text(item.link) ||
          text(item.pinUrl) ||
          text(item.pin_url) ||
          text(item.domain);

        return {
          title:
            text(item.title) || text(item.description) || "Pinterest result",
          imageUrl,
          link,
          source: "Pinterest",
        };
      })
      .filter((item: PinterestItem) => item.imageUrl)
      .slice(0, 12);

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      {
        error: "Unexpected Pinterest search error.",
      },
      { status: 500 },
    );
  }
}
