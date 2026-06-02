"use client";

import { Camera, Send, Sparkles, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { useState } from "react";
import GemstoneFields, {
  buildGemstoneContext,
  emptyGemstoneFormData,
} from "./GemstoneFields";

type ThemeMode = "dark" | "light";
type AppLocale = "ar" | "en" | "ku" | "fr" | "hi" | "fa" | "tr" | "ru";

type Props = {
  theme: ThemeMode;
  locale?: string;
  labels: {
    title: string;
    hint: string;
    placeholder: string;
    upload: string;
    camera: string;
    send: string;
    analyzing: string;
    imageReady: string;
  };
  prompt: string;
  setPrompt: (value: string) => void;
  selectedFiles?: File[];
  imagePreviews?: string[];
  selectedFile?: File | null;
  imagePreview?: string | null;
  error: string;
  handleImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  removeImage: () => void;
  removeImageAt?: (index: number) => void;
  handleAnalyze: () => void;
  isAnalyzing: boolean;
};

function normalizeLocale(locale?: string): AppLocale {
  if (
    locale === "ar" ||
    locale === "en" ||
    locale === "ku" ||
    locale === "fr" ||
    locale === "hi" ||
    locale === "fa" ||
    locale === "tr" ||
    locale === "ru"
  ) {
    return locale;
  }

  return "ar";
}

function isRtl(locale: AppLocale) {
  return locale === "ar" || locale === "fa" || locale === "ku";
}

function copy(locale: AppLocale) {
  const text = {
    ar: {
      uploadBox: "ارفع أو التقط صورة",
      optional: "ملاحظة اختيارية عن القطعة...",
      start: "بدء التحليل",
      clear: "مسح الكل",
      main: "الرئيسية",
      ready: "صورة جاهزة للتحليل",
    },
    en: {
      uploadBox: "Upload or take a photo",
      optional: "Optional note about the item...",
      start: "Start analysis",
      clear: "Clear all",
      main: "Main",
      ready: "Photo ready for analysis",
    },
    fr: {
      uploadBox: "Ajouter ou prendre une photo",
      optional: "Note facultative sur l'objet...",
      start: "Lancer l'analyse",
      clear: "Effacer",
      main: "Principale",
      ready: "Image prête pour l'analyse",
    },
    hi: {
      uploadBox: "फ़ोटो अपलोड करें या लें",
      optional: "वस्तु के बारे में वैकल्पिक नोट...",
      start: "विश्लेषण शुरू करें",
      clear: "सब हटाएँ",
      main: "मुख्य",
      ready: "फ़ोटो विश्लेषण के लिए तैयार",
    },
    fa: {
      uploadBox: "عکس بارگذاری کنید یا بگیرید",
      optional: "یادداشت اختیاری درباره قطعه...",
      start: "شروع تحلیل",
      clear: "حذف همه",
      main: "اصلی",
      ready: "تصویر آماده تحلیل است",
    },
    tr: {
      uploadBox: "Fotoğraf yükle veya çek",
      optional: "Parça hakkında isteğe bağlı not...",
      start: "Analizi başlat",
      clear: "Tümünü temizle",
      main: "Ana",
      ready: "Fotoğraf analiz için hazır",
    },
    ru: {
      uploadBox: "Загрузите или сделайте фото",
      optional: "Необязательная заметка о предмете...",
      start: "Начать анализ",
      clear: "Очистить",
      main: "Главное",
      ready: "Фото готово к анализу",
    },
    ku: {
      uploadBox: "وێنە باربکە یان بگرە",
      optional: "تێبینی هەڵبژاردە لەسەر پارچەکە...",
      start: "دەستپێکردنی شیکردنەوە",
      clear: "سڕینەوەی هەموو",
      main: "سەرەکی",
      ready: "وێنە ئامادەیە بۆ شیکردنەوە",
    },
  } satisfies Record<AppLocale, Record<string, string>>;

  return text[locale];
}

export default function EvaluationComposer({
  theme,
  locale = "ar",
  labels,
  prompt,
  setPrompt,
  selectedFiles = [],
  imagePreviews = [],
  selectedFile = null,
  imagePreview = null,
  error,
  handleImageChange,
  removeImage,
  removeImageAt,
  handleAnalyze,
  isAnalyzing,
}: Props) {
  const safeLocale = normalizeLocale(locale);
  const isLight = theme === "light";
  const dir = isRtl(safeLocale) ? "rtl" : "ltr";
  const t = copy(safeLocale);
  const [gemstoneData, setGemstoneData] = useState(emptyGemstoneFormData);

  const previews =
    imagePreviews.length > 0 ? imagePreviews : imagePreview ? [imagePreview] : [];
  const files =
    selectedFiles.length > 0 ? selectedFiles : selectedFile ? [selectedFile] : [];
  const canAnalyze = Boolean(prompt.trim() || previews.length > 0);

  function handleRemoveAt(index: number) {
    if (removeImageAt) {
      removeImageAt(index);
      return;
    }

    removeImage();
  }

  function handleSmartAnalyze() {
    const gemstoneContext = buildGemstoneContext(gemstoneData);

    if (gemstoneContext) {
      const mergedPrompt = [
        prompt.trim(),
        "IMPORTANT USER-PROVIDED GEMSTONE / JEWELRY DETAILS:",
        gemstoneContext,
      ]
        .filter(Boolean)
        .join("\n\n");

      setPrompt(mergedPrompt);
      window.setTimeout(handleAnalyze, 60);
      return;
    }

    handleAnalyze();
  }

  return (
    <section className="w-full" dir={dir}>
      {error && (
        <div className="mb-4 rounded-[14px] border border-[#8b3a2b]/30 bg-[#d9b59e]/70 px-4 py-3 text-sm text-[#6d241d]">
          {error}
        </div>
      )}

      <div
        className={[
          "rounded-[22px] border p-3.5 shadow-[0_16px_38px_rgba(62,39,22,0.12)] backdrop-blur-2xl",
          isLight
            ? "border-[#d2b98f] bg-[#fff4e2]/90 text-[#241913]"
            : "border-[rgba(34,211,238,0.18)] bg-[#07111F]/88 text-[#F8FAFC]",
        ].join(" ")}
      >
        <label className="group relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-[#d2b98f] bg-[#fff4e2]/72 px-5 py-5 text-center transition hover:border-[#b88a3d] hover:bg-[#f8edda]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(184,138,61,0.15),transparent_52%)] opacity-80" />
          <div className="relative grid h-14 w-14 place-items-center rounded-[16px] bg-[#e8d1ad] text-[#8b3a2b] ring-1 ring-[#b88a3d]/25">
            <Camera className="h-7 w-7" />
          </div>
          <p className="relative mt-3 text-base font-semibold text-[#241913]">
            {t.uploadBox}
          </p>
          {previews.length > 0 ? (
            <p className="relative mt-1 text-xs text-[#735f4b]">{t.ready}</p>
          ) : null}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        {previews.length > 0 && (
          <div className="mt-3 rounded-[18px] border border-[#d2b98f] bg-[#efe3cf]/70 p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs text-[#735f4b]">
                {previews.length} {labels.imageReady}
              </p>
              <button
                type="button"
                onClick={removeImage}
                className="rounded-[10px] px-3 py-1 text-xs text-[#735f4b] transition hover:bg-[#d9b59e]/55 hover:text-[#6d241d]"
              >
                {t.clear}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {previews.map((preview, index) => (
                <div
                  key={`${preview}-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-[14px] border border-[#d2b98f] bg-[#d9b59e]"
                >
                  <img
                    src={preview}
                    alt={files[index]?.name || labels.imageReady}
                    className="h-full w-full object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-1.5 right-1.5 rounded-[8px] bg-[#241913]/70 px-2 py-0.5 text-[10px] text-[#fff4e2]">
                      {t.main}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAt(index)}
                    className="absolute left-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-[9px] bg-[#241913]/70 text-[#fff4e2] backdrop-blur-md transition hover:bg-[#6d241d]"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <textarea
          dir={dir}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={2}
          aria-label={labels.placeholder}
          placeholder={t.optional}
          className={[
            "mt-3 min-h-[68px] w-full resize-none rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/78 px-4 py-3 text-sm leading-6 text-[#241913] outline-none transition placeholder:text-[#8c765e] focus:border-[#b88a3d] focus:ring-2 focus:ring-[#b88a3d]/18",
            dir === "rtl" ? "text-right" : "text-left",
          ].join(" ")}
        />

        <div className="hidden">
          <GemstoneFields
            value={gemstoneData}
            onChange={setGemstoneData}
            locale={safeLocale}
          />
        </div>

        <button
          type="button"
          onClick={handleSmartAnalyze}
          disabled={isAnalyzing || !canAnalyze}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#b88a3d] px-5 text-sm font-semibold text-[#fff4e2] shadow-[0_12px_28px_rgba(62,39,22,0.14)] transition hover:bg-[#986f2e] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isAnalyzing ? (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" />
              {labels.analyzing}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {t.start}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
