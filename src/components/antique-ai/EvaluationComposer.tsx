"use client";

import { Camera, ImagePlus, Send, Sparkles, X } from "lucide-react";
import type { ChangeEvent } from "react";

type ThemeMode = "dark" | "light";

type Props = {
  theme: ThemeMode;
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

export default function EvaluationComposer({
  theme,
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

  return (
    <section className="flex min-h-dvh items-start justify-center px-4 pb-24 pt-[125px] md:pt-[150px] lg:pt-[175px]">
      <div className="w-full max-w-[780px]">
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

        <div className="mx-auto mt-8 max-w-[700px]">
          {/* Search / actions bar فقط، بدون صور داخله */}
          <div
            className={[
              "rounded-[2rem] border p-2 backdrop-blur-2xl transition md:rounded-full",
              isLight
                ? "border-white/70 bg-white/52 shadow-[0_28px_90px_rgba(55,105,160,0.22)]"
                : "border-white/12 bg-white/[0.085] shadow-[0_28px_90px_rgba(0,0,0,0.38)]",
            ].join(" ")}
          >
            <div className="flex min-h-13 items-center gap-1.5 md:h-14 md:gap-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !canAnalyze}
                className={[
                  "grid h-11 w-11 shrink-0 place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35",
                  isLight
                    ? "bg-[#101318] text-white shadow-[0_16px_34px_rgba(0,0,0,0.18)] hover:scale-[1.03]"
                    : "bg-white text-black shadow-[0_16px_34px_rgba(255,255,255,0.12)] hover:scale-[1.03]",
                ].join(" ")}
                aria-label={isAnalyzing ? labels.analyzing : labels.send}
              >
                <Send className="h-4 w-4" />
              </button>

              <label
                title={labels.camera}
                className={[
                  "grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full transition",
                  isLight
                    ? "text-black/58 hover:bg-white/70 hover:text-black"
                    : "text-white/58 hover:bg-white/[0.1] hover:text-white",
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

              <label
                title={labels.upload}
                className={[
                  "grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full transition",
                  isLight
                    ? "text-black/58 hover:bg-white/70 hover:text-black"
                    : "text-white/58 hover:bg-white/[0.1] hover:text-white",
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

              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                aria-label={labels.placeholder}
                placeholder={labels.placeholder}
                className={[
                  "h-full min-w-0 flex-1 bg-transparent px-4 text-[15px] font-normal outline-none placeholder:text-transparent",
                  isLight ? "text-black" : "text-white",
                ].join(" ")}
              />
            </div>
          </div>

          {/* الصور تحت الشريط بمربعات متوسطة */}
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
                  {previews.length} صورة مرفوعة للتقييم
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
                  مسح الكل
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
                        الرئيسية
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