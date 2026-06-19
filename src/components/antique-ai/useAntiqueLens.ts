"use client";

import {
  Camera,
  CameraResultType,
  CameraSource,
} from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useFollowUpEvaluation } from "./useFollowUpEvaluation";
import { createShareImage } from "./createShareImage";
import {
  loadEvaluationArchiveItemsFromSupabase,
  mergeEvaluationArchiveItems,
  saveEvaluationToSupabase,
} from "@/lib/evaluationsSupabase";
import {
  canUserAnalyze,
  DEFAULT_USAGE_LIMIT_STATUS,
  incrementAnalysisUsage,
  type UsageLimitStatus,
} from "@/lib/usageLimitsSupabase";

import {
  addArchiveItemWithStatus,
  ARCHIVE_STORAGE_EVENT,
  ARCHIVE_STORAGE_KEY,
  clearArchiveItems,
  createArchiveImageAssets,
  createArchiveImagePreviews,
  deleteArchiveItem,
  fileToDataUrl,
  loadArchiveItems,
  loadArchiveItemsWithImages,
  type ArchiveItem,
} from "./archiveStore";
import { content, normalizeResult } from "./antiqueContent";
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

async function cameraPhotoToFile(photoPath: string) {
  const response = await fetch(photoPath);
  const blob = await response.blob();
  const type = blob.type || "image/jpeg";
  const extension = type.split("/")[1] || "jpg";

  return new File([blob], `kishib-camera-${Date.now()}.${extension}`, {
    type,
  });
}

function getUsefulShareUrl() {
  if (typeof window === "undefined" || !window.location?.href) return "";

  try {
    const currentUrl = new URL(window.location.href);
    const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

    if (localHosts.has(currentUrl.hostname)) return "";

    return currentUrl.href;
  } catch {
    return "";
  }
}

function getUsageMessage(locale: Locale, key: "auth" | "limit" | "checkFailed") {
  if (locale === "en") {
    if (key === "auth") return "Please sign in first to start an evaluation.";
    if (key === "checkFailed") {
      return "We could not verify your free usage limit. Please try again.";
    }
    return "Your free evaluations are finished. Please subscribe to continue.";
  }

  if (key === "auth") return "يرجى تسجيل الدخول أولًا لبدء التقييم.";
  if (key === "checkFailed") {
    return "تعذر التحقق من محاولاتك المجانية. حاول مرة أخرى.";
  }
  return "انتهت محاولاتك المجانية. يرجى الاشتراك لمتابعة التحليل.";
}

function isCanceledShare(error: unknown) {
  if (error instanceof DOMException) {
    return error.name === "AbortError" || error.name === "NotAllowedError";
  }

  const record =
    error && typeof error === "object" ? (error as Record<string, unknown>) : null;
  const message = String(
    record?.message ?? record?.errorMessage ?? record?.code ?? error ?? "",
  ).toLowerCase();

  return (
    message.includes("cancel") ||
    message.includes("abort") ||
    message.includes("dismiss") ||
    message.includes("canceled") ||
    message.includes("cancelled")
  );
}

function buildShareSummary(result: AnalysisResult, shareUrl = "") {
  const title = result.title || result.itemType || "KISHIB Evaluation";
  const category = result.itemType || result.lookup || "";
  const value = result.estimatedValue || result.priceRange || "";
  const description = result.description || result.history || result.lookup || "";
  const reportDate = new Intl.DateTimeFormat("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return [
    "تقرير KISHIB",
    title,
    category ? `الفئة: ${category}` : "",
    description ? `الوصف: ${description}` : "",
    value ? `السعر التقديري: ${value}` : "",
    `تاريخ التقرير: ${reportDate}`,
    shareUrl,
  ]
    .filter(Boolean)
    .join("\n");
}

function isAndroidNativeApp() {
  return (
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  );
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
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
    Ø£Ù‡Ù… Ù‚Ø§Ø¹Ø¯Ø©:
    Ù†ÙˆØ¹ Ø§Ù„Ù‚Ø·Ø¹Ø© Ù„Ø§Ø²Ù… ÙŠÙƒÙˆÙ† Ø£ÙˆÙ„ Ø§Ù„Ø¨Ø­Ø«.
    Ø¥Ø°Ø§ Ù†ÙˆØ¹ Ø§Ù„Ù‚Ø·Ø¹Ø© ØºÙ„Ø· Ø£Ùˆ Ø¹Ø§Ù…ØŒ Pinterest ÙŠØ¬ÙŠØ¨ Ù†ØªØ§Ø¦Ø¬ Ø¨Ø¹ÙŠØ¯Ø©.
  */

  const itemTerms: string[] = [];
  const materialTerms: string[] = [];
  const colorTerms: string[] = [];
  const styleTerms: string[] = [];

  // Ø´ÙŠØ´Ø© / Ø£Ø±ÙƒÙŠÙ„Ø© / Ù†Ø±ÙƒÙŠÙ„Ø©
  if (
    /Ø´ÙŠØ´Ø©|Ø£Ø±ÙƒÙŠÙ„Ø©|Ø§Ø±ÙƒÙŠÙ„Ø©|Ù†Ø±ÙƒÙŠÙ„Ø©|Ù†Ø±Ø¬ÙŠÙ„Ø©|Ù†Ø§Ø±Ø¬ÙŠÙ„Ø©|hookah|shisha|narghile|nargile|water pipe|waterpipe/.test(
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

  // Ø¥Ø¨Ø±ÙŠÙ‚ / Ø¯Ù„Ø© / Ø¬Ùƒ
  else if (/Ø¥Ø¨Ø±ÙŠÙ‚|Ø§Ø¨Ø±ÙŠÙ‚|Ø¯Ù„Ø©|Ø¯Ù„Ù‡|ewer|pitcher|jug|decanter|coffee pot/.test(rawText)) {
    itemTerms.push(
      "antique ewer",
      "decorative pitcher",
      "vintage coffee pot",
    );
  }

  // Ù…Ø²Ù‡Ø±ÙŠØ©
  else if (/Ù…Ø²Ù‡Ø±ÙŠØ©|ÙØ§Ø²Ø©|vase/.test(rawText)) {
    itemTerms.push("antique vase", "decorative vase");
  }

  // ÙƒØ£Ø³ / Ù‚Ø¯Ø­
  else if (/ÙƒØ£Ø³|ÙƒØ§Ø³|Ù‚Ø¯Ø­|goblet|cup|chalice/.test(rawText)) {
    itemTerms.push("antique goblet", "decorative chalice");
  }

  // ØµØ­Ù† / Ø·Ø¨Ù‚
  else if (/ØµØ­Ù†|Ø·Ø¨Ù‚|plate|dish/.test(rawText)) {
    itemTerms.push("antique decorative plate");
  }

  // ØªÙ…Ø«Ø§Ù„
  else if (/ØªÙ…Ø«Ø§Ù„|figure|statue|figurine/.test(rawText)) {
    itemTerms.push("antique figurine");
  }

  // fallback Ø¥Ø°Ø§ Ù…Ø§ Ø¹Ø±Ù Ù†ÙˆØ¹ Ø§Ù„Ù‚Ø·Ø¹Ø©
  else {
    itemTerms.push(
      result.title || "",
      result.lookup || "",
      ...(result.visualSearchKeywords || []),
    );
  }

  // Ø§Ù„Ù…ÙˆØ§Ø¯
  if (/Ù†Ø­Ø§Ø³|brass|copper|Ø¨Ø±ÙˆÙ†Ø²|bronze/.test(rawText)) {
    materialTerms.push("brass", "copper", "bronze");
  }

  if (/ÙØ¶Ø©|silver|Ù…Ø·Ù„ÙŠ ÙØ¶Ø©|silver plated/.test(rawText)) {
    materialTerms.push("silver plated", "silver");
  }

  if (/ÙƒØ±ÙŠØ³ØªØ§Ù„|crystal|glass|Ø²Ø¬Ø§Ø¬/.test(rawText)) {
    materialTerms.push("crystal glass");
  }

  if (/Ø®Ø´Ø¨|wood|wooden/.test(rawText)) {
    materialTerms.push("wooden");
  }

  if (/Ø¨ÙˆØ±Ø³Ù„ÙŠÙ†|porcelain|ceramic|Ø®Ø²Ù/.test(rawText)) {
    materialTerms.push("porcelain ceramic");
  }

  // Ø§Ù„Ø£Ù„ÙˆØ§Ù†
  if (/Ø£Ø²Ø±Ù‚|Ø§Ø²Ø±Ù‚|blue|ÙƒØ­Ù„ÙŠ/.test(rawText)) {
    colorTerms.push("blue");
  }

  if (/Ø°Ù‡Ø¨ÙŠ|gold|gilded/.test(rawText)) {
    colorTerms.push("gold");
  }

  if (/Ø£Ø³ÙˆØ¯|Ø§Ø³ÙˆØ¯|black/.test(rawText)) {
    colorTerms.push("black");
  }

  if (/Ø¨Ù†ÙŠ|brown/.test(rawText)) {
    colorTerms.push("brown");
  }

  // Ø§Ù„Ø£Ø³Ù„ÙˆØ¨ / Ø§Ù„Ù…Ù†Ø´Ø£
  if (/Ø¹Ø«Ù…Ø§Ù†ÙŠ|ottoman/.test(rawText)) {
    styleTerms.push("ottoman");
  }

  if (/Ø´Ø±Ù‚ÙŠ|middle eastern|islamic|arabic/.test(rawText)) {
    styleTerms.push("middle eastern", "islamic");
  }

  if (/Ù…Ø²Ø®Ø±Ù|Ø²Ø®Ø±ÙØ©|engraved|etched|ornate|decorated/.test(rawText)) {
    styleTerms.push("engraved", "ornate");
  }

  if (/Ù‚Ø¯ÙŠÙ…|antique|vintage/.test(rawText)) {
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

const HOUSE_STRONG_MATCH_THRESHOLD = 0.88;
const HOUSE_VISIBLE_IMAGE_THRESHOLD = 0.92;

function isUsableHouseMatch(item: HouseOfAntiquesMatch) {
  return (
    item.source === "house_store" &&
    item.hasStrongMatch === true &&
    item.sameObjectType === true &&
    item.confidence === "exact" &&
    typeof item.confidenceScore === "number" &&
    item.confidenceScore >= HOUSE_STRONG_MATCH_THRESHOLD &&
    typeof item.visualSimilarity === "number" &&
    item.visualSimilarity >= HOUSE_VISIBLE_IMAGE_THRESHOLD
  );
}

function buildHouseSimilarImages(matches: HouseOfAntiquesMatch[]): SimilarImageResult[] {
  return matches
    .filter(isUsableHouseMatch)
    .filter((item) => (item.visualSimilarity ?? 0) >= HOUSE_VISIBLE_IMAGE_THRESHOLD)
    .flatMap((item) => {
      const urls = item.images?.length ? item.images : item.imageUrl ? [item.imageUrl] : [];

      return urls.slice(0, 2).map((imageUrl) => ({
        title: "قطعة مرجعية مشابهة جدًا",
        imageUrl,
        link: item.url || imageUrl,
        source: "قطعة مرجعية مشابهة جدًا",
        description: item.description,
        confidence: item.confidence,
        confidenceScore: item.confidenceScore,
        visualSimilarity: item.visualSimilarity,
        matchReason: item.matchReason,
        isHouseOfAntiques: true,
      }));
    })
    .slice(0, 6);
}

function isHouseOfAntiquesSimilarImage(item: SimilarImageResult) {
  const sourceText = `${item.source || ""} ${item.link || ""} ${item.imageUrl || ""}`
    .toLowerCase();

  return (
    item.isHouseOfAntiques === true ||
    sourceText.includes("house_store") ||
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

  return filterExternalSimilarImages(externalImages)
    .filter((item) => {
      const key = item.imageUrl || item.link || item.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 24);
}

function normalizeSimilarImageItems(items: unknown): SimilarImageResult[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item): SimilarImageResult | null => {
      if (!item || typeof item !== "object") return null;

      const record = item as Record<string, unknown>;
      const title = typeof record.title === "string" ? record.title : "";
      const imageUrl =
        typeof record.imageUrl === "string"
          ? record.imageUrl
          : Array.isArray(record.images) && typeof record.images[0] === "string"
            ? record.images[0]
            : "";
      const link =
        typeof record.link === "string"
          ? record.link
          : typeof record.url === "string"
            ? record.url
            : imageUrl;

      if (!imageUrl && !link) return null;

      const normalizedItem: SimilarImageResult = {
        title: title || "Similar item",
        imageUrl,
        link,
      };

      if (typeof record.source === "string") normalizedItem.source = record.source;
      if (typeof record.price === "string") normalizedItem.price = record.price;
      if (typeof record.description === "string") {
        normalizedItem.description = record.description;
      }

      return normalizedItem;
    })
    .filter((item): item is SimilarImageResult => Boolean(item));
}

async function safePostJson(url: string, body: unknown) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    let data: unknown = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.warn(`[KISHIB] Optional request skipped: ${url}`);
    return { ok: false, status: 0, data: null };
  }
}

function getSimilarItems(result: Partial<AnalysisResult> | null | undefined): SimilarImageResult[] {
  const extendedResult = result as
    | (Partial<AnalysisResult> & {
        houseOfAntiquesMatches?: SimilarImageResult[];
      })
    | null
    | undefined;

  return normalizeSimilarImageItems(
    result?.similarItems ||
    result?.similarPhotos ||
    result?.similarImages ||
    result?.imageMatches ||
    result?.visualMatches ||
    result?.storeMatches ||
    result?.matches ||
    result?.similar ||
    result?.similarPieces ||
    extendedResult?.houseOfAntiquesMatches ||
    result?.houseOfAntiques?.matches ||
    [],
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
  const [archiveOriginalImages, setArchiveOriginalImages] = useState<string[]>(
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
const [selectedArchiveItemId, setSelectedArchiveItemId] = useState<string | null>(null);
const [usageStatus, setUsageStatus] = useState<UsageLimitStatus>(
  DEFAULT_USAGE_LIMIT_STATUS,
);
const [isUsageLoading, setIsUsageLoading] = useState(false);
const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

const followUp = useFollowUpEvaluation({
  result,
  itemId: selectedArchiveItemId,
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

const t = useMemo(() => content[locale], [locale]);

async function refreshUsageStatus() {
  setIsUsageLoading(true);

  try {
    const nextStatus = await canUserAnalyze();
    setUsageStatus(nextStatus);
    return nextStatus;
  } finally {
    setIsUsageLoading(false);
  }
}

function openSubscriptionModal() {
  setIsSubscriptionModalOpen(true);
}

function closeSubscriptionModal() {
  setIsSubscriptionModalOpen(false);
}

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
    setArchiveOriginalImages([]);
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
    const timer = window.setTimeout(async () => {
      const savedLocale = window.localStorage.getItem(
        USER_LOCALE_STORAGE_KEY,
      ) as Locale | null;

      if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
        setLocale(savedLocale);
      }

      const [localArchiveItems, supabaseArchiveItems] = await Promise.all([
        loadArchiveItemsWithImages(),
        loadEvaluationArchiveItemsFromSupabase(),
      ]);
      const archiveItems = mergeEvaluationArchiveItems(
        localArchiveItems,
        supabaseArchiveItems,
      );
      console.info("[KISHIB archive] Initial archive load", {
        key: ARCHIVE_STORAGE_KEY,
        count: archiveItems.length,
        localCount: localArchiveItems.length,
        supabaseCount: supabaseArchiveItems.length,
      });
      setHistory(archiveItems);
      void refreshUsageStatus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function refreshArchiveFromStorage() {
      const [localArchiveItems, supabaseArchiveItems] = await Promise.all([
        loadArchiveItemsWithImages(),
        loadEvaluationArchiveItemsFromSupabase(),
      ]);
      const archiveItems = mergeEvaluationArchiveItems(
        localArchiveItems,
        supabaseArchiveItems,
      );

      console.info("[KISHIB archive] Refreshed archive from storage", {
        key: ARCHIVE_STORAGE_KEY,
        count: archiveItems.length,
        localCount: localArchiveItems.length,
        supabaseCount: supabaseArchiveItems.length,
      });
      setHistory(archiveItems);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== ARCHIVE_STORAGE_KEY) return;
      refreshArchiveFromStorage();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(ARCHIVE_STORAGE_EVENT, refreshArchiveFromStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        ARCHIVE_STORAGE_EVENT,
        refreshArchiveFromStorage,
      );
    };
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
    if (!result) {
      followUp.handleAddInfo();
      return;
    }

    followUp.handleAddInfo();
    setAppScreen("follow-up");
    pushAppHistoryState("follow-up");
  }

  async function addImageFiles(incomingFiles: File[]) {
    if (!incomingFiles.length) return;

    const imageFiles = incomingFiles.filter((file) =>
      file.type.startsWith("image/"),
    );

    if (!imageFiles.length) {
      setError("Ø§Ù„Ù…Ù„ÙØ§Øª Ù„Ø§Ø²Ù… ØªÙƒÙˆÙ† ØµÙˆØ±.");
      return;
    }

    const tooLargeFile = imageFiles.find(
      (file) => file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024,
    );

    if (tooLargeFile) {
      setError(`Ø¥Ø­Ø¯Ù‰ Ø§Ù„ØµÙˆØ± ÙƒØ¨ÙŠØ±Ø© Ø¬Ø¯Ø§Ù‹. Ø§Ø®ØªØ§Ø±ÙŠ ØµÙˆØ± Ø£Ù‚Ù„ Ù…Ù† ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    const mergedFiles = [...selectedFiles, ...imageFiles].slice(0, MAX_IMAGES);

    if (selectedFiles.length + imageFiles.length > MAX_IMAGES) {
      setError(`Ù…Ø³Ù…ÙˆØ­ Ø±ÙØ¹ ${MAX_IMAGES} ØµÙˆØ± ÙƒØ­Ø¯ Ø£Ù‚ØµÙ‰ Ù„Ù„ØªÙ‚ÙŠÙŠÙ… Ø§Ù„ÙˆØ§Ø­Ø¯.`);
    } else {
      setError("");
    }

    revokePreviewUrls(imagePreviews);

    const nextPreviews = mergedFiles.map((file) => URL.createObjectURL(file));

    setSelectedFiles(mergedFiles);
    setImagePreviews(nextPreviews);
    setArchiveImagePreviews([]);
    setArchiveOriginalImages([]);
    setResult(null);

    const assets = await createArchiveImageAssets(mergedFiles);
    setArchiveImagePreviews(assets.imagePreviews);
    setArchiveOriginalImages(assets.originalImages);
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const incomingFiles = Array.from(event.target.files || []);

    await addImageFiles(incomingFiles);
    event.target.value = "";
  }

  async function handleTakePhoto() {
    try {
      setError("");

      const photo = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.Uri,
        quality: 85,
        allowEditing: false,
      });
      const photoPath =
        photo.webPath || (photo.path ? Capacitor.convertFileSrc(photo.path) : "");

      if (!photoPath) {
        setError("Unable to read the captured photo.");
        return;
      }

      const file = await cameraPhotoToFile(photoPath);
      await addImageFiles([file]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to open camera.";

      if (/cancel/i.test(message)) return;

      console.error("Camera capture failed:", error);
      setError(message);
    }
  }

  function removeImage() {
    revokePreviewUrls(imagePreviews);

    setSelectedFiles([]);
    setImagePreviews([]);
    setArchiveImagePreviews([]);
    setArchiveOriginalImages([]);
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
    const nextArchiveOriginalImages = archiveOriginalImages.filter(
      (_, previewIndex) => previewIndex !== index,
    );

    setSelectedFiles(nextFiles);
    setImagePreviews(nextPreviews);
    setArchiveImagePreviews(nextArchivePreviews);
    setArchiveOriginalImages(nextArchiveOriginalImages);
    setResult(null);
    setError("");

    if (nextFiles.length && nextArchivePreviews.length !== nextFiles.length) {
      const assets = await createArchiveImageAssets(nextFiles);
      setArchiveImagePreviews(assets.imagePreviews);
      setArchiveOriginalImages(assets.originalImages);
    }
  }

  async function saveHistory(item: ArchiveItem) {
    console.info("[KISHIB archive] saveHistory called", {
      key: ARCHIVE_STORAGE_KEY,
      id: item.id,
      title: item.title,
      hasImagePreview: Boolean(item.imagePreview),
      hasOriginalImage: Boolean(item.originalImage),
    });
    const archiveSaveResult = await addArchiveItemWithStatus(item);
    const updatedArchive = archiveSaveResult.items;
    console.info("[KISHIB archive] History state updated", {
      key: ARCHIVE_STORAGE_KEY,
      count: updatedArchive.length,
      saved: archiveSaveResult.saved,
    });
    setHistory(updatedArchive);

    if (!archiveSaveResult.saved) {
      setError(
        locale === "en"
          ? "The evaluation is visible now, but your browser storage is full and it could not be saved to the archive."
          : "\u0627\u0644\u062a\u0642\u064a\u064a\u0645 \u0638\u0627\u0647\u0631 \u0627\u0644\u0622\u0646\u060c \u0644\u0643\u0646 \u062a\u062e\u0632\u064a\u0646 \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u0645\u0645\u062a\u0644\u0626 \u0648\u0644\u0645 \u0646\u062a\u0645\u0643\u0646 \u0645\u0646 \u062d\u0641\u0638\u0647 \u0641\u064a \u0627\u0644\u0623\u0631\u0634\u064a\u0641.",
      );
    }
  }

  function openHistoryItem(item: ArchiveItem) {
    revokePreviewUrls(imagePreviews);

    const restoredImagePreviews =
      item.originalImages?.length
        ? item.originalImages.filter((preview) => !preview.startsWith("blob:"))
        : item.originalImage && !item.originalImage.startsWith("blob:")
          ? [item.originalImage]
          : item.imagePreviews?.length
            ? item.imagePreviews.filter((preview) => !preview.startsWith("blob:"))
            : item.imagePreview && !item.imagePreview.startsWith("blob:")
              ? [item.imagePreview]
              : [];
    const restoredArchivePreviews =
      item.imagePreviews?.length
        ? item.imagePreviews.filter((preview) => !preview.startsWith("blob:"))
        : item.imagePreview && !item.imagePreview.startsWith("blob:")
          ? [item.imagePreview]
          : restoredImagePreviews;

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
    setArchiveImagePreviews(restoredArchivePreviews);
    setArchiveOriginalImages(restoredImagePreviews);
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
    const { ok, data } = await safePostJson("/api/google-lens", { imageUrl });
    const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};

    if (!ok) {
      setSimilarImages([]);
      return;
    }

    setSimilarImages(
      Array.isArray(record.items) ? filterExternalSimilarImages(record.items as SimilarImageResult[]) : [],
    );
  } catch {
    console.warn("Google Lens similar images skipped.");
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

  const currentUsageStatus = await refreshUsageStatus();

  if (!currentUsageStatus.canAnalyze) {
    if (currentUsageStatus.reason === "auth_required") {
      setError(getUsageMessage(locale, "auth"));
      return;
    }

    if (currentUsageStatus.reason === "usage_check_failed") {
      setError(getUsageMessage(locale, "checkFailed"));
      return;
    }

    setError(getUsageMessage(locale, "limit"));
    openSubscriptionModal();
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

    formData.append("notes", prompt);
    formData.append("locale", locale);

    let uploadedImageUrl = "";
    let cloudinaryPublicId = "";
    const uploadedImageUrls: string[] = [];
    const cloudinaryPublicIds: string[] = [];
    let googleLensContext = "";
    let houseContext = "";
    let googleLensItems: SimilarImageResult[] = [];
    let houseStoreContext: HouseOfAntiquesContext | null = null;

    // 1) Upload all selected images to Cloudinary for archive/search context.
    if (selectedFiles.length) {
      const uploadResults = await Promise.all(
        selectedFiles.slice(0, 6).map(async (file) => {
          const uploadFormData = new FormData();
          uploadFormData.append("image", file);

          const uploadResponse = await fetch("/api/upload-image", {
            method: "POST",
            body: uploadFormData,
          });

          const uploadData = await uploadResponse.json();

          if (!uploadResponse.ok || !uploadData?.imageUrl) {
            throw new Error(uploadData?.error || "Failed to upload image.");
          }

          return {
            imageUrl: String(uploadData.imageUrl),
            publicId:
              typeof uploadData.publicId === "string" ? uploadData.publicId : "",
          };
        }),
      );

      uploadedImageUrls.push(...uploadResults.map((item) => item.imageUrl));
      cloudinaryPublicIds.push(
        ...uploadResults.map((item) => item.publicId).filter(Boolean),
      );
      uploadedImageUrl = uploadedImageUrls[0] || "";
      cloudinaryPublicId = cloudinaryPublicIds[0] || "";

      uploadedImageUrls.forEach((url) => {
        formData.append("uploadedImageUrls", url);
      });
      formData.append("uploadedImageUrl", uploadedImageUrl);
    }

    // 2) Google Lens visual matches. Search several uploaded views because
    // detail shots such as stamps/signatures should support, not replace, the main object.
    if (uploadedImageUrls.length > 0) {
      setIsLoadingSimilar(true);

      try {
        const lensResults = await Promise.all(
          uploadedImageUrls.slice(0, 4).map(async (imageUrl, imageIndex) => {
            const { ok, data: lensData } = await safePostJson("/api/google-lens", {
              imageUrl,
            });
            const lensRecord =
              lensData && typeof lensData === "object"
                ? (lensData as Record<string, unknown>)
                : {};

            if (!ok || !Array.isArray(lensRecord.items)) {
              return [];
            }

            return filterExternalSimilarImages(lensRecord.items as SimilarImageResult[]).map((item) => ({
              ...item,
              source: item.source
                ? `${item.source} · image ${imageIndex + 1}`
                : `Google Lens · image ${imageIndex + 1}`,
            }));
          }),
        );
        const interleavedLensItems = Array.from({ length: 8 }).flatMap((_, rank) =>
          lensResults
            .map((itemsForImage) => itemsForImage[rank])
            .filter(Boolean) as SimilarImageResult[],
        );
        const items = mergeSimilarImages([], interleavedLensItems).slice(0, 24);

        if (items.length > 0) {
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
      } catch {
        console.warn("Google Lens market context skipped.");
        setSimilarImages([]);
      } finally {
        setIsLoadingSimilar(false);
      }
    }

    // 3) House of Antiques internal comparables
    try {
      const { ok: houseOk, data: houseRawData } = await safePostJson(
        "/api/house-comparables",
        {
          query: prompt,
        },
      );
      const houseData =
        houseRawData && typeof houseRawData === "object"
          ? (houseRawData as Record<string, unknown>)
          : {};

      if (houseOk && Array.isArray(houseData.items)) {
        const matches = (houseData.items as HouseOfAntiquesMatch[]).filter(
          isUsableHouseMatch,
        );
        houseStoreContext = {
          found: matches.length > 0,
          confidence: matches.length > 0 ? "exact" : "none",
          matches,
          contextText:
            matches.length > 0
              ? typeof houseData.contextText === "string"
                ? houseData.contextText
                : typeof houseData.storeContext === "string"
                  ? houseData.storeContext
                  : ""
              : "",
        };

        const houseSimilarImages = buildHouseSimilarImages(matches);

        if (houseSimilarImages.length > 0) {
          setSimilarImages(mergeSimilarImages(houseSimilarImages, googleLensItems));
        }

        houseContext = matches
          .slice(0, 3)
          .map((item: HouseOfAntiquesMatch, index: number) => {
            return [
              `${index + 1}. VERY CLOSE INTERNAL REFERENCE`,
              `Title: ${item.title || "Very close reference item"}`,
              `Description: ${item.description || "No description"}`,
              `Listed retail price: ${item.price || "No listed price"} ${item.currency || ""}`,
              `Category: ${item.category || "Unknown"}`,
              `Material: ${item.material || "Unknown"}`,
              `Period: ${item.period || "Unknown"}`,
              `Origin: ${item.origin || "Unknown"}`,
              `Similarity score: ${item.score || 0}`,
              `Similarity confidence: ${item.confidence || "none"}`,
              `Similarity confidence score: ${item.confidenceScore || 0}`,
              `Visual similarity: ${item.visualSimilarity || 0}`,
              `Similarity reason: ${item.matchReason || "Text similarity"}`,
              `hasStrongMatch: ${item.hasStrongMatch === true ? "true" : "false"}`,
            ].join(" | ");
          })
          .join("\n");
      }
    } catch {
      console.warn("House of Antiques comparables skipped.");
    }

    // 4) Build combined market context
    const combinedMarketContext = [
      googleLensContext
        ? `Google Lens visual matches from all uploaded views. Results from mark/stamp/signature close-ups are supporting clues only and must not override the full-object appraisal:\n${googleLensContext}`
        : "",
      houseContext &&
      houseStoreContext?.confidence === "exact" &&
      houseStoreContext.matches.some(isUsableHouseMatch)
        ? `Neutral internal reference comparables:\n${houseContext}`
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
   houseOfAntiques: houseStoreContext?.found ? houseStoreContext : undefined,
 });

 console.info("[KISHIB archive] Analysis completed", {
   title: analyzedResult.title,
   hasSelectedFiles: selectedFiles.length > 0,
   selectedFilesCount: selectedFiles.length,
 });

  try {
    const { ok: refinedHouseOk, data: refinedHouseRawData } = await safePostJson(
      "/api/house-comparables",
      {
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
      },
    );
    const refinedHouseData =
      refinedHouseRawData && typeof refinedHouseRawData === "object"
        ? (refinedHouseRawData as Record<string, unknown>)
        : {};

    if (refinedHouseOk && Array.isArray(refinedHouseData.items)) {
      const matches = (refinedHouseData.items as HouseOfAntiquesMatch[]).filter(
        isUsableHouseMatch,
      );

      houseStoreContext = {
        found: matches.length > 0,
        confidence: matches.length > 0 ? "exact" : "none",
        matches,
        contextText:
          matches.length > 0
            ? typeof refinedHouseData.contextText === "string"
              ? refinedHouseData.contextText
              : typeof refinedHouseData.storeContext === "string"
                ? refinedHouseData.storeContext
                : ""
            : "",
      };

      const houseSimilarImages = buildHouseSimilarImages(matches);

      if (houseSimilarImages.length > 0) {
        setSimilarImages(mergeSimilarImages(houseSimilarImages, googleLensItems));
      }
    }
  } catch {
    console.warn("Refined House of Antiques comparables skipped.");
  }

let finalResult = normalizeResult({
  ...analyzedResult,
  houseOfAntiques: houseStoreContext?.found ? houseStoreContext : undefined,
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
        houseOfAntiques: houseStoreContext?.found ? houseStoreContext : undefined,
      });
    }
  } catch (translateError) {
    console.error("Initial result translation failed:", translateError);
  }
}

const resultSimilarItems = getSimilarItems(finalResult);
const resultExternalSimilarImages = filterExternalSimilarImages(resultSimilarItems);
const finalExternalSimilarImages = resultExternalSimilarImages.length
  ? resultExternalSimilarImages
  : googleLensItems;
const finalSimilarImages = mergeSimilarImages(
  [],
  finalExternalSimilarImages,
);

if (finalSimilarImages.length > 0) {
  finalResult = normalizeResult({
    ...finalResult,
    uploadedImageUrl: uploadedImageUrl || finalResult.uploadedImageUrl,
    sourceImageUrl: uploadedImageUrl || finalResult.sourceImageUrl,
    imageUrl: uploadedImageUrl || finalResult.imageUrl,
    similarImages: finalSimilarImages,
    similarItems: finalSimilarImages,
    visualMatches: finalSimilarImages,
  });
}

if (uploadedImageUrl) {
  finalResult = normalizeResult({
    ...finalResult,
    uploadedImageUrl,
    sourceImageUrl: uploadedImageUrl,
    imageUrl: uploadedImageUrl,
    imagePreviews: uploadedImageUrls.length
      ? uploadedImageUrls
      : finalResult.imagePreviews,
  });
}

const usageAfterSuccessfulAnalysis = await incrementAnalysisUsage();
setUsageStatus(usageAfterSuccessfulAnalysis);

setSimilarImages(finalSimilarImages);
setResult(finalResult);
setSelectedArchiveItemId(null);
setAppScreen("result");
pushAppHistoryState("result");
setTranslatedResults({
  [locale]: finalResult,
});

const archiveAssets =
  archiveImagePreviews.length && archiveOriginalImages.length
    ? {
        imagePreviews: archiveImagePreviews,
        originalImages: archiveOriginalImages,
      }
    : await createArchiveImageAssets(selectedFiles);
const archivePreviews = archiveAssets.imagePreviews.length
  ? archiveAssets.imagePreviews
  : await createArchiveImagePreviews(selectedFiles);
const archiveOriginals = archiveAssets.originalImages.length
  ? archiveAssets.originalImages
  : archivePreviews;
const imagePreview = archivePreviews[0] || undefined;
const originalImage = archiveOriginals[0] || imagePreview || uploadedImageUrl || undefined;
const stableImagePreview = imagePreview || uploadedImageUrl || undefined;
const stableImagePreviews = archivePreviews.length
  ? archivePreviews
  : stableImagePreview
    ? [stableImagePreview]
    : [];
const stableOriginalImages = archiveOriginals.length
  ? archiveOriginals
  : originalImage
    ? [originalImage]
    : stableImagePreviews;
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
  locale,
  imagePreview: stableImagePreview,
  imagePreviews: stableImagePreviews,
  originalImage,
  originalImages: stableOriginalImages,
  createdAt: new Date().toISOString(),
  result: {
    ...finalResult,
    userNote: prompt || "",
    cloudinaryPublicId: cloudinaryPublicId || undefined,
    uploadedImageUrl: uploadedImageUrl || finalResult.uploadedImageUrl,
    uploadedImageUrls,
    sourceImageUrl: uploadedImageUrl || finalResult.sourceImageUrl,
    imageUrl: uploadedImageUrl || finalResult.imageUrl,
    imagePreview: stableImagePreview,
    imagePreviews: stableImagePreviews,
    originalImage,
    originalImages: stableOriginalImages,
    similarImages: finalSimilarImages,
    similarItems: finalSimilarImages,
    visualMatches: finalSimilarImages,
  },
  similarImages: finalSimilarImages,
  cloudinaryPublicId: cloudinaryPublicId || undefined,
};

console.info("[KISHIB archive] Prepared history item before save", {
  key: ARCHIVE_STORAGE_KEY,
  id: archiveItem.id,
  title: archiveItem.title,
  hasPrompt: Boolean(archiveItem.prompt),
  hasResult: Boolean(archiveItem.result),
  hasImagePreview: Boolean(archiveItem.imagePreview),
  hasOriginalImage: Boolean(archiveItem.originalImage),
  similarImagesCount: finalSimilarImages.length,
});

await saveHistory(archiveItem);
setSelectedArchiveItemId(archiveItem.id);
await saveEvaluationToSupabase({
  archiveItem,
  locale,
  imageUrl: uploadedImageUrl || finalResult.imageUrl,
  cloudinaryPublicId,
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

  const shareUrl = getUsefulShareUrl();
  const shareText = buildShareSummary(result, shareUrl);
  const shareTitle = locale === "en" ? "KISHIB Report" : "تقرير KISHIB";
  const shareImageMessage =
    locale === "en"
      ? "Report images were downloaded. You can share them from your downloads."
      : "تم تنزيل صور التقرير، يمكنك مشاركتها من التنزيلات.";
  const fallbackMessage =
    locale === "en"
      ? "Report summary copied. You can paste and share it."
      : "تم نسخ ملخص التقرير، يمكنك لصقه ومشاركته.";
  const platform = Capacitor.getPlatform();

  console.log("[KISHIB share] platform:", {
    platform,
    isNative: Capacitor.isNativePlatform(),
    hasPublicUrl: Boolean(shareUrl),
  });

  try {
    const shareImages = await createShareImage({
      result,
      imagePreview:
        imagePreviews[0] ||
        result.imagePreview ||
        result.imageUrl ||
        result.uploadedImageUrl ||
        null,
      labels: t,
      locale,
    });
    const shareData = {
      title: shareTitle,
      text: shareTitle,
      files: shareImages,
    } as ShareData;

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      (!navigator.canShare || navigator.canShare(shareData))
    ) {
      await navigator.share(shareData);
      return;
    }

    shareImages.forEach(downloadFile);
    alert(shareImageMessage);
    return;
  } catch (err) {
    if (isCanceledShare(err)) return;
    console.error("[KISHIB image share failed]", err);
  }

  try {
    if (isAndroidNativeApp()) {
      await Share.share({
        title: shareTitle,
        text: shareText,
        ...(shareUrl ? { url: shareUrl } : {}),
        dialogTitle: locale === "en" ? "Share KISHIB Report" : "مشاركة تقرير KISHIB",
      });
      return;
    }

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      const shareData: ShareData = {
        title: shareTitle,
        text: shareText,
      };

      if (shareUrl) {
        shareData.url = shareUrl;
      }

      await navigator.share(shareData);
      return;
    }
  } catch (err) {
    if (isCanceledShare(err)) return;
    console.error("[KISHIB share failed]", err);
  }

  try {
    await copyTextToClipboard(shareText);
    alert(fallbackMessage);
  } catch (err) {
    console.error("Failed to share or copy report summary:", err);
    alert(locale === "en" ? "Sharing is not available right now." : "تعذرت المشاركة والنسخ الآن.");
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
  handleTakePhoto,
  removeImage,
  removeImageAt,
  handleAnalyze,
  handleShare,
  similarImages,
  isLoadingSimilar,
  usageStatus,
  isUsageLoading,
  refreshUsageStatus,
  isSubscriptionModalOpen,
  openSubscriptionModal,
  closeSubscriptionModal,
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
