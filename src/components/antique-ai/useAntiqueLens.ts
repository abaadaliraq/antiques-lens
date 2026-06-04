"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useFollowUpEvaluation } from "./useFollowUpEvaluation";

import {
  addArchiveItem,
  clearArchiveItems,
  createArchiveImagePreviews,
  deleteArchiveItem,
  fileToDataUrl,
  loadArchiveItems,
  type ArchiveItem,
} from "./archiveStore";
import { content, normalizeResult } from "./antiqueContent";
import { createShareImage } from "./createShareImage";
import type {
  AnalysisResult,
  Locale,
  ThemeMode,
  SimilarImageResult,
  HouseOfAntiquesContext,
  HouseOfAntiquesMatch,
} from "./types";
const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE_MB = 8;
const SUPPORTED_LOCALES: Locale[] = [
  "ar",
  "en",
  "fr",
  "hi",
  "fa",
  "tr",
  "ru",
  "ku",
];
const USER_LOCALE_STORAGE_KEY = "antiques-lens:locale";

type AppScreen = "home" | "result" | "archive-result" | "follow-up";

function pushAppHistoryState(screen: AppScreen) {
  if (typeof window === "undefined") return;

  window.history.pushState(
    { kishibScreen: screen },
    "",
    window.location.href,
  );
}

function replaceAppHistoryState(screen: AppScreen) {
  if (typeof window === "undefined") return;

  window.history.replaceState(
    { kishibScreen: screen },
    "",
    window.location.href,
  );
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

function isUsableHouseMatch(item: HouseOfAntiquesMatch) {
  return item.confidence === "exact";
}

function buildHouseSimilarImages(): SimilarImageResult[] {
  return [];
}

function isHouseOfAntiquesSimilarImage(item: SimilarImageResult) {
  const sourceText = `${item.source || ""} ${item.link || ""} ${item.imageUrl || ""}`
    .toLowerCase();

  return (
    sourceText.includes("house of antiques") ||
    sourceText.includes("houseofantiques.store")
  );
}

function filterExternalSimilarImages(items: SimilarImageResult[]) {
  return items.filter((item) => !isHouseOfAntiquesSimilarImage(item));
}

function mergeSimilarImages(
  houseImages: SimilarImageResult[],
  externalImages: SimilarImageResult[],
) {
  const seen = new Set<string>();

  return [...houseImages, ...externalImages]
    .filter((item) => {
      const key = item.imageUrl || item.link || item.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 16);
}

function getSimilarItems(result: Partial<AnalysisResult> | null | undefined) {
  return (
    result?.similarItems ||
    result?.similarPhotos ||
    result?.similarImages ||
    result?.imageMatches ||
    result?.visualMatches ||
    result?.storeMatches ||
    result?.matches ||
    result?.similar ||
    result?.similarPieces ||
    []
  );
}

export function useAntiqueLens() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "ar";

    const savedLocale = window.localStorage.getItem(
      USER_LOCALE_STORAGE_KEY,
    ) as Locale | null;

    return savedLocale && SUPPORTED_LOCALES.includes(savedLocale)
      ? savedLocale
      : "ar";
  });
  const theme: ThemeMode = "light";
const [similarImages, setSimilarImages] = useState<SimilarImageResult[]>([]);
const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [archiveImagePreviews, setArchiveImagePreviews] = useState<string[]>(
    [],
  );
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("home");
  const currentScreenRef = useRef<AppScreen>("home");
  const lastBackPressRef = useRef(0);
  const historyReadyRef = useRef(false);
  const goBackInsideAppRef = useRef<() => boolean>(() => false);

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
const [history, setHistory] = useState<ArchiveItem[]>([]);
const [selectedArchiveItemId, setSelectedArchiveItemId] = useState<string | null>(null);

  const t = useMemo(() => content[locale], [locale]);

  function setAppScreen(screen: AppScreen) {
    currentScreenRef.current = screen;
    setCurrentScreen(screen);
  }

  function goHome(options: { replaceHistory?: boolean } = {}) {
    revokePreviewUrls(imagePreviews);
setSimilarImages([]);
setIsLoadingSimilar(false);
    setPrompt("");
    setSelectedFiles([]);
    setImagePreviews([]);
    setArchiveImagePreviews([]);
    setResult(null);
    setSelectedArchiveItemId(null);
    setError("");
    followUp.resetFollowUp();
    setAppScreen("home");

    if (options.replaceHistory) {
      replaceAppHistoryState("home");
    }
  }

  function goBackInsideApp() {
    const screen = currentScreenRef.current;

    if (screen === "follow-up") {
      followUp.setFollowUpOpen(false);
      setAppScreen("result");
      return true;
    }

    if (screen === "result" || screen === "archive-result") {
      goHome();
      return true;
    }

    return false;
  }

  goBackInsideAppRef.current = goBackInsideApp;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedLocale = window.localStorage.getItem(
        USER_LOCALE_STORAGE_KEY,
      ) as Locale | null;

      if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
        setLocale(savedLocale);
      }

      setHistory(loadArchiveItems());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (historyReadyRef.current) return;

    replaceAppHistoryState("home");
    pushAppHistoryState("home");
    historyReadyRef.current = true;

    function handlePopState() {
      if (goBackInsideAppRef.current()) {
        replaceAppHistoryState(currentScreenRef.current);
        if (currentScreenRef.current === "home") {
          pushAppHistoryState("home");
        }
        return;
      }

      const now = Date.now();

      if (now - lastBackPressRef.current > 2000) {
        lastBackPressRef.current = now;
        pushAppHistoryState("home");
        return;
      }

      window.history.back();
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    return () => {
      revokePreviewUrls(imagePreviews);
    };
  }, [imagePreviews]);

  useEffect(() => {
    if (currentScreen !== "follow-up" || followUp.followUpOpen) return;

    setAppScreen("result");
    replaceAppHistoryState("result");
  }, [currentScreen, followUp.followUpOpen]);

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
  window.localStorage.setItem(USER_LOCALE_STORAGE_KEY, nextLocale);

  if (nextLocale === locale) {
    return;
  }

  setLocale(nextLocale);

  if (!result) return;

  const cached = translatedResults[nextLocale];

  if (cached) {
    setResult(cached);
    return;
  }

  await translateCurrentResult(result, nextLocale);
}

  function resetEvaluation() {
    goHome({ replaceHistory: true });
  }

  function setFollowUpOpenInside(value: boolean) {
    followUp.setFollowUpOpen(value);

    if (value) {
      setAppScreen("follow-up");
      pushAppHistoryState("follow-up");
      return;
    }

    if (currentScreenRef.current === "follow-up") {
      setAppScreen("result");
      replaceAppHistoryState("result");
    }
  }

  function handleAddInfoInside() {
    if (!result || followUp.followUpUsed) {
      followUp.handleAddInfo();
      return;
    }

    followUp.handleAddInfo();
    setAppScreen("follow-up");
    pushAppHistoryState("follow-up");
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
    setArchiveImagePreviews([]);
    setResult(null);

    const previews = await createArchiveImagePreviews(mergedFiles);
    setArchiveImagePreviews(previews);

    event.target.value = "";
  }

  function removeImage() {
    revokePreviewUrls(imagePreviews);

    setSelectedFiles([]);
    setImagePreviews([]);
    setArchiveImagePreviews([]);
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

    const nextArchivePreviews = archiveImagePreviews.filter(
      (_, previewIndex) => previewIndex !== index,
    );

    setSelectedFiles(nextFiles);
    setImagePreviews(nextPreviews);
    setArchiveImagePreviews(nextArchivePreviews);
    setResult(null);
    setError("");

    if (nextFiles.length && nextArchivePreviews.length !== nextFiles.length) {
      const previews = await createArchiveImagePreviews(nextFiles);
      setArchiveImagePreviews(previews);
    }
  }

  function saveHistory(item: ArchiveItem) {
    const updatedArchive = addArchiveItem(item);
    setHistory(updatedArchive);
  }

  function openHistoryItem(item: ArchiveItem) {
    revokePreviewUrls(imagePreviews);

    const restoredImagePreviews =
      item.imagePreviews?.length
        ? item.imagePreviews.filter((preview) => !preview.startsWith("blob:"))
        : item.imagePreview && !item.imagePreview.startsWith("blob:")
          ? [item.imagePreview]
          : [];

   const savedResult = normalizeResult(item.result);
const restoredSimilarImages =
  item.similarImages?.length ? item.similarImages : getSimilarItems(savedResult);

setPrompt(item.prompt || "");
setResult(savedResult);
setSelectedArchiveItemId(item.id);
setSimilarImages(restoredSimilarImages);
setTranslatedResults({
  [locale]: savedResult,
});
setSelectedFiles([]);
    setImagePreviews(restoredImagePreviews);
    setArchiveImagePreviews(restoredImagePreviews);
    setError("");
    setHistoryOpen(false);
    setAppScreen("archive-result");
    pushAppHistoryState("archive-result");
  }

  function clearHistory() {
    setHistory([]);
    clearArchiveItems();
  }

  function deleteHistoryItem(id: string) {
    const updatedArchive = deleteArchiveItem(id);
    setHistory(updatedArchive);

    if (selectedArchiveItemId === id) {
      goHome({ replaceHistory: true });
    }
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

    setSimilarImages(
      Array.isArray(data.items) ? filterExternalSimilarImages(data.items) : [],
    );
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
    let googleLensItems: SimilarImageResult[] = [];
    let houseStoreContext: HouseOfAntiquesContext | null = null;

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
          const items = filterExternalSimilarImages(lensData.items).slice(0, 16);

          googleLensItems = items;
          setSimilarImages(items);

          googleLensContext = items
            .slice(0, 10)
            .map((item: SimilarImageResult, index: number) => {
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
          query: prompt,
        }),
      });

      const houseData = await houseResponse.json();

      if (houseResponse.ok && Array.isArray(houseData.items)) {
        const matches = (houseData.items as HouseOfAntiquesMatch[]).filter(
          isUsableHouseMatch,
        );
        houseStoreContext = {
          found: matches.length > 0,
          confidence: matches.length > 0 ? "exact" : "none",
          matches,
          contextText:
            matches.length > 0
              ? houseData.contextText || houseData.storeContext || ""
              : "",
        };

        const houseSimilarImages = buildHouseSimilarImages();

        if (houseSimilarImages.length > 0) {
          setSimilarImages(mergeSimilarImages(houseSimilarImages, googleLensItems));
        }

        houseContext = matches
          .slice(0, 8)
          .map((item: HouseOfAntiquesMatch, index: number) => {
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
              `Similarity confidence: ${item.confidence || "none"}`,
              `Similarity reason: ${item.matchReason || "Text similarity"}`,
              `Image: ${item.imageUrl || "No image"}`,
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
      houseContext && houseStoreContext?.confidence === "exact"
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

 const analyzedResult = normalizeResult({
   ...data,
   houseOfAntiques: houseStoreContext || undefined,
 });

  try {
    const refinedHouseResponse = await fetch("/api/house-comparables", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: [
          prompt,
          analyzedResult.title,
          analyzedResult.lookup,
          analyzedResult.history,
          ...(analyzedResult.visualSearchKeywords || []),
          ...(analyzedResult.keywords || []),
        ]
          .filter(Boolean)
          .join("\n"),
        title: analyzedResult.title,
        itemType: analyzedResult.itemType || analyzedResult.lookup,
        material: analyzedResult.material,
        origin: analyzedResult.origin,
        description: analyzedResult.history || analyzedResult.description,
      }),
    });

    const refinedHouseData = await refinedHouseResponse.json();

    if (refinedHouseResponse.ok && Array.isArray(refinedHouseData.items)) {
      const matches = (refinedHouseData.items as HouseOfAntiquesMatch[]).filter(
        isUsableHouseMatch,
      );

      houseStoreContext = {
        found: matches.length > 0,
        confidence: matches.length > 0 ? "exact" : "none",
        matches,
        contextText:
          matches.length > 0
            ? refinedHouseData.contextText || refinedHouseData.storeContext || ""
            : "",
      };

      const houseSimilarImages = buildHouseSimilarImages();

      if (houseSimilarImages.length > 0) {
        setSimilarImages(mergeSimilarImages(houseSimilarImages, googleLensItems));
      }
    }
  } catch (error) {
    console.error("Refined House of Antiques comparables failed:", error);
  }

let finalResult = normalizeResult({
  ...analyzedResult,
  houseOfAntiques: houseStoreContext || undefined,
});

if (locale !== "ar") {
  try {
    const translateResponse = await fetch("/api/translate-result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locale,
        result: analyzedResult,
      }),
    });

    const translateData = await translateResponse.json();

    if (translateResponse.ok) {
      finalResult = normalizeResult({
        ...(translateData.result || translateData),
        houseOfAntiques: houseStoreContext || undefined,
      });
    }
  } catch (translateError) {
    console.error("Initial result translation failed:", translateError);
  }
}

const finalSimilarImages = getSimilarItems(finalResult).length
  ? getSimilarItems(finalResult)
  : googleLensItems;

if (finalSimilarImages.length > 0) {
  finalResult = normalizeResult({
    ...finalResult,
    similarImages: finalSimilarImages,
    similarItems: finalSimilarImages,
    visualMatches: finalSimilarImages,
  });
}

setSimilarImages(finalSimilarImages);
setResult(finalResult);
setSelectedArchiveItemId(null);
setAppScreen("result");
pushAppHistoryState("result");
setTranslatedResults({
  [locale]: finalResult,
});

const archivePreviews = archiveImagePreviews.length
  ? archiveImagePreviews
  : await createArchiveImagePreviews(selectedFiles);
const imagePreview = archivePreviews[0] || undefined;
const analyzedArchiveResult = finalResult as AnalysisResult & {
  itemName?: string;
  objectName?: string;
};
const archiveItem: ArchiveItem = {
  id: crypto.randomUUID(),
  title:
    analyzedArchiveResult?.title ||
    analyzedArchiveResult?.itemName ||
    analyzedArchiveResult?.objectName ||
    "Untitled item",
  prompt: prompt || "",
  imagePreview,
  imagePreviews: archivePreviews.length
    ? archivePreviews
    : imagePreview
      ? [imagePreview]
      : [],
  createdAt: new Date().toISOString(),
  result: {
    ...finalResult,
    imagePreview,
    imagePreviews: archivePreviews.length
      ? archivePreviews
      : imagePreview
        ? [imagePreview]
        : [],
    similarImages: finalSimilarImages,
    similarItems: finalSimilarImages,
    visualMatches: finalSimilarImages,
  },
  similarImages: finalSimilarImages,
};

saveHistory(archiveItem);


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
  currentScreen,
  historyOpen,
  setHistoryOpen,
  history,
  changeLocale,
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
  goHome,
  goBackInsideApp,
  ...followUp,
  setFollowUpOpen: setFollowUpOpenInside,
  handleAddInfo: handleAddInfoInside,

};
}
