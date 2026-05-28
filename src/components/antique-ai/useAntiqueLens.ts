"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useFollowUpEvaluation } from "./useFollowUpEvaluation";

import { content, HISTORY_KEY, normalizeResult } from "./antiqueContent";
import { createShareImage } from "./createShareImage";
import type {
  AnalysisResult,
  HistoryItem,
  Locale,
  ThemeMode,
  SimilarImageResult,
} from "./types";
const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE_MB = 8;

type HistoryItemWithImages = HistoryItem & {
  imagePreviews?: string[];
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return String(Date.now());
}

function createHistoryTitle(data: AnalysisResult) {
  return data.title || data.lookup || data.itemType || "تقييم قطعة قديمة";
}

function revokePreviewUrl(url: string | null) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function revokePreviewUrls(urls: string[]) {
  urls.forEach((url) => revokePreviewUrl(url));
}

function downloadShareImage(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = file.name;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

async function copyFallbackSummary(result: AnalysisResult) {
  const text = [
    result.title,
    "",
    result.lookup,
    "",
    result.timePeriod,
    result.origin,
    result.material,
    result.condition,
    result.authenticity,
    result.estimatedValue,
    
    "",
    result.disclaimer,
    
  ]
    .filter(Boolean)
    .join("\n");

  if (!text.trim()) return;

  await navigator.clipboard.writeText(text);
}

function fileToDataUrl(file: File): Promise<string> {
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

async function createHistoryThumbnail(
  file: File,
  maxSize = 260,
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

      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function cleanHistoryItems(items: HistoryItem[]) {
  return items.map((item) => {
    const current = item as HistoryItemWithImages;

    const cleanImagePreview =
      current.imagePreview && !current.imagePreview.startsWith("blob:")
        ? current.imagePreview
        : null;

    const cleanImagePreviews =
      current.imagePreviews?.filter((src) => src && !src.startsWith("blob:")) ||
      [];

    return {
      ...current,
      imagePreview: cleanImagePreview,
      imagePreviews: cleanImagePreviews,
      result: normalizeResult(current.result || {}),
    };
  });
}

async function createHistoryThumbnails(files: File[]) {
  if (!files.length) return [];

  try {
    return await Promise.all(files.map((file) => createHistoryThumbnail(file)));
  } catch {
    return [];
  }
}
async function resizeImageForAnalysis(
  file: File,
  maxWidth = 1400,
  quality = 0.72,
): Promise<File> {
  const dataUrl = await fileToDataUrl(file);

  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const ratio = image.width / image.height;

      const width = image.width > maxWidth ? maxWidth : image.width;
      const height = width / ratio;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const resizedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            {
              type: "image/jpeg",
              lastModified: Date.now(),
            },
          );

          resolve(resizedFile);
        },
        "image/jpeg",
        quality,
      );
    };

    image.onerror = () => resolve(file);
    image.src = dataUrl;
  });
}
function buildPinterestSearchQuery(result: AnalysisResult) {
  const rawText = [
    result.title,
    result.lookup,
    result.material,
    result.style,
    result.description,
    result.history,
    ...(result.visualSearchKeywords || []),
    ...(result.keywords || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  /*
    أهم قاعدة:
    نوع القطعة لازم يكون أول البحث.
    إذا نوع القطعة غلط أو عام، Pinterest يجيب نتائج بعيدة.
  */

  const itemTerms: string[] = [];
  const materialTerms: string[] = [];
  const colorTerms: string[] = [];
  const styleTerms: string[] = [];

  // شيشة / أركيلة / نركيلة
  if (
    /شيشة|أركيلة|اركيلة|نركيلة|نرجيلة|نارجيلة|hookah|shisha|narghile|nargile|water pipe|waterpipe/.test(
      rawText,
    )
  ) {
    itemTerms.push(
      "antique hookah",
      "vintage shisha pipe",
      "middle eastern hookah",
      "ottoman hookah",
      "brass hookah",
    );
  }

  // إبريق / دلة / جك
  else if (/إبريق|ابريق|دلة|دله|ewer|pitcher|jug|decanter|coffee pot/.test(rawText)) {
    itemTerms.push(
      "antique ewer",
      "decorative pitcher",
      "vintage coffee pot",
    );
  }

  // مزهرية
  else if (/مزهرية|فازة|vase/.test(rawText)) {
    itemTerms.push("antique vase", "decorative vase");
  }

  // كأس / قدح
  else if (/كأس|كاس|قدح|goblet|cup|chalice/.test(rawText)) {
    itemTerms.push("antique goblet", "decorative chalice");
  }

  // صحن / طبق
  else if (/صحن|طبق|plate|dish/.test(rawText)) {
    itemTerms.push("antique decorative plate");
  }

  // تمثال
  else if (/تمثال|figure|statue|figurine/.test(rawText)) {
    itemTerms.push("antique figurine");
  }

  // fallback إذا ما عرف نوع القطعة
  else {
    itemTerms.push(
      result.title || "",
      result.lookup || "",
      ...(result.visualSearchKeywords || []),
    );
  }

  // المواد
  if (/نحاس|brass|copper|برونز|bronze/.test(rawText)) {
    materialTerms.push("brass", "copper", "bronze");
  }

  if (/فضة|silver|مطلي فضة|silver plated/.test(rawText)) {
    materialTerms.push("silver plated", "silver");
  }

  if (/كريستال|crystal|glass|زجاج/.test(rawText)) {
    materialTerms.push("crystal glass");
  }

  if (/خشب|wood|wooden/.test(rawText)) {
    materialTerms.push("wooden");
  }

  if (/بورسلين|porcelain|ceramic|خزف/.test(rawText)) {
    materialTerms.push("porcelain ceramic");
  }

  // الألوان
  if (/أزرق|ازرق|blue|كحلي/.test(rawText)) {
    colorTerms.push("blue");
  }

  if (/ذهبي|gold|gilded/.test(rawText)) {
    colorTerms.push("gold");
  }

  if (/أسود|اسود|black/.test(rawText)) {
    colorTerms.push("black");
  }

  if (/بني|brown/.test(rawText)) {
    colorTerms.push("brown");
  }

  // الأسلوب / المنشأ
  if (/عثماني|ottoman/.test(rawText)) {
    styleTerms.push("ottoman");
  }

  if (/شرقي|middle eastern|islamic|arabic/.test(rawText)) {
    styleTerms.push("middle eastern", "islamic");
  }

  if (/مزخرف|زخرفة|engraved|etched|ornate|decorated/.test(rawText)) {
    styleTerms.push("engraved", "ornate");
  }

  if (/قديم|antique|vintage/.test(rawText)) {
    styleTerms.push("antique", "vintage");
  }

  const query = [
    ...itemTerms,
    ...materialTerms.slice(0, 2),
    ...colorTerms.slice(0, 1),
    ...styleTerms.slice(0, 3),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return query;
}

export function useAntiqueLens() {
  const [locale, setLocale] = useState<Locale>("ar");
  const [theme, setTheme] = useState<ThemeMode>("dark");
const [similarImages, setSimilarImages] = useState<SimilarImageResult[]>([]);
const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [historyImagePreviews, setHistoryImagePreviews] = useState<string[]>(
    [],
  );

  const [result, setResult] = useState<AnalysisResult | null>(null);
  
const [translatedResults, setTranslatedResults] = useState<
  Partial<Record<Locale, AnalysisResult>>
>({});

const [isTranslatingResult, setIsTranslatingResult] = useState(false);
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [error, setError] = useState("");

const followUp = useFollowUpEvaluation({
  result,
  locale,
  setResult,
  setError,
  setTranslatedResults,
  setImagePreviews,
  setSelectedFiles,
  normalizeResult,
});

const [historyOpen, setHistoryOpen] = useState(false);
const [history, setHistory] = useState<HistoryItemWithImages[]>([]);

  const t = useMemo(() => content[locale], [locale]);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(
      "antiques-lens:locale",
    ) as Locale | null;

    const savedTheme = window.localStorage.getItem(
      "antiques-lens:theme",
    ) as ThemeMode | null;

    if (savedLocale && ["ar", "en", "ku", "fr"].includes(savedLocale)) {
      setLocale(savedLocale);
    }

    if (savedTheme && ["dark", "light"].includes(savedTheme)) {
      setTheme(savedTheme);
    }

    try {
      const savedHistory = window.localStorage.getItem(HISTORY_KEY);

      if (!savedHistory) return;

      const parsed = JSON.parse(savedHistory) as HistoryItem[];

      if (Array.isArray(parsed)) {
        const cleaned = cleanHistoryItems(parsed).slice(0, 20);

        setHistory(cleaned);
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(cleaned));
      }
    } catch {
      window.localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  useEffect(() => {
    return () => {
      revokePreviewUrls(imagePreviews);
    };
  }, [imagePreviews]);

async function translateCurrentResult(
  currentResult: AnalysisResult,
  nextLocale: Locale,
) {
  try {
    setIsTranslatingResult(true);
    setError("");

    const response = await fetch("/api/translate-result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locale: nextLocale,
        result: currentResult,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Failed to translate result.");
    }

    const translated = normalizeResult(data.result || data);

    setTranslatedResults((current) => ({
      ...current,
      [nextLocale]: translated,
    }));

    setResult(translated);
  } catch (error) {
    console.error("translateCurrentResult error:", error);
    setError(
      error instanceof Error
        ? error.message
        : "Failed to translate result.",
    );
  } finally {
    setIsTranslatingResult(false);
  }
}

async function changeLocale(nextLocale: Locale) {
  setLocale(nextLocale);
  window.localStorage.setItem("antiques-lens:locale", nextLocale);

  if (!result) return;

  const cached = translatedResults[nextLocale];

  if (cached) {
    setResult(cached);
    return;
  }

  await translateCurrentResult(result, nextLocale);
}

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem("antiques-lens:theme", next);
      return next;
    });
  }

  function resetEvaluation() {
    revokePreviewUrls(imagePreviews);
setSimilarImages([]);
setIsLoadingSimilar(false);
    setPrompt("");
    setSelectedFiles([]);
    setImagePreviews([]);
    setHistoryImagePreviews([]);
    setResult(null);
    setError("");
    
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const incomingFiles = Array.from(event.target.files || []);

    if (!incomingFiles.length) return;

    const imageFiles = incomingFiles.filter((file) =>
      file.type.startsWith("image/"),
    );

    if (!imageFiles.length) {
      setError("الملفات لازم تكون صور.");
      event.target.value = "";
      return;
    }

    const tooLargeFile = imageFiles.find(
      (file) => file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024,
    );

    if (tooLargeFile) {
      setError(`إحدى الصور كبيرة جداً. اختاري صور أقل من ${MAX_IMAGE_SIZE_MB}MB.`);
      event.target.value = "";
      return;
    }

    const mergedFiles = [...selectedFiles, ...imageFiles].slice(0, MAX_IMAGES);

    if (selectedFiles.length + imageFiles.length > MAX_IMAGES) {
      setError(`مسموح رفع ${MAX_IMAGES} صور كحد أقصى للتقييم الواحد.`);
    } else {
      setError("");
    }

    revokePreviewUrls(imagePreviews);

    const nextPreviews = mergedFiles.map((file) => URL.createObjectURL(file));

    setSelectedFiles(mergedFiles);
    setImagePreviews(nextPreviews);
    setHistoryImagePreviews([]);
    setResult(null);

    const thumbnails = await createHistoryThumbnails(mergedFiles);
    setHistoryImagePreviews(thumbnails);

    event.target.value = "";
  }

  function removeImage() {
    revokePreviewUrls(imagePreviews);

    setSelectedFiles([]);
    setImagePreviews([]);
    setHistoryImagePreviews([]);
    setResult(null);
    setError("");
  }

  async function removeImageAt(index: number) {
    const removedPreview = imagePreviews[index];

    revokePreviewUrl(removedPreview || null);

    const nextFiles = selectedFiles.filter(
      (_, fileIndex) => fileIndex !== index,
    );

    const nextPreviews = imagePreviews.filter(
      (_, previewIndex) => previewIndex !== index,
    );

    const nextHistoryPreviews = historyImagePreviews.filter(
      (_, previewIndex) => previewIndex !== index,
    );

    setSelectedFiles(nextFiles);
    setImagePreviews(nextPreviews);
    setHistoryImagePreviews(nextHistoryPreviews);
    setResult(null);
    setError("");

    if (nextFiles.length && nextHistoryPreviews.length !== nextFiles.length) {
      const thumbnails = await createHistoryThumbnails(nextFiles);
      setHistoryImagePreviews(thumbnails);
    }
  }

  function saveHistory(item: HistoryItemWithImages) {
    setHistory((current) => {
      const next = [item, ...current].slice(0, 20);

      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        return next;
      } catch {
        /*
          localStorage محدود. إذا امتلأ، نحفظ النتائج بدون الصور بدل ما نخرب التاريخ كله.
        */
        const lighter = next.map((entry) => ({
          ...entry,
          imagePreview: null,
          imagePreviews: [],
        }));

        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(lighter));
        return lighter;
      }
    });
  }

  function openHistoryItem(item: HistoryItemWithImages) {
    revokePreviewUrls(imagePreviews);

    const cleanImages =
      item.imagePreviews?.filter((src) => src && !src.startsWith("blob:")) ||
      [];

    const fallbackImage =
      item.imagePreview && !item.imagePreview.startsWith("blob:")
        ? item.imagePreview
        : null;

    const finalImages = cleanImages.length
      ? cleanImages
      : fallbackImage
        ? [fallbackImage]
        : [];

   const savedResult = normalizeResult(item.result);

setPrompt(item.prompt);
setResult(savedResult);
setTranslatedResults({
  [locale]: savedResult,
});
setSelectedFiles([]);
    setImagePreviews(finalImages);
    setHistoryImagePreviews(finalImages);
    setError("");
    setHistoryOpen(false);
  }

  function clearHistory() {
    setHistory([]);
    window.localStorage.removeItem(HISTORY_KEY);
  }

  function deleteHistoryItem(id: string) {
    setHistory((current) => {
      const next = current.filter((item) => item.id !== id);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }
async function fetchSimilarImagesByImage(imageUrl: string) {
  if (!imageUrl.trim()) return;

  setIsLoadingSimilar(true);
  setSimilarImages([]);

  try {
    const response = await fetch("/api/google-lens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Google Lens search failed.");
    }

    setSimilarImages(Array.isArray(data.items) ? data.items : []);
  } catch (error) {
    console.error("Google Lens similar images failed:", error);
    setSimilarImages([]);
  } finally {
    setIsLoadingSimilar(false);
  }
}

async function handleAnalyze() {
  if (!selectedFiles.length && !prompt.trim()) {
    setError(t.emptyError);
    return;
  }

  setIsAnalyzing(true);
  setError("");
  setResult(null);
  setSimilarImages([]);
  setIsLoadingSimilar(false);

  try {
    const formData = new FormData();

    const optimizedFiles = await Promise.all(
      selectedFiles.slice(0, 6).map((file) => resizeImageForAnalysis(file)),
    );

    optimizedFiles.forEach((file) => {
      formData.append("images", file);
    });

    if (optimizedFiles[0]) {
      formData.append("image", optimizedFiles[0]);
    }

    formData.append("notes", prompt);
    formData.append("locale", locale);

    let uploadedImageUrl = "";
    let googleLensContext = "";
    let houseContext = "";

    // 1) Upload first image to Cloudinary
    if (selectedFiles[0]) {
      const uploadFormData = new FormData();
      uploadFormData.append("image", selectedFiles[0]);

      const uploadResponse = await fetch("/api/upload-image", {
        method: "POST",
        body: uploadFormData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData?.imageUrl) {
        throw new Error(uploadData?.error || "Failed to upload image.");
      }

      uploadedImageUrl = uploadData.imageUrl;
      formData.append("uploadedImageUrl", uploadedImageUrl);
    }

    // 2) Google Lens visual matches
    if (uploadedImageUrl) {
      setIsLoadingSimilar(true);

      try {
        const lensResponse = await fetch("/api/google-lens", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageUrl: uploadedImageUrl }),
        });

        const lensData = await lensResponse.json();

        if (lensResponse.ok && Array.isArray(lensData.items)) {
          const items = lensData.items.slice(0, 16);

          setSimilarImages(items);

          googleLensContext = items
            .slice(0, 10)
            .map((item: any, index: number) => {
              return [
                `${index + 1}. GOOGLE LENS VISUAL MATCH`,
                `Title: ${item.title || "Untitled similar item"}`,
                `Source: ${item.source || "Unknown"}`,
                `Price: ${item.price || "No visible price"}`,
                `Link: ${item.link || "No link"}`,
              ].join(" | ");
            })
            .join("\n");
        }
      } catch (error) {
        console.error("Google Lens market context failed:", error);
        setSimilarImages([]);
      } finally {
        setIsLoadingSimilar(false);
      }
    }

    // 3) House of Antiques internal comparables
    try {
      const houseResponse = await fetch("/api/house-comparables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: [prompt, googleLensContext].filter(Boolean).join("\n"),
        }),
      });

      const houseData = await houseResponse.json();

      if (houseResponse.ok && Array.isArray(houseData.items)) {
        houseContext = houseData.items
          .slice(0, 8)
          .map((item: any, index: number) => {
            return [
              `${index + 1}. INTERNAL HOUSE OF ANTIQUES COMPARABLE`,
              `Title: ${item.title || "Untitled House of Antiques item"}`,
              `Description: ${item.description || "No description"}`,
              `Listed retail price: ${item.price || "No listed price"} ${item.currency || ""}`,
              `Category: ${item.category || "Unknown"}`,
              `Material: ${item.material || "Unknown"}`,
              `Period: ${item.period || "Unknown"}`,
              `Origin: ${item.origin || "Unknown"}`,
              `Similarity score: ${item.score || 0}`,
              `URL: ${item.url || "No link"}`,
              `Source: ${item.source || "House of Antiques Store"}`,
            ].join(" | ");
          })
          .join("\n");
      }
    } catch (error) {
      console.error("House of Antiques comparables failed:", error);
    }

    // 4) Build combined market context
    const combinedMarketContext = [
      googleLensContext
        ? `Google Lens visual matches:\n${googleLensContext}`
        : "",
      houseContext
        ? `House of Antiques internal comparables:\n${houseContext}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    if (combinedMarketContext) {
      formData.append("marketContext", combinedMarketContext);
    }

    // 5) Analyze with OpenAI
    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Failed to analyze request.");
    }

   const analyzedResult = normalizeResult(data);

setResult(analyzedResult);
setTranslatedResults({
  [locale]: analyzedResult,
});

const savedThumbnails = historyImagePreviews.length
  ? historyImagePreviews
  : await createHistoryThumbnails(selectedFiles);

saveHistory({
  id: createId(),
  title: createHistoryTitle(analyzedResult),
  prompt,
  createdAt: new Date().toISOString(),
  imagePreview: savedThumbnails[0] || null,
  imagePreviews: savedThumbnails,
  result: analyzedResult,
});


  } catch (err) {
    setError(err instanceof Error ? err.message : "Unexpected error.");
  } finally {
    setIsAnalyzing(false);
    setIsLoadingSimilar(false);
  }

}

async function handleShare() {
  if (!result) return;

  try {
    const labels = {
      result: t.result,
      age: t.age,
      value: t.value,
      material: t.material,
      origin: t.origin,
      lookup: t.lookup,
      description: t.description,
      condition: t.condition,
      authenticity: t.authenticity,
      priceReason: t.priceReason,
      valueDrivers: t.valueDrivers,
      valueReducers: t.valueReducers,
      similar: t.similar,
      similarHint: t.similarHint,
      soon: t.soon,
      neededPhotos: t.neededPhotos,
      followUp: t.followUp,
      confidence: t.confidence,
      notice: t.notice,
      similarImages,
    };

    const file = await createShareImage({
      result,
      imagePreview: imagePreviews[0] || null,
      labels,
      locale,
    });

    const shareData = {
      title: result.title || "Antique Lens Report",
      text: "Antique Lens evaluation report",
      files: [file],
    } as ShareData & { files: File[] };

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare(shareData)
    ) {
      await navigator.share(shareData);
      return;
    }

    downloadShareImage(file);
  } catch (err) {
    console.error("Failed to share report image:", err);

    try {
      await copyFallbackSummary(result);
      alert("تعذر إنشاء صورة المشاركة. تم نسخ ملخص التقرير بدل الصورة.");
    } catch {
      alert("تعذر إنشاء صورة المشاركة.");
    }
  }
}

return {
  locale,
  theme,
  t,

  prompt,
  setPrompt,

  selectedFiles,
  imagePreviews,
  selectedFile: selectedFiles[0] || null,
  imagePreview: imagePreviews[0] || null,
 result,
isAnalyzing,
isTranslatingResult,
error,
  historyOpen,
  setHistoryOpen,
  history,
  changeLocale,
  toggleTheme,
  resetEvaluation,
  handleImageChange,
  removeImage,
  removeImageAt,
  handleAnalyze,
  handleShare,
  similarImages,
  isLoadingSimilar,
  openHistoryItem,
  clearHistory,
  deleteHistoryItem,
    ...followUp,

};
}