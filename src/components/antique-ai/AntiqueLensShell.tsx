"use client";

import AntiqueBackground from "@/components/antique-ai/AntiqueBackground";
import BottomBar from "@/components/antique-ai/BottomBar";
import CookieBar from "@/components/antique-ai/CookieBar";
import EvaluationComposer from "@/components/antique-ai/EvaluationComposer";
import FollowUpEvaluationPanel from "@/components/antique-ai/FollowUpEvaluationPanel";
import HistorySidebar from "@/components/antique-ai/HistorySidebar";
import LanguagePills from "@/components/antique-ai/LanguagePills";
import MobileTopBar from "@/components/antique-ai/MobileTopBar";
import ResultView from "@/components/antique-ai/ResultView";
import ThemeToggle from "@/components/antique-ai/ThemeToggle";
import ThinkingMotion from "@/components/antique-ai/ThinkingMotion";
import { useAntiqueLens } from "./useAntiqueLens";

function getSafeSimilarImages(lens: ReturnType<typeof useAntiqueLens>) {
  const result = lens.result as any;

  if (Array.isArray(lens.similarImages) && lens.similarImages.length > 0) {
    return lens.similarImages;
  }

  if (Array.isArray(result?.similarImages) && result.similarImages.length > 0) {
    return result.similarImages;
  }

  if (Array.isArray(result?.similarPhotos) && result.similarPhotos.length > 0) {
    return result.similarPhotos;
  }

  if (Array.isArray(result?.similarItems) && result.similarItems.length > 0) {
    return result.similarItems;
  }

  if (Array.isArray(result?.similar) && result.similar.length > 0) {
    return result.similar;
  }

  if (Array.isArray(result?.similarPieces) && result.similarPieces.length > 0) {
    return result.similarPieces;
  }

  return [];
}

export default function AntiqueLensShell() {
  const lens = useAntiqueLens();

  const activeLocale = String(lens.locale);

  const safeSimilarImages = getSafeSimilarImages(lens);

  const isSimilarLoading =
    Boolean(lens.isLoadingSimilar) && safeSimilarImages.length === 0;

  const canUseFollowUp = Boolean(
    lens.result && !lens.followUpOpen && !lens.followUpUsed
  );

  const followUpPanel =
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
    ) : null;

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

        <div className="lg:hidden">
          <MobileTopBar
            locale={lens.locale}
            setLocale={lens.changeLocale}
            onOpenArchive={() => lens.setHistoryOpen(true)}
          />
        </div>

        <div className="fixed right-4 top-4 z-50 hidden items-center gap-2 md:right-8 md:top-6 lg:flex">
          <LanguagePills lang={lens.locale} setLang={lens.changeLocale} />
          <ThemeToggle theme={lens.theme} onToggle={lens.toggleTheme} />
        </div>

        {lens.isTranslatingResult && (
          <div className="fixed inset-x-0 top-20 z-50 mx-auto flex w-fit items-center gap-3 rounded-full border border-[#d6a25f]/20 bg-black/70 px-5 py-3 text-[12px] font-medium text-[#f4d29b] shadow-2xl shadow-black/30 backdrop-blur-2xl">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#d6a25f]" />

            <span>
              {activeLocale === "en"
                ? "Translating report..."
                : activeLocale === "fr"
                  ? "Traduction du rapport..."
                  : activeLocale === "ku"
                    ? "وەرگێڕانی ڕاپۆرت..."
                    : activeLocale === "hi"
                      ? "रिपोर्ट का अनुवाद हो रहा है..."
                      : activeLocale === "fa"
                        ? "در حال ترجمه گزارش..."
                        : activeLocale === "tr"
                          ? "Rapor çevriliyor..."
                          : activeLocale === "ru"
                            ? "Перевод отчёта..."
                            : "جاري ترجمة التقرير..."}
            </span>
          </div>
        )}

        <section className="relative z-10 min-h-dvh lg:pl-[280px]">
          {!lens.result && !lens.isAnalyzing && (
            <div className="mx-auto flex min-h-dvh w-full max-w-[760px] flex-col justify-center px-4 pb-24 pt-16 md:px-8 md:pb-28 md:pt-20">
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
                locale={lens.locale}
                handleImageChange={lens.handleImageChange}
                removeImage={lens.removeImage}
                removeImageAt={lens.removeImageAt}
                handleAnalyze={lens.handleAnalyze}
                isAnalyzing={lens.isAnalyzing}
              />
            </div>
          )}

          {lens.isAnalyzing && (
            <div className="flex min-h-dvh items-center justify-center px-4 pb-24 pt-20">
              <ThinkingMotion locale={lens.locale} />
            </div>
          )}

          {lens.result && !lens.isAnalyzing && (
            <div className="mx-auto w-full max-w-[980px] px-4 pb-28 pt-20 md:px-8 lg:pt-24">
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
                similarImages={safeSimilarImages}
                isLoadingSimilar={isSimilarLoading}
                onShare={lens.handleShare}
                onAddInfo={canUseFollowUp ? lens.handleAddInfo : undefined}
                followUpPanel={followUpPanel}
              />
            </div>
          )}
        </section>

        <BottomBar
          theme={lens.theme}
          labels={{
            new: lens.t.new,
            share: lens.t.share,
          }}
          hasResult={Boolean(lens.result)}
          onNew={lens.resetEvaluation}
          onShare={lens.handleShare}
        />

        <CookieBar />
      </div>
    </main>
  );
}