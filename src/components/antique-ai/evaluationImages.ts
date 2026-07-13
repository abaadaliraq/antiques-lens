"use client";

type ImageSourceRecord = {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  uploadedImageUrl?: string | null;
  sourceImageUrl?: string | null;
  imagePreview?: string | null;
  imagePreviews?: string[] | null;
  originalImage?: string | null;
  originalImages?: string[] | null;
};

function normalizeImageKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const pathname = decodeURIComponent(url.pathname).replace(/\/+$/, "");
    return `${url.origin}${pathname}`.toLowerCase();
  } catch {
    return decodeURIComponent(trimmed).split("?")[0].replace(/\/+$/, "").toLowerCase();
  }
}

function pushImage(
  output: string[],
  seen: Set<string>,
  value?: string | null,
) {
  if (typeof value !== "string" || !value.trim()) return;

  const cleanValue = value.trim();
  const key = normalizeImageKey(cleanValue);
  if (!key || seen.has(key)) return;

  seen.add(key);
  output.push(cleanValue);
}

export function normalizeEvaluationImages(
  record?: ImageSourceRecord | null,
  extras: Array<string | undefined | null> = [],
) {
  const output: string[] = [];
  const seen = new Set<string>();

  extras.forEach((value) => pushImage(output, seen, value));

  if (!record) return output;

  [
    ...(Array.isArray(record.imageUrls) ? record.imageUrls : []),
    ...(Array.isArray(record.originalImages) ? record.originalImages : []),
    ...(Array.isArray(record.imagePreviews) ? record.imagePreviews : []),
    record.originalImage,
    record.uploadedImageUrl,
    record.sourceImageUrl,
    record.imageUrl,
    record.imagePreview,
  ].forEach((value) => pushImage(output, seen, value));

  return output;
}
