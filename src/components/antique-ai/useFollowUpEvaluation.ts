"use client";

import { useState } from "react";
import type { AnalysisResult, Locale } from "./types";

const FOLLOW_UP_NOTE_MAX_CHARS = 1200;
const FOLLOW_UP_PAYLOAD_MAX_CHARS = 6000;
const FOLLOW_UP_HARD_NOTE_MAX_CHARS = 6000;

type UseFollowUpEvaluationArgs = {
  result: AnalysisResult | null;
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

function getMessage(locale: Locale, key: "used" | "empty" | "failed") {
  const messages: Record<
    "used" | "empty" | "failed",
    Partial<Record<Locale, string>> & { ar: string }
  > = {
    used: {
      ar: "يمكنك إضافة معلومات إضافية مرة واحدة فقط لهذا التقييم.",
      en: "You can add extra information only once for this evaluation.",
      fr: "Vous pouvez ajouter des informations supplémentaires une seule fois pour cette évaluation.",
      hi: "आप इस मूल्यांकन में अतिरिक्त जानकारी केवल एक बार जोड़ सकते हैं.",
      fa: "برای این ارزیابی فقط یک‌بار می‌توانید اطلاعات اضافی اضافه کنید.",
      tr: "Bu değerlendirmeye yalnızca bir kez ek bilgi ekleyebilirsiniz.",
      ru: "Вы можете добавить дополнительную информацию к этой оценке только один раз.",
      ku: "دەتوانیت تەنها جارێک زانیاری زیاتر زیاد بکەیت بۆ ئەم هەڵسەنگاندنە.",
    },
    empty: {
      ar: "أضف ملاحظة أو صورة إضافية واحدة على الأقل.",
      en: "Add a note or at least one extra image.",
      fr: "Ajoutez une note ou au moins une image supplémentaire.",
      hi: "एक नोट या कम से कम एक अतिरिक्त तस्वीर जोड़ें.",
      fa: "یک یادداشت یا حداقل یک تصویر اضافی اضافه کنید.",
      tr: "Bir not veya en az bir ek görsel ekleyin.",
      ru: "Добавьте заметку или хотя бы одно дополнительное изображение.",
      ku: "تکایە تێبینی یان لانیکەم وێنەیەکی زیادە زیاد بکە.",
    },
    failed: {
      ar: "فشل تحديث التقييم.",
      en: "Failed to update evaluation.",
      fr: "Échec de la mise à jour de l’évaluation.",
      hi: "मूल्यांकन अपडेट करने में विफल.",
      fa: "به‌روزرسانی ارزیابی ناموفق بود.",
      tr: "Değerlendirme güncellenemedi.",
      ru: "Не удалось обновить оценку.",
      ku: "نوێکردنەوەی هەڵسەنگاندن سەرکەوتوو نەبوو.",
    },
  };

  return messages[key][locale] || messages[key].ar;
}

function getTooLongMessage(locale: Locale) {
  if (locale === "en") {
    return "The added note or evaluation context is too long. Please shorten the note to the key detail and try again.";
  }

  return "\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629 \u0623\u0648 \u0633\u064a\u0627\u0642 \u0627\u0644\u062a\u0642\u064a\u064a\u0645 \u0637\u0648\u064a\u0644 \u062c\u062f\u064b\u0627. \u0627\u062e\u062a\u0635\u0631\u064a \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u0625\u0644\u0649 \u0623\u0647\u0645 \u062a\u0641\u0635\u064a\u0644 \u062b\u0645 \u062d\u0627\u0648\u0644\u064a \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.";
}

function trimText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";

  const clean = value.replace(/\s+/g, " ").trim();

  if (clean.length <= maxLength) return clean;

  return clean.slice(0, maxLength).trim();
}

function trimList(value: unknown, maxItems: number, maxItemLength: number) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => trimText(item, maxItemLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function buildCompactFollowUpContext(result: AnalysisResult) {
  return {
    title: trimText(result.title, 180),
    category: trimText(result.itemType || result.lookup, 120),
    material: trimText(result.material, 160),
    agePeriod: trimText(result.timePeriod || result.period, 160),
    origin: trimText(result.origin, 160),
    estimatedPriceRange: trimText(
      result.estimatedValue || result.priceRange,
      180,
    ),
    shortDescription: trimText(result.description || result.history, 700),
    keyConditionNotes: trimText(result.condition, 700),
    analysis: trimText(result.lookup || result.authenticity, 900),
    priceReasoning: trimText(result.priceReasoning, 700),
    valueDrivers: trimList(result.valueDrivers, 5, 180),
    valueReducers: trimList(result.valueReducers, 5, 180),
  };
}

function sanitizeFollowUpError(error: unknown, locale: Locale) {
  const message = error instanceof Error ? error.message : "";

  if (
    /request too large|tokens?|context length|platform\.openai|gpt-4|openai/i.test(
      message,
    )
  ) {
    return getTooLongMessage(locale);
  }

  return message || getMessage(locale, "failed");
}

export function useFollowUpEvaluation({
  result,
  locale,
  setResult,
  setError,
  setTranslatedResults,
  setImagePreviews,
  setSelectedFiles,
  normalizeResult,
}: UseFollowUpEvaluationArgs) {
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpUsed, setFollowUpUsed] = useState(false);
  const [followUpText, setFollowUpText] = useState("");
  const [followUpFiles, setFollowUpFiles] = useState<File[]>([]);
  const [followUpPreviews, setFollowUpPreviews] = useState<string[]>([]);
  const [isFollowUpAnalyzing, setIsFollowUpAnalyzing] = useState(false);

  function handleAddInfo() {
    if (!result) return;

    if (followUpUsed) {
      setError(getMessage(locale, "used"));
      return;
    }

    setError("");
    setFollowUpOpen(true);
  }

  function handleFollowUpImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    const allowedFiles = files
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 4);

    const newPreviews = allowedFiles.map((file) => URL.createObjectURL(file));

    setFollowUpFiles((current) => [...current, ...allowedFiles].slice(0, 4));
    setFollowUpPreviews((current) => [...current, ...newPreviews].slice(0, 4));

    event.target.value = "";
  }

  function removeFollowUpImageAt(index: number) {
    setFollowUpFiles((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );

    setFollowUpPreviews((current) => {
      const removed = current[index];

      if (removed) {
        URL.revokeObjectURL(removed);
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function resetFollowUp() {
    followUpPreviews.forEach((preview) => URL.revokeObjectURL(preview));

    setFollowUpOpen(false);
    setFollowUpUsed(false);
    setFollowUpText("");
    setFollowUpFiles([]);
    setFollowUpPreviews([]);
    setIsFollowUpAnalyzing(false);
  }

  async function handleFollowUpAnalyze() {
    if (!result) return;

    if (followUpUsed) {
      setFollowUpOpen(false);
      return;
    }

    if (!followUpText.trim() && followUpFiles.length === 0) {
      setError(getMessage(locale, "empty"));
      return;
    }

    if (followUpText.trim().length > FOLLOW_UP_HARD_NOTE_MAX_CHARS) {
      setError(getTooLongMessage(locale));
      return;
    }

    try {
      setIsFollowUpAnalyzing(true);
      setError("");

      const formData = new FormData();
      const compactContext = buildCompactFollowUpContext(result);
      let compactFollowUpText = trimText(followUpText, FOLLOW_UP_NOTE_MAX_CHARS);
      let textPayload = {
        locale,
        followUpClaim: compactFollowUpText,
        followUpContext: compactContext,
      };

      if (JSON.stringify(textPayload).length > FOLLOW_UP_PAYLOAD_MAX_CHARS) {
        compactFollowUpText = trimText(compactFollowUpText, 600);
        textPayload = {
          locale,
          followUpClaim: compactFollowUpText,
          followUpContext: compactContext,
        };
      }

      if (JSON.stringify(textPayload).length > FOLLOW_UP_PAYLOAD_MAX_CHARS) {
        setError(getTooLongMessage(locale));
        return;
      }

      formData.append("notes", compactFollowUpText || "Follow-up update.");
      formData.append("followUpClaim", compactFollowUpText);
      formData.append("followUpContext", JSON.stringify(compactContext));
      formData.append("locale", locale);
      formData.append("itemType", "");
      formData.append("material", "");
      formData.append("dimensions", "");
      formData.append("weight", "");
      formData.append("hasMark", "");

      followUpFiles.forEach((file) => {
        formData.append("image", file);
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || getMessage(locale, "failed"));
      }

      const updatedResult = normalizeResult(data);

      setResult(updatedResult);
      setTranslatedResults({
        [locale]: updatedResult,
      });

      setImagePreviews((current) =>
        [...current, ...followUpPreviews].slice(0, 8),
      );

      setSelectedFiles((current) => [...current, ...followUpFiles].slice(0, 8));

      setFollowUpUsed(true);
      setFollowUpOpen(false);
      setFollowUpText("");
      setFollowUpFiles([]);
      setFollowUpPreviews([]);
    } catch (error) {
      console.error("handleFollowUpAnalyze error:", error);

      setError(sanitizeFollowUpError(error, locale));
    } finally {
      setIsFollowUpAnalyzing(false);
    }
  }

  return {
    followUpOpen,
    followUpUsed,
    followUpText,
    followUpFiles,
    followUpPreviews,
    isFollowUpAnalyzing,
    setFollowUpOpen,
    setFollowUpText,
    handleAddInfo,
    handleFollowUpImageChange,
    removeFollowUpImageAt,
    handleFollowUpAnalyze,
    resetFollowUp,
  };
}
