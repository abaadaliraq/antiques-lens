export type ArchiveItem = {
  id: string;
  title: string;
  prompt?: string;
  locale?: string;
  imagePreview?: string;
  imagePreviews?: string[];
  imagePreviewRef?: string;
  imagePreviewRefs?: string[];
  originalImage?: string;
  originalImages?: string[];
  originalImageRef?: string;
  originalImageRefs?: string[];
  createdAt: string;
  result: any;
  similarImages?: any[];
  cloudinaryPublicId?: string;
};

export const ARCHIVE_STORAGE_KEY = "antiques-lens:history-v2";
export const USER_ARCHIVE_STORAGE_PREFIX = "kishib_archive_";
export const ARCHIVE_MIGRATION_STORAGE_PREFIX = "kishib_archive_migrated_";
export const LEGACY_ARCHIVE_MIGRATED_KEY = "kishib_archive_legacy_migrated";
export const ARCHIVE_STORAGE_EVENT = "kishib:archive-updated";
const QUOTA_SAVE_LIMITS = [Number.MAX_SAFE_INTEGER];
const MAX_SIMILAR_IMAGES_IN_ARCHIVE = 8;
const ARCHIVE_IMAGE_DB_NAME = "kishib-archive-images";
const ARCHIVE_IMAGE_STORE_NAME = "images";
const LEGACY_ARCHIVE_STORAGE_KEYS = [
  "kishib-history",
  "antique-history",
  "antiqueLensHistory",
  "history",
  "archive",
  "antiques-lens:history",
];

function isClientSide() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getUserArchiveStorageKey(userId?: string | null) {
  const cleanUserId = String(userId || "").trim();
  return cleanUserId ? `${USER_ARCHIVE_STORAGE_PREFIX}${cleanUserId}` : "";
}

export function getUserArchiveMigrationKey(userId?: string | null) {
  const cleanUserId = String(userId || "").trim();
  return cleanUserId ? `${ARCHIVE_MIGRATION_STORAGE_PREFIX}${cleanUserId}` : "";
}

function isPersistentImage(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("blob:") &&
    !value.startsWith("filesystem:")
  );
}

function isDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

function getStableImageUrl(value: unknown): string | undefined {
  return isPersistentImage(value) ? value : undefined;
}

function openArchiveImageDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const request = indexedDB.open(ARCHIVE_IMAGE_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(ARCHIVE_IMAGE_STORE_NAME)) {
        db.createObjectStore(ARCHIVE_IMAGE_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error("[KISHIB archive] Unable to open image database:", request.error);
      resolve(null);
    };
  });
}

function putArchiveImage(ref: string, value: string): Promise<void> {
  return openArchiveImageDb().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) {
          resolve();
          return;
        }

        const tx = db.transaction(ARCHIVE_IMAGE_STORE_NAME, "readwrite");
        tx.objectStore(ARCHIVE_IMAGE_STORE_NAME).put(value, ref);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          console.error("[KISHIB archive] Unable to store archive image:", tx.error);
          db.close();
          resolve();
        };
      }),
  );
}

function getArchiveImage(ref: string): Promise<string | undefined> {
  return openArchiveImageDb().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) {
          resolve(undefined);
          return;
        }

        const tx = db.transaction(ARCHIVE_IMAGE_STORE_NAME, "readonly");
        const request = tx.objectStore(ARCHIVE_IMAGE_STORE_NAME).get(ref);

        request.onsuccess = () => {
          db.close();
          resolve(typeof request.result === "string" ? request.result : undefined);
        };
        request.onerror = () => {
          console.error("[KISHIB archive] Unable to read archive image:", request.error);
          db.close();
          resolve(undefined);
        };
      }),
  );
}

function looksMojibake(value: string) {
  return /(?:\u00d8|\u00d9|\u00da|\u00db|\u00d0|\u00d1|\u00c3|\u00c2|\u00e0\u00a4|\u00e0\u00a5|Ã˜|Ã™|Ãš|Ã›|Ãƒ|Ã‚)/.test(value);
}

function mojibakeScore(value: string) {
  return (
    value.match(
      /(?:\u00d8|\u00d9|\u00da|\u00db|\u00d0|\u00d1|\u00c3|\u00c2|\u00e0\u00a4|\u00e0\u00a5|Ã˜|Ã™|Ãš|Ã›|Ãƒ|Ã‚)/g,
    )?.length || 0
  );
}

function repairMojibakeText(value: string): string {
  if (!looksMojibake(value)) return value;

  try {
    let best = value;
    let bestScore = mojibakeScore(value);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const bytes = Uint8Array.from(best, (char) => char.charCodeAt(0) & 0xff);
      const repaired = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      const score = mojibakeScore(repaired);

      if (score >= bestScore) break;

      best = repaired;
      bestScore = score;

      if (score === 0) break;
    }

    return best;
  } catch {
    return value;
  }
}

function repairTextValue(value: unknown): unknown {
  if (typeof value === "string") return repairMojibakeText(value);
  if (Array.isArray(value)) return value.map(repairTextValue);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      repairTextValue(entry),
    ]),
  );
}

function sanitizeStringArray(value: unknown, limit = 12): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => repairMojibakeText(item))
    .slice(0, limit);
}

function sanitizeSimilarImages(value: unknown): any[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const record = item as Record<string, unknown>;
      const imageUrl =
        typeof record.imageUrl === "string" && !isDataUrl(record.imageUrl)
          ? record.imageUrl
          : Array.isArray(record.images) &&
              typeof record.images[0] === "string" &&
              !isDataUrl(record.images[0])
            ? record.images[0]
            : "";
      const link =
        typeof record.link === "string"
          ? record.link
          : typeof record.url === "string"
            ? record.url
            : imageUrl;

      if (!imageUrl && !link) return null;

      return {
        title:
          typeof record.title === "string"
            ? repairMojibakeText(record.title)
            : "Similar item",
        imageUrl,
        link,
        source:
          typeof record.source === "string"
            ? repairMojibakeText(record.source)
            : undefined,
        price:
          typeof record.price === "string"
            ? repairMojibakeText(record.price)
            : undefined,
        description:
          typeof record.description === "string"
            ? repairMojibakeText(record.description)
            : undefined,
        confidence: record.confidence,
        matchReason:
          typeof record.matchReason === "string"
            ? repairMojibakeText(record.matchReason)
            : undefined,
        isHouseOfAntiques:
          typeof record.isHouseOfAntiques === "boolean"
            ? record.isHouseOfAntiques
            : undefined,
      };
    })
    .filter(Boolean)
    .slice(0, MAX_SIMILAR_IMAGES_IN_ARCHIVE);
}

function getSimilarItemsFromResult(result: any) {
  return (
    (Array.isArray(result?.similarImages) && result.similarImages) ||
    (Array.isArray(result?.similarItems) && result.similarItems) ||
    (Array.isArray(result?.similarPhotos) && result.similarPhotos) ||
    (Array.isArray(result?.visualMatches) && result.visualMatches) ||
    (Array.isArray(result?.storeMatches) && result.storeMatches) ||
    (Array.isArray(result?.matches) && result.matches) ||
    (Array.isArray(result?.similar) && result.similar) ||
    (Array.isArray(result?.similarPieces) && result.similarPieces) ||
    (Array.isArray(result?.houseOfAntiquesMatches) && result.houseOfAntiquesMatches) ||
    (Array.isArray(result?.houseOfAntiques?.matches) && result.houseOfAntiques.matches) ||
    []
  );
}

function sanitizeResultForArchive(result: any, images: {
  imagePreview?: string;
  imagePreviews: string[];
  imagePreviewRef?: string;
  imagePreviewRefs: string[];
  originalImage?: string;
  originalImages: string[];
  originalImageRef?: string;
  originalImageRefs: string[];
  similarImages: any[];
}) {
  const repaired = repairTextValue(result || {}) as Record<string, any>;
  const houseMatches = sanitizeSimilarImages(repaired.houseOfAntiques?.matches);

  return {
    title: repaired.title,
    lookup: repaired.lookup,
    timePeriod: repaired.timePeriod,
    period: repaired.period,
    origin: repaired.origin,
    material: repaired.material,
    style: repaired.style,
    condition: repaired.condition,
    authenticity: repaired.authenticity,
    estimatedValue: repaired.estimatedValue,
    priceRange: repaired.priceRange,
    priceReasoning: repaired.priceReasoning,
    history: repaired.history,
    historicalReading: repaired.historicalReading,
    safeInitialChecks: sanitizeStringArray(repaired.safeInitialChecks),
    carePreservationTips: sanitizeStringArray(repaired.carePreservationTips),
    description: repaired.description,
    itemType: repaired.itemType,
    uploadedImageUrl: repaired.uploadedImageUrl,
    sourceImageUrl: repaired.sourceImageUrl,
    imageUrl: repaired.imageUrl,
    confidence: repaired.confidence,
    confidenceNote: repaired.confidenceNote,
    disclaimer: repaired.disclaimer,
    valueDrivers: sanitizeStringArray(repaired.valueDrivers),
    valueReducers: sanitizeStringArray(repaired.valueReducers),
    visualSearchKeywords: sanitizeStringArray(repaired.visualSearchKeywords),
    keywords: sanitizeStringArray(repaired.keywords),
    neededPhotos: sanitizeStringArray(repaired.neededPhotos),
    followUpQuestion:
      typeof repaired.followUpQuestion === "string"
        ? repaired.followUpQuestion
        : "",
    brandAssessment: repaired.brandAssessment,
    artistAttribution: repaired.artistAttribution,
    valuation_scenarios: Array.isArray(repaired.valuation_scenarios)
      ? repaired.valuation_scenarios
      : undefined,
    valuationScenarios: Array.isArray(repaired.valuationScenarios)
      ? repaired.valuationScenarios
      : undefined,
    evidenceUsed: repaired.evidenceUsed,
    hallmarkAnalysis: repaired.hallmarkAnalysis,
    markAnalysis: repaired.markAnalysis,
    metalValue: repaired.metalValue,
    houseOfAntiques: repaired.houseOfAntiques
      ? {
          found: Boolean(repaired.houseOfAntiques.found),
          confidence: repaired.houseOfAntiques.confidence,
          matches: houseMatches,
          contextText:
            typeof repaired.houseOfAntiques.contextText === "string"
              ? repairMojibakeText(repaired.houseOfAntiques.contextText).slice(
                  0,
                  2000,
                )
              : "",
        }
      : undefined,
    imagePreview: images.imagePreview,
    imagePreviews: images.imagePreviews,
    imagePreviewRef: images.imagePreviewRef,
    imagePreviewRefs: images.imagePreviewRefs,
    originalImage: images.originalImage,
    originalImages: images.originalImages,
    originalImageRef: images.originalImageRef,
    originalImageRefs: images.originalImageRefs,
    similarImages: images.similarImages,
    similarItems: images.similarImages,
    visualMatches: images.similarImages,
  };
}

function cleanArchiveItem(item: ArchiveItem): ArchiveItem {
  const imagePreviewRefs = Array.isArray(item.imagePreviewRefs)
    ? item.imagePreviewRefs.filter(Boolean)
    : Array.isArray(item.result?.imagePreviewRefs)
      ? item.result.imagePreviewRefs.filter(Boolean)
      : [];
  const originalImageRefs = Array.isArray(item.originalImageRefs)
    ? item.originalImageRefs.filter(Boolean)
    : Array.isArray(item.result?.originalImageRefs)
      ? item.result.originalImageRefs.filter(Boolean)
      : [];
  const imagePreviewRef =
    item.imagePreviewRef || item.result?.imagePreviewRef || imagePreviewRefs[0];
  const originalImageRef =
    item.originalImageRef || item.result?.originalImageRef || originalImageRefs[0];
  const imagePreviews = Array.isArray(item.imagePreviews)
    ? item.imagePreviews.filter(isPersistentImage)
    : [];

  const originalImages = Array.isArray(item.originalImages)
    ? item.originalImages.filter(isPersistentImage)
    : Array.isArray(item.result?.originalImages)
      ? item.result.originalImages.filter(isPersistentImage)
      : [];

  const originalImage =
    isPersistentImage(item.originalImage)
      ? item.originalImage
      : isPersistentImage(item.result?.originalImage)
        ? item.result.originalImage
        : originalImages[0] ||
          getStableImageUrl(item.result?.uploadedImageUrl) ||
          getStableImageUrl(item.result?.sourceImageUrl) ||
          getStableImageUrl(item.result?.imageUrl);

  const imagePreview = isPersistentImage(item.imagePreview)
    ? item.imagePreview
    : isPersistentImage(item.result?.imagePreview)
      ? item.result.imagePreview
      : imagePreviews[0] ||
        getStableImageUrl(item.result?.uploadedImageUrl) ||
        getStableImageUrl(item.result?.sourceImageUrl) ||
        getStableImageUrl(item.result?.imageUrl) ||
        originalImage;

  const similarImages = Array.isArray(item.similarImages)
    ? sanitizeSimilarImages(item.similarImages)
    : sanitizeSimilarImages(getSimilarItemsFromResult(item.result));

  const result = item.result || {};
  const cleanImagePreviews = imagePreviews.length
    ? imagePreviews
    : imagePreview
      ? [imagePreview]
      : [];
  const cleanOriginalImages = originalImages.length
    ? originalImages
    : originalImage
      ? [originalImage]
      : [];

  const repairedTitle =
    typeof item.title === "string"
      ? repairMojibakeText(item.title)
      : "Untitled item";
  const repairedPrompt =
    typeof item.prompt === "string" ? repairMojibakeText(item.prompt) : "";
  const archiveResult = sanitizeResultForArchive(result, {
    imagePreview,
    imagePreviews: cleanImagePreviews,
    imagePreviewRef,
    imagePreviewRefs,
    originalImage,
    originalImages: cleanOriginalImages,
    originalImageRef,
    originalImageRefs,
    similarImages,
  });

  return {
    id: item.id || createArchiveId(),
    title: repairedTitle || "Untitled item",
    prompt: repairedPrompt,
    locale: item.locale,
    imagePreview,
    imagePreviews: cleanImagePreviews,
    imagePreviewRef,
    imagePreviewRefs,
    originalImage,
    originalImages: cleanOriginalImages,
    originalImageRef,
    originalImageRefs,
    createdAt: item.createdAt || new Date().toISOString(),
    result: archiveResult,
    similarImages,
    cloudinaryPublicId: item.cloudinaryPublicId || item.result?.cloudinaryPublicId,
  };
}

function createArchiveId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return String(Date.now());
}

function withoutStoredImages(item: ArchiveItem): ArchiveItem {
  const result = item.result || {};

  return {
    ...item,
    imagePreview: undefined,
    imagePreviews: [],
    originalImage: undefined,
    originalImages: [],
    result: {
      ...result,
      imagePreview: undefined,
      imagePreviews: [],
      originalImage: undefined,
      originalImages: [],
    },
  };
}

async function moveArchiveImagesToIndexedDb(item: ArchiveItem): Promise<ArchiveItem> {
  const imagePreviews = Array.isArray(item.imagePreviews)
    ? item.imagePreviews
    : item.imagePreview
      ? [item.imagePreview]
      : [];
  const originalImages = Array.isArray(item.originalImages)
    ? item.originalImages
    : item.originalImage
      ? [item.originalImage]
      : [];

  const imagePreviewRefs = imagePreviews.map(
    (_, index) => `${item.id}:preview:${index}`,
  );
  const originalImageRefs = originalImages.map(
    (_, index) => `${item.id}:original:${index}`,
  );

  await Promise.all([
    ...imagePreviews
      .filter(isDataUrl)
      .map((image, index) => putArchiveImage(imagePreviewRefs[index], image)),
    ...originalImages
      .filter(isDataUrl)
      .map((image, index) => putArchiveImage(originalImageRefs[index], image)),
  ]);

  return {
    ...item,
    imagePreview: imagePreviews.find((image) => !isDataUrl(image)),
    imagePreviews: imagePreviews.filter((image) => !isDataUrl(image)),
    imagePreviewRef: imagePreviewRefs[0] || item.imagePreviewRef,
    imagePreviewRefs: imagePreviewRefs.length
      ? imagePreviewRefs
      : item.imagePreviewRefs || [],
    originalImage: originalImages.find((image) => !isDataUrl(image)),
    originalImages: originalImages.filter((image) => !isDataUrl(image)),
    originalImageRef: originalImageRefs[0] || item.originalImageRef,
    originalImageRefs: originalImageRefs.length
      ? originalImageRefs
      : item.originalImageRefs || [],
    result: {
      ...(item.result || {}),
      imagePreview: imagePreviews.find((image) => !isDataUrl(image)),
      imagePreviews: imagePreviews.filter((image) => !isDataUrl(image)),
      imagePreviewRef: imagePreviewRefs[0] || item.imagePreviewRef,
      imagePreviewRefs: imagePreviewRefs.length
        ? imagePreviewRefs
        : item.imagePreviewRefs || [],
      originalImage: originalImages.find((image) => !isDataUrl(image)),
      originalImages: originalImages.filter((image) => !isDataUrl(image)),
      originalImageRef: originalImageRefs[0] || item.originalImageRef,
      originalImageRefs: originalImageRefs.length
        ? originalImageRefs
        : item.originalImageRefs || [],
    },
  };
}

async function hydrateArchiveItemImages(item: ArchiveItem): Promise<ArchiveItem> {
  const previewRefs = item.imagePreviewRefs?.length
    ? item.imagePreviewRefs
    : item.imagePreviewRef
      ? [item.imagePreviewRef]
      : [];
  const originalRefs = item.originalImageRefs?.length
    ? item.originalImageRefs
    : item.originalImageRef
      ? [item.originalImageRef]
      : [];
  const [storedPreviews, storedOriginals] = await Promise.all([
    Promise.all(previewRefs.map((ref) => getArchiveImage(ref))),
    Promise.all(originalRefs.map((ref) => getArchiveImage(ref))),
  ]);
  const imagePreviews = [
    ...(item.imagePreviews || []),
    ...storedPreviews.filter((image): image is string => Boolean(image)),
  ];
  const originalImages = [
    ...(item.originalImages || []),
    ...storedOriginals.filter((image): image is string => Boolean(image)),
  ];
  const imagePreview = item.imagePreview || imagePreviews[0];
  const originalImage = item.originalImage || originalImages[0] || imagePreview;

  return cleanArchiveItem({
    ...item,
    imagePreview,
    imagePreviews,
    originalImage,
    originalImages: originalImages.length ? originalImages : imagePreviews,
    result: {
      ...(item.result || {}),
      imagePreview,
      imagePreviews,
      originalImage,
      originalImages: originalImages.length ? originalImages : imagePreviews,
    },
  });
}

function readArchiveArrayFromStorage(key: string): ArchiveItem[] {
  const savedItems = window.localStorage.getItem(key);

  if (!savedItems) return [];

  const parsed = JSON.parse(savedItems);

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item) => item && typeof item === "object")
    .map((item) => cleanArchiveItem(item as ArchiveItem));
}

function hasArchiveImage(item: ArchiveItem) {
  return Boolean(
    item.imagePreview ||
      item.originalImage ||
      item.result?.uploadedImageUrl ||
      item.result?.sourceImageUrl ||
      item.result?.imageUrl ||
      item.imagePreviews?.length ||
      item.originalImages?.length ||
      item.imagePreviewRef ||
      item.originalImageRef,
  );
}

function mergeLegacyImages(currentItems: ArchiveItem[]): ArchiveItem[] {
  if (!currentItems.length) return currentItems;

  const legacyItems = LEGACY_ARCHIVE_STORAGE_KEYS.flatMap((legacyKey) => {
    try {
      return readArchiveArrayFromStorage(legacyKey);
    } catch {
      return [];
    }
  });

  if (!legacyItems.length) return currentItems;

  return currentItems.map((item) => {
    if (hasArchiveImage(item)) return item;

    const legacyMatch = legacyItems.find(
      (legacyItem) =>
        legacyItem.id === item.id ||
        (legacyItem.title === item.title && legacyItem.createdAt === item.createdAt),
    );

    if (!legacyMatch || !hasArchiveImage(legacyMatch)) return item;

    return cleanArchiveItem({
      ...item,
      imagePreview: legacyMatch.imagePreview,
      imagePreviews: legacyMatch.imagePreviews,
      originalImage: legacyMatch.originalImage,
      originalImages: legacyMatch.originalImages,
      result: {
        ...(item.result || {}),
        imagePreview: legacyMatch.imagePreview,
        imagePreviews: legacyMatch.imagePreviews,
        originalImage: legacyMatch.originalImage,
        originalImages: legacyMatch.originalImages,
      },
    });
  });
}

function notifyArchiveUpdated(count: number, key: string, userId?: string | null) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(ARCHIVE_STORAGE_EVENT, {
      detail: {
        key,
        userId: userId || null,
        count,
      },
    }),
  );
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to read image"));
    };

    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export function loadArchiveItems(userId?: string | null): ArchiveItem[] {
  if (!isClientSide()) return [];

  const key = getUserArchiveStorageKey(userId);
  if (!key) return [];

  try {
    const cleaned = readArchiveArrayFromStorage(key);

    console.info("[KISHIB archive] Loaded user archive cache", {
      key,
      userId,
      count: cleaned.length,
    });

    return cleaned;
  } catch (error) {
    console.error("[KISHIB archive] Unable to load user archive cache:", error);
    return [];
  }
}

export function loadLegacyArchiveItemsForMigration(): ArchiveItem[] {
  if (!isClientSide()) return [];

  try {
    const items = [ARCHIVE_STORAGE_KEY, ...LEGACY_ARCHIVE_STORAGE_KEYS]
      .flatMap((key) => {
        try {
          return readArchiveArrayFromStorage(key);
        } catch {
          return [];
        }
      });
    const seen = new Set<string>();

    return mergeLegacyImages(items).filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  } catch (error) {
    console.error("[KISHIB archive] Unable to load legacy archive items:", error);
    return [];
  }
}

export function hasMigratedLegacyArchive(userId?: string | null) {
  if (!isClientSide()) return true;
  const key = getUserArchiveMigrationKey(userId);
  return !key || window.localStorage.getItem(key) === "1";
}

export function markLegacyArchiveMigrated(userId?: string | null) {
  if (!isClientSide()) return;
  const key = getUserArchiveMigrationKey(userId);
  if (key) window.localStorage.setItem(key, "1");
}

export function hasClaimedLegacyArchiveMigration() {
  if (!isClientSide()) return true;
  return window.localStorage.getItem(LEGACY_ARCHIVE_MIGRATED_KEY) === "1";
}

export function markLegacyArchiveMigrationClaimed() {
  if (!isClientSide()) return;
  window.localStorage.setItem(LEGACY_ARCHIVE_MIGRATED_KEY, "1");
}

export function clearLegacyArchiveStorageAfterMigration() {
  if (!isClientSide()) return;

  [ARCHIVE_STORAGE_KEY, ...LEGACY_ARCHIVE_STORAGE_KEYS].forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export async function loadArchiveItemsWithImages(userId?: string | null): Promise<ArchiveItem[]> {
  const items = loadArchiveItems(userId);

  return Promise.all(items.map((item) => hydrateArchiveItemImages(item)));
}

export function saveArchiveItems(items: ArchiveItem[], userId?: string | null): boolean {
  if (!isClientSide()) return false;

  const key = getUserArchiveStorageKey(userId);
  if (!key) return false;

  const cleaned = items.map((item) => cleanArchiveItem(item));

  for (const limit of QUOTA_SAVE_LIMITS) {
    const trimmed = cleaned.slice(0, limit);

    try {
      window.localStorage.setItem(key, JSON.stringify(trimmed));
      console.info("[KISHIB archive] Saved archive items", {
        key,
        count: trimmed.length,
      });
      notifyArchiveUpdated(trimmed.length, key, userId);
      return true;
    } catch (error) {
      console.error("[KISHIB archive] Unable to save archive with images:", {
        key,
        attemptedCount: trimmed.length,
        error,
      });
    }
  }

  const textOnlyArchive = cleaned.map((item) => withoutStoredImages(item));

  for (const limit of QUOTA_SAVE_LIMITS) {
    const trimmed = textOnlyArchive.slice(0, limit);

    try {
      window.localStorage.setItem(
        key,
        JSON.stringify(trimmed),
      );
      console.warn(
        "[KISHIB archive] Saved text-only archive after image storage failed",
        {
          key,
          count: trimmed.length,
        },
      );
      notifyArchiveUpdated(trimmed.length, key, userId);
      return true;
    } catch (fallbackError) {
      console.error(
        "[KISHIB archive] Unable to save text-only archive fallback:",
        {
          key,
          attemptedCount: trimmed.length,
          error: fallbackError,
        },
      );
    }
  }

  return false;
}

export async function addArchiveItem(item: ArchiveItem, userId?: string | null): Promise<ArchiveItem[]> {
  return (await addArchiveItemWithStatus(item, userId)).items;
}

export async function addArchiveItemWithStatus(item: ArchiveItem, userId?: string | null): Promise<{
  items: ArchiveItem[];
  saved: boolean;
}> {
  const cleanedItem = cleanArchiveItem(item);
  const previousItems = await loadArchiveItemsWithImages(userId);
  const updatedItems = [cleanedItem, ...previousItems];
  const storageItems = await Promise.all(
    updatedItems.map((archiveItem) => moveArchiveImagesToIndexedDb(archiveItem)),
  );

  const key = getUserArchiveStorageKey(userId);

  console.info("[KISHIB archive] Adding archive item", {
    key,
    id: cleanedItem.id,
    title: cleanedItem.title,
    previousCount: updatedItems.length - 1,
    nextCount: updatedItems.length,
    hasImagePreview: Boolean(cleanedItem.imagePreview),
    hasOriginalImage: Boolean(cleanedItem.originalImage),
  });

  const saved = saveArchiveItems(storageItems, userId);
  return {
    items: updatedItems,
    saved,
  };
}

export function clearArchiveItems(userId?: string | null): void {
  if (!isClientSide()) return;

  const key = getUserArchiveStorageKey(userId);
  if (key) window.localStorage.removeItem(key);
}

export function formatArchiveDate(createdAt: string, locale = "en"): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
}

async function createCompressedImageDataUrl(
  file: File,
  maxSize: number,
  quality: number,
): Promise<string> {
  const dataUrl = await fileToDataUrl(file);

  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const ratio = image.width / image.height;

      let width = maxSize;
      let height = maxSize;

      if (ratio > 1) {
        height = maxSize / ratio;
      } else {
        width = maxSize * ratio;
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

async function createArchiveImagePreview(file: File): Promise<string> {
  return createCompressedImageDataUrl(file, 300, 0.55);
}

async function createArchiveOriginalImage(file: File): Promise<string> {
  return createCompressedImageDataUrl(file, 900, 0.65);
}

export async function createArchiveImageAssets(files: File[]): Promise<{
  imagePreviews: string[];
  originalImages: string[];
}> {
  if (!files.length) {
    return {
      imagePreviews: [],
      originalImages: [],
    };
  }

  try {
    const [imagePreviews, originalImages] = await Promise.all([
      Promise.all(files.map((file) => createArchiveImagePreview(file))),
      Promise.all(files.map((file) => createArchiveOriginalImage(file))),
    ]);

    return {
      imagePreviews,
      originalImages,
    };
  } catch {
    return {
      imagePreviews: [],
      originalImages: [],
    };
  }
}

export async function createArchiveImagePreviews(files: File[]): Promise<string[]> {
  if (!files.length) return [];

  try {
    return (await createArchiveImageAssets(files)).imagePreviews;
  } catch {
    return [];
  }
}

export function deleteArchiveItem(id: string, userId?: string | null): ArchiveItem[] {
  const updatedItems = loadArchiveItems(userId).filter((item) => item.id !== id);

  saveArchiveItems(updatedItems, userId);
  return updatedItems;
}
