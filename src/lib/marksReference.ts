import "server-only";

export type MarkType =
  | "hallmark"
  | "signature"
  | "maker_mark"
  | "purity_mark"
  | "serial_number"
  | "unknown";

export type MarkAnalysis = {
  hasMark: boolean;
  markType: MarkType;
  visibleText: string;
  symbolDescription: string;
  locationOnObject: string;
  clarity: "clear" | "partial" | "unclear";
  possibleMeaning: string;
  confidence: "low" | "medium" | "high";
  needsCloseup: boolean;
  referenceMatches?: MarkReferenceMatch[];
};

export type MarkReferenceMatch = {
  id: string;
  type: MarkType;
  markText: string;
  possibleMeaning: string;
  material?: string;
  period?: string;
  confidence: number;
  confidenceNotes: string;
};

type ReferenceMark = {
  id: string;
  type: MarkType;
  markText: string;
  aliases: string[];
  possibleMeaning: string;
  material?: string;
  period?: string;
  confidenceNotes: string;
};

const VISIBLE_REFERENCE_THRESHOLD = 0.85;
const INTERNAL_REFERENCE_THRESHOLD = 0.65;

const referenceMarks: ReferenceMark[] = [
  {
    id: "silver-925",
    type: "purity_mark",
    markText: "925",
    aliases: ["925", "sterling", "sterling silver"],
    possibleMeaning:
      "May indicate sterling silver at 92.5% purity, but material cannot be confirmed from an image alone.",
    material: "silver",
    confidenceNotes:
      "Treat as a possible purity mark only. Confirm with weight, close-up hallmark photo, and direct testing.",
  },
  {
    id: "gold-750",
    type: "purity_mark",
    markText: "750",
    aliases: ["750", "18k", "18 k", "18kt", "18 karat", "18 carat"],
    possibleMeaning:
      "May indicate 18K gold, but the metal and stamp authenticity require direct verification.",
    material: "gold",
    confidenceNotes:
      "Use only as a possible indicator. Do not certify gold from image evidence.",
  },
  {
    id: "gold-916",
    type: "purity_mark",
    markText: "916",
    aliases: ["916", "22k", "22 k", "22kt", "22 karat", "22 carat"],
    possibleMeaning:
      "May indicate 22K gold, but this needs hallmark and material testing confirmation.",
    material: "gold",
    confidenceNotes:
      "A visible 916 stamp is not enough to prove gold content or authenticity.",
  },
  {
    id: "gold-585",
    type: "purity_mark",
    markText: "585",
    aliases: ["585", "14k", "14 k", "14kt", "14 karat", "14 carat"],
    possibleMeaning:
      "May indicate 14K gold, but it remains unconfirmed without direct inspection.",
    material: "gold",
    confidenceNotes:
      "Treat as a possible purity indicator, not a final material conclusion.",
  },
  {
    id: "platinum-950",
    type: "purity_mark",
    markText: "950",
    aliases: ["950", "pt950", "plat 950", "platinum 950"],
    possibleMeaning:
      "May indicate high-purity platinum, but the stamp must be verified directly.",
    material: "platinum",
    confidenceNotes:
      "Needs close-up mark photo, weight, and direct material testing.",
  },
  {
    id: "unclear-signature",
    type: "signature",
    markText: "unclear signature",
    aliases: ["signature", "signed", "artist signature", "maker signature"],
    possibleMeaning:
      "A signature may affect attribution and value, but unclear signatures should not be assigned to a named artist or maker.",
    confidenceNotes:
      "Request a close-up photo and compare with reliable references before attribution.",
  },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function containsAlias(haystack: string, alias: string) {
  const cleanAlias = normalize(alias);
  if (!cleanAlias) return false;

  return haystack.includes(cleanAlias);
}

function scoreReference(mark: MarkAnalysis, reference: ReferenceMark) {
  const text = normalize(
    [
      mark.visibleText,
      mark.symbolDescription,
      mark.possibleMeaning,
      mark.markType,
    ].join(" "),
  );

  let score = 0;

  if (mark.markType === reference.type) score += 0.22;
  if (containsAlias(text, reference.markText)) score += 0.58;
  if (reference.aliases.some((alias) => containsAlias(text, alias))) score += 0.46;
  if (mark.clarity === "clear") score += 0.12;
  if (mark.confidence === "high") score += 0.1;
  if (mark.confidence === "medium") score += 0.04;

  return Math.min(0.99, Math.round(score * 100) / 100);
}

export function findMarkReferenceMatches(mark?: MarkAnalysis | null) {
  if (!mark?.hasMark) return [];

  const matches = referenceMarks
    .map((reference) => ({
      reference,
      confidence: scoreReference(mark, reference),
    }))
    .filter((item) => item.confidence >= INTERNAL_REFERENCE_THRESHOLD)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
    .map(({ reference, confidence }): MarkReferenceMatch => ({
      id: reference.id,
      type: reference.type,
      markText: reference.markText,
      possibleMeaning: reference.possibleMeaning,
      material: reference.material,
      period: reference.period,
      confidence,
      confidenceNotes: reference.confidenceNotes,
    }));

  return matches.filter((match) => match.confidence >= VISIBLE_REFERENCE_THRESHOLD);
}
