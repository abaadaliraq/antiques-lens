import { NextResponse } from "next/server";
import { houseSupabase } from "../../../lib/houseSupabase";
import { buildKnowledgeContext } from "../../../lib/antiqueKnowledge";

export const runtime = "nodejs";

type HouseComparable = {
  id: string;
  slug: string;
  sku: string;
  title: string;
  description: string;
  category: string;
  material: string;
  period: string;
  origin: string;
  price: string;
  currency: string;
  imageUrl: string;
  images: string[];
  url: string;
  source: string;
  score: number;
  matchReason: string;
};

type ProductImageRow = {
  product_id: string;
  image_url: string;
  sort_order: number | null;
};

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArabic(text: string) {
  return text
    .toLowerCase()
    .replace(/[أإآا]/g, "ا")
    .replace(/[ى]/g, "ي")
    .replace(/[ة]/g, "ه")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ي")
    .replace(/[گ]/g, "ك")
    .replace(/[ق]/g, "ق")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}\s\-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: unknown) {
  return normalizeArabic(safeText(value));
}

function uniqueList(values: string[]) {
  const seen = new Set<string>();

  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
}

function buildSearchTerms(input: string) {
  const normalized = normalizeArabic(input);

  const words = normalized
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => word.length >= 2);

  const phrases: string[] = [];

  for (let i = 0; i < words.length; i += 1) {
    const two = [words[i], words[i + 1]].filter(Boolean).join(" ");
    const three = [words[i], words[i + 1], words[i + 2]].filter(Boolean).join(" ");

    if (two.split(" ").length === 2) phrases.push(two);
    if (three.split(" ").length === 3) phrases.push(three);
  }

  return uniqueList([...words, ...phrases]).slice(0, 80);
}

function addMany(set: Set<string>, values: string[]) {
  values.forEach((value) => {
    const normalized = normalizeArabic(value);
    if (normalized) set.add(normalized);
  });
}

function expandTerms(rawTerms: string[]) {
  const expanded = new Set<string>();

  for (const term of rawTerms) {
    const normalizedTerm = normalizeArabic(term);
    if (!normalizedTerm) continue;

    expanded.add(normalizedTerm);

    if (
      [
        "فازه",
        "فازة",
        "مزهرية",
        "مزهره",
        "جره",
        "جرة",
        "اناء",
        "انيه",
        "vase",
        "jar",
      ].includes(normalizedTerm)
    ) {
      addMany(expanded, [
        "فازة",
        "فازه",
        "مزهرية",
        "مزهره",
        "جرة",
        "جره",
        "إناء",
        "اناء",
        "آنية",
        "انيه",
        "vase",
        "jar",
        "vessel",
        "pot",
      ]);
    }

    if (
      [
        "خزف",
        "خزفي",
        "خزفيه",
        "خزفية",
        "سيراميك",
        "فخار",
        "ceramic",
        "pottery",
      ].includes(normalizedTerm)
    ) {
      addMany(expanded, [
        "خزف",
        "خزفي",
        "خزفية",
        "خزفيه",
        "سيراميك",
        "فخار",
        "ceramic",
        "pottery",
        "porcelain",
      ]);
    }

    if (
      [
        "قران",
        "قرآن",
        "قرانيه",
        "قرآنية",
        "ايات",
        "آيات",
        "ايه",
        "آية",
        "كتابه",
        "كتابة",
        "كتابيه",
        "كتابية",
        "خط",
        "calligraphy",
        "quranic",
        "islamic",
      ].includes(normalizedTerm)
    ) {
      addMany(expanded, [
        "قرآن",
        "قران",
        "قرآنية",
        "قرانيه",
        "آيات",
        "ايات",
        "آية",
        "ايه",
        "كتابة",
        "كتابه",
        "كتابية",
        "كتابيه",
        "خط",
        "عربي",
        "اسلامي",
        "إسلامي",
        "calligraphy",
        "quranic",
        "islamic",
        "arabic writing",
      ]);
    }

    if (
      [
        "شيشه",
        "شيشة",
        "نركيله",
        "نركيلة",
        "اركيله",
        "أركيلة",
        "hookah",
        "shisha",
      ].includes(normalizedTerm)
    ) {
      addMany(expanded, [
        "شيشة",
        "شيشه",
        "نركيلة",
        "نركيله",
        "أركيلة",
        "اركيله",
        "hookah",
        "shisha",
        "water pipe",
      ]);
    }

    if (["سماور", "samovar"].includes(normalizedTerm)) {
      addMany(expanded, [
        "سماور",
        "samovar",
        "tea",
        "brass",
        "copper",
        "نحاس",
      ]);
    }

    if (["نحاس", "نحاسي", "نحاسيه", "brass", "copper"].includes(normalizedTerm)) {
      addMany(expanded, [
        "نحاس",
        "نحاسي",
        "نحاسية",
        "نحاسيه",
        "brass",
        "copper",
        "metal",
      ]);
    }

    if (["لوحه", "لوحة", "رسم", "فنان", "painting", "art"].includes(normalizedTerm)) {
      addMany(expanded, [
        "لوحة",
        "لوحه",
        "رسم",
        "فنان",
        "painting",
        "art",
        "artist",
        "signed",
      ]);
    }

    if (
      ["خزانه", "خزانة", "عرض", "فاترينا", "كابينه", "cabinet", "display"].includes(
        normalizedTerm,
      )
    ) {
      addMany(expanded, [
        "خزانة",
        "خزانه",
        "عرض",
        "فاترينا",
        "كابينة",
        "كابينه",
        "خشب",
        "زجاج",
        "cabinet",
        "display",
        "showcase",
        "wood",
        "glass",
      ]);
    }
  }

  return Array.from(expanded).slice(0, 120);
}

function productHaystack(product: any) {
  return [
    product.id,
    product.slug,
    product.sku,
    product.source_category,
    product.name_ar,
    product.name_en,
    product.name_ku,
    product.description_ar,
    product.description_en,
    product.description_ku,
    product.material_ar,
    product.material_en,
    product.material_ku,
    product.period_ar,
    product.period_en,
    product.period_ku,
    product.condition_ar,
    product.condition_en,
    product.condition_ku,
    product.origin_country,
    product.artist_name,
    product.keywords_ar,
    product.keywords_en,
    product.keywords_ku,
    product.seo_title,
    product.seo_description,
  ]
    .map(normalizeText)
    .join(" ");
}

function productTitleText(product: any) {
  return [
    product.name_ar,
    product.name_en,
    product.name_ku,
    product.slug,
    product.sku,
    product.source_category,
  ]
    .map(normalizeText)
    .join(" ");
}

function getMatchReason(product: any, terms: string[]) {
  const titleText = productTitleText(product);
  const haystack = productHaystack(product);

  const titleHits = terms.filter((term) => titleText.includes(term)).slice(0, 5);
  const textHits = terms.filter((term) => haystack.includes(term)).slice(0, 5);

  if (titleHits.length > 0) {
    return `Matched House of Antiques title/SKU/category terms: ${titleHits.join(", ")}`;
  }

  if (textHits.length > 0) {
    return `Matched House of Antiques description/material/keywords terms: ${textHits.join(", ")}`;
  }

  return "Weak internal store text match";
}

function scoreProduct(product: any, terms: string[]) {
  const haystack = productHaystack(product);
  const titleText = productTitleText(product);

  let score = 0;

  for (const term of terms) {
    if (!term) continue;

    if (titleText === term) score += 80;
    if (titleText.includes(term)) score += 18;
    if (haystack.includes(term)) score += 6;

    const sku = normalizeText(product.sku);
    const slug = normalizeText(product.slug);
    const id = normalizeText(product.id);

    if (sku && sku.includes(term)) score += 40;
    if (slug && slug.includes(term)) score += 36;
    if (id && id.includes(term)) score += 45;
  }

  const isVaseQuery = terms.some((term) =>
    ["فازه", "فازة", "مزهرية", "مزهره", "جره", "جرة", "vase", "jar"].includes(term),
  );

  const isQuranicQuery = terms.some((term) =>
    [
      "قران",
      "قرآن",
      "قرانيه",
      "قرآنية",
      "ايات",
      "آيات",
      "كتابه",
      "كتابية",
      "خط",
      "quranic",
      "calligraphy",
      "islamic",
    ].includes(term),
  );

  const isCeramicQuery = terms.some((term) =>
    ["خزف", "خزفي", "خزفيه", "خزفية", "سيراميك", "فخار", "ceramic", "pottery"].includes(
      term,
    ),
  );

  const isCabinetQuery = terms.some((term) =>
    ["خزانه", "خزانة", "فاترينا", "عرض", "cabinet", "display", "showcase"].includes(
      term,
    ),
  );

  if (isVaseQuery && titleText.includes("فازه")) score += 35;
  if (isVaseQuery && titleText.includes("فازة")) score += 35;
  if (isVaseQuery && titleText.includes("vase")) score += 35;
  if (isVaseQuery && haystack.includes("مزهر")) score += 18;

  if (isQuranicQuery && haystack.includes("قران")) score += 35;
  if (isQuranicQuery && haystack.includes("قرآ")) score += 35;
  if (isQuranicQuery && haystack.includes("ايات")) score += 26;
  if (isQuranicQuery && haystack.includes("خط")) score += 18;
  if (isQuranicQuery && haystack.includes("calligraphy")) score += 26;

  if (isCeramicQuery && haystack.includes("خزف")) score += 24;
  if (isCeramicQuery && haystack.includes("ceramic")) score += 24;
  if (isCeramicQuery && haystack.includes("pottery")) score += 20;

  if (isCabinetQuery && haystack.includes("خزانه")) score += 30;
  if (isCabinetQuery && haystack.includes("خزانة")) score += 30;
  if (isCabinetQuery && haystack.includes("فاترينا")) score += 28;
  if (isCabinetQuery && haystack.includes("cabinet")) score += 30;
  if (isCabinetQuery && haystack.includes("display")) score += 20;

  if (product.featured_image) score += 3;
  if (product.status === "available") score += 4;
  if (product.is_available) score += 4;
  if (product.is_featured) score += 2;
  if (product.signed) score += 2;

  return score;
}

function buildProductUrl(product: any) {
  const productKey = safeText(product.slug) || safeText(product.id);

  return productKey
    ? `https://www.houseofantiques.store/product/${productKey}`
    : "https://www.houseofantiques.store/";
}

function buildImages(product: any, imageMap: Map<string, string[]>) {
  const productId = String(product.id);
  const galleryImages = imageMap.get(productId) || [];

  return uniqueList([
    safeText(product.featured_image),
    ...galleryImages,
  ]);
}

function toComparable(
  product: any,
  score: number,
  imageMap: Map<string, string[]>,
  terms: string[],
): HouseComparable {
  const title =
    safeText(product.name_ar) ||
    safeText(product.name_en) ||
    safeText(product.name_ku) ||
    "قطعة من بيت التحفيات";

  const description =
    safeText(product.description_ar) ||
    safeText(product.description_en) ||
    safeText(product.description_ku);

  const priceAmount =
    typeof product.price_amount === "number"
      ? product.price_amount
      : product.price_amount
        ? Number(product.price_amount)
        : null;

  const currency = safeText(product.currency_code) || "USD";
  const images = buildImages(product, imageMap);

  return {
    id: String(product.id),
    slug: safeText(product.slug),
    sku: safeText(product.sku),
    title,
    description,
    category: safeText(product.source_category),
    material:
      safeText(product.material_ar) ||
      safeText(product.material_en) ||
      safeText(product.material_ku),
    period:
      safeText(product.period_ar) ||
      safeText(product.period_en) ||
      safeText(product.period_ku),
    origin: safeText(product.origin_country),
    price: priceAmount ? `${priceAmount}` : "No listed price",
    currency,
    imageUrl: images[0] || "",
    images,
    url: buildProductUrl(product),
    source: "House of Antiques Store",
    score,
    matchReason: getMatchReason(product, terms),
  };
}

function buildStoreContext(items: HouseComparable[]) {
  if (items.length === 0) return "";

  return items
    .slice(0, 6)
    .map((item, index) => {
      return `
HOUSE OF ANTIQUES INTERNAL MATCH ${index + 1}
Title: ${item.title}
SKU: ${item.sku || "N/A"}
Product ID: ${item.id}
Category: ${item.category || "N/A"}
Material: ${item.material || "N/A"}
Period: ${item.period || "N/A"}
Origin: ${item.origin || "N/A"}
Exact listed price: ${item.price} ${item.currency}
Product URL: ${item.url}
Image URL: ${item.imageUrl || "N/A"}
Source: ${item.source}
Match score: ${item.score}
Match reason: ${item.matchReason}
Description: ${item.description || "N/A"}
`;
    })
    .join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const query = safeText(body?.query);
    const title = safeText(body?.title);
    const material = safeText(body?.material);
    const origin = safeText(body?.origin);
    const itemType = safeText(body?.itemType);
    const description = safeText(body?.description);
    const notes = safeText(body?.notes);
    const sku = safeText(body?.sku);
    const slug = safeText(body?.slug);
    const productId = safeText(body?.id) || safeText(body?.productId);

   const searchText = [
  productId,
  sku,
  slug,
  query,
  title,
  material,
  origin,
  itemType,
  description,
  notes,
]
  .filter(Boolean)
  .join(" ");

const knowledgeContext = buildKnowledgeContext(searchText);

const expandedSearchText = [searchText, knowledgeContext]
  .filter(Boolean)
  .join("\n\n");

    if (!searchText) {
      return NextResponse.json(
        { error: "Missing search query." },
        { status: 400 },
      );
    }

    const terms = expandTerms(buildSearchTerms(expandedSearchText));

    const selectFields = `
      id,
      slug,
      sku,
      source_category,
      name_ar,
      name_en,
      name_ku,
      description_ar,
      description_en,
      description_ku,
      price_amount,
      currency_code,
      status,
      is_available,
      is_featured,
      artist_name,
      material_ar,
      material_en,
      material_ku,
      condition_ar,
      condition_en,
      condition_ku,
      period_ar,
      period_en,
      period_ku,
      origin_country,
      signed,
      featured_image,
      keywords_ar,
      keywords_en,
      keywords_ku,
      seo_title,
      seo_description,
      created_at
    `;

    const { data, error } = await houseSupabase
      .from("products")
      .select(selectFields)
      .limit(2000);

    if (error) {
      console.error("House comparables Supabase error:", error);

      return NextResponse.json(
        { error: "Failed to read House of Antiques products." },
        { status: 500 },
      );
    }

    const products = Array.isArray(data) ? data : [];

    const productIds = products.map((product) => String(product.id)).filter(Boolean);

    const imageMap = new Map<string, string[]>();

    if (productIds.length > 0) {
      const { data: imageRows, error: imageError } = await houseSupabase
        .from("product_images")
        .select("product_id,image_url,sort_order")
        .in("product_id", productIds)
        .order("sort_order", { ascending: true });

      if (imageError) {
        console.warn("House product_images read warning:", imageError);
      }

      const rows = Array.isArray(imageRows) ? (imageRows as ProductImageRow[]) : [];

      for (const row of rows) {
        const productIdKey = String(row.product_id);
        const imageUrl = safeText(row.image_url);

        if (!productIdKey || !imageUrl) continue;

        const current = imageMap.get(productIdKey) || [];
        current.push(imageUrl);
        imageMap.set(productIdKey, current);
      }
    }

    const scored = products
      .map((product) => ({
        product,
        score: scoreProduct(product, terms),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    const items = scored.map(({ product, score }) =>
      toComparable(product, score, imageMap, terms),
    );

    return NextResponse.json({
      items,
    query: searchText,
terms,
knowledgeContext,
storeContext: buildStoreContext(items),
      note:
        items.length > 0
          ? "House of Antiques internal store matches were found. Use exact listed price and product URL as internal store evidence."
          : "No House of Antiques internal store match was found from text search.",
    });
  } catch (error) {
    console.error("House comparables route error:", error);

    return NextResponse.json(
      { error: "Unexpected House comparables error." },
      { status: 500 },
    );
  }
}