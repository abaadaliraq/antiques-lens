import { NextResponse } from "next/server";
import { houseSupabase } from "../../../lib/houseSupabase";

export const runtime = "nodejs";

type HouseComparable = {
  id: string;
  title: string;
  description: string;
  category: string;
  material: string;
  period: string;
  origin: string;
  price: string;
  currency: string;
  imageUrl: string;
  url: string;
  source: string;
  score: number;
};

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildSearchTerms(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => word.length >= 2)
    .slice(0, 16);
}

function expandTerms(terms: string[]) {
  const expanded = new Set(terms);

  for (const term of terms) {
    if (["ركية", "رگية", "رقيه"].includes(term)) {
      [
        "ركية",
        "رگية",
        "حمام",
        "صابون",
        "مشط",
        "علبة",
        "نحاس",
        "معدن",
        "hammam",
        "bath",
        "toiletry",
        "box",
        "copper",
      ].forEach((x) => expanded.add(x));
    }

    if (["نحاس", "نحاسي", "نحاسية"].includes(term)) {
      ["نحاس", "نحاسي", "نحاسية", "copper", "brass"].forEach((x) =>
        expanded.add(x),
      );
    }

    if (["شيشة", "نركيلة", "اركيلة", "أركيلة"].includes(term)) {
      ["شيشة", "نركيلة", "أركيلة", "hookah", "shisha"].forEach((x) =>
        expanded.add(x),
      );
    }

    if (["سماور", "samovar"].includes(term)) {
      ["سماور", "samovar", "tea", "brass", "copper"].forEach((x) =>
        expanded.add(x),
      );
    }

    if (["لوحة", "رسم", "فنان"].includes(term)) {
      ["لوحة", "رسم", "فنان", "painting", "art", "artist"].forEach((x) =>
        expanded.add(x),
      );
    }
  }

  return Array.from(expanded).slice(0, 24);
}

function productHaystack(product: any) {
  return [
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
    product.origin_country,
    product.artist_name,
    product.source_category,
    product.keywords_ar,
    product.keywords_en,
    product.keywords_ku,
    product.sku,
  ]
    .map(safeText)
    .join(" ")
    .toLowerCase();
}

function scoreProduct(product: any, terms: string[]) {
  const haystack = productHaystack(product);

  let score = 0;

  for (const term of terms) {
    if (!term) continue;

    if (haystack.includes(term)) {
      score += 2;
    }

    const titleText = [
      product.name_ar,
      product.name_en,
      product.name_ku,
      product.source_category,
    ]
      .map(safeText)
      .join(" ")
      .toLowerCase();

    if (titleText.includes(term)) {
      score += 3;
    }
  }

  if (product.featured_image) score += 1;
  if (product.is_featured) score += 1;
  if (product.signed) score += 1;
  if (product.status === "available") score += 1;
  if (product.is_available) score += 1;

  return score;
}

function toComparable(product: any, score: number): HouseComparable {
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

  const url = product.slug
    ? `https://www.houseofantiques.store/products/${product.slug}`
    : "https://www.houseofantiques.store/";

  return {
    id: String(product.id),
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
    imageUrl: safeText(product.featured_image),
    url,
    source: "House of Antiques Store",
    score,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const query = safeText(body?.query);
    const title = safeText(body?.title);
    const material = safeText(body?.material);
    const origin = safeText(body?.origin);
    const itemType = safeText(body?.itemType);

    const searchText = [query, title, material, origin, itemType]
      .filter(Boolean)
      .join(" ");

    if (!searchText) {
      return NextResponse.json(
        { error: "Missing search query." },
        { status: 400 },
      );
    }

    const terms = expandTerms(buildSearchTerms(searchText));

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
      period_ar,
      period_en,
      period_ku,
      origin_country,
      signed,
      featured_image,
      keywords_ar,
      keywords_en,
      keywords_ku,
      created_at
    `;

    /*
      نسحب مجموعة منتجات من المتجر ثم نسوي scoring داخل الكود.
      هذا أفضل من الاعتماد على ilike فقط، خصوصاً مع العربية واللهجات.
    */
    const { data, error } = await houseSupabase
      .from("products")
      .select(selectFields)
      .limit(250);

    if (error) {
      console.error("House comparables Supabase error:", error);

      return NextResponse.json(
        { error: "Failed to read House of Antiques products." },
        { status: 500 },
      );
    }

    const products = Array.isArray(data) ? data : [];

    const scored = products
      .map((product) => ({
        product,
        score: scoreProduct(product, terms),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    const items = scored.map(({ product, score }) => toComparable(product, score));

    return NextResponse.json({
      items,
      count: items.length,
      query: searchText,
      terms,
    });
  } catch (error) {
    console.error("House comparables route error:", error);

    return NextResponse.json(
      { error: "Unexpected House comparables error." },
      { status: 500 },
    );
  }
}