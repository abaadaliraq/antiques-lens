export type ArchiveItem = {
  id: string;
  title: string;
  prompt?: string;
  imagePreview?: string;
  imagePreviews?: string[];
  createdAt: string;
  result: any;
  similarImages?: any[];
};

export const ARCHIVE_STORAGE_KEY = "antiques-lens:history-v2";
export const MAX_ARCHIVE_ITEMS = 500;

function isClientSide() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cleanArchiveItem(item: ArchiveItem): ArchiveItem {
  const imagePreviews = Array.isArray(item.imagePreviews)
    ? item.imagePreviews.filter(
        (preview) => typeof preview === "string" && !preview.startsWith("blob:"),
      )
    : [];

  const imagePreview =
    item.imagePreview && !item.imagePreview.startsWith("blob:")
      ? item.imagePreview
      : imagePreviews[0];

  const similarImages = Array.isArray(item.similarImages)
    ? item.similarImages
    : Array.isArray(item.result?.similarImages)
      ? item.result.similarImages
      : Array.isArray(item.result?.similarItems)
        ? item.result.similarItems
        : Array.isArray(item.result?.visualMatches)
          ? item.result.visualMatches
          : [];

  return {
    id: item.id || createArchiveId(),
    title: item.title || "Untitled item",
    prompt: item.prompt || "",
    imagePreview,
    imagePreviews: imagePreviews.length
      ? imagePreviews
      : imagePreview
        ? [imagePreview]
        : [],
    createdAt: item.createdAt || new Date().toISOString(),
    result: item.result || {},
    similarImages,
  };
}

function createArchiveId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return String(Date.now());
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

export function loadArchiveItems(): ArchiveItem[] {
  if (!isClientSide()) return [];

  try {
    const savedItems = window.localStorage.getItem(ARCHIVE_STORAGE_KEY);

    if (!savedItems) return [];

    const parsed = JSON.parse(savedItems);

    if (!Array.isArray(parsed)) return [];

    const cleaned = parsed.map((item) => cleanArchiveItem(item));

    saveArchiveItems(cleaned);
    return cleaned;
  } catch {
    window.localStorage.removeItem(ARCHIVE_STORAGE_KEY);
    return [];
  }
}

export function saveArchiveItems(items: ArchiveItem[]): void {
  if (!isClientSide()) return;

  const cleaned = items.map((item) => cleanArchiveItem(item));

  window.localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(cleaned));
}

export function addArchiveItem(item: ArchiveItem): ArchiveItem[] {
  const updatedItems = [cleanArchiveItem(item), ...loadArchiveItems()];

  saveArchiveItems(updatedItems);
  return updatedItems;
}

export function clearArchiveItems(): void {
  if (!isClientSide()) return;

  window.localStorage.removeItem(ARCHIVE_STORAGE_KEY);
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

async function createArchiveImagePreview(file: File, maxSize = 1600): Promise<string> {
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

      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

export async function createArchiveImagePreviews(files: File[]): Promise<string[]> {
  if (!files.length) return [];

  try {
    return await Promise.all(files.map((file) => createArchiveImagePreview(file)));
  } catch {
    return [];
  }
}

export function deleteArchiveItem(id: string): ArchiveItem[] {
  const updatedItems = loadArchiveItems().filter((item) => item.id !== id);

  saveArchiveItems(updatedItems);
  return updatedItems;
}
