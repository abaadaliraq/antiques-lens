import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

type MarketReferenceSearchInput = {
  itemType?: string;
  category?: string;
  material?: string;
  origin?: string;
  keywords?: string[];
};

export type MarketReference = {
  id: string;
  title: string;
  title_ar?: string | null;
  title_en?: string | null;
  category?: string | null;
  item_type?: string | null;
  material?: string | null;
  origin?: string | null;
  period?: string | null;
  style?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  currency?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  source_type?: string | null;
  sale_status?: string | null;
  confidence?: string | null;
  description?: string | null;
  expert_notes?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  keywords?: string[] | null;
  is_house_of_antiques?: boolean | null;
  is_verified?: boolean | null;
};

function cleanText(value?: string) {
  return value?.trim().toLowerCase() || "";
}

function cleanKeywords(keywords?: string[]) {
  return (keywords || [])
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

export async function searchMarketReferences(input: MarketReferenceSearchInput) {
  const itemType = cleanText(input.itemType);
  const category = cleanText(input.category);
  const material = cleanText(input.material);
  const origin = cleanText(input.origin);
  const keywords = cleanKeywords(input.keywords);

  let query = supabaseAdmin
    .from("market_references")
    .select(
      `
      id,
      title,
      title_ar,
      title_en,
      category,
      item_type,
      material,
      origin,
      period,
      style,
      price_min,
      price_max,
      currency,
      source_name,
      source_url,
      source_type,
      sale_status,
      confidence,
      description,
      expert_notes,
      image_url,
      image_urls,
      keywords,
      is_house_of_antiques,
      is_verified
    `
    )
    .eq("is_active", true)
    .limit(12);

  const orFilters: string[] = [];

  if (itemType) {
    orFilters.push(`item_type.ilike.%${itemType}%`);
    orFilters.push(`title.ilike.%${itemType}%`);
    orFilters.push(`title_ar.ilike.%${itemType}%`);
    orFilters.push(`title_en.ilike.%${itemType}%`);
  }

  if (category) {
    orFilters.push(`category.ilike.%${category}%`);
  }

  if (material) {
    orFilters.push(`material.ilike.%${material}%`);
    orFilters.push(`description.ilike.%${material}%`);
  }

  if (origin) {
    orFilters.push(`origin.ilike.%${origin}%`);
    orFilters.push(`style.ilike.%${origin}%`);
  }

  for (const keyword of keywords) {
    orFilters.push(`title.ilike.%${keyword}%`);
    orFilters.push(`title_ar.ilike.%${keyword}%`);
    orFilters.push(`title_en.ilike.%${keyword}%`);
    orFilters.push(`description.ilike.%${keyword}%`);
  }

  if (orFilters.length > 0) {
    query = query.or(orFilters.join(","));
  }

  const { data, error } = await query;

  if (error) {
    console.error("MARKET_REFERENCES_SEARCH_ERROR:", error);
    return [];
  }

  return rankMarketReferences(data || [], {
    itemType,
    category,
    material,
    origin,
    keywords,
  }).slice(0, 8);
}

function rankMarketReferences(
  references: MarketReference[],
  input: {
    itemType: string;
    category: string;
    material: string;
    origin: string;
    keywords: string[];
  }
) {
  return references
    .map((ref) => {
      let score = 0;

      const haystack = [
        ref.title,
        ref.title_ar,
        ref.title_en,
        ref.category,
        ref.item_type,
        ref.material,
        ref.origin,
        ref.period,
        ref.style,
        ref.description,
        ref.expert_notes,
        ...(ref.keywords || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (input.itemType && haystack.includes(input.itemType)) score += 4;
      if (input.category && haystack.includes(input.category)) score += 3;
      if (input.material && haystack.includes(input.material)) score += 4;
      if (input.origin && haystack.includes(input.origin)) score += 2;

      for (const keyword of input.keywords) {
        if (keyword && haystack.includes(keyword)) score += 1;
      }

      if (ref.is_house_of_antiques) score += 3;
      if (ref.is_verified) score += 3;
      if (ref.source_type === "auction") score += 3;
      if (ref.source_type === "sold_listing") score += 3;
      if (ref.source_type === "house_of_antiques") score += 2;
      if (ref.confidence === "high") score += 2;
      if (ref.price_min || ref.price_max) score += 2;

      return {
        ...ref,
        _score: score,
      };
    })
    .filter((ref) => ref._score > 0)
    .sort((a, b) => b._score - a._score);
}

export function formatMarketReferencesForPrompt(references: MarketReference[]) {
  if (!references.length) {
    return `
No internal market references were found.
The valuation confidence must be lower unless other strong market evidence is available.
`;
  }

  return references
    .map((ref, index) => {
      const price =
        ref.price_min || ref.price_max
          ? `${ref.price_min ?? "?"} - ${ref.price_max ?? "?"} ${
              ref.currency || "USD"
            }`
          : "No price available";

      return `
Reference ${index + 1}:
Title: ${ref.title}
Arabic title: ${ref.title_ar || "N/A"}
Category: ${ref.category || "N/A"}
Item type: ${ref.item_type || "N/A"}
Material: ${ref.material || "N/A"}
Origin: ${ref.origin || "N/A"}
Period: ${ref.period || "N/A"}
Style: ${ref.style || "N/A"}
Price range: ${price}
Source: ${ref.source_name || "N/A"}
Source type: ${ref.source_type || "N/A"}
Sale status: ${ref.sale_status || "N/A"}
Confidence: ${ref.confidence || "N/A"}
House of Antiques reference: ${ref.is_house_of_antiques ? "yes" : "no"}
Verified: ${ref.is_verified ? "yes" : "no"}
Description: ${ref.description || "N/A"}
Expert notes: ${ref.expert_notes || "N/A"}
Keywords: ${(ref.keywords || []).join(", ") || "N/A"}
`;
    })
    .join("\n---\n");
}