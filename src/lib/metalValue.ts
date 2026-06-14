export const TROY_OUNCE_GRAMS = 31.1035;

export type SilverMeltValue = {
  metal: "silver";
  weightGrams: number;
  purityAssumption: string;
  spotPricePerGramUsd: number;
  meltValueUsdLow: number;
  meltValueUsdMid: number;
  meltValueUsdHigh: number;
  note: string;
};

export type SilverScenario = {
  label: "light" | "medium" | "heavy";
  labelAr: string;
  weightGrams: number;
  purityAssumption: string;
  spotPricePerGramUsd: number;
  meltValueUsdLow: number;
  meltValueUsdMid: number;
  meltValueUsdHigh: number;
  antiqueEstimateUsdLow: number;
  antiqueEstimateUsdHigh: number;
  note: string;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeNumerals(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";

  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndex = arabic.indexOf(digit);
    if (arabicIndex >= 0) return String(arabicIndex);

    const persianIndex = persian.indexOf(digit);
    return persianIndex >= 0 ? String(persianIndex) : digit;
  });
}

export function normalizeWeightToGrams(input?: string | number | null) {
  if (input === null || input === undefined) return null;

  const raw = normalizeNumerals(String(input)).toLowerCase().trim();
  if (!raw) return null;

  const normalized = raw
    .replace(/[،,]/g, ".")
    .replace(/كغم|كيلو|كيلوغرام|kg|kgs/g, " kg")
    .replace(/غرام|جرام|غم|g|grams/g, " g")
    .replace(/اونصة|أونصة|oz|ounce/g, " oz");

  const normalizedWithArabicUnits = normalized
    .replace(/[،٬]/g, ".")
    .replace(/كيلوغرام|كيلو غرام|كيلو|كغم|كغ/g, " kg")
    .replace(/غرام|جرام|غم|غ/g, " g")
    .replace(/أونصة|اونصة|اوقية|أوقية/g, " oz");

  const match = normalizedWithArabicUnits.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;

  if (normalizedWithArabicUnits.includes("kg")) return value * 1000;
  if (normalizedWithArabicUnits.includes("oz")) return value * TROY_OUNCE_GRAMS;

  return value;
}

export function detectSilver(text: string) {
  const value = text.toLowerCase();

  return (
    value.includes("فضة") ||
    value.includes("فضه") ||
    value.includes("silver") ||
    value.includes("sterling") ||
    value.includes("925") ||
    value.includes("958") ||
    value.includes("900") ||
    value.includes("880") ||
    value.includes("800") ||
    value.includes("999")
  );
}

export function detectSilverPurity(text: string) {
  const value = text.toLowerCase();

  if (value.includes("999") || value.includes("pure silver")) return 0.999;
  if (value.includes("958") || value.includes("britannia")) return 0.958;
  if (value.includes("925") || value.includes("sterling")) return 0.925;
  if (value.includes("900") || value.includes("coin silver")) return 0.9;
  if (value.includes("880")) return 0.88;
  if (value.includes("800")) return 0.8;

  return null;
}

export function calculateSilverMeltValue(input: {
  weightGrams: number;
  purity?: number | null;
  pricePerGramUsd: number;
}): SilverMeltValue {
  const purity = input.purity;

  const lowPurity = purity ?? 0.8;
  const midPurity = purity ?? 0.925;
  const highPurity = purity ?? 0.999;

  const low = input.weightGrams * lowPurity * input.pricePerGramUsd;
  const mid = input.weightGrams * midPurity * input.pricePerGramUsd;
  const high = input.weightGrams * highPurity * input.pricePerGramUsd;

  return {
    metal: "silver",
    weightGrams: roundMoney(input.weightGrams),
    purityAssumption: purity
      ? `${Math.round(purity * 1000)}/1000`
      : "range: 800 / 925 / 999",
    spotPricePerGramUsd: roundMoney(input.pricePerGramUsd),
    meltValueUsdLow: roundMoney(low),
    meltValueUsdMid: roundMoney(mid),
    meltValueUsdHigh: roundMoney(high),
    note:
      "This is the raw silver floor value only. It does not include age, hand engraving, rarity, provenance, or antique premium.",
  };
}

export function getSilverWeightScenarios(text: string): number[] {
  const value = text.toLowerCase();

  if (
    value.includes("spoon") ||
    value.includes("ملعقة") ||
    value.includes("ring") ||
    value.includes("خاتم") ||
    value.includes("bracelet") ||
    value.includes("سوار") ||
    value.includes("jewelry") ||
    value.includes("مجوهر")
  ) {
    return [30, 80, 180];
  }

  if (
    value.includes("cup") ||
    value.includes("كأس") ||
    value.includes("كاس") ||
    value.includes("bowl") ||
    value.includes("وعاء") ||
    value.includes("صحن") ||
    value.includes("dish")
  ) {
    return [150, 500, 1200];
  }

  if (
    value.includes("tray") ||
    value.includes("صينية") ||
    value.includes("teapot") ||
    value.includes("ابريق") ||
    value.includes("إبريق") ||
    value.includes("vase") ||
    value.includes("مزهرية") ||
    value.includes("samovar") ||
    value.includes("سماور")
  ) {
    return [500, 1500, 3000];
  }

  return [100, 500, 1500];
}

export function calculateSilverScenarioValues(input: {
  scenarioWeights: number[];
  purity?: number | null;
  pricePerGramUsd: number;
}): SilverScenario[] {
  const purity = input.purity;
  const lowPurity = purity ?? 0.8;
  const midPurity = purity ?? 0.925;
  const highPurity = purity ?? 0.999;

  const labels: Array<{
    label: "light" | "medium" | "heavy";
    labelAr: string;
    premiumLow: number;
    premiumHigh: number;
  }> = [
    {
      label: "light",
      labelAr: "خفيف",
      premiumLow: 1.15,
      premiumHigh: 1.8,
    },
    {
      label: "medium",
      labelAr: "متوسط",
      premiumLow: 1.12,
      premiumHigh: 2.1,
    },
    {
      label: "heavy",
      labelAr: "ثقيل",
      premiumLow: 1.08,
      premiumHigh: 2.4,
    },
  ];

  return input.scenarioWeights.map((weightGrams, index) => {
    const meta = labels[index] ?? labels[1];
    const low = weightGrams * lowPurity * input.pricePerGramUsd;
    const mid = weightGrams * midPurity * input.pricePerGramUsd;
    const high = weightGrams * highPurity * input.pricePerGramUsd;

    return {
      label: meta.label,
      labelAr: meta.labelAr,
      weightGrams: roundMoney(weightGrams),
      purityAssumption: purity
        ? `${Math.round(purity * 1000)}/1000`
        : "range: 800 / 925 / 999",
      spotPricePerGramUsd: roundMoney(input.pricePerGramUsd),
      meltValueUsdLow: roundMoney(low),
      meltValueUsdMid: roundMoney(mid),
      meltValueUsdHigh: roundMoney(high),
      antiqueEstimateUsdLow: roundMoney(mid * meta.premiumLow),
      antiqueEstimateUsdHigh: roundMoney(high * meta.premiumHigh),
      note:
        "Estimated scenario because no exact weight was provided. Final valuation requires weighing the item and checking purity marks.",
    };
  });
}
