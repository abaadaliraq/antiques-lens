export type Locale = "ar" | "en" | "ku" | "fr";
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
  
};
export type SimilarImageResult = {
  title: string;
  imageUrl: string;
  link: string;
  source?: string;
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