"use client";

import AntiqueBackground from "@/components/antique-ai/AntiqueBackground";
import BottomBar from "@/components/antique-ai/BottomBar";
import CookieBar from "@/components/antique-ai/CookieBar";
import EvaluationComposer from "@/components/antique-ai/EvaluationComposer";
import HistorySidebar from "@/components/antique-ai/HistorySidebar";
import LanguagePills from "@/components/antique-ai/LanguagePills";
import ResultView from "@/components/antique-ai/ResultView";
import ThemeToggle from "@/components/antique-ai/ThemeToggle";
import ThinkingMotion from "@/components/antique-ai/ThinkingMotion";
import { useAntiqueLens } from "./useAntiqueLens";
import FollowUpEvaluationPanel from "@/components/antique-ai/FollowUpEvaluationPanel";

export default function AntiqueLensShell() {
  const lens = useAntiqueLens();

  return (
    <main
      dir={lens.t.dir}
      data-theme={lens.theme}
      className={[
        "relative min-h-dvh overflow-x-hidden bg-black transition-colors duration-500",
        lens.theme === "light" ? "text-[#111318]" : "text-white",
      ].join(" ")}
    >
      <AntiqueBackground imageSrc="/bg-1.jpg" />

      <div className="relative z-10 min-h-dvh">
        <HistorySidebar
          open={lens.historyOpen}
          history={lens.history}
          labels={{
            brand: lens.t.badge,
            sub: lens.t.sub,
            new: lens.t.new,
            archive: lens.t.archive,
            empty: lens.t.emptyArchive,
            clear: lens.t.clearArchive,
            notice: lens.t.notice,
          }}
          onOpen={() => lens.setHistoryOpen(true)}
          onClose={() => lens.setHistoryOpen(false)}
          onDeleteItem={lens.deleteHistoryItem}
          onNewEvaluation={() => {
            lens.resetEvaluation();
            lens.setHistoryOpen(false);
          }}
          onOpenItem={lens.openHistoryItem}
          onClearHistory={lens.clearHistory}
        />

        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 md:right-8 md:top-6">
          <LanguagePills lang={lens.locale} setLang={lens.changeLocale} />
          <ThemeToggle theme={lens.theme} onToggle={lens.toggleTheme} />
        </div>

        {lens.isTranslatingResult && (
          <div className="fixed inset-x-0 top-20 z-50 mx-auto flex w-fit items-center gap-3 rounded-full border border-[#d6a25f]/20 bg-black/70 px-5 py-3 text-[12px] font-medium text-[#f4d29b] shadow-2xl shadow-black/30 backdrop-blur-2xl">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#d6a25f]" />
            <span>
              {lens.locale === "en"
                ? "Translating report..."
                : lens.locale === "fr"
                  ? "Traduction du rapport..."
                  : lens.locale === "ku"
                    ? "وەرگێڕانی ڕاپۆرت..."
                    : "جاري ترجمة التقرير..."}
            </span>
          </div>
        )}

        <section className="relative z-10 min-h-dvh lg:pl-[280px]">
          {!lens.result && !lens.isAnalyzing && (
            <EvaluationComposer
              theme={lens.theme}
              labels={lens.t}
              prompt={lens.prompt}
              setPrompt={lens.setPrompt}
              selectedFiles={lens.selectedFiles}
              imagePreviews={lens.imagePreviews}
              selectedFile={lens.selectedFile}
              imagePreview={lens.imagePreview}
              error={lens.error}
              handleImageChange={lens.handleImageChange}
              removeImage={lens.removeImage}
              removeImageAt={lens.removeImageAt}
              handleAnalyze={lens.handleAnalyze}
              isAnalyzing={lens.isAnalyzing}
            />
          )}

          {lens.isAnalyzing && (
            <div className="flex min-h-dvh items-center justify-center px-4 pb-24 pt-20">
              <ThinkingMotion />
            </div>
          )}

          {lens.result && !lens.isAnalyzing && (
            <div className="mx-auto w-full max-w-[980px] px-4 pb-28 pt-20 md:px-8">
      <ResultView
  locale={lens.locale}
  labels={{
    result: lens.t.result,
    age: lens.t.age,
    value: lens.t.value,
    material: lens.t.material,
    origin: lens.t.origin,
    lookup: lens.t.lookup,
    description: lens.t.description,
    condition: lens.t.condition,
    authenticity: lens.t.authenticity,
    priceReason: lens.t.priceReason,
    valueDrivers: lens.t.valueDrivers,
    valueReducers: lens.t.valueReducers,
    similar: lens.t.similar,
    similarHint: lens.t.similarHint,
    soon: lens.t.soon,
    neededPhotos: lens.t.neededPhotos,
    followUp: lens.t.followUp,
    confidence: lens.t.confidence,
    notice: lens.t.notice,
    addInfo: lens.t.addInfo,
  }}
  result={lens.result}
  imagePreview={lens.imagePreview}
  imagePreviews={lens.imagePreviews}
  similarImages={lens.similarImages}
  isLoadingSimilar={lens.isLoadingSimilar}
  onShare={lens.handleShare}
  onAddInfo={lens.handleAddInfo}
  followUpPanel={
    lens.followUpOpen && !lens.followUpUsed ? (
      <FollowUpEvaluationPanel
        locale={lens.locale}
        error={lens.error}
        followUpText={lens.followUpText}
        followUpPreviews={lens.followUpPreviews}
        isFollowUpAnalyzing={lens.isFollowUpAnalyzing}
        setFollowUpText={lens.setFollowUpText}
        setFollowUpOpen={lens.setFollowUpOpen}
        handleFollowUpImageChange={lens.handleFollowUpImageChange}
        removeFollowUpImageAt={lens.removeFollowUpImageAt}
        handleFollowUpAnalyze={lens.handleFollowUpAnalyze}
      />
    ) : null
  }
/>
                
  <FollowUpEvaluationPanel
    locale={lens.locale}
    error={lens.error}
    followUpText={lens.followUpText}
    followUpPreviews={lens.followUpPreviews}
    isFollowUpAnalyzing={lens.isFollowUpAnalyzing}
    setFollowUpText={lens.setFollowUpText}
    setFollowUpOpen={lens.setFollowUpOpen}
    handleFollowUpImageChange={lens.handleFollowUpImageChange}
    removeFollowUpImageAt={lens.removeFollowUpImageAt}
    handleFollowUpAnalyze={lens.handleFollowUpAnalyze}
  />

              {lens.followUpOpen && !lens.followUpUsed && (
  <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
    <div className="mb-5">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.32em] text-[#d6a25f]/70">
        {lens.locale === "en"
          ? "One-time follow-up"
          : lens.locale === "fr"
            ? "Suivi unique"
            : lens.locale === "ku"
              ? "دواداچوونی یەکجار"
              : "متابعة مرة واحدة"}
      </p>

      <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-white">
        {lens.locale === "en"
          ? "Add more photos or details"
          : lens.locale === "fr"
            ? "Ajoutez plus de photos ou de détails"
            : lens.locale === "ku"
              ? "وێنە یان وردەکاری زیاتر زیاد بکە"
              : "أضف صوراً أو معلومات إضافية"}
      </h2>

      <p className="mt-2 text-[13px] font-light leading-6 text-white/45">
        {lens.locale === "en"
          ? "You can update this evaluation once using extra photos or notes."
          : lens.locale === "fr"
            ? "Vous pouvez mettre à jour cette évaluation une seule fois avec des photos ou notes supplémentaires."
            : lens.locale === "ku"
              ? "دەتوانیت ئەم هەڵسەنگاندنە تەنها جارێک بە وێنە یان تێبینی زیاتر نوێ بکەیتەوە."
              : "يمكنك تحديث هذا التقييم مرة واحدة فقط باستخدام صور أو ملاحظات إضافية."}
      </p>
    </div>

    <textarea
      value={lens.followUpText}
      onChange={(event) => lens.setFollowUpText(event.target.value)}
      placeholder={
        lens.locale === "en"
          ? "Write extra details: weight, dimensions, marks, age, story, condition..."
          : lens.locale === "fr"
            ? "Ajoutez des détails: poids, dimensions, marques, âge, histoire, état..."
            : lens.locale === "ku"
              ? "وردەکاری زیادە بنووسە: کێش، قەبارە، نیشانە، تەمەن، چیرۆک، دۆخ..."
              : "اكتب معلومات إضافية: الوزن، الأبعاد، الختم، العمر، القصة، الحالة..."
      }
      className="min-h-[130px] w-full resize-none rounded-[1.4rem] border border-white/10 bg-black/35 p-4 text-[15px] font-light leading-7 text-white outline-none placeholder:text-white/25 focus:border-[#d6a25f]/35"
    />

    <div className="mt-4">
      <label className="flex cursor-pointer items-center justify-center rounded-[1.4rem] border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center text-[13px] font-medium text-white/55 transition hover:border-[#d6a25f]/35 hover:text-[#d6a25f]">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={lens.handleFollowUpImageChange}
        />
        {lens.locale === "en"
          ? "Upload extra images"
          : lens.locale === "fr"
            ? "Importer des images supplémentaires"
            : lens.locale === "ku"
              ? "وێنەی زیادە باربکە"
              : "رفع صور إضافية"}
      </label>
    </div>

    {lens.followUpPreviews.length > 0 && (
      <div className="mt-4 grid grid-cols-4 gap-3">
        {lens.followUpPreviews.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
          >
            <img src={src} alt="" className="h-full w-full object-cover" />

            <button
              type="button"
              onClick={() => lens.removeFollowUpImageAt(index)}
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-xs text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    )}

    {lens.error && (
      <p className="mt-4 text-[13px] font-medium leading-6 text-red-300">
        {lens.error}
      </p>
    )}

    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={lens.handleFollowUpAnalyze}
        disabled={lens.isFollowUpAnalyzing}
        className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#d6a25f] px-5 text-[13px] font-bold text-black transition hover:bg-[#edbc78] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {lens.isFollowUpAnalyzing
          ? lens.locale === "en"
            ? "Updating..."
            : lens.locale === "fr"
              ? "Mise à jour..."
              : lens.locale === "ku"
                ? "نوێکردنەوە..."
                : "جاري تحديث التقييم..."
          : lens.locale === "en"
            ? "Update evaluation"
            : lens.locale === "fr"
              ? "Mettre à jour l’évaluation"
              : lens.locale === "ku"
                ? "هەڵسەنگاندن نوێ بکەوە"
                : "تحديث التقييم"}
      </button>

      <button
        type="button"
        onClick={() => lens.setFollowUpOpen(false)}
        disabled={lens.isFollowUpAnalyzing}
        className="h-12 rounded-full border border-white/10 px-5 text-[13px] font-medium text-white/55 transition hover:bg-white/[0.06] disabled:opacity-50"
      >
        {lens.locale === "en"
          ? "Cancel"
          : lens.locale === "fr"
            ? "Annuler"
            : lens.locale === "ku"
              ? "پاشگەزبوونەوە"
              : "إلغاء"}
      </button>
    </div>
  </section>
)}
            </div>
            
          )}
        </section>

        <BottomBar
  theme={lens.theme}
  labels={{
    new: lens.t.new,
    share: lens.t.share,
    addInfo: lens.t.addInfo,
  }}
  hasResult={Boolean(lens.result)}
  onNew={lens.resetEvaluation}
  onShare={lens.handleShare}
  onAddInfo={lens.handleAddInfo}
/>

        <CookieBar />
      </div>
    </main>
  );
}