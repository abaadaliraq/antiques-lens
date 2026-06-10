"use client";

import { Capacitor } from "@capacitor/core";
import { Camera, Image as ImageIcon, Send, Sparkles, X } from "lucide-react";
import type { ChangeEvent, MouseEvent } from "react";
import { useRef, useState } from "react";
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
  handleTakePhoto?: (source?: "camera" | "gallery") => void | Promise<void>;
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

function copy(locale: AppLocale): Record<string, string> {
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

  const pickerText: Record<AppLocale, Record<string, string>> = {
    ar: {
      sheetTitle: "إضافة صورة",
      sheetHint: "اختر طريقة إضافة الصورة إلى تقييم KISHIB",
      takePhoto: "التقط صورة",
      chooseGallery: "اختر من المعرض",
      close: "إغلاق",
    },
    en: {
      sheetTitle: "Add an image",
      sheetHint: "Choose how to add an image to your KISHIB evaluation",
      takePhoto: "Take a photo",
      chooseGallery: "Choose from gallery",
      close: "Close",
    },
    fr: {
      sheetTitle: "Ajouter une image",
      sheetHint: "Choisissez comment ajouter une image",
      takePhoto: "Prendre une photo",
      chooseGallery: "Choisir depuis la galerie",
      close: "Fermer",
    },
    hi: {
      sheetTitle: "छवि जोड़ें",
      sheetHint: "KISHIB मूल्यांकन में छवि जोड़ने का तरीका चुनें",
      takePhoto: "फ़ोटो लें",
      chooseGallery: "गैलरी से चुनें",
      close: "बंद करें",
    },
    fa: {
      sheetTitle: "افزودن تصویر",
      sheetHint: "روش افزودن تصویر به ارزیابی KISHIB را انتخاب کنید",
      takePhoto: "گرفتن عکس",
      chooseGallery: "انتخاب از گالری",
      close: "بستن",
    },
    tr: {
      sheetTitle: "Görsel ekle",
      sheetHint: "KISHIB değerlendirmesine görsel ekleme yöntemini seçin",
      takePhoto: "Fotoğraf çek",
      chooseGallery: "Galeriden seç",
      close: "Kapat",
    },
    ru: {
      sheetTitle: "Добавить изображение",
      sheetHint: "Выберите способ добавления изображения",
      takePhoto: "Сделать фото",
      chooseGallery: "Выбрать из галереи",
      close: "Закрыть",
    },
    ku: {
      sheetTitle: "زیادکردنی وێنە",
      sheetHint: "شێوازی زیادکردنی وێنە بۆ هەڵسەنگاندنی KISHIB هەڵبژێرە",
      takePhoto: "وێنە بگرە",
      chooseGallery: "لە گەلەری هەڵبژێرە",
      close: "داخستن",
    },
  };

  return { ...text[locale], ...pickerText[locale] };
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
  handleTakePhoto,
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
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  function handleUploadBoxClick(event: MouseEvent<HTMLLabelElement>) {
    console.log("Upload button clicked");
    console.log("Platform:", Capacitor.getPlatform());

    event.preventDefault();
    setIsImagePickerOpen(true);
  }

  function closeImagePicker() {
    setIsImagePickerOpen(false);
  }

  function chooseCamera() {
    closeImagePicker();

    if (Capacitor.isNativePlatform() && handleTakePhoto) {
      void handleTakePhoto("camera");
      return;
    }

    cameraInputRef.current?.click();
  }

  function chooseGallery() {
    closeImagePicker();

    if (Capacitor.isNativePlatform() && handleTakePhoto) {
      void handleTakePhoto("gallery");
      return;
    }

    galleryInputRef.current?.click();
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
        <label
          onClick={handleUploadBoxClick}
          className="group relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-[#d2b98f] bg-[#fff4e2]/72 px-5 py-5 text-center transition hover:border-[#b88a3d] hover:bg-[#f8edda]"
        >
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
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
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

      {isImagePickerOpen ? (
        <div
          className="fixed inset-0 z-[99999] flex items-end bg-[#241913]/35 px-3 pb-3 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={closeImagePicker}
        >
          <div
            className="w-full rounded-t-[28px] border border-[#d2b98f]/80 bg-[#fff4e2]/94 p-4 text-[#241913] shadow-[0_-20px_60px_rgba(36,25,19,0.28)] backdrop-blur-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#b88a3d]/45" />
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[18px] font-bold text-[#233f32]">
                  {t.sheetTitle}
                </h3>
                <p className="mt-1 text-[13px] leading-5 text-[#735f4b]">
                  {t.sheetHint}
                </p>
              </div>
              <button
                type="button"
                onClick={closeImagePicker}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d2b98f] bg-[#efe3cf]/70 text-[#735f4b]"
                aria-label={t.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-2.5">
              <button
                type="button"
                onClick={chooseCamera}
                className="flex w-full items-center gap-3 rounded-[18px] border border-[#d2b98f] bg-[#f8edda] px-4 py-3.5 text-start shadow-[0_10px_24px_rgba(62,39,22,0.08)] transition active:scale-[0.99]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[#e8d1ad] text-[#8b3a2b]">
                  <Camera className="h-5 w-5" />
                </span>
                <span className="text-[16px] font-semibold text-[#241913]">
                  {t.takePhoto}
                </span>
              </button>

              <button
                type="button"
                onClick={chooseGallery}
                className="flex w-full items-center gap-3 rounded-[18px] border border-[#d2b98f] bg-[#f8edda] px-4 py-3.5 text-start shadow-[0_10px_24px_rgba(62,39,22,0.08)] transition active:scale-[0.99]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[#e8d1ad] text-[#8b3a2b]">
                  <ImageIcon className="h-5 w-5" />
                </span>
                <span className="text-[16px] font-semibold text-[#241913]">
                  {t.chooseGallery}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
