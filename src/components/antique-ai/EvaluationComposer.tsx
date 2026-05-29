"use client";

import { Camera, ImagePlus, Send, Sparkles, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { useState } from "react";
import GemstoneFields, {
  emptyGemstoneFormData,
  buildGemstoneContext,
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

function getGemPromptPlaceholder(locale: AppLocale) {
  if (locale === "en") {
    return "Add any extra notes about the stone, source, expected price, story, or certificate...";
  }

  if (locale === "fr") {
    return "Ajoutez des notes sur la pierre, l’origine, le prix attendu, l’histoire ou le certificat...";
  }

  if (locale === "ku") {
    return "هەر زانیارییەکی زیادە دەربارەی بەرد، سەرچاوە، نرخ، چیرۆک یان بڕوانامە بنووسە...";
  }

  if (locale === "hi") {
    return "रत्न, स्रोत, अनुमानित कीमत, कहानी या प्रमाणपत्र के बारे में कोई अतिरिक्त जानकारी लिखें...";
  }

  if (locale === "fa") {
    return "هر توضیح اضافی درباره سنگ، منبع، قیمت مورد انتظار، داستان یا گواهی را بنویسید...";
  }

  if (locale === "tr") {
    return "Taş, kaynak, beklenen fiyat, hikâye veya sertifika hakkında ek notlar yazın...";
  }

  if (locale === "ru") {
    return "Добавьте сведения о камне, происхождении, ожидаемой цене, истории или сертификате...";
  }

  return "اكتبي أي ملاحظات إضافية عن الحجر، المصدر، السعر المتوقع، القصة، أو الشهادة...";
}

function getUploadedPhotosText(locale: AppLocale, count: number) {
  if (locale === "en") return `${count} uploaded image${count > 1 ? "s" : ""}`;
  if (locale === "fr") return `${count} image${count > 1 ? "s" : ""} téléchargée${count > 1 ? "s" : ""}`;
  if (locale === "ku") return `${count} وێنە بارکراوە`;
  if (locale === "hi") return `${count} तस्वीर अपलोड हुई`;
  if (locale === "fa") return `${count} تصویر بارگذاری شد`;
  if (locale === "tr") return `${count} görsel yüklendi`;
  if (locale === "ru") return `${count} изображений загружено`;
  return `${count} صورة مرفوعة للتقييم`;
}

function getClearAllText(locale: AppLocale) {
  if (locale === "en") return "Clear all";
  if (locale === "fr") return "Tout effacer";
  if (locale === "ku") return "سڕینەوەی هەموو";
  if (locale === "hi") return "सब हटाएँ";
  if (locale === "fa") return "حذف همه";
  if (locale === "tr") return "Tümünü sil";
  if (locale === "ru") return "Очистить всё";
  return "مسح الكل";
}

function getMainText(locale: AppLocale) {
  if (locale === "en") return "Main";
  if (locale === "fr") return "Principale";
  if (locale === "ku") return "سەرەکی";
  if (locale === "hi") return "मुख्य";
  if (locale === "fa") return "اصلی";
  if (locale === "tr") return "Ana";
  if (locale === "ru") return "Главное";
  return "الرئيسية";
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
  const isLight = theme === "light";
  const safeLocale = normalizeLocale(locale);

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

  function autoResizeTextarea(element: HTMLTextAreaElement) {
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 132)}px`;
  }

  function handleSmartAnalyze() {
    const gemstoneContext = buildGemstoneContext(gemstoneData);

    if (gemstoneContext) {
      const cleanPrompt = prompt.trim();

      const mergedPrompt = [
        cleanPrompt,
        "IMPORTANT USER-PROVIDED GEMSTONE / JEWELRY DETAILS:",
        gemstoneContext,
      ]
        .filter(Boolean)
        .join("\n\n");

      setPrompt(mergedPrompt);

      window.setTimeout(() => {
        handleAnalyze();
      }, 60);

      return;
    }

    handleAnalyze();
  }

  return (
    <section className="flex min-h-dvh items-start justify-center px-4 pb-24 pt-[125px] md:pt-[150px] lg:pt-[175px]">
      <div className="w-full max-w-[820px]">
        <div className="text-center">
          <div
            className={[
              "mx-auto mb-5 grid h-12 w-12 place-items-center rounded-[1.25rem] border backdrop-blur-2xl transition md:h-14 md:w-14",
              isLight
                ? "border-white/70 bg-white/45 text-black shadow-[0_22px_70px_rgba(60,110,160,0.18)]"
                : "border-white/10 bg-white/[0.075] text-white shadow-[0_22px_70px_rgba(0,0,0,0.34)]",
            ].join(" ")}
          >
            <Sparkles className="h-5 w-5 text-[#d9a256]" />
          </div>

          <h1
            className={[
              "mx-auto max-w-[720px] text-[34px] font-semibold leading-[1.08] tracking-[-0.055em] md:text-[58px]",
              isLight ? "text-[#111318]" : "text-white",
            ].join(" ")}
          >
            {labels.title}
          </h1>

          <p
            className={[
              "mx-auto mt-4 max-w-[560px] text-[13px] leading-6 md:text-[14px] md:leading-7",
              isLight ? "text-black/46" : "text-white/46",
            ].join(" ")}
          >
            {labels.hint}
          </p>
        </div>

        {error && (
          <div
            className={[
              "mx-auto mt-5 max-w-[620px] rounded-2xl border px-4 py-3 text-sm backdrop-blur-xl",
              isLight
                ? "border-red-500/20 bg-red-500/10 text-red-700"
                : "border-red-400/20 bg-red-500/10 text-red-200",
            ].join(" ")}
          >
            {error}
          </div>
        )}

        <div className="mx-auto mt-8 w-full max-w-[760px]">
          <GemstoneFields
            value={gemstoneData}
            onChange={setGemstoneData}
            locale={safeLocale}
          />

          <div
            className={[
              "mt-5 w-full rounded-[1.75rem] border backdrop-blur-2xl transition",
              "px-3 py-2",
              isLight
                ? "border-black/10 bg-white/70 shadow-[0_24px_80px_rgba(55,105,160,0.18)]"
                : "border-white/12 bg-white/[0.085] shadow-[0_28px_90px_rgba(0,0,0,0.38)]",
            ].join(" ")}
          >
            <div className="flex w-full items-end gap-2">
              <div className="flex shrink-0 items-center gap-1 pb-1">
                <label
                  title={labels.upload}
                  className={[
                    "grid h-9 w-9 cursor-pointer place-items-center rounded-full transition",
                    isLight
                      ? "text-black/58 hover:bg-black/5 hover:text-black"
                      : "text-white/60 hover:bg-white/[0.1] hover:text-white",
                  ].join(" ")}
                >
                  <ImagePlus className="h-[18px] w-[18px]" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                <label
                  title={labels.camera}
                  className={[
                    "grid h-9 w-9 cursor-pointer place-items-center rounded-full transition",
                    isLight
                      ? "text-black/58 hover:bg-black/5 hover:text-black"
                      : "text-white/60 hover:bg-white/[0.1] hover:text-white",
                  ].join(" ")}
                >
                  <Camera className="h-[18px] w-[18px]" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                value={prompt}
                onChange={(event) => {
                  setPrompt(event.target.value);
                  autoResizeTextarea(event.currentTarget);
                }}
                onInput={(event) => autoResizeTextarea(event.currentTarget)}
                rows={1}
                aria-label={labels.placeholder}
                placeholder={
                  gemstoneData.evaluationKind === "antique"
                    ? labels.placeholder
                    : getGemPromptPlaceholder(safeLocale)
                }
                className={[
                  "min-h-[38px] max-h-[132px] flex-1 resize-none overflow-y-auto bg-transparent",
                  "px-2 py-2 text-[15px] leading-6 outline-none",
                  "placeholder:text-white/30",
                  isLight ? "text-black placeholder:text-black/35" : "text-white",
                ].join(" ")}
              />

              <button
                type="button"
                onClick={handleSmartAnalyze}
                disabled={isAnalyzing || !canAnalyze}
                className={[
                  "mb-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full transition",
                  "disabled:cursor-not-allowed disabled:opacity-35",
                  isLight
                    ? "bg-[#101318] text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)] hover:scale-[1.03]"
                    : "bg-white text-black shadow-[0_12px_28px_rgba(255,255,255,0.12)] hover:scale-[1.03]",
                ].join(" ")}
                aria-label={isAnalyzing ? labels.analyzing : labels.send}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {previews.length > 0 && (
            <div
              className={[
                "mt-4 rounded-[1.7rem] border p-3 backdrop-blur-2xl",
                isLight
                  ? "border-black/10 bg-white/45 shadow-[0_18px_50px_rgba(55,105,160,0.12)]"
                  : "border-white/10 bg-white/[0.045] shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
              ].join(" ")}
            >
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <p
                  className={[
                    "text-xs",
                    isLight ? "text-black/55" : "text-white/48",
                  ].join(" ")}
                >
                  {getUploadedPhotosText(safeLocale, previews.length)}
                </p>

                <button
                  type="button"
                  onClick={removeImage}
                  className={[
                    "rounded-full px-3 py-1 text-xs transition",
                    isLight
                      ? "text-black/50 hover:bg-black/5 hover:text-black"
                      : "text-white/45 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {getClearAllText(safeLocale)}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {previews.map((preview, index) => (
                  <div
                    key={`${preview}-${index}`}
                    className={[
                      "group relative aspect-square overflow-hidden rounded-2xl border bg-black",
                      isLight ? "border-black/10" : "border-white/12",
                    ].join(" ")}
                  >
                    <img
                      src={preview}
                      alt={files[index]?.name || labels.imageReady}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />

                    {index === 0 && (
                      <div className="absolute bottom-1.5 right-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                        {getMainText(safeLocale)}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveAt(index)}
                      className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-white opacity-100 backdrop-blur-md transition hover:bg-red-500 md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}