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
  historicalReading?: string;
  safeInitialChecks?: string[];
  carePreservationTips?: string[];
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
  uploadedImageUrl?: string;
  sourceImageUrl?: string;
  imageUrl?: string;
  imagePreview?: string;
  imagePreviews?: string[];
  originalImage?: string;
  originalImages?: string[];
  priceRange?: string;
  period?: string;
  keywords?: string[];
  similar?: SimilarImageResult[];
  similarItems?: SimilarImageResult[];
  similarPhotos?: SimilarImageResult[];
  similarImages?: SimilarImageResult[];
  similarPieces?: SimilarImageResult[];
  imageMatches?: SimilarImageResult[];
  visualMatches?: SimilarImageResult[];
  storeMatches?: SimilarImageResult[];
  matches?: SimilarImageResult[];
  houseOfAntiques?: HouseOfAntiquesContext;
  brandAssessment?: {
    possibleBrand: string;
    category: string;
    confidence: "high" | "medium" | "low";
    authenticityStatus: string;
    missingEvidence: string[];
    requiredPhotos: string[];
    priceScenario: string;
  };
  valuation_scenarios?: ValuationScenario[];
  valuationScenarios?: ValuationScenario[];
  evidenceUsed?: EvidenceUsed | null;
  hallmarkAnalysis?: HallmarkAnalysis | null;
  markAnalysis?: MarkAnalysis | null;
  metalValue?: {
    metal: "silver" | "gold" | "platinum" | "palladium" | "copper" | "unknown";
    weightGrams?: number;
    purityAssumption?: string;
    spotPricePerGramUsd?: number;
    meltValueUsdLow?: number;
    meltValueUsdMid?: number;
    meltValueUsdHigh?: number;
    note?: string;
    warning?: string;
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

export type ValuationScenario = {
  label: string;
  labelAr?: string;
  min?: number;
  max?: number;
  currency?: string;
  confidence?: "low" | "medium" | "high" | string;
  note?: string;
  materialValueMin?: number;
  materialValueMax?: number;
  antiquePremiumMin?: number;
  antiquePremiumMax?: number;
};

export type EvidenceUsed = {
  images?: "available" | "missing" | string;
  userAgeClaim?: "available" | "missing" | string;
  hallmark?: "detected" | "missing" | "unclear" | string;
  weight?: "available" | "missing" | string;
  metalMarketPrice?: "used" | "not_used" | string;
  similarItems?: "found" | "not_found" | string;
};

export type AntiqueChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUrls?: string[];
  createdAt: string;
  isFinalSummary?: boolean;
};

export type AntiqueChatSession = {
  itemId: string;
  originalAnalysis: AnalysisResult;
  currentResult: AnalysisResult;
  messages: AntiqueChatMessage[];
  usedTurns: number;
  updatedAt: string;
};

export type MarkAnalysis = {
  hasMark: boolean;
  markType:
    | "hallmark"
    | "signature"
    | "maker_mark"
    | "purity_mark"
    | "serial_number"
    | "unknown";
  visibleText: string;
  symbolDescription: string;
  locationOnObject: string;
  clarity: "clear" | "partial" | "unclear";
  possibleMeaning: string;
  confidence: "low" | "medium" | "high";
  needsCloseup: boolean;
  referenceMatches?: {
    id: string;
    type: MarkAnalysis["markType"];
    markText: string;
    possibleMeaning: string;
    material?: string;
    period?: string;
    confidence: number;
    confidenceNotes: string;
  }[];
};

export type HallmarkAnalysis = {
  hallmark_detected?: true | false | "unclear";
  readable_text?: string;
  possible_type?:
    | "gold_karat"
    | "silver_purity"
    | "maker_mark"
    | "artist_signature"
    | "serial_number"
    | "decorative_mark"
    | "unclear"
    | string;
  clarity?: "high" | "medium" | "low" | string;
  interpretation?: string;
  recommendation?: string;
};

export type SimilarImageResult = {
  title: string;
  imageUrl: string;
  link: string;
  source?: string;
  price?: string;
  description?: string;
  confidence?: HouseOfAntiquesConfidence;
  confidenceScore?: number;
  visualSimilarity?: number;
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
  confidenceScore?: number;
  visualSimilarity?: number;
  matchReason?: string;
  hasStrongMatch?: boolean;
  sameObjectType?: boolean;
  categoryMatch?: boolean;
  materialOrFinishCompatible?: boolean;
  shapeMatch?: boolean;
  decorativeMotifMatch?: boolean;
  structuralMatch?: boolean;
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
  originalImage?: string | null;
  originalImages?: string[];
  result: AnalysisResult;
};
