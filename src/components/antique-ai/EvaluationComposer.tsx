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
  if (locale === "en") return "Add extra notes...";
  if (locale === "fr") return "Ajoutez des notes...";
  if (locale === "ku") return "زانیاریی زیادە بنووسە...";
  if (locale === "hi") return "अतिरिक्त जानकारी लिखें...";
  if (locale === "fa") return "توضیحات اضافه بنویسید...";
  if (locale === "tr") return "Ek not yazın...";
  if (locale === "ru") return "Добавьте заметки...";
  return "اكتبي ملاحظة قصيرة...";
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
const inputDir =
  safeLocale === "ar" || safeLocale === "fa" || safeLocale === "ku"
    ? "rtl"
    : "ltr";
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
    element.style.height = `${Math.min(element.scrollHeight, 84)}px`;
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
  <section className="flex min-h-dvh items-center justify-center px-4 pb-20 pt-20 md:px-6 md:pb-24 md:pt-10">
    <div className="w-full max-w-[820px] -translate-y-6 md:-translate-y-12">
      <div className="text-center">
        <div className="mx-auto mb-3 flex justify-center md:mb-4">
  <img
    src="/kishib-logo.png"
    alt="KISHIB"
    className="h-[58px] w-[58px] object-contain drop-shadow-[0_18px_35px_rgba(0,0,0,0.38)] md:h-[74px] md:w-[74px]"
  />
</div>

        <h1
          className={[
            "mx-auto max-w-[720px] whitespace-nowrap text-center text-[24px] font-medium leading-none tracking-[-0.04em]",
            "sm:text-[32px] md:text-[54px] md:font-semibold lg:text-[58px]",
            isLight ? "text-[#111318]" : "text-white",
          ].join(" ")}
        >
          {labels.title}
        </h1>

        <p
          className={[
            "mx-auto mt-3 hidden max-w-[560px] text-[13px] leading-6 md:block md:text-[14px] md:leading-7",
            isLight ? "text-black/46" : "text-white/46",
          ].join(" ")}
        >
          {labels.hint}
        </p>
      </div>

      {error && (
        <div
          className={[
            "mx-auto mt-4 max-w-[620px] rounded-2xl border px-4 py-3 text-sm backdrop-blur-xl",
            isLight
              ? "border-red-500/20 bg-red-500/10 text-red-700"
              : "border-red-400/20 bg-red-500/10 text-red-200",
          ].join(" ")}
        >
          {error}
        </div>
      )}

      <div className="mx-auto mt-4 w-full max-w-[760px] md:mt-5">
        <div
          className={[
            "w-full rounded-[1.65rem] border transition",
            "border-white/80 bg-white px-2.5 py-1.5 shadow-[0_18px_55px_rgba(0,0,0,0.18)]",
          ].join(" ")}
        >
          <div className="flex w-full items-center gap-1.5">
            <div className="flex shrink-0 items-center gap-1">
              <label
                title={labels.upload}
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-[#4a3a2b] transition hover:bg-black/5"
              >
                <ImagePlus className="h-[15px] w-[15px]" />
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
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-[#4a3a2b] transition hover:bg-black/5"
              >
                <Camera className="h-[15px] w-[15px]" />
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
              dir={inputDir}
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                autoResizeTextarea(event.currentTarget);
              }}
              onInput={(event) => autoResizeTextarea(event.currentTarget)}
              rows={1}
              aria-label={labels.placeholder}
              placeholder=""
              className={[
                "min-h-[30px] max-h-[72px] flex-1 resize-none overflow-y-auto bg-transparent",
                "px-2 py-1 text-[13px] font-normal leading-5 outline-none",
                "text-[#34291f] placeholder:text-transparent",
                inputDir === "rtl" ? "text-right" : "text-left",
              ].join(" ")}
            />

            <button
              type="button"
              onClick={handleSmartAnalyze}
              disabled={isAnalyzing || !canAnalyze}
              className={[
                "grid h-9 w-9 shrink-0 place-items-center rounded-full transition",
                "bg-[#ebe5dd] text-[#4a3a2b] shadow-[0_10px_22px_rgba(0,0,0,0.10)] hover:scale-[1.03]",
                "disabled:cursor-not-allowed disabled:opacity-35",
              ].join(" ")}
              aria-label={isAnalyzing ? labels.analyzing : labels.send}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mx-auto mt-2 w-full max-w-[620px] md:mt-3 md:max-w-none">
          <GemstoneFields
            value={gemstoneData}
            onChange={setGemstoneData}
            locale={safeLocale}
          />
        </div>

        {previews.length > 0 && (
          <div
            className={[
              "mt-3 rounded-[1.55rem] border p-3 backdrop-blur-2xl md:mt-4 md:rounded-[1.7rem]",
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