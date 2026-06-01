export type Locale =
  | "ar"
  | "en"
  | "fr"
  | "hi"
  | "fa"
  | "tr"
  | "ru"
  | "ku";

export type ThemeMode = "dark" | "light";

export type AnalysisResult = {
  title: string;
  lookup: string;
  timePeriod: string;
  origin: string;
  material: string;
  style: string;
  condition: string;
  authenticity: string;
  estimatedValue: string;
  priceReasoning: string;
  history: string;
  valueDrivers: string[];
  valueReducers: string[];
  visualSearchKeywords: string[];
  neededPhotos: string[];
  followUpQuestion: string;
  confidence: number;
  confidenceNote: string;
  disclaimer: string;

  itemType?: string;
  description?: string;
  priceRange?: string;
  period?: string;
  keywords?: string[];
  houseOfAntiques?: HouseOfAntiquesContext;
  metalValue?: {
    metal: "silver" | "gold" | "unknown";
    weightGrams?: number;
    purityAssumption?: string;
    spotPricePerGramUsd?: number;
    meltValueUsdLow?: number;
    meltValueUsdMid?: number;
    meltValueUsdHigh?: number;
    note?: string;
    scenarios?: {
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
    }[];
  };
};

export type SimilarImageResult = {
  title: string;
  imageUrl: string;
  link: string;
  source?: string;
  price?: string;
  description?: string;
  confidence?: HouseOfAntiquesConfidence;
  matchReason?: string;
  isHouseOfAntiques?: boolean;
};

export type HouseOfAntiquesConfidence =
  | "exact"
  | "strong"
  | "partial"
  | "weak"
  | "none";

export type HouseOfAntiquesMatch = {
  id: string;
  slug?: string;
  sku?: string;
  title: string;
  description?: string;
  category?: string;
  material?: string;
  period?: string;
  origin?: string;
  price?: string;
  currency?: string;
  imageUrl?: string;
  images?: string[];
  url?: string;
  source?: string;
  score?: number;
  confidence?: HouseOfAntiquesConfidence;
  matchReason?: string;
};

export type HouseOfAntiquesContext = {
  found: boolean;
  confidence: HouseOfAntiquesConfidence;
  matches: HouseOfAntiquesMatch[];
  contextText?: string;
};

export type HistoryItem = {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  imagePreview: string | null;
  imagePreviews?: string[];
  result: AnalysisResult;
};
