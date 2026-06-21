import { NextResponse } from "next/server";
import {
  getSimilarImageUser,
  logSimilarImageUsage,
} from "@/lib/similarImageUsageServer";

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

function debugPinterest(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[KISHIB similar][pinterest] ${message}`, details || {});
}

export async function POST(request: Request) {
  let userId: string | null = null;

  try {
    const userContext = await getSimilarImageUser(request);
    userId = userContext.userId;
    const { query } = await request.json();

    debugPinterest("request start", {
      hasQuery: typeof query === "string" && Boolean(query.trim()),
      query: typeof query === "string" ? query.slice(0, 160) : "",
      hasScrapeCreatorsKey: Boolean(process.env.SCRAPECREATORS_API_KEY),
      hasUser: Boolean(userId),
    });

    if (!query || typeof query !== "string") {
      await logSimilarImageUsage(userId, "pinterest", "failed", "missing_query");
      return NextResponse.json(
        { error: "Missing Pinterest search query." },
        { status: 400 },
      );
    }

    const apiKey = process.env.SCRAPECREATORS_API_KEY;

    if (!apiKey) {
      await logSimilarImageUsage(userId, "pinterest", "failed", "missing_scrapecreators_key");
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

    debugPinterest("provider response", {
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      await logSimilarImageUsage(userId, "pinterest", "failed", `provider_status_${response.status}`);

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

    let excludedMissingImage = 0;

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
      .filter((item: PinterestItem) => {
        const keep = Boolean(item.imageUrl);
        if (!keep) excludedMissingImage += 1;
        return keep;
      })
      .slice(0, 12);

    debugPinterest("mapped results", {
      rawCount: rawItems.length,
      returnedCount: items.length,
      excludedMissingImage,
    });

    await logSimilarImageUsage(userId, "pinterest", "success");

    return NextResponse.json({ items });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[KISHIB similar][pinterest] route error", {
        message: error instanceof Error ? error.message : String(error),
      });
    }

    await logSimilarImageUsage(
      userId,
      "pinterest",
      "failed",
      error instanceof Error ? error.message : String(error),
    );

    return NextResponse.json(
      {
        error: "Unexpected Pinterest search error.",
      },
      { status: 500 },
    );
  }
}
