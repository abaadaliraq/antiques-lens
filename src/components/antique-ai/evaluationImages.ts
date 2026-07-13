"use client";

type ImageSourceRecord = {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  uploadedImageUrl?: string | null;
  uploadedImageUrls?: string[] | null;
  sourceImageUrl?: string | null;
  imagePreview?: string | null;
  imagePreviews?: string[] | null;
  originalImage?: string | null;
  originalImages?: string[] | null;
};

function isLocalImage(value: string) {
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("filesystem:")
  );
}

function isRemoteImage(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function stripKnownImageExtension(value: string) {
  return value.replace(/\.(avif|bmp|gif|heic|jpeg|jpg|png|webp)$/i, "");
}

function getCloudinaryKey(url: URL) {
  if (!/cloudinary\.com$/i.test(url.hostname) && !/\.cloudinary\.com$/i.test(url.hostname)) {
    return "";
  }

  const parts = decodeURIComponent(url.pathname)
    .split("/")
    .filter(Boolean);
  const uploadIndex = parts.findIndex((part) => part === "upload");
  if (uploadIndex === -1) return "";

  let publicIdStart = uploadIndex + 1;
  const versionIndex = parts.findIndex(
    (part, index) => index > uploadIndex && /^v\d+$/i.test(part),
  );

  if (versionIndex !== -1) {
    publicIdStart = versionIndex + 1;
  } else {
    while (
      publicIdStart < parts.length - 1 &&
      (parts[publicIdStart].includes(",") ||
        /^(c_|w_|h_|q_|f_|dpr_|g_|e_|ar_|b_|r_|x_|y_|z_)/i.test(parts[publicIdStart]))
    ) {
      publicIdStart += 1;
    }
  }

  const publicId = parts.slice(publicIdStart).join("/");
  return publicId ? `cloudinary:${stripKnownImageExtension(publicId).toLowerCase()}` : "";
}

export function normalizeImageKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (isLocalImage(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const cloudinaryKey = getCloudinaryKey(url);
    if (cloudinaryKey) return cloudinaryKey;

    const pathname = decodeURIComponent(url.pathname).replace(/\/+$/, "");
    return `${url.origin}${stripKnownImageExtension(pathname)}`.toLowerCase();
  } catch {
    return stripKnownImageExtension(
      decodeURIComponent(trimmed).split("?")[0].replace(/\/+$/, ""),
    ).toLowerCase();
  }
}

function cleanImageList(values: Array<string | undefined | null>) {
  const output: string[] = [];
  const seen = new Set<string>();

  values.forEach((value) => {
    if (typeof value !== "string" || !value.trim()) return;

    const cleanValue = value.trim();
    const key = normalizeImageKey(cleanValue);
    if (!key || seen.has(key)) return;

    seen.add(key);
    output.push(cleanValue);
  });

  return output;
}

function firstNonEmptyList(lists: Array<Array<string | undefined | null>>) {
  for (const list of lists) {
    const cleanList = cleanImageList(list);
    if (cleanList.length > 0) return cleanList;
  }

  return [];
}

export function normalizeEvaluationImages(record?: ImageSourceRecord | null) {
  if (!record) return [];

  const imageUrls = cleanImageList(Array.isArray(record.imageUrls) ? record.imageUrls : []);
  if (imageUrls.length > 0) return imageUrls;

  const uploadedImageUrls = cleanImageList(
    Array.isArray(record.uploadedImageUrls) ? record.uploadedImageUrls : [],
  );
  if (uploadedImageUrls.length > 0) return uploadedImageUrls;

  const remoteFallbacks = cleanImageList([
    record.uploadedImageUrl,
    record.sourceImageUrl,
    record.imageUrl,
  ]).filter(isRemoteImage);

  const originalImages = cleanImageList(
    Array.isArray(record.originalImages) ? record.originalImages : [],
  );
  const remoteOriginalImages = originalImages.filter(isRemoteImage);
  if (remoteOriginalImages.length > 0) return remoteOriginalImages;

  if (remoteFallbacks.length > 0) return remoteFallbacks;

  const imagePreviews = cleanImageList(
    Array.isArray(record.imagePreviews) ? record.imagePreviews : [],
  );
  if (imagePreviews.length > 0) return imagePreviews;

  if (originalImages.length > 0) return originalImages;

  return firstNonEmptyList([
    [record.originalImage],
    [record.imagePreview],
  ]);
}
