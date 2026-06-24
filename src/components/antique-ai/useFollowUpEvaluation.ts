"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AnalysisResult,
  AntiqueChatMessage,
  AntiqueChatSession,
  Locale,
} from "./types";

const MAX_CHAT_TURNS = 10;
const CHAT_STORAGE_PREFIX = "kishib:antique-chat:";
const CHAT_NOTE_MAX_CHARS = 1600;
const CHAT_HARD_NOTE_MAX_CHARS = 6000;
const MAX_PENDING_IMAGES = 4;

type UseFollowUpEvaluationArgs = {
  result: AnalysisResult | null;
  itemId: string | null;
  locale: Locale;
  setResult: React.Dispatch<React.SetStateAction<AnalysisResult | null>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedResults: React.Dispatch<
    React.SetStateAction<Partial<Record<Locale, AnalysisResult>>>
  >;
  setImagePreviews: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  normalizeResult: (value: Partial<AnalysisResult>) => AnalysisResult;
};

function storageKey(itemId: string) {
  return `${CHAT_STORAGE_PREFIX}${itemId}`;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getMessage(
  locale: Locale,
  key: "empty" | "failed" | "tooLong" | "limit",
) {
  const messages: Record<
    "empty" | "failed" | "tooLong" | "limit",
    Partial<Record<Locale, string>> & { ar: string }
  > = {
    empty: {
      ar: "أضف رسالة أو صورة واحدة على الأقل.",
      en: "Add a message or at least one image.",
    },
    failed: {
      ar: "تعذر تحديث جلسة التقييم.",
      en: "Failed to update the evaluation session.",
    },
    tooLong: {
      ar: "الرسالة طويلة جدًا. اختصرها إلى أهم معلومة ثم حاول مرة أخرى.",
      en: "The message is too long. Please shorten it to the key detail and try again.",
    },
    limit: {
      ar: "وصلت إلى 10 رسائل لهذه القطعة. يمكنك طلب الخلاصة النهائية الآن.",
      en: "You reached 10 messages for this item. You can request the final summary now.",
    },
  };

  return messages[key][locale] || messages[key].ar;
}

function trimText(value: string, maxLength: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= maxLength ? clean : clean.slice(0, maxLength).trim();
}

function safeParseSession(
  value: string | null,
  itemId: string,
  normalizeResult: (value: Partial<AnalysisResult>) => AnalysisResult,
): AntiqueChatSession | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as AntiqueChatSession;

    if (!parsed || parsed.itemId !== itemId || !Array.isArray(parsed.messages)) {
      return null;
    }

    return {
      ...parsed,
      originalAnalysis: normalizeResult(parsed.originalAnalysis),
      currentResult: normalizeResult(parsed.currentResult),
      messages: parsed.messages
        .filter((message) => message && typeof message.text === "string")
        .map((message) => ({
          id: message.id || createId(message.role || "message"),
          role: message.role === "assistant" ? "assistant" : "user",
          text: message.text,
          imageUrls: Array.isArray(message.imageUrls)
            ? message.imageUrls.filter((image): image is string => typeof image === "string")
            : [],
          createdAt: message.createdAt || new Date().toISOString(),
          isFinalSummary: Boolean(message.isFinalSummary),
        })),
      usedTurns:
        typeof parsed.usedTurns === "number"
          ? Math.min(MAX_CHAT_TURNS, Math.max(0, parsed.usedTurns))
          : parsed.messages.filter((message) => message.role === "user").length,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function saveSession(session: AntiqueChatSession) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey(session.itemId), JSON.stringify(session));
  } catch (error) {
    console.warn("[KISHIB chat] Unable to save chat session:", error);
  }
}

function getUploadedImageText(locale: Locale) {
  return locale === "en"
    ? "I uploaded additional images."
    : "رفعت صورة إضافية.";
}

function getFinalSummaryText(locale: Locale) {
  return locale === "en" ? "Give me the final summary." : "اعطني الخلاصة النهائية";
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

async function createChatImagePreview(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);

  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const ratio = image.width / image.height || 1;
      const maxSize = 900;
      const width = image.width > image.height ? maxSize : maxSize * ratio;
      const height = image.width > image.height ? maxSize / ratio : maxSize;
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
      resolve(canvas.toDataURL("image/jpeg", 0.68));
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

export function buildCompactFollowUpContext(result: AnalysisResult) {
  return {
    title: trimText(result.title || "", 180),
    category: trimText(result.itemType || result.lookup || "", 160),
    material: trimText(result.material || "", 180),
    agePeriod: trimText(result.timePeriod || result.period || "", 180),
    origin: trimText(result.origin || "", 180),
    estimatedPriceRange: trimText(result.estimatedValue || result.priceRange || "", 200),
    shortDescription: trimText(result.description || result.history || "", 900),
    historicalReading: trimText(result.historicalReading || "", 700),
    safeInitialChecks: Array.isArray(result.safeInitialChecks) ? result.safeInitialChecks.slice(0, 7) : [],
    carePreservationTips: Array.isArray(result.carePreservationTips) ? result.carePreservationTips.slice(0, 6) : [],
    keyConditionNotes: trimText(result.condition || "", 800),
    authenticity: trimText(result.authenticity || "", 800),
    priceReasoning: trimText(result.priceReasoning || "", 800),
    confidence: result.confidence,
    confidenceNote: trimText(result.confidenceNote || "", 500),
    valueDrivers: Array.isArray(result.valueDrivers) ? result.valueDrivers.slice(0, 6) : [],
    valueReducers: Array.isArray(result.valueReducers) ? result.valueReducers.slice(0, 6) : [],
    neededPhotos: Array.isArray(result.neededPhotos) ? result.neededPhotos.slice(0, 6) : [],
  };
}

export function useFollowUpEvaluation({
  result,
  itemId,
  locale,
  setResult,
  setError,
  setTranslatedResults,
  setImagePreviews,
  setSelectedFiles,
  normalizeResult,
}: UseFollowUpEvaluationArgs) {
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpText, setFollowUpText] = useState("");
  const [followUpFiles, setFollowUpFiles] = useState<File[]>([]);
  const [followUpPreviews, setFollowUpPreviews] = useState<string[]>([]);
  const [isFollowUpAnalyzing, setIsFollowUpAnalyzing] = useState(false);
  const [isReadingFollowUpImage, setIsReadingFollowUpImage] = useState(false);
  const [chatSession, setChatSession] = useState<AntiqueChatSession | null>(null);

  const followUpUsed = (chatSession?.usedTurns || 0) >= MAX_CHAT_TURNS;
  const remainingTurns = Math.max(0, MAX_CHAT_TURNS - (chatSession?.usedTurns || 0));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!result || !itemId || typeof window === "undefined") {
        setChatSession(null);
        return;
      }

      const saved = safeParseSession(
        window.localStorage.getItem(storageKey(itemId)),
        itemId,
        normalizeResult,
      );
      const nextSession =
        saved ||
        ({
          itemId,
          originalAnalysis: result,
          currentResult: result,
          messages: [],
          usedTurns: 0,
          updatedAt: new Date().toISOString(),
        } satisfies AntiqueChatSession);

      setChatSession(nextSession);

      if (saved?.currentResult) {
        setResult(saved.currentResult);
        setTranslatedResults({ [locale]: saved.currentResult });
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [itemId, locale, normalizeResult, result, setResult, setTranslatedResults]);

  const previousChatMessages = useMemo(
    () =>
      (chatSession?.messages || []).map((message) => ({
        role: message.role,
        text: message.text,
        imageCount: message.imageUrls?.length || 0,
        isFinalSummary: Boolean(message.isFinalSummary),
      })),
    [chatSession],
  );

  function handleAddInfo() {
    if (!result) return;

    setError("");
    setFollowUpOpen(true);
  }

  function handleFollowUpImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files || [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, MAX_PENDING_IMAGES);

    if (files.length === 0) return;

    const newPreviews = files.map((file) => URL.createObjectURL(file));

    setFollowUpFiles((current) =>
      [...current, ...files].slice(0, MAX_PENDING_IMAGES),
    );
    setFollowUpPreviews((current) =>
      [...current, ...newPreviews].slice(0, MAX_PENDING_IMAGES),
    );

    event.target.value = "";
  }

  function removeFollowUpImageAt(index: number) {
    setFollowUpFiles((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );

    setFollowUpPreviews((current) => {
      const removed = current[index];

      if (removed) URL.revokeObjectURL(removed);

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function clearPendingInput() {
    followUpPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setFollowUpText("");
    setFollowUpFiles([]);
    setFollowUpPreviews([]);
  }

  function resetFollowUp() {
    clearPendingInput();
    setFollowUpOpen(false);
    setIsFollowUpAnalyzing(false);
    setIsReadingFollowUpImage(false);
    setChatSession(null);
  }

  async function submitChatMessage(options: { finalSummary?: boolean; text?: string } = {}) {
    if (!result || !itemId || !chatSession) return;

    const isFinalSummary = Boolean(options.finalSummary);
    const messageText = trimText(options.text ?? followUpText, CHAT_NOTE_MAX_CHARS);

    if (!isFinalSummary && followUpUsed) {
      setError(getMessage(locale, "limit"));
      return;
    }

    if (!isFinalSummary && !messageText && followUpFiles.length === 0) {
      setError(getMessage(locale, "empty"));
      return;
    }

    if ((options.text ?? followUpText).trim().length > CHAT_HARD_NOTE_MAX_CHARS) {
      setError(getMessage(locale, "tooLong"));
      return;
    }

    try {
      setIsFollowUpAnalyzing(true);
      setIsReadingFollowUpImage(followUpFiles.length > 0);
      setError("");

      const pendingFiles = followUpFiles;
      const pendingPreviews = followUpPreviews;
      const userMessage: AntiqueChatMessage = {
        id: createId("user"),
        role: "user",
        text: isFinalSummary
          ? locale === "en"
            ? "Give me the final summary."
            : "اعطني الخلاصة النهائية"
          : messageText || (locale === "en" ? "I uploaded additional images." : "رفعت صورًا إضافية."),
        imageUrls: pendingPreviews,
        createdAt: new Date().toISOString(),
        isFinalSummary,
      };
      userMessage.text = isFinalSummary
        ? locale === "en"
          ? "Give me the final summary."
          : "اعطني الخلاصة النهائية"
        : messageText || getUploadedImageText(locale);
      userMessage.text = isFinalSummary
        ? getFinalSummaryText(locale)
        : messageText || getUploadedImageText(locale);
      const optimisticSession: AntiqueChatSession = {
        ...chatSession,
        messages: [...chatSession.messages, userMessage],
        usedTurns: isFinalSummary
          ? chatSession.usedTurns
          : Math.min(MAX_CHAT_TURNS, chatSession.usedTurns + 1),
        updatedAt: new Date().toISOString(),
      };

      setChatSession(optimisticSession);
      setFollowUpText("");
      setFollowUpFiles([]);
      setFollowUpPreviews([]);

      const storedImages = await Promise.all(
        pendingFiles.map((file) => createChatImagePreview(file)),
      );
      const sentUserMessage: AntiqueChatMessage = {
        ...userMessage,
        imageUrls: storedImages,
      };

      const formData = new FormData();

      formData.append("originalAnalysis", JSON.stringify(chatSession.originalAnalysis));
      formData.append("currentResult", JSON.stringify(result));
      formData.append("previousChatMessages", JSON.stringify(previousChatMessages));
      formData.append("newUserMessage", sentUserMessage.text);
      formData.append("newUploadedImages", JSON.stringify(storedImages));
      formData.append("locale", locale);
      formData.append("remainingTurns", String(isFinalSummary ? remainingTurns : Math.max(0, remainingTurns - 1)));
      formData.append("isFinalSummary", String(isFinalSummary));

      pendingFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/antique-chat", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || getMessage(locale, "failed"));
      }

      const updatedResult = normalizeResult(data.updatedResult || result);
      const assistantMessage: AntiqueChatMessage = {
        id: createId("assistant"),
        role: "assistant",
        text:
          typeof data.assistantMessage === "string" && data.assistantMessage.trim()
            ? data.assistantMessage.trim()
            : updatedResult.followUpQuestion || getMessage(locale, "failed"),
        createdAt: new Date().toISOString(),
        isFinalSummary,
      };
      const nextSession: AntiqueChatSession = {
        ...optimisticSession,
        currentResult: updatedResult,
        messages: [...chatSession.messages, sentUserMessage, assistantMessage],
        updatedAt: new Date().toISOString(),
      };

      setChatSession(nextSession);
      pendingPreviews.forEach((preview) => URL.revokeObjectURL(preview));
      saveSession(nextSession);
      setResult(updatedResult);
      setTranslatedResults({ [locale]: updatedResult });

      if (storedImages.length > 0) {
        setImagePreviews((current) => [...current, ...storedImages].slice(0, 10));
        setSelectedFiles((current) => [...current, ...pendingFiles].slice(0, 10));
      }

      setFollowUpOpen(true);
    } catch (error) {
      console.error("submitChatMessage error:", error);
      setError(error instanceof Error ? error.message : getMessage(locale, "failed"));
      setChatSession(chatSession);
    } finally {
      setIsFollowUpAnalyzing(false);
      setIsReadingFollowUpImage(false);
    }
  }

  return {
    followUpOpen,
    followUpUsed,
    followUpText,
    followUpFiles,
    followUpPreviews,
    isFollowUpAnalyzing,
    isReadingFollowUpImage,
    chatMessages: chatSession?.messages || [],
    chatUsedTurns: chatSession?.usedTurns || 0,
    chatMaxTurns: MAX_CHAT_TURNS,
    chatRemainingTurns: remainingTurns,
    setFollowUpOpen,
    setFollowUpText,
    handleAddInfo,
    handleFollowUpImageChange,
    removeFollowUpImageAt,
    handleFollowUpAnalyze: () => submitChatMessage(),
    handleFinalSummary: () => submitChatMessage({ finalSummary: true }),
    handleSuggestionClick: (text: string) => {
      setFollowUpOpen(true);
      setFollowUpText(text);
    },
    resetFollowUp,
  };
}
