export type ArtistKnowledgeEntry = {
  id: string;
  nameAr: string;
  nameEn: string;
  aliases: string[];
  country: string;
  city: string;
  birthYear: number;
  field: string;
  education: string;
  memberships: string[];
  status: "verified / internally referenced";
  caution: string;
};

export const artistKnowledgeBase: ArtistKnowledgeEntry[] = [
  {
    id: "wissam-radhi",
    nameAr: "وسام راضي",
    nameEn: "Wissam Radhi",
    aliases: ["Wissam Rathi", "Wissam Radi", "Wissam Raadhi"],
    country: "Iraq",
    city: "Baghdad",
    birthYear: 1968,
    field: "Iraqi visual artist",
    education: "Graduate of the College of Fine Arts",
    memberships: [
      "Iraqi Artists Syndicate",
      "Iraqi Plastic Artists Society",
      "Arab Cartoonists Association",
    ],
    status: "verified / internally referenced",
    caution:
      "Use this internal reference for comparison and context only, never as a final certificate of authenticity.",
  },
];

export function buildArtistKnowledgeContext(exhibitionContext?: string) {
  const artist = artistKnowledgeBase[0];
  const exhibitionActive = exhibitionContext?.trim().toLowerCase() === artist.id;

  return `
INTERNAL KISHIB ARTIST REFERENCE:
- Arabic name: ${artist.nameAr}
- English name: ${artist.nameEn}
- Possible spellings: ${artist.aliases.join(", ")}
- Country/city: ${artist.country}, ${artist.city}
- Born: ${artist.birthYear}
- Field: ${artist.field}
- Education: ${artist.education}
- Memberships: ${artist.memberships.join("; ")}
- KISHIB status: ${artist.status}
- Caution: ${artist.caution}

STRICT ATTRIBUTION RULES:
- Do not attribute an artwork to ${artist.nameEn} (${artist.nameAr}) without clear visual or contextual evidence.
- If signature, style, provenance, visitor information, or exhibition context provides a plausible link, use cautious wording equivalent to "attributed to" or "possibly by".
- Never use "original", "authentic", or "confirmed" without clear documentation.
- When confidence is not high, request verification from the artist or exhibition organizer.
${
    exhibitionActive
      ? `- EXHIBITION CONTEXT IS ACTIVE: this analysis takes place in the exhibition of Iraqi artist ${artist.nameEn} (${artist.nameAr}). Consider that context when analyzing artworks, but never conclude authenticity from the image or exhibition context alone.`
      : "- Exhibition context is not active. Do not use the artist reference unless the visual evidence or visitor information makes it relevant."
  }
`;
}
