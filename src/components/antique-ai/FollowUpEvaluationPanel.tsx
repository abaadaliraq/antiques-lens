"use client";

import type { Locale } from "./types";

type Props = {
  locale: Locale;
  error?: string;
  followUpText: string;
  followUpPreviews: string[];
  isFollowUpAnalyzing: boolean;
  setFollowUpText: (value: string) => void;
  setFollowUpOpen: (value: boolean) => void;
  handleFollowUpImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeFollowUpImageAt: (index: number) => void;
  handleFollowUpAnalyze: () => void;
};

function copy(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "One-time follow-up",
      title: "Add more photos or details",
      hint: "You can update this evaluation once using extra photos or notes.",
      placeholder:
        "Write extra details: weight, dimensions, marks, age, story, condition...",
      upload: "Upload extra images",
      update: "Update evaluation",
      updating: "Updating...",
      cancel: "Cancel",
    };
  }

  if (locale === "fr") {
    return {
      eyebrow: "Suivi unique",
      title: "Ajoutez plus de photos ou de détails",
      hint: "Vous pouvez mettre à jour cette évaluation une seule fois.",
      placeholder:
        "Ajoutez des détails: poids, dimensions, marques, âge, histoire, état...",
      upload: "Importer des images supplémentaires",
      update: "Mettre à jour l’évaluation",
      updating: "Mise à jour...",
      cancel: "Annuler",
    };
  }
  if (locale === "hi") {
    return {
      eyebrow: "एक बार का फ़ॉलो-अप",
      title: "अधिक तस्वीरें या विवरण जोड़ें",
      hint: "आप अतिरिक्त तस्वीरों या नोट्स से इस मूल्यांकन को एक बार अपडेट कर सकते हैं.",
      placeholder: "अतिरिक्त विवरण लिखें: वजन, आयाम, निशान, उम्र, कहानी, स्थिति...",
      upload: "अतिरिक्त तस्वीरें अपलोड करें",
      update: "मूल्यांकन अपडेट करें",
      updating: "अपडेट हो रहा है...",
      cancel: "रद्द करें",
    };
  }

  if (locale === "fa") {
    return {
      eyebrow: "پیگیری یک‌باره",
      title: "تصاویر یا جزئیات بیشتری اضافه کنید",
      hint: "می‌توانید این ارزیابی را فقط یک‌بار با تصاویر یا یادداشت‌های اضافی به‌روزرسانی کنید.",
      placeholder: "جزئیات اضافی بنویسید: وزن، ابعاد، مهر، سن، داستان، وضعیت...",
      upload: "بارگذاری تصاویر اضافی",
      update: "به‌روزرسانی ارزیابی",
      updating: "در حال به‌روزرسانی...",
      cancel: "لغو",
    };
  }

  if (locale === "tr") {
    return {
      eyebrow: "Tek seferlik takip",
      title: "Daha fazla fotoğraf veya detay ekle",
      hint: "Bu değerlendirmeyi ek fotoğraf veya notlarla yalnızca bir kez güncelleyebilirsiniz.",
      placeholder: "Ek detaylar yazın: ağırlık, ölçüler, işaretler, yaş, hikâye, durum...",
      upload: "Ek görseller yükle",
      update: "Değerlendirmeyi güncelle",
      updating: "Güncelleniyor...",
      cancel: "İptal",
    };
  }

  if (locale === "ru") {
    return {
      eyebrow: "Одно уточнение",
      title: "Добавьте фото или детали",
      hint: "Вы можете обновить эту оценку один раз, добавив фото или заметки.",
      placeholder: "Добавьте детали: вес, размеры, клейма, возраст, история, состояние...",
      upload: "Загрузить дополнительные фото",
      update: "Обновить оценку",
      updating: "Обновление...",
      cancel: "Отмена",
    };
  }
  if (locale === "ku") {
    return {
      eyebrow: "دواداچوونی یەکجار",
      title: "وێنە یان وردەکاری زیاتر زیاد بکە",
      hint: "دەتوانیت ئەم هەڵسەنگاندنە تەنها جارێک نوێ بکەیتەوە.",
      placeholder:
        "وردەکاری زیادە بنووسە: کێش، قەبارە، نیشانە، تەمەن، چیرۆک، دۆخ...",
      upload: "وێنەی زیادە باربکە",
      update: "هەڵسەنگاندن نوێ بکەوە",
      updating: "نوێکردنەوە...",
      cancel: "پاشگەزبوونەوە",
    };
  }

  return {
    eyebrow: "متابعة مرة واحدة",
    title: "أضف صوراً أو معلومات إضافية",
    hint: "يمكنك تحديث هذا التقييم مرة واحدة فقط باستخدام صور أو ملاحظات إضافية.",
    placeholder: "اكتب معلومات إضافية: الوزن، الأبعاد، الختم، العمر، القصة، الحالة...",
    upload: "رفع صور إضافية",
    update: "تحديث التقييم",
    updating: "جاري تحديث التقييم...",
    cancel: "إلغاء",
  };
}

export default function FollowUpEvaluationPanel({
  locale,
  error,
  followUpText,
  followUpPreviews,
  isFollowUpAnalyzing,
  setFollowUpText,
  setFollowUpOpen,
  handleFollowUpImageChange,
  removeFollowUpImageAt,
  handleFollowUpAnalyze,
}: Props) {
  const t = copy(locale);

  return (
    <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
      <div className="mb-5">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.32em] text-[#22D3EE]/70">
          {t.eyebrow}
        </p>

        <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-white">
          {t.title}
        </h2>

        <p className="mt-2 text-[13px] font-light leading-6 text-white/45">
          {t.hint}
        </p>
      </div>

      <textarea
        value={followUpText}
        onChange={(event) => setFollowUpText(event.target.value)}
        placeholder={t.placeholder}
        className="min-h-[130px] w-full resize-none rounded-[1.4rem] border border-white/10 bg-black/35 p-4 text-[15px] font-light leading-7 text-white outline-none placeholder:text-white/25 focus:border-[#22D3EE]/35"
      />

      <div className="mt-4">
        <label className="flex cursor-pointer items-center justify-center rounded-[1.4rem] border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center text-[13px] font-medium text-white/55 transition hover:border-[#22D3EE]/35 hover:text-[#22D3EE]">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFollowUpImageChange}
          />
          {t.upload}
        </label>
      </div>

      {followUpPreviews.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {followUpPreviews.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
            >
              <img src={src} alt="" className="h-full w-full object-cover" />

              <button
                type="button"
                onClick={() => removeFollowUpImageAt(index)}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error ? (
        <p className="mt-4 text-[13px] font-medium leading-6 text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleFollowUpAnalyze}
          disabled={isFollowUpAnalyzing}
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#2563EB] px-5 text-[13px] font-bold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isFollowUpAnalyzing ? t.updating : t.update}
        </button>

        <button
          type="button"
          onClick={() => setFollowUpOpen(false)}
          disabled={isFollowUpAnalyzing}
          className="h-12 rounded-full border border-white/10 px-5 text-[13px] font-medium text-white/55 transition hover:bg-white/[0.06] disabled:opacity-50"
        >
          {t.cancel}
        </button>
      </div>
    </section>
  );
}
