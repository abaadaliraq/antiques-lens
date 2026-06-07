import "server-only";
import { TROY_OUNCE_GRAMS } from "@/lib/metalValue";

export type MetalSymbol = "XAU" | "XAG" | "XCU" | "XPT" | "XPD";
export type DisplayMetalKey = "gold" | "silver" | "copper" | "platinum";

export type DisplayMetalPrice = {
  symbol: Exclude<MetalSymbol, "XPD">;
  name: string;
  priceUsdPerOunce: number;
  updatedAt: string;
  changeUsdPerOunce?: number;
  changePercent?: number;
};

export type MetalPricesResponse = Record<DisplayMetalKey, DisplayMetalPrice> & {
  updatedAt: string;
  source: "metals-api" | "gold-api" | "fallback";
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

const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const FALLBACK_WARNING = "Live metal price unavailable, using fallback estimate";

const DISPLAY_METALS: Array<{
  key: DisplayMetalKey;
  symbol: Exclude<MetalSymbol, "XPD">;
  name: string;
}> = [
  { key: "gold", symbol: "XAU", name: "Gold" },
  { key: "silver", symbol: "XAG", name: "Silver" },
  { key: "copper", symbol: "XCU", name: "Copper" },
  { key: "platinum", symbol: "XPT", name: "Platinum" },
];

const LEGACY_SYMBOLS: MetalSymbol[] = ["XAU", "XAG", "XCU", "XPT", "XPD"];

const FALLBACK_OUNCE_USD: Record<MetalSymbol, number> = {
  XAU: 2300,
  XAG: 29,
  XCU: 0.27,
  XPT: 1000,
  XPD: 950,
};

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

function getMetalsApiUrl() {
  const endpoint = envValue("METALS_API_URL");
  const key = envValue("METALS_API_KEY");

  if (endpoint) {
    const url = new URL(endpoint);
    if (key && !url.searchParams.has("access_key")) {
      url.searchParams.set("access_key", key);
    }
    url.searchParams.set("base", "USD");
    url.searchParams.set("symbols", "XAU,XAG,XCU,XPT");
    return url.toString();
  }

  if (!key || key.startsWith("http") || key.includes("API_KEY")) return null;

  const url = new URL("https://metals-api.com/api/latest");
  url.searchParams.set("access_key", key);
  url.searchParams.set("base", "USD");
  url.searchParams.set("symbols", "XAU,XAG,XCU,XPT");
  return url.toString();
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Metal price request failed: ${response.status}`);
    }

    return (await response.json()) as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

function rateToUsdPerOunce(rate: unknown) {
  const value = Number(rate);
  if (!Number.isFinite(value) || value <= 0) return null;

  return value < 1 ? 1 / value : value;
}

async function fetchMetalsApiPrices() {
  const url = getMetalsApiUrl();
  if (!url) return null;

  const data = await fetchJson(url);
  const rates =
    data.rates && typeof data.rates === "object"
      ? (data.rates as Record<string, unknown>)
      : null;

  if (!rates) {
    throw new Error("Metals API response did not include rates");
  }

  const prices: Partial<Record<MetalSymbol, number>> = {};

  for (const metal of DISPLAY_METALS) {
    const price = rateToUsdPerOunce(rates[metal.symbol]);
    if (price) prices[metal.symbol] = price;
  }

  if (!DISPLAY_METALS.every((metal) => isUsableNumber(prices[metal.symbol]))) {
    throw new Error("Metals API response did not include all required metals");
  }

  return prices as Record<Exclude<MetalSymbol, "XPD">, number>;
}

async function fetchGoldApiPrice(symbol: MetalSymbol) {
  const data = await fetchJson(`https://api.gold-api.com/price/${symbol}/USD`);
  const price = Number(data?.price);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Gold API returned invalid price for ${symbol}`);
  }

  return price;
}

function buildSpotPrices(
  prices: Record<MetalSymbol, number>,
  source: MetalSpotPrices["source"],
  warning?: string,
): MetalSpotPrices {
  const updatedAt = new Date().toISOString();
  const displayPrices = Object.fromEntries(
    DISPLAY_METALS.map((metal) => [
      metal.key,
      {
        symbol: metal.symbol,
        name: metal.name,
        priceUsdPerOunce: roundMoney(prices[metal.symbol]),
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
    source,
    warning,
  };
}

async function fetchLivePrices() {
  const metalsApiPrices = await fetchMetalsApiPrices();

  if (metalsApiPrices) {
    return {
      source: "metals-api" as const,
      prices: {
        ...FALLBACK_OUNCE_USD,
        ...metalsApiPrices,
      },
    };
  }

  const results = await Promise.allSettled(
    LEGACY_SYMBOLS.map((symbol) => fetchGoldApiPrice(symbol)),
  );
  const prices = { ...FALLBACK_OUNCE_USD };
  const failedSymbols: string[] = [];

  results.forEach((result, index) => {
    const symbol = LEGACY_SYMBOLS[index];
    if (!symbol) return;

    if (result.status === "fulfilled") {
      prices[symbol] = result.value;
      return;
    }

    failedSymbols.push(symbol);
  });

  return {
    source: failedSymbols.length ? ("fallback" as const) : ("gold-api" as const),
    prices,
    warning: failedSymbols.length ? FALLBACK_WARNING : undefined,
  };
}

export async function getMetalSpotPrices(): Promise<MetalSpotPrices> {
  const now = Date.now();

  if (cachedPrices && cachedPrices.expiresAt > now) {
    return cachedPrices.value;
  }

  try {
    const live = await fetchLivePrices();
    const value = buildSpotPrices(live.prices, live.source, live.warning);

    cachedPrices = {
      expiresAt: now + CACHE_TTL_MS,
      value,
    };

    return value;
  } catch (error) {
    console.warn(FALLBACK_WARNING, error);
    const value = buildSpotPrices(
      FALLBACK_OUNCE_USD,
      "fallback",
      FALLBACK_WARNING,
    );

    cachedPrices = {
      expiresAt: now + CACHE_TTL_MS,
      value,
    };

    return value;
  }
}
