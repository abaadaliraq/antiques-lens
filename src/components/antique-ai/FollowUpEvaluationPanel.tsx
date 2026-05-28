"use client";

type Locale = "ar" | "en" | "ku" | "fr";

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
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.32em] text-[#d6a25f]/70">
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
        className="min-h-[130px] w-full resize-none rounded-[1.4rem] border border-white/10 bg-black/35 p-4 text-[15px] font-light leading-7 text-white outline-none placeholder:text-white/25 focus:border-[#d6a25f]/35"
      />

      <div className="mt-4">
        <label className="flex cursor-pointer items-center justify-center rounded-[1.4rem] border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center text-[13px] font-medium text-white/55 transition hover:border-[#d6a25f]/35 hover:text-[#d6a25f]">
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
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#d6a25f] px-5 text-[13px] font-bold text-black transition hover:bg-[#edbc78] disabled:cursor-not-allowed disabled:opacity-50"
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