"use client";

import ThinkingMotion from "@/components/antique-ai/ThinkingMotion";
import CookieBar from "@/components/antique-ai/CookieBar";
import HistorySidebar from "@/components/antique-ai/HistorySidebar";
import ResultView from "@/components/antique-ai/ResultView";
import GlassAtmosphere from "@/components/antique-ai/GlassAtmosphere";
import EvaluationComposer from "@/components/antique-ai/EvaluationComposer";
import BottomBar from "@/components/antique-ai/BottomBar";
import LanguagePills from "@/components/antique-ai/LanguagePills";
import ThemeToggle from "@/components/antique-ai/ThemeToggle";
import { useAntiqueLens } from "./useAntiqueLens";

export default function AntiqueLensShell() {
  const lens = useAntiqueLens();

  return (
    <main
      dir={lens.t.dir}
      data-theme={lens.theme}
      className={[
        "relative min-h-dvh overflow-hidden transition-colors duration-500",
        lens.theme === "light" ? "text-[#111318]" : "text-white",
      ].join(" ")}
    >
      <GlassAtmosphere theme={lens.theme} />

      <HistorySidebar
        open={lens.historyOpen}
        history={lens.history as any}
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
        onOpenItem={(item: any) => lens.openHistoryItem(item)}
        onClearHistory={lens.clearHistory}
      />

      <div className="fixed right-4 top-4 z-50 flex items-center gap-2 md:right-8 md:top-6">
        <LanguagePills
          locale={lens.locale}
          setLocale={lens.changeLocale}
          theme={lens.theme}
        />
        <ThemeToggle theme={lens.theme} onToggle={lens.toggleTheme} />
      </div>

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

        {lens.result && (
          <div className="mx-auto w-full max-w-[980px] px-4 pb-28 pt-20 md:px-8">
<ResultView
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
  }}
  result={lens.result}
  imagePreview={lens.imagePreview}
  imagePreviews={lens.imagePreviews}
  onShare={lens.handleShare}
/>
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
    </main>
  );
}