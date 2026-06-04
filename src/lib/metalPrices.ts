import "server-only";
import { TROY_OUNCE_GRAMS } from "@/lib/metalValue";

export type MetalSymbol = "XAU" | "XAG" | "XPT" | "XPD";

export type MetalSpotPrices = {
  goldOunceUSD: number;
  goldGramUSD: number;
  silverOunceUSD: number;
  silverGramUSD: number;
  platinumOunceUSD: number;
  platinumGramUSD: number;
  palladiumOunceUSD: number;
  palladiumGramUSD: number;
  updatedAt: string;
  source: "gold-api" | "fallback";
  warning?: string;
};

const CACHE_TTL_MS = 45 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const FALLBACK_WARNING = "Live metal price unavailable, using fallback estimate";

const FALLBACK_OUNCE_USD: Record<MetalSymbol, number> = {
  XAU: 2300,
  XAG: 29,
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

function buildSpotPrices(
  prices: Record<MetalSymbol, number>,
  source: MetalSpotPrices["source"],
  warning?: string,
): MetalSpotPrices {
  return {
    goldOunceUSD: roundMoney(prices.XAU),
    goldGramUSD: roundMoney(prices.XAU / TROY_OUNCE_GRAMS),
    silverOunceUSD: roundMoney(prices.XAG),
    silverGramUSD: roundMoney(prices.XAG / TROY_OUNCE_GRAMS),
    platinumOunceUSD: roundMoney(prices.XPT),
    platinumGramUSD: roundMoney(prices.XPT / TROY_OUNCE_GRAMS),
    palladiumOunceUSD: roundMoney(prices.XPD),
    palladiumGramUSD: roundMoney(prices.XPD / TROY_OUNCE_GRAMS),
    updatedAt: new Date().toISOString(),
    source,
    warning,
  };
}

export async function fetchMetalPrice(symbol: MetalSymbol) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://api.gold-api.com/price/${symbol}/USD`,
      {
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Gold API failed for ${symbol}: ${response.status}`);
    }

    const data = await response.json();
    const price = Number(data?.price);

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`Gold API returned invalid price for ${symbol}`);
    }

    return price;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Gold API request failed for ${symbol}: ${error.message}`
        : `Gold API request failed for ${symbol}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function getMetalSpotPrices(): Promise<MetalSpotPrices> {
  const now = Date.now();

  if (cachedPrices && cachedPrices.expiresAt > now) {
    return cachedPrices.value;
  }

  const symbols: MetalSymbol[] = ["XAU", "XAG", "XPT", "XPD"];
  const results = await Promise.allSettled(
    symbols.map((symbol) => fetchMetalPrice(symbol)),
  );

  const prices = { ...FALLBACK_OUNCE_USD };
  const failedSymbols: string[] = [];

  results.forEach((result, index) => {
    const symbol = symbols[index];

    if (!symbol) return;

    if (result.status === "fulfilled") {
      prices[symbol] = result.value;
      return;
    }

    failedSymbols.push(symbol);
    console.warn(FALLBACK_WARNING, result.reason);
  });

  const source = failedSymbols.length ? "fallback" : "gold-api";
  const warning = failedSymbols.length ? FALLBACK_WARNING : undefined;

  const value = buildSpotPrices(prices, source, warning);

  cachedPrices = {
    expiresAt: now + CACHE_TTL_MS,
    value,
  };

  return value;
}
