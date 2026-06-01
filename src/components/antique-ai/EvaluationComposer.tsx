"use client";

import { Camera, ImagePlus, Send, Sparkles, X } from "lucide-react";
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
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div
        className={[
          "rounded-[28px] border p-4 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl",
          isLight
            ? "border-black/10 bg-white/90 text-black"
            : "border-[rgba(34,211,238,0.18)] bg-[#07111F]/88 text-[#F8FAFC]",
        ].join(" ")}
      >
        <label className="group relative flex min-h-[172px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-[rgba(34,211,238,0.22)] bg-black/45 px-5 py-6 text-center transition hover:border-[#22D3EE]/55 hover:bg-[#0B1220]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_52%)] opacity-80" />
          <div className="relative grid h-16 w-16 place-items-center rounded-3xl bg-[#2563EB]/18 text-[#22D3EE] ring-1 ring-[#22D3EE]/20">
            <Camera className="h-8 w-8" />
          </div>
          <p className="relative mt-4 text-lg font-semibold text-[#F8FAFC]">
            {t.uploadBox}
          </p>
          <p className="relative mt-1 text-sm text-[#94A3B8]">
            {previews.length > 0 ? t.ready : labels.imageReady}
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        <div className="mt-3 flex gap-2">
          <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-[#CBD5E1] transition hover:border-[#22D3EE]/35 hover:text-white">
            <ImagePlus className="h-4 w-4 text-[#22D3EE]" />
            {labels.upload}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-[#CBD5E1] transition hover:border-[#22D3EE]/35 hover:text-white">
            <Camera className="h-4 w-4 text-[#22D3EE]" />
            {labels.camera}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        {previews.length > 0 && (
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/25 p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs text-[#94A3B8]">
                {previews.length} {labels.imageReady}
              </p>
              <button
                type="button"
                onClick={removeImage}
                className="rounded-full px-3 py-1 text-xs text-[#94A3B8] transition hover:bg-white/10 hover:text-white"
              >
                {t.clear}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {previews.map((preview, index) => (
                <div
                  key={`${preview}-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black"
                >
                  <img
                    src={preview}
                    alt={files[index]?.name || labels.imageReady}
                    className="h-full w-full object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
                      {t.main}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAt(index)}
                    className="absolute left-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white backdrop-blur-md transition hover:bg-red-500"
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
            "mt-4 min-h-[76px] w-full resize-none rounded-3xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-[#F8FAFC] outline-none transition placeholder:text-[#64748B] focus:border-[#22D3EE]/45",
            dir === "rtl" ? "text-right" : "text-left",
          ].join(" ")}
        />

        <GemstoneFields
          value={gemstoneData}
          onChange={setGemstoneData}
          locale={safeLocale}
        />

        <button
          type="button"
          onClick={handleSmartAnalyze}
          disabled={isAnalyzing || !canAnalyze}
          className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-[#2563EB] to-[#22D3EE] px-5 text-sm font-semibold text-white shadow-[0_18px_46px_rgba(37,99,235,0.28)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
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
