"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import { content, HISTORY_KEY, normalizeResult } from "./antiqueContent";
import { createShareImage } from "./createShareImage";
import type { AnalysisResult, HistoryItem, Locale, ThemeMode } from "./types";

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

export function useAntiqueLens() {
  const [locale, setLocale] = useState<Locale>("ar");
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const [prompt, setPrompt] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [historyImagePreviews, setHistoryImagePreviews] = useState<string[]>(
    [],
  );

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

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

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    window.localStorage.setItem("antiques-lens:locale", nextLocale);
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

    setPrompt(item.prompt);
    setResult(normalizeResult(item.result));
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

  async function handleAnalyze() {
    if (!selectedFiles.length && !prompt.trim()) {
      setError(t.emptyError);
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      /*
        fallback للـ API القديم إذا بعده ينتظر image.
        لا تعتمدين عليه للأبد، لازم route التحليل يقرأ images كلها.
      */
      if (selectedFiles[0]) {
        formData.append("image", selectedFiles[0]);
      }

      formData.append("notes", prompt);
      formData.append("locale", locale);

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

  function handleAddInfo() {
    setResult(null);

    window.setTimeout(() => {
      const input = document.querySelector("input, textarea");
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }

  return {
    locale,
    theme,
    t,

    prompt,
    setPrompt,

    selectedFiles,
    imagePreviews,

    /*
      fallback للكومبوننتات القديمة.
      أي ملف بعده يستخدم selectedFile/imagePreview راح يشتغل على أول صورة.
    */
    selectedFile: selectedFiles[0] || null,
    imagePreview: imagePreviews[0] || null,

    result,
    isAnalyzing,
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
    handleAddInfo,

    openHistoryItem,
    clearHistory,
    deleteHistoryItem,
  };
}