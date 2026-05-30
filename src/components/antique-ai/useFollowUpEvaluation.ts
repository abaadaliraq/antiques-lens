"use client";

import { useState } from "react";
import type { AnalysisResult, Locale } from "./types";

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

    try {
      setIsFollowUpAnalyzing(true);
      setError("");

      const formData = new FormData();

      const combinedNotes = `
Previous evaluation result:
${JSON.stringify(result)}

User added extra information:
${followUpText || "No extra text."}

Instruction:
Update the evaluation using the previous result plus the new images/information.
Do not restart from zero unless the new evidence clearly changes the identification.
Mention if the new photos increased or reduced confidence.
Keep the same JSON shape.
`;

      formData.append("notes", combinedNotes);
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

      setError(
        error instanceof Error ? error.message : getMessage(locale, "failed"),
      );
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
