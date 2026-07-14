"use client";
import {
  Camera,
  CameraResultType,
  CameraSource,
} from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useFollowUpEvaluation } from "./useFollowUpEvaluation";
import {
  EVALUATION_ARCHIVE_PAGE_SIZE,
  deleteEvaluationFromSupabase,
  getCurrentEvaluationUserId,
  loadEvaluationArchivePageFromSupabase,
  mergeEvaluationArchiveItems,
  saveEvaluationToSupabase,
} from "@/lib/evaluationsSupabase";
import {
  canUserAnalyze,
  DEFAULT_USAGE_LIMIT_STATUS,
  incrementAnalysisUsage,
  type UsageLimitStatus,
} from "@/lib/usageLimitsSupabase";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { compressImageForUpload } from "@/lib/compressImageForUpload";
import { SUPPORTED_LOCALES } from "@/i18n/common";

import {
  addArchiveItemWithStatus,
  ARCHIVE_STORAGE_EVENT,
  ARCHIVE_STORAGE_KEY,
  clearArchiveItems,
  clearLegacyArchiveStorageAfterMigration,
  createArchiveImageAssets,
  createArchiveImagePreviews,
  deleteArchiveItem,
  fileToDataUrl,
  hasClaimedLegacyArchiveMigration,
  hasMigratedLegacyArchive,
  loadArchiveItemsWithImages,
  loadLegacyArchiveItemsForMigration,
  markLegacyArchiveMigrated,
  markLegacyArchiveMigrationClaimed,
  saveArchiveItems,
  type ArchiveItem,
} from "./archiveStore";
import { content, normalizeResult } from "./antiqueContent";
import { normalizeEvaluationImages } from "./evaluationImages";
import type {
  AnalysisResult,
  Locale,
  ThemeMode,
  SimilarImageResult,
  HouseOfAntiquesContext,
  HouseOfAntiquesMatch,
} from "./types";
const MAX_IMAGES = 6;
const OPTIONAL_NOTE_MAX_LENGTH = 200;
const USER_LOCALE_STORAGE_KEY = "antiques-lens:locale";

function logDevelopmentTiming(
  label: string,
  startedAt: number,
  details?: Record<string, unknown>,
) {
  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[KISHIB TIMING] ${label}: ${Math.round(performance.now() - startedAt)}ms`,
      details || {},
    );
  }
}

type AppScreen = "home" | "analysis" | "result" | "archive-result" | "follow-up";

type AnalysisStage =
  | "uploadingImages"
  | "analyzingItem"
  | "searchingSimilar"
  | "preparingResult"
  | "analysisInProgress";

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

function getUsageMessage(locale: Locale, key: "auth" | "limit" | "checkFailed") {
  const messages: Record<Locale, Record<"auth" | "limit" | "checkFailed", string>> = {
    ar: {
      auth: "يرجى تسجيل الدخول أولًا لبدء التقييم.",
      checkFailed: "تعذر التحقق من محاولاتك المجانية. حاول مرة أخرى.",
      limit: "انتهت محاولاتك المجانية. يرجى الاشتراك لمتابعة التحليل.",
    },
    en: {
      auth: "Please sign in first to start an evaluation.",
      checkFailed: "We could not verify your free usage limit. Please try again.",
      limit: "Your free evaluations are finished. Please subscribe to continue.",
    },
    ku: {
      auth: "تکایە سەرەتا بچۆ ژوورەوە بۆ دەستپێکردنی هەڵسەنگاندن.",
      checkFailed: "نەتوانرا سنووری بەکارهێنانی خۆڕایی پشتڕاست بکرێتەوە. دووبارە هەوڵبدە.",
      limit: "هەڵسەنگاندنە خۆڕاییەکانت تەواو بوون. بۆ بەردەوامبوون بەشداربە.",
    },
    fr: {
      auth: "Connectez-vous d’abord pour lancer une évaluation.",
      checkFailed: "Impossible de vérifier votre limite gratuite. Réessayez.",
      limit: "Vos évaluations gratuites sont terminées. Abonnez-vous pour continuer.",
    },
    hi: {
      auth: "मूल्यांकन शुरू करने के लिए पहले साइन इन करें.",
      checkFailed: "हम आपकी निःशुल्क सीमा सत्यापित नहीं कर सके. फिर प्रयास करें.",
      limit: "आपके निःशुल्क मूल्यांकन समाप्त हो गए हैं. जारी रखने के लिए सदस्यता लें.",
    },
    fa: {
      auth: "برای شروع ارزیابی ابتدا وارد شوید.",
      checkFailed: "امکان بررسی محدودیت رایگان شما نبود. دوباره تلاش کنید.",
      limit: "ارزیابی‌های رایگان شما تمام شده است. برای ادامه اشتراک تهیه کنید.",
    },
    tr: {
      auth: "Değerlendirmeye başlamak için önce giriş yapın.",
      checkFailed: "Ücretsiz kullanım sınırınız doğrulanamadı. Tekrar deneyin.",
      limit: "Ücretsiz değerlendirmeleriniz bitti. Devam etmek için abone olun.",
    },
    ru: {
      auth: "Сначала войдите, чтобы начать оценку.",
      checkFailed: "Не удалось проверить ваш бесплатный лимит. Попробуйте ещё раз.",
      limit: "Ваши бесплатные оценки закончились. Оформите подписку, чтобы продолжить.",
    },
    es: {
      auth: "Inicia sesión primero para comenzar una evaluación.",
      checkFailed: "No pudimos verificar tu límite gratuito. Inténtalo de nuevo.",
      limit: "Tus evaluaciones gratuitas se han terminado. Suscríbete para continuar.",
    },
  };

  return (messages[locale] || messages.en)[key];
}

function getArchiveErrorMessage(locale: Locale, key: "load" | "loadMore") {
  const messages: Record<Locale, Record<"load" | "loadMore", string>> = {
    ar: {
      load: "تعذر تحميل أرشيفك. حاول التحديث مرة أخرى.",
      loadMore: "تعذر تحميل المزيد من عناصر الأرشيف.",
    },
    en: {
      load: "Could not load your archive. Pull to refresh or try again.",
      loadMore: "Could not load more archive items.",
    },
    ku: {
      load: "نەتوانرا ئەرشیفەکەت بار بکرێت. دووبارە هەوڵبدە.",
      loadMore: "نەتوانرا بڕگەی زیاتر لە ئەرشیف بار بکرێت.",
    },
    fr: {
      load: "Impossible de charger votre archive. Réessayez.",
      loadMore: "Impossible de charger plus d’éléments d’archive.",
    },
    hi: {
      load: "आपका संग्रह लोड नहीं हो सका. फिर प्रयास करें.",
      loadMore: "संग्रह के और आइटम लोड नहीं हो सके.",
    },
    fa: {
      load: "آرشیو شما بارگذاری نشد. دوباره تلاش کنید.",
      loadMore: "بارگذاری موارد بیشتر آرشیو ممکن نشد.",
    },
    tr: {
      load: "Arşiviniz yüklenemedi. Tekrar deneyin.",
      loadMore: "Daha fazla arşiv öğesi yüklenemedi.",
    },
    ru: {
      load: "Не удалось загрузить ваш архив. Попробуйте ещё раз.",
      loadMore: "Не удалось загрузить больше элементов архива.",
    },
    es: {
      load: "No se pudo cargar tu archivo. Inténtalo de nuevo.",
      loadMore: "No se pudieron cargar más elementos del archivo.",
    },
  };

  return (messages[locale] || messages.en)[key];
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
  return items.filter((item) => {
    const blocked = isHouseOfAntiquesSimilarImage(item);

    if (blocked && process.env.NODE_ENV !== "production") {
      console.info("[KISHIB similar] excluded internal store image", {
        title: item.title,
        source: item.source,
        hasImageUrl: Boolean(item.imageUrl),
        hasLink: Boolean(item.link),
        reason: "house_of_antiques_source",
      });
    }

    return !blocked;
  });
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

function isAbortError(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") return true;
  if (!error || typeof error !== "object" || !("name" in error)) return false;

  return (error as { name?: unknown }).name === "AbortError";
}

function createAbortError() {
  if (typeof DOMException !== "undefined") {
    return new DOMException("Analysis cancelled", "AbortError");
  }

  const error = new Error("Analysis cancelled");
  error.name = "AbortError";
  return error;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

async function safePostJson(url: string, body: unknown, signal?: AbortSignal) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Optional requests can still fail gracefully without blocking analysis.
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("[KISHIB similar] request start", {
        url,
        hasBody: Boolean(body),
        hasAuth: Boolean(headers.Authorization),
      });
    }

    throwIfAborted(signal);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });

    let data: unknown = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (process.env.NODE_ENV !== "production") {
      const record =
        data && typeof data === "object" ? (data as Record<string, unknown>) : {};
      const items = Array.isArray(record.items) ? record.items : [];

      console.info("[KISHIB similar] response received", {
        url,
        status: response.status,
        ok: response.ok,
        itemsCount: items.length,
        rawCount: record.rawCount,
        error: typeof record.error === "string" ? record.error : undefined,
      });
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn("[KISHIB similar] optional request failed", {
        url,
        message: error instanceof Error ? error.message : String(error),
      });
    } else {
      console.warn(`[KISHIB] Optional request skipped: ${url}`);
    }

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
  const [locale, setLocale] = useState<Locale>("ar");
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
  const similarRequestKeysRef = useRef<Set<string>>(new Set());
  const evaluationTimingStartRef = useRef<number | null>(null);
  const activeAnalysisAbortRef = useRef<AbortController | null>(null);
  const activeAnalysisRequestIdRef = useRef(0);
  const analysisNoticeTimerRef = useRef<number | null>(null);
  const activeArchiveRequestIdRef = useRef<string | null>(null);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  
const [translatedResults, setTranslatedResults] = useState<
  Partial<Record<Locale, AnalysisResult>>
>({});

const [isTranslatingResult, setIsTranslatingResult] = useState(false);
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [isCancellingAnalysis, setIsCancellingAnalysis] = useState(false);
const [analysisNotice, setAnalysisNotice] = useState("");
const [analysisStage, setAnalysisStage] = useState<AnalysisStage>("analysisInProgress");
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
const [archiveUserId, setArchiveUserId] = useState<string | null>(null);
const [archivePage, setArchivePage] = useState(0);
const [archiveHasMore, setArchiveHasMore] = useState(false);
const [isArchiveLoading, setIsArchiveLoading] = useState(true);
const [isArchiveRefreshing, setIsArchiveRefreshing] = useState(false);
const [isArchiveLoadingMore, setIsArchiveLoadingMore] = useState(false);
const [archiveError, setArchiveError] = useState("");

const t = useMemo(() => content[locale], [locale]);

function showAnalysisNotice(message: string) {
  setAnalysisNotice(message);

  if (analysisNoticeTimerRef.current) {
    window.clearTimeout(analysisNoticeTimerRef.current);
  }

  analysisNoticeTimerRef.current = window.setTimeout(() => {
    setAnalysisNotice((current) => (current === message ? "" : current));
    analysisNoticeTimerRef.current = null;
  }, 2_400);
}

function cancelAnalysis() {
  if (!isAnalyzing && !activeAnalysisAbortRef.current) return;

  setIsCancellingAnalysis(true);
  setIsAnalyzing(false);
  activeAnalysisAbortRef.current?.abort();
  setError("");
  setResult(null);
  setSimilarImages([]);
  setIsLoadingSimilar(false);
  setAnalysisStage("analysisInProgress");
  setAppScreen("home");
  showAnalysisNotice(t.analysisCancelled);
}

useEffect(() => {
  return () => {
    activeAnalysisAbortRef.current?.abort();

    if (analysisNoticeTimerRef.current) {
      window.clearTimeout(analysisNoticeTimerRef.current);
    }
  };
}, []);

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

  useEffect(() => {
    goBackInsideAppRef.current = goBackInsideApp;
  });

  async function migrateLegacyArchiveForUser(userId: string) {
    if (hasMigratedLegacyArchive(userId)) return [];

    if (hasClaimedLegacyArchiveMigration()) {
      markLegacyArchiveMigrated(userId);
      return [];
    }

    const legacyItems = loadLegacyArchiveItemsForMigration();
    if (!legacyItems.length) {
      markLegacyArchiveMigrated(userId);
      return [];
    }

    const migratedResults = await Promise.allSettled(
      legacyItems.map((archiveItem) =>
        saveEvaluationToSupabase({
          archiveItem,
          locale: (archiveItem.locale as Locale) || locale,
          imageUrl:
            archiveItem.originalImage ||
            archiveItem.imagePreview ||
            archiveItem.result?.uploadedImageUrl ||
            archiveItem.result?.imageUrl,
          cloudinaryPublicId: archiveItem.cloudinaryPublicId,
        }),
      ),
    );
    const migratedCount = migratedResults.filter(
      (result) => result.status === "fulfilled" && result.value === true,
    ).length;

    if (migratedCount === legacyItems.length) {
      saveArchiveItems(legacyItems, userId);
      markLegacyArchiveMigrated(userId);
      markLegacyArchiveMigrationClaimed();
      clearLegacyArchiveStorageAfterMigration();
    }

    console.info("[KISHIB archive] Legacy archive migration checked", {
      userId,
      legacyCount: legacyItems.length,
      migratedCount,
    });

    return legacyItems;
  }

 async function refreshArchiveForCurrentUser({
  reset = true,
  silent = false,
}: { reset?: boolean; silent?: boolean } = {}) {
  const requestId = crypto.randomUUID();
  activeArchiveRequestIdRef.current = requestId;

  if (reset) {
    setHistory([]);
    setArchivePage(0);
    setArchiveHasMore(false);
  }

  setArchiveError("");

  if (!silent) {
    setIsArchiveLoading(true);
  } else {
    setIsArchiveRefreshing(true);
  }

  try {
    console.log("[ARCHIVE] 1 - Getting user");

    const userId = await getCurrentEvaluationUserId();

    console.log("[ARCHIVE] 2 - User loaded", userId);

    if (activeArchiveRequestIdRef.current !== requestId) return;

    setArchiveUserId(userId);

    if (!userId) {
      setHistory([]);
      setArchivePage(0);
      setArchiveHasMore(false);
      return;
    }

    console.log("[ARCHIVE] 3 - Starting migration");

    await migrateLegacyArchiveForUser(userId);

    console.log("[ARCHIVE] 4 - Migration completed");

    if (activeArchiveRequestIdRef.current !== requestId) return;

    console.log("[ARCHIVE] 5 - Loading Supabase archive");

    const firstPage = await loadEvaluationArchivePageFromSupabase({
      page: 0,
      pageSize: EVALUATION_ARCHIVE_PAGE_SIZE,
    });

    console.log("[ARCHIVE] 6 - Supabase loaded", firstPage);

    if (activeArchiveRequestIdRef.current !== requestId) return;

    console.log("[ARCHIVE] 7 - Loading local cache");

    const cachedItems = await loadArchiveItemsWithImages(userId);

    console.log("[ARCHIVE] 8 - Cache loaded", cachedItems.length);

    const archiveItems = mergeEvaluationArchiveItems(
      firstPage.items,
      cachedItems.filter((item) =>
        firstPage.items.some(
          (supabaseItem) => supabaseItem.id === item.id,
        ),
      ),
    );

    setHistory(archiveItems);
    setArchivePage(1);
    setArchiveHasMore(firstPage.hasMore);

    saveArchiveItems(archiveItems, userId, {
      notify: false,
    });

    console.log("[ARCHIVE] 9 - Archive completed", archiveItems.length);
  } catch (error) {
    if (activeArchiveRequestIdRef.current === requestId) {
      setArchiveError(getArchiveErrorMessage(locale, "load"));
      console.error("[ARCHIVE] FAILED", error);
    }
  } finally {
    if (activeArchiveRequestIdRef.current === requestId) {
      console.log("[ARCHIVE] 10 - Stopping loader");
setIsArchiveLoading(false);
      setIsArchiveRefreshing(false);
    }
  }
}
useEffect(() => {
  const timer = window.setTimeout(() => {
    const savedLocale = window.localStorage.getItem(
      USER_LOCALE_STORAGE_KEY,
    ) as Locale | null;

    if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
      setLocale(savedLocale);
    }

    void refreshArchiveForCurrentUser();
    void refreshUsageStatus();
  }, 0);

  return () => window.clearTimeout(timer);
}, []);
useEffect(() => {
  const supabase = getSupabaseBrowserClient();

  const { data } = supabase.auth.onAuthStateChange(() => {
    activeArchiveRequestIdRef.current = crypto.randomUUID();
    setArchiveUserId(null);
    setHistory([]);
    setArchivePage(0);
    setArchiveHasMore(false);
    setArchiveError("");

    void refreshArchiveForCurrentUser();
  });

  return () => data.subscription.unsubscribe();
}, []);

async function loadMoreArchiveItems() {
  if (!archiveUserId || isArchiveLoadingMore || !archiveHasMore) return;

  setIsArchiveLoadingMore(true);
  setArchiveError("");

  try {
    const page = archivePage;

    const nextPage = await loadEvaluationArchivePageFromSupabase({
      page,
      pageSize: EVALUATION_ARCHIVE_PAGE_SIZE,
    });

    if (nextPage.userId !== archiveUserId) return;

    setHistory((current) => {
      const merged = mergeEvaluationArchiveItems(current, nextPage.items);

      saveArchiveItems(merged, archiveUserId, {
        notify: false,
      });

      return merged;
    });

    setArchivePage(page + 1);
    setArchiveHasMore(nextPage.hasMore);
  } catch (error) {
    setArchiveError(getArchiveErrorMessage(locale, "loadMore"));
    console.error("[KISHIB archive] Load more failed", error);
  } finally {
    setIsArchiveLoadingMore(false);
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

return;}

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
      setError("الملفات لازم تكون صور.");
      return;
    }

    const compressionStartedAt = performance.now();
    evaluationTimingStartRef.current = compressionStartedAt;
    const compressedFiles = await Promise.all(
      imageFiles.map((file) => compressImageForUpload(file)),
    );
    logDevelopmentTiming("compressionBatch", compressionStartedAt, {
      imageCount: imageFiles.length,
      execution: imageFiles.length > 1 ? "parallel" : "single",
    });

    const mergedFiles = [...selectedFiles, ...compressedFiles].slice(0, MAX_IMAGES);

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
    const userId = archiveUserId || (await getCurrentEvaluationUserId());
    const archiveSaveResult = await addArchiveItemWithStatus(item, userId);
    const updatedArchive = mergeEvaluationArchiveItems(
      archiveSaveResult.items,
      history,
    );
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
    clearArchiveItems(archiveUserId);
  }

  function deleteHistoryItem(id: string) {
    deleteArchiveItem(id, archiveUserId);
    setHistory((current) => current.filter((item) => item.id !== id));
    void deleteEvaluationFromSupabase(id);

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

async function fetchPinterestSimilarImages(result: AnalysisResult, signal?: AbortSignal) {
  const query = buildPinterestSearchQuery(result);

  if (process.env.NODE_ENV !== "production") {
    console.info("[KISHIB similar] pinterest fallback query", {
      query,
      hasQuery: Boolean(query),
    });
  }

  if (!query) return [];

  try {
    const { ok, data } = await safePostJson("/api/pinterest-search", { query }, signal);
    const record =
      data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const rawItems = Array.isArray(record.items)
      ? (record.items as SimilarImageResult[])
      : [];
    const items = mergeSimilarImages([], rawItems);

    if (process.env.NODE_ENV !== "production") {
      console.info("[KISHIB similar] pinterest fallback result", {
        ok,
        rawCount: rawItems.length,
        visibleCount: items.length,
      });
    }

    return ok ? items : [];
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn("[KISHIB similar] pinterest fallback failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    }

    return [];
  }
}

async function fetchGoogleLensSimilarImages(
  imageUrls: string[],
  requestKey: string,
  signal?: AbortSignal,
) {
  const usableImageUrls = imageUrls.filter(Boolean).slice(0, 4);

  if (!usableImageUrls.length) return [];

  if (similarRequestKeysRef.current.has(requestKey)) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[KISHIB similar] google lens duplicate request skipped", {
        requestKey,
      });
    }

    return [];
  }

  similarRequestKeysRef.current.add(requestKey);

  if (process.env.NODE_ENV !== "production") {
    console.info("[KISHIB similar] google lens batch start", {
      requestKey,
      imageCount: imageUrls.length,
      searchedImages: usableImageUrls.length,
    });
  }

  const lensResults: SimilarImageResult[][] = [];

  for (const [imageIndex, imageUrl] of usableImageUrls.entries()) {
    throwIfAborted(signal);
    if (process.env.NODE_ENV !== "production") {
      console.info("[KISHIB similar] google lens image request", {
        imageIndex: imageIndex + 1,
        imageUrlHost: (() => {
          try {
            return new URL(imageUrl).host;
          } catch {
            return "invalid-url";
          }
        })(),
      });
    }

    const { ok, status, data: lensData } = await safePostJson("/api/google-lens", {
      imageUrl,
    }, signal);
    const lensRecord =
      lensData && typeof lensData === "object"
        ? (lensData as Record<string, unknown>)
        : {};
    const skippedLimit = lensRecord.skippedLimit === true;

    if (skippedLimit || status === 429) {
      if (process.env.NODE_ENV !== "production") {
        console.info("[KISHIB similar] google lens stopped", {
          reason: skippedLimit ? "limit" : "provider_429",
          status,
        });
      }

      break;
    }

    if (!ok || !Array.isArray(lensRecord.items)) {
      if (process.env.NODE_ENV !== "production") {
        console.info("[KISHIB similar] google lens image skipped", {
          imageIndex: imageIndex + 1,
          ok,
          status,
          hasItemsArray: Array.isArray(lensRecord.items),
        });
      }

      continue;
    }

    const externalItems = filterExternalSimilarImages(
      lensRecord.items as SimilarImageResult[],
    );

    if (process.env.NODE_ENV !== "production") {
      console.info("[KISHIB similar] google lens image results", {
        imageIndex: imageIndex + 1,
        rawCount: (lensRecord.items as SimilarImageResult[]).length,
        visibleCount: externalItems.length,
      });
    }

    lensResults.push(
      externalItems.map((item) => ({
        ...item,
        source: item.source
          ? `${item.source} · image ${imageIndex + 1}`
          : `Google Lens · image ${imageIndex + 1}`,
      })),
    );
  }

  const interleavedLensItems = Array.from({ length: 8 }).flatMap((_, rank) =>
    lensResults
      .map((itemsForImage) => itemsForImage[rank])
      .filter(Boolean) as SimilarImageResult[],
  );
  const items = mergeSimilarImages([], interleavedLensItems).slice(0, 24);

  if (process.env.NODE_ENV !== "production") {
    console.info("[KISHIB similar] google lens merged results", {
      visibleCount: items.length,
    });
  }

  return items;
}

async function handleAnalyze() {
  if (isCancellingAnalysis) return;

  const trimmedPrompt = prompt.trim();

  if (trimmedPrompt.length > OPTIONAL_NOTE_MAX_LENGTH) {
    setError("يجب ألا تتجاوز الملاحظة 200 حرف.");
    return;
  }

  if (!selectedFiles.length && !trimmedPrompt) {
    setError(t.emptyError);
    return;
  }

  const abortController = new AbortController();
  const signal = abortController.signal;
  const requestId = activeAnalysisRequestIdRef.current + 1;
  activeAnalysisRequestIdRef.current = requestId;
  activeAnalysisAbortRef.current?.abort();
  activeAnalysisAbortRef.current = abortController;

  // Enter the dedicated analysis screen before any upload, API request, or
  // usage check. This keeps the submitted files and prompt in state so an
  // error can return the user to the composer without losing their work.
  setIsAnalyzing(true);
  setIsCancellingAnalysis(false);
  setAppScreen("analysis");
  setError("");
  setAnalysisNotice("");
  setAnalysisStage(selectedFiles.length ? "uploadingImages" : "analyzingItem");
  setResult(null);
  setSimilarImages([]);
  setIsLoadingSimilar(false);

  let currentUsageStatus: UsageLimitStatus;

  try {
    currentUsageStatus = await refreshUsageStatus();
    throwIfAborted(signal);
  } catch (err) {
    if (isAbortError(err)) {
      if (activeAnalysisRequestIdRef.current === requestId) {
        setError("");
        setResult(null);
        setSimilarImages([]);
        setIsAnalyzing(false);
        setIsCancellingAnalysis(false);
        setIsLoadingSimilar(false);
        setAppScreen("home");
        activeAnalysisAbortRef.current = null;
      }
      return;
    }

    setError(
      err instanceof Error ? err.message : getUsageMessage(locale, "checkFailed"),
    );
    setIsAnalyzing(false);
    setIsCancellingAnalysis(false);
    setAppScreen("home");
    activeAnalysisAbortRef.current = null;
    return;
  }

  if (!currentUsageStatus.canAnalyze) {
    setIsAnalyzing(false);
    setAppScreen("home");

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

  throwIfAborted(signal);
  setAnalysisStage(selectedFiles.length ? "uploadingImages" : "analyzingItem");

  const analysisStartedAt = performance.now();
  const totalStartedAt = evaluationTimingStartRef.current ?? analysisStartedAt;

  try {
    const formData = new FormData();

    selectedFiles.slice(0, 6).forEach((file) => {
      formData.append("images", file);
    });

    if (trimmedPrompt) {
      formData.append("notes", trimmedPrompt);
    }
    formData.append("locale", locale);

    let uploadedImageUrl = "";
    let cloudinaryPublicId = "";
    const uploadedImageUrls: string[] = [];
    const cloudinaryPublicIds: string[] = [];
    let houseContext = "";
    let googleLensItems: SimilarImageResult[] = [];
    let houseStoreContext: HouseOfAntiquesContext | null = null;
    let cloudinaryDurationMs = 0;
    let initialHouseDurationMs = 0;
    const parallelEvaluationStartedAt = performance.now();
    const initialHouseRequestStartedAt = performance.now();
    const initialHouseRequest = safePostJson(
      "/api/house-comparables",
      { query: trimmedPrompt },
      signal,
    ).finally(() => {
      initialHouseDurationMs = performance.now() - initialHouseRequestStartedAt;
    });
    let earlyGoogleLensPromise: Promise<SimilarImageResult[]> | null = null;
    let earlyGoogleLensStartedAt: number | null = null;

    // 1) Upload all selected images to Cloudinary for archive/search context.
    if (selectedFiles.length) {
      const cloudinaryStartedAt = performance.now();
      const uploadResults = await Promise.all(
        selectedFiles.slice(0, 6).map(async (file) => {
          const uploadFormData = new FormData();
          uploadFormData.append("image", file);

          const uploadResponse = await fetch("/api/upload-image", {
            method: "POST",
            body: uploadFormData,
            signal,
          });

          const uploadData = await uploadResponse.json();
          throwIfAborted(signal);

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
      cloudinaryDurationMs = performance.now() - cloudinaryStartedAt;
      logDevelopmentTiming("cloudinaryUpload", cloudinaryStartedAt, {
        imageCount: selectedFiles.slice(0, 6).length,
        execution: selectedFiles.length > 1 ? "parallel" : "single",
      });

      if (uploadedImageUrls.length > 0) {
        const earlySimilarRequestKey = `cloudinary:${uploadedImageUrls.join("|")}`;
        earlyGoogleLensStartedAt = performance.now();
        earlyGoogleLensPromise = fetchGoogleLensSimilarImages(
          uploadedImageUrls,
          earlySimilarRequestKey,
          signal,
        );
      }
    }

    // 2) House of Antiques internal comparables
    try {
      const { ok: houseOk, data: houseRawData } = await initialHouseRequest;
      throwIfAborted(signal);
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
    } catch (error) {
      if (isAbortError(error)) throw error;
      console.warn("House of Antiques comparables skipped.");
    } finally {
      logDevelopmentTiming(
        "marketReferencesSupabaseInitial",
        initialHouseRequestStartedAt,
      );
      logDevelopmentTiming("parallelEvaluationGroup", parallelEvaluationStartedAt, {
        operations: ["cloudinaryUpload", "initialHouseComparables"],
        execution: "parallel",
      });
      if (process.env.NODE_ENV !== "production") {
        const sequentialBeforeOptimization =
          cloudinaryDurationMs + initialHouseDurationMs;
        const parallelDuration = performance.now() - parallelEvaluationStartedAt;
        console.info(
          `[KISHIB TIMING] sequentialBeforeOptimization: ${Math.round(sequentialBeforeOptimization)}ms`,
        );
        console.info(
          `[KISHIB TIMING] timeSavedEstimate: ${Math.max(0, Math.round(sequentialBeforeOptimization - parallelDuration))}ms`,
          { group: "cloudinaryUpload + initialHouseComparables" },
        );
      }
    }

    // 3) Build combined market context
    const imagePreparationStartedAt = performance.now();
    const combinedMarketContext = [
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
    logDevelopmentTiming("imageAndLinkPreparation", imagePreparationStartedAt);

    // 4) Analyze with OpenAI
    const aiPipelineStartedAt = performance.now();
    throwIfAborted(signal);

    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
      signal,
    });

    const data = await response.json();
    throwIfAborted(signal);
    logDevelopmentTiming("aiPipeline", aiPipelineStartedAt, {
      note: "Server logs split primaryAI, secondaryAI, DeepSeek, and merges",
    });

    if (!response.ok) {
      throw new Error(data?.error || "Failed to analyze request.");
    }

 const initialJsonStartedAt = performance.now();
 const analyzedResult = normalizeResult({
   ...data,
   houseOfAntiques: houseStoreContext?.found ? houseStoreContext : undefined,
 });
 logDevelopmentTiming("finalJsonProcessingInitial", initialJsonStartedAt);

 console.info("[KISHIB archive] Analysis completed", {
   title: analyzedResult.title,
   hasSelectedFiles: selectedFiles.length > 0,
   selectedFilesCount: selectedFiles.length,
 });

  const refinedMarketReferencesStartedAt = performance.now();
  try {
    const { ok: refinedHouseOk, data: refinedHouseRawData } = await safePostJson(
      "/api/house-comparables",
      {
        query: [
          trimmedPrompt,
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
      signal,
    );
    throwIfAborted(signal);
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
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.warn("Refined House of Antiques comparables skipped.");
  } finally {
    logDevelopmentTiming(
      "marketReferencesSupabaseRefined",
      refinedMarketReferencesStartedAt,
    );
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
      signal,
      body: JSON.stringify({
        locale,
        result: analyzedResult,
      }),
    });

    const translateData = await translateResponse.json();
    throwIfAborted(signal);

    if (translateResponse.ok) {
      finalResult = normalizeResult({
        ...(translateData.result || translateData),
        houseOfAntiques: houseStoreContext?.found ? houseStoreContext : undefined,
      });
    }
  } catch (translateError) {
    if (isAbortError(translateError)) throw translateError;
    console.error("Initial result translation failed:", translateError);
  }
}

setAnalysisStage("searchingSimilar");
const resultSimilarItems = getSimilarItems(finalResult);
const resultExternalSimilarImages = filterExternalSimilarImages(resultSimilarItems);
if (earlyGoogleLensPromise) {
  setIsLoadingSimilar(true);
  const googleLensStartedAt = earlyGoogleLensStartedAt ?? performance.now();

  try {
    googleLensItems = await earlyGoogleLensPromise;
    throwIfAborted(signal);

    if (googleLensItems.length > 0) {
      setSimilarImages(googleLensItems);
    }
  } finally {
    logDevelopmentTiming("googleLensSimilarImages", googleLensStartedAt, {
      imageCount: uploadedImageUrls.length,
      execution: "sequential provider requests",
      startedAfter: "cloudinaryUpload",
      overlappedWith: "OpenAI evaluation and refined market references",
    });
    setIsLoadingSimilar(false);
  }
}

const finalExternalSimilarImages = resultExternalSimilarImages.length
  ? googleLensItems.length
    ? googleLensItems
    : resultExternalSimilarImages
  : googleLensItems;
let finalSimilarImages = mergeSimilarImages(
  [],
  finalExternalSimilarImages,
);

if (finalSimilarImages.length === 0) {
  setIsLoadingSimilar(true);
  const pinterestStartedAt = performance.now();

  try {
    const fallbackSimilarImages = await fetchPinterestSimilarImages(finalResult, signal);
    throwIfAborted(signal);

    if (fallbackSimilarImages.length > 0) {
      finalSimilarImages = fallbackSimilarImages;
      setSimilarImages(fallbackSimilarImages);
    }
  } finally {
    logDevelopmentTiming("pinterestFallback", pinterestStartedAt);
    setIsLoadingSimilar(false);
  }
}

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
    imageUrls: uploadedImageUrls.length ? uploadedImageUrls : [uploadedImageUrl],
    uploadedImageUrls,
    uploadedImageUrl,
    sourceImageUrl: uploadedImageUrl,
    imageUrl: uploadedImageUrl,
    imagePreview: undefined,
    imagePreviews: undefined,
    originalImage: undefined,
    originalImages: undefined,
  });
}

const finalImageUrls = normalizeEvaluationImages({
  ...finalResult,
  imageUrls: uploadedImageUrls.length ? uploadedImageUrls : finalResult.imageUrls,
  uploadedImageUrls:
    uploadedImageUrls.length ? uploadedImageUrls : finalResult.uploadedImageUrls,
  imagePreview: uploadedImageUrls.length ? undefined : imagePreviews[0],
  imagePreviews: uploadedImageUrls.length ? undefined : imagePreviews,
});
const primaryFinalImageUrl =
  finalImageUrls[0] || uploadedImageUrl || finalResult.imageUrl || "";
const hasRemoteResultImages = finalImageUrls.some((src) =>
  /^https?:\/\//i.test(src),
);

if (finalImageUrls.length > 0) {
  finalResult = normalizeResult({
    ...finalResult,
    imageUrls: finalImageUrls,
    uploadedImageUrls:
      uploadedImageUrls.length > 0 ? uploadedImageUrls : finalResult.uploadedImageUrls,
    uploadedImageUrl: hasRemoteResultImages
      ? primaryFinalImageUrl
      : finalResult.uploadedImageUrl,
    sourceImageUrl: hasRemoteResultImages
      ? primaryFinalImageUrl
      : finalResult.sourceImageUrl,
    imageUrl: primaryFinalImageUrl,
    imagePreview: hasRemoteResultImages ? undefined : finalResult.imagePreview,
    imagePreviews: hasRemoteResultImages ? undefined : finalResult.imagePreviews,
    originalImage: hasRemoteResultImages ? undefined : finalResult.originalImage,
    originalImages: hasRemoteResultImages ? undefined : finalResult.originalImages,
  });
}

setAnalysisStage("preparingResult");
throwIfAborted(signal);
const usageAfterSuccessfulAnalysis = await incrementAnalysisUsage();
throwIfAborted(signal);
setUsageStatus(usageAfterSuccessfulAnalysis);

const finalJsonStartedAt = performance.now();
throwIfAborted(signal);
setSimilarImages(finalSimilarImages);
setResult(finalResult);
setSelectedArchiveItemId(null);
setAppScreen("result");
pushAppHistoryState("result");
setTranslatedResults({
  [locale]: finalResult,
});
logDevelopmentTiming("finalJsonProcessing", finalJsonStartedAt);
logDevelopmentTiming("totalUntilResultVisible", totalStartedAt, {
  includesUserWaitAfterCompression: totalStartedAt !== analysisStartedAt,
});

throwIfAborted(signal);
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
const archiveResultImageFields = hasRemoteResultImages
  ? {
      imageUrls: finalImageUrls,
      uploadedImageUrls:
        uploadedImageUrls.length > 0
          ? uploadedImageUrls
          : finalResult.uploadedImageUrls,
      uploadedImageUrl: primaryFinalImageUrl,
      sourceImageUrl: primaryFinalImageUrl,
      imageUrl: primaryFinalImageUrl,
      imagePreview: undefined,
      imagePreviews: undefined,
      originalImage: undefined,
      originalImages: undefined,
    }
  : {
      imageUrls: finalImageUrls,
      uploadedImageUrls: finalResult.uploadedImageUrls,
      uploadedImageUrl: finalResult.uploadedImageUrl,
      sourceImageUrl: finalResult.sourceImageUrl,
      imageUrl: finalResult.imageUrl,
      imagePreview: stableImagePreview,
      imagePreviews: stableImagePreviews,
      originalImage,
      originalImages: stableOriginalImages,
    };
const archiveItem: ArchiveItem = {
  id: crypto.randomUUID(),
  title:
    analyzedArchiveResult?.title ||
    analyzedArchiveResult?.itemName ||
    analyzedArchiveResult?.objectName ||
    "Untitled item",
  prompt: trimmedPrompt,
  locale,
  imagePreview: stableImagePreview,
  imagePreviews: stableImagePreviews,
  originalImage,
  originalImages: stableOriginalImages,
  createdAt: new Date().toISOString(),
  result: {
    ...finalResult,
    userNote: trimmedPrompt,
    cloudinaryPublicId: cloudinaryPublicId || undefined,
    ...archiveResultImageFields,
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

throwIfAborted(signal);
setSelectedArchiveItemId(archiveItem.id);
void (async () => {
  const backgroundSaveStartedAt = performance.now();
  const archiveSaveStartedAt = performance.now();
  const archiveSavePromise = saveHistory(archiveItem).finally(() => {
    logDevelopmentTiming("saveArchive", archiveSaveStartedAt);
  });
  const supabaseSaveStartedAt = performance.now();
  const supabaseSavePromise = saveEvaluationToSupabase({
    archiveItem,
    locale,
    imageUrl: uploadedImageUrl || finalResult.imageUrl,
    cloudinaryPublicId,
  }).finally(() => {
    logDevelopmentTiming("saveEvaluationSupabase", supabaseSaveStartedAt);
  });

  await Promise.allSettled([archiveSavePromise, supabaseSavePromise]);
  logDevelopmentTiming("backgroundSaveGroup", backgroundSaveStartedAt, {
    execution: "parallel",
    blocksResultDisplay: false,
  });
})();


  } catch (err) {
    if (isAbortError(err)) {
      if (activeAnalysisRequestIdRef.current === requestId) {
        setError("");
        setResult(null);
        setSimilarImages([]);
        setAppScreen("home");
      }
    } else if (activeAnalysisRequestIdRef.current === requestId) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setAppScreen("home");
    }
  } finally {
    if (activeAnalysisRequestIdRef.current === requestId) {
      setIsAnalyzing(false);
      setIsCancellingAnalysis(false);
      setIsLoadingSimilar(false);
      activeAnalysisAbortRef.current = null;
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
isCancellingAnalysis,
analysisNotice,
analysisStage,
isTranslatingResult,
error,
  currentScreen,
  historyOpen,
  setHistoryOpen,
  history,
  archiveUserId,
  archiveHasMore,
  isArchiveLoading,
  isArchiveRefreshing,
  isArchiveLoadingMore,
  archiveError,
  loadMoreArchiveItems,
  refreshArchive: () => refreshArchiveForCurrentUser({ silent: true }),
  changeLocale,
  resetEvaluation,
  handleImageChange,
  handleTakePhoto,
  removeImage,
  removeImageAt,
  handleAnalyze,
  cancelAnalysis,
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


