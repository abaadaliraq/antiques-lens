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
  handleTakePhoto?: () => void | Promise<void>;
  removeImage: () => void;
  removeImageAt?: (index: number) => void;
  handleAnalyze: () => void;
  isAnalyzing: boolean;
  usageStatus?: {
    canAnalyze: boolean;
    remainingCredits: number;
    usedCount: number;
    freeLimit: number;
    subscriptionStatus: string;
    accessType?: string;
    isLifetimeFree?: boolean;
    reason: string;
  };
  isUsageLoading?: boolean;
  onOpenSubscription?: () => void;
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
      credits: "المحاولات المجانية المتبقية",
      oneLeft: "تبقت لديك محاولة مجانية واحدة فقط",
      subscribeAnalyze: "اشترك لتفعيل التحليل",
      of: "من",
    },
    en: {
      uploadBox: "Upload or take a photo",
      optional: "Optional note about the item...",
      start: "Start analysis",
      clear: "Clear all",
      main: "Main",
      ready: "Photo ready for analysis",
      credits: "Free evaluations remaining",
      oneLeft: "You have one free evaluation left",
      subscribeAnalyze: "Subscribe to enable analysis",
      of: "of",
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

  const usageFallback = locale === "ar" ? text.ar : text.en;

  return { ...usageFallback, ...text[locale], ...pickerText[locale] };
}

const PHOTO_TIPS_STORAGE_KEY = "kishib-photo-tips-dismissed";

function photoGuidance(locale: AppLocale) {
  if (locale === "ar") {
    return {
      title: "قبل التصوير",
      hint: "كلما كانت الصور أوضح ومن زوايا أكثر، كانت نتيجة التقييم أدق.",
      openCamera: "فتح الكاميرا",
      chooseGallery: "اختيار من المعرض",
      dontShowAgain: "لا تظهر مرة أخرى",
      tips: [
        "امسح عدسة الكاميرا قبل التصوير.",
        "صوّر القطعة في إضاءة واضحة وبدون فلاش قوي.",
        "اجعل القطعة كاملة داخل الصورة بدون قص.",
        "التقط صورة قريبة للختم، التوقيع، القاعدة، أو أي علامة.",
        "صوّر أكثر من زاوية: الواجهة، الخلف، الجوانب، والتفاصيل.",
      ],
    };
  }

  return {
    title: "Before taking the photo",
    hint: "Clearer photos from multiple angles improve the evaluation accuracy.",
    openCamera: "Open Camera",
    chooseGallery: "Choose from Gallery",
    dontShowAgain: "Don't show again",
    tips: [
      "Clean your camera lens before taking the photo.",
      "Use clear lighting and avoid strong flash.",
      "Keep the whole item visible without cropping.",
      "Take close-up photos of marks, signatures, base, or stamps.",
      "Capture multiple angles: front, back, sides, and details.",
    ],
  };
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
  usageStatus,
  isUsageLoading = false,
  onOpenSubscription,
}: Props) {
  const safeLocale = normalizeLocale(locale);
  const isLight = theme === "light";
  const dir = isRtl(safeLocale) ? "rtl" : "ltr";
  const t = copy(safeLocale);
  const photoTips = photoGuidance(safeLocale);
  const [gemstoneData, setGemstoneData] = useState(emptyGemstoneFormData);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [hidePhotoTips, setHidePhotoTips] = useState(false);
  const [hasSeenPhotoTips, setHasSeenPhotoTips] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(PHOTO_TIPS_STORAGE_KEY) === "1";
  });
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const shouldShowPhotoTips = !hasSeenPhotoTips;

  const previews =
    imagePreviews.length > 0 ? imagePreviews : imagePreview ? [imagePreview] : [];
  const files =
    selectedFiles.length > 0 ? selectedFiles : selectedFile ? [selectedFile] : [];
  const canAnalyze = Boolean(prompt.trim() || previews.length > 0);
  const hasUsageStatus = Boolean(usageStatus);
  const isLimitReached =
    hasUsageStatus &&
    usageStatus?.canAnalyze === false &&
    usageStatus.reason !== "auth_required" &&
    usageStatus.reason !== "usage_check_failed";
  const remainingCredits = usageStatus?.remainingCredits ?? 0;
  const freeLimit = usageStatus?.freeLimit ?? 5;
  const shouldShowUsage =
    hasUsageStatus &&
    usageStatus?.subscriptionStatus !== "active" &&
    usageStatus?.subscriptionStatus !== "lifetime_free" &&
    usageStatus?.accessType !== "admin" &&
    usageStatus?.accessType !== "lifetime_free" &&
    usageStatus?.isLifetimeFree !== true;

  function handleRemoveAt(index: number) {
    if (removeImageAt) {
      removeImageAt(index);
      return;
    }

    removeImage();
  }

  function handleSmartAnalyze() {
    if (isLimitReached) {
      onOpenSubscription?.();
      return;
    }

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

  function rememberPhotoTipsChoice() {
    setHasSeenPhotoTips(true);

    if (hidePhotoTips && typeof window !== "undefined") {
      window.localStorage.setItem(PHOTO_TIPS_STORAGE_KEY, "1");
    }
  }

  function chooseCamera() {
    rememberPhotoTipsChoice();

    if (Capacitor.isNativePlatform() && handleTakePhoto) {
      closeImagePicker();
      void handleTakePhoto();
      return;
    }

    cameraInputRef.current?.click();
    closeImagePicker();
  }

  function chooseGallery() {
    rememberPhotoTipsChoice();
    galleryInputRef.current?.click();
    closeImagePicker();
  }

  return (
    <section className="w-full" dir={dir}>
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        className="sr-only"
        tabIndex={-1}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
        className="sr-only"
        tabIndex={-1}
      />

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
          <p className="relative mt-2 max-w-xs text-xs leading-5 text-[#735f4b]">
            {photoTips.hint}
          </p>
          {previews.length > 0 ? (
            <p className="relative mt-1 text-xs text-[#735f4b]">{t.ready}</p>
          ) : null}
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

        {shouldShowUsage ? (
          <div className="mt-3 rounded-[14px] border border-[#d2b98f] bg-[#efe3cf]/62 px-3 py-2">
            <div className="flex items-center justify-between gap-3 text-[12px] font-semibold text-[#735f4b]">
              <span>{t.credits}</span>
              <span dir="ltr" className="font-bold text-[#986f2e]">
                {remainingCredits} {t.of} {freeLimit}
              </span>
            </div>
            {remainingCredits === 1 && !isLimitReached ? (
              <p className="mt-1 text-[11px] font-semibold text-[#8b3a2b]">
                {t.oneLeft}
              </p>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSmartAnalyze}
          disabled={isAnalyzing || isUsageLoading || !canAnalyze}
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
              {isLimitReached ? t.subscribeAnalyze : t.start}
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
                  {shouldShowPhotoTips ? photoTips.title : t.sheetTitle}
                </h3>
                <p className="mt-1 text-[13px] leading-5 text-[#735f4b]">
                  {shouldShowPhotoTips ? photoTips.hint : t.sheetHint}
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

            {shouldShowPhotoTips ? (
              <div className="mb-4 border-y border-[#d2b98f]/55 bg-[#fff8ec]/64 px-1 py-3">
                <ul className="grid gap-2">
                  {photoTips.tips.map((tip, index) => (
                    <li key={`${tip}-${index}`} className="flex gap-2 text-[13px] leading-6 text-[#735f4b]">
                      <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#b88a3d]/75" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>

                <label className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-[#735f4b]">
                  <input
                    type="checkbox"
                    checked={hidePhotoTips}
                    onChange={(event) => setHidePhotoTips(event.target.checked)}
                    className="h-4 w-4 rounded border-[#d2b98f] accent-[#b88a3d]"
                  />
                  <span>{photoTips.dontShowAgain}</span>
                </label>
              </div>
            ) : null}

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
                  {shouldShowPhotoTips ? photoTips.openCamera : t.takePhoto}
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
                  {shouldShowPhotoTips ? photoTips.chooseGallery : t.chooseGallery}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
