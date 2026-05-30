"use client";

import AntiqueBackground from "@/components/antique-ai/AntiqueBackground";
import AuthScreen from "@/components/antique-ai/AuthScreen";
import BottomBar from "@/components/antique-ai/BottomBar";
import CookieBar from "@/components/antique-ai/CookieBar";
import EvaluationComposer from "@/components/antique-ai/EvaluationComposer";
import FollowUpEvaluationPanel from "@/components/antique-ai/FollowUpEvaluationPanel";
import HistorySidebar from "@/components/antique-ai/HistorySidebar";
import MobileTopBar from "@/components/antique-ai/MobileTopBar";
import ResultView from "@/components/antique-ai/ResultView";
import ThinkingMotion from "@/components/antique-ai/ThinkingMotion";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import type { Locale } from "./types";
import { useAntiqueLens } from "./useAntiqueLens";
import UserMenu from "@/components/antique-ai/UserMenu";



const SUPPORTED_AUTH_LOCALES: Locale[] = [
  "ar",
  "en",
  "fr",
  "hi",
  "fa",
  "tr",
  "ru",
  "ku",
];

const PENDING_OAUTH_LOCALE_KEY = "kishib:pending-oauth-locale";

function getSessionLocale(session: unknown): Locale | null {
  const record =
    session && typeof session === "object"
      ? (session as Record<string, unknown>)
      : null;
  const user =
    record?.user && typeof record.user === "object"
      ? (record.user as Record<string, unknown>)
      : null;
  const metadata =
    user?.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, unknown>)
      : null;
  const preferredLocale = metadata?.preferred_locale;

  return typeof preferredLocale === "string" &&
    SUPPORTED_AUTH_LOCALES.includes(preferredLocale as Locale)
    ? (preferredLocale as Locale)
    : null;
}

function getPendingOAuthLocale(): Locale | null {
  const savedLocale = window.localStorage.getItem(PENDING_OAUTH_LOCALE_KEY);

  return typeof savedLocale === "string" &&
    SUPPORTED_AUTH_LOCALES.includes(savedLocale as Locale)
    ? (savedLocale as Locale)
    : null;
}

function getSafeSimilarImages(lens: ReturnType<typeof useAntiqueLens>) {
  const result = lens.result as Record<string, unknown> | null;

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
  const [authReady, setAuthReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const timer = window.setTimeout(() => {
      try {
        const supabase = getSupabaseBrowserClient();

        void supabase.auth.getSession().then(({ data }) => {
          if (!isMounted) return;
          const pendingLocale = getPendingOAuthLocale();
          const sessionLocale = getSessionLocale(data.session);
          const preferredLocale = pendingLocale || sessionLocale;

          if (preferredLocale) {
            void lens.changeLocale(preferredLocale);
          }

          if (pendingLocale && data.session) {
            window.localStorage.removeItem(PENDING_OAUTH_LOCALE_KEY);
            void supabase.auth.updateUser({
              data: {
                ...data.session.user.user_metadata,
                preferred_locale: pendingLocale,
              },
            });
          }

          setHasSession(Boolean(data.session));
          setAuthReady(true);
        });

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          const pendingLocale = getPendingOAuthLocale();
          const sessionLocale = getSessionLocale(session);
          const preferredLocale = pendingLocale || sessionLocale;

          if (preferredLocale) {
            void lens.changeLocale(preferredLocale);
          }

          if (pendingLocale && session) {
            window.localStorage.removeItem(PENDING_OAUTH_LOCALE_KEY);
            void supabase.auth.updateUser({
              data: {
                ...session.user.user_metadata,
                preferred_locale: pendingLocale,
              },
            });
          }

          setHasSession(Boolean(session));
          setAuthReady(true);
        });

        unsubscribe = () => data.subscription.unsubscribe();
      } catch {
        if (!isMounted) return;
        setHasSession(false);
        setAuthReady(true);
      }
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
      unsubscribe?.();
    };
    
  }, []);

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

  function handleAuthenticated() {
    setHasSession(true);
    setAuthReady(true);
  }

  if (!authReady || !hasSession) {
    return (
      <>
        <AuthScreen
          locale={lens.locale}
          setLocale={lens.changeLocale}
          onAuthenticated={handleAuthenticated}
        />
        <CookieBar />
      </>
    );
  }

  return (
    <main
      dir={lens.t.dir}
      data-theme={lens.theme}
      className="relative min-h-dvh overflow-x-hidden bg-black text-white transition-colors duration-500"
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

      <div className="fixed right-4 top-4 z-[9999] hidden items-center gap-2 md:right-8 md:top-6 lg:flex">
  <UserMenu locale={lens.locale} setLocale={lens.changeLocale} />
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
