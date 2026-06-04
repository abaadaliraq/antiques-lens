import { brandKnowledge, type BrandCategory } from "@/data/brandKnowledge";

export type BrandDetectionResult = {
  brandId: string;
  brandName: string;
  category: BrandCategory;
  confidence: "high" | "medium" | "low";
  matchedSignals: string[];
  missingEvidence: string[];
  requiredPhotos: string[];
  authenticityRisk: string;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[&.']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(input: string, values: string[]) {
  return values.filter((value) => {
    const normalized = normalizeText(value);
    return normalized && input.includes(normalized);
  });
}

export function detectPossibleBrand(input?: string | null): BrandDetectionResult | null {
  const text = normalizeText(input || "");
  if (!text) return null;

  const candidates = brandKnowledge
    .map((brand) => {
      const matchedAliases = includesAny(text, [brand.name, ...brand.aliases]);
      const matchedMarks = includesAny(text, brand.knownMarks);
      const matchedSignals = includesAny(text, [
        ...brand.authenticitySignals,
        ...brand.knownMarks,
      ]);
      const matchedRisks = includesAny(text, brand.commonReplicaRisks);
      const score =
        matchedAliases.length * 4 +
        matchedMarks.length * 2 +
        matchedSignals.length -
        matchedRisks.length;

      return {
        brand,
        matchedAliases,
        matchedMarks,
        matchedSignals,
        matchedRisks,
        score,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = candidates[0];
  if (!top) return null;

  const confidence =
    top.matchedAliases.length && top.matchedMarks.length
      ? "high"
      : top.matchedAliases.length
        ? "medium"
        : "low";

  const missingEvidence = top.brand.requiredPhotos.filter((photo) => {
    const normalized = normalizeText(photo);
    return !text.includes(normalized);
  });

  const authenticityRisk =
    top.matchedRisks.length > 0
      ? "visible or stated replica-risk signals need expert verification"
      : confidence === "high"
        ? "cannot confirm authenticity from photos alone"
        : "brand mention without enough authentication evidence";

  return {
    brandId: top.brand.id,
    brandName: top.brand.name,
    category: top.brand.category,
    confidence,
    matchedSignals: [
      ...new Set([
        ...top.matchedAliases,
        ...top.matchedMarks,
        ...top.matchedSignals,
      ]),
    ],
    missingEvidence,
    requiredPhotos: top.brand.requiredPhotos,
    authenticityRisk,
  };
}
