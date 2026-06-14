import "server-only";
import { TROY_OUNCE_GRAMS } from "@/lib/metalValue";

export type MetalSymbol = "XAU" | "XAG" | "XCU" | "XPT" | "XPD";
export type DisplayMetalKey =
  | "gold"
  | "silver"
  | "platinum"
  | "palladium"
  | "copper";

export type DisplayMetalPrice = {
  symbol: MetalSymbol;
  name: string;
  priceUsdPerOunce: number;
  priceUsdPerGram: number;
  updatedAt: string;
};

export type MetalPricesResponse = Record<DisplayMetalKey, DisplayMetalPrice> & {
  updatedAt: string;
  source: "metals.dev";
  stale?: boolean;
  warning?: string;
};

export type MetalSpotPrices = MetalPricesResponse & {
  goldOunceUSD: number;
  goldGramUSD: number;
  silverOunceUSD: number;
  silverGramUSD: number;
  copperOunceUSD: number;
  copperGramUSD: number;
  platinumOunceUSD: number;
  platinumGramUSD: number;
  palladiumOunceUSD: number;
  palladiumGramUSD: number;
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const UNAVAILABLE_WARNING = "Live Metals.dev prices are unavailable";

const DISPLAY_METALS: Array<{
  key: DisplayMetalKey;
  symbol: MetalSymbol;
  name: string;
  aliases: string[];
}> = [
  { key: "gold", symbol: "XAU", name: "Gold", aliases: ["gold", "XAU"] },
  { key: "silver", symbol: "XAG", name: "Silver", aliases: ["silver", "XAG"] },
  {
    key: "platinum",
    symbol: "XPT",
    name: "Platinum",
    aliases: ["platinum", "XPT"],
  },
  {
    key: "palladium",
    symbol: "XPD",
    name: "Palladium",
    aliases: ["palladium", "XPD"],
  },
  { key: "copper", symbol: "XCU", name: "Copper", aliases: ["copper", "XCU"] },
];

let cachedPrices:
  | {
      expiresAt: number;
      value: MetalSpotPrices;
    }
  | null = null;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function isUsableNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function envValue(name: string) {
  const value = process.env[name]?.trim();
  return value && value !== "API_KEY" ? value : "";
}

function getMetalsDevUrl() {
  const apiKey = envValue("METALS_API_KEY");

  if (!apiKey || apiKey.startsWith("http")) {
    return null;
  }

  const url = new URL("https://api.metals.dev/v1/latest");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("currency", "USD");
  url.searchParams.set("unit", "toz");
  return url.toString();
}

function getNestedObject(
  data: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  const value = data[key];
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function readMetalPrice(
  data: Record<string, unknown>,
  aliases: string[],
): number | null {
  const pools = [
    data,
    getNestedObject(data, "metals"),
    getNestedObject(data, "rates"),
    getNestedObject(data, "prices"),
  ].filter((pool): pool is Record<string, unknown> => Boolean(pool));

  for (const pool of pools) {
    for (const alias of aliases) {
      const direct = Number(pool[alias]);
      if (isUsableNumber(direct)) return direct;

      const lower = Number(pool[alias.toLowerCase()]);
      if (isUsableNumber(lower)) return lower;
    }
  }

  return null;
}

async function fetchMetalsDevPrices() {
  const url = getMetalsDevUrl();
  if (!url) return null;

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Metals.dev request failed: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const prices: Partial<Record<MetalSymbol, number>> = {};

  for (const metal of DISPLAY_METALS) {
    const price = readMetalPrice(data, metal.aliases);
    if (price) prices[metal.symbol] = price;
  }

  if (!DISPLAY_METALS.every((metal) => isUsableNumber(prices[metal.symbol]))) {
    throw new Error("Metals.dev response did not include all required metals");
  }

  return prices as Record<MetalSymbol, number>;
}

function buildSpotPrices(
  prices: Record<MetalSymbol, number>,
  options?: { stale?: boolean; warning?: string },
): MetalSpotPrices {
  const updatedAt = new Date().toISOString();
  const displayPrices = Object.fromEntries(
    DISPLAY_METALS.map((metal) => [
      metal.key,
      {
        symbol: metal.symbol,
        name: metal.name,
        priceUsdPerOunce: roundMoney(prices[metal.symbol]),
        priceUsdPerGram: roundMoney(prices[metal.symbol] / TROY_OUNCE_GRAMS),
        updatedAt,
      },
    ]),
  ) as Record<DisplayMetalKey, DisplayMetalPrice>;

  return {
    ...displayPrices,
    goldOunceUSD: roundMoney(prices.XAU),
    goldGramUSD: roundMoney(prices.XAU / TROY_OUNCE_GRAMS),
    silverOunceUSD: roundMoney(prices.XAG),
    silverGramUSD: roundMoney(prices.XAG / TROY_OUNCE_GRAMS),
    copperOunceUSD: roundMoney(prices.XCU),
    copperGramUSD: roundMoney(prices.XCU / TROY_OUNCE_GRAMS),
    platinumOunceUSD: roundMoney(prices.XPT),
    platinumGramUSD: roundMoney(prices.XPT / TROY_OUNCE_GRAMS),
    palladiumOunceUSD: roundMoney(prices.XPD),
    palladiumGramUSD: roundMoney(prices.XPD / TROY_OUNCE_GRAMS),
    updatedAt,
    source: "metals.dev",
    stale: options?.stale,
    warning: options?.warning,
  };
}

export async function getMetalSpotPrices(): Promise<MetalSpotPrices | null> {
  const now = Date.now();

  if (cachedPrices && cachedPrices.expiresAt > now) {
    return cachedPrices.value;
  }

  try {
    const prices = await fetchMetalsDevPrices();

    if (!prices) {
      console.info("[Metals.dev skipped] METALS_API_KEY is not configured");
      return cachedPrices?.value
        ? {
            ...cachedPrices.value,
            stale: true,
            warning: UNAVAILABLE_WARNING,
          }
        : null;
    }

    const value = buildSpotPrices(prices);
    cachedPrices = {
      expiresAt: now + CACHE_TTL_MS,
      value,
    };

    return value;
  } catch (error) {
    console.warn(
      "[Metals.dev skipped]",
      error instanceof Error ? error.message.replace(/\?.*$/, "") : "request failed",
    );

    if (cachedPrices?.value) {
      return {
        ...cachedPrices.value,
        stale: true,
        warning: UNAVAILABLE_WARNING,
      };
    }

    return null;
  }
}
