"use client";

import AntiqueBackground from "@/components/antique-ai/AntiqueBackground";
import AuthScreen from "@/components/antique-ai/AuthScreen";
import BottomBar from "@/components/antique-ai/BottomBar";
import CookieBar from "@/components/antique-ai/CookieBar";
import EvaluationComposer from "@/components/antique-ai/EvaluationComposer";
import FollowUpEvaluationPanel from "@/components/antique-ai/FollowUpEvaluationPanel";
import ResultView from "@/components/antique-ai/ResultView";
import ThinkingMotion from "@/components/antique-ai/ThinkingMotion";
import UserMenu from "@/components/antique-ai/UserMenu";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import type { HistoryItem, Locale } from "./types";
import { useAntiqueLens } from "./useAntiqueLens";

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
const AUTH_CACHE_KEY = "kishib:auth-session-active";

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

function cacheAuthSession(active: boolean) {
  if (active) {
    window.localStorage.setItem(AUTH_CACHE_KEY, "true");
    return;
  }

  window.localStorage.removeItem(AUTH_CACHE_KEY);
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

function homeCopy(locale: Locale) {
  const text = {
    ar: {
      eyebrow: "KISHIB",
      title: "KISHIB",
      slogan: "Scan. Value. Verify.",
      collection: "مجموعتي",
      latest: "آخر التقييمات",
      empty: "لا توجد تقييمات بعد",
    },
    en: {
      eyebrow: "KISHIB",
      title: "KISHIB",
      slogan: "Scan. Value. Verify.",
      collection: "My collection",
      latest: "Latest evaluations",
      empty: "No evaluations yet",
    },
    fr: {
      eyebrow: "KISHIB",
      title: "KISHIB",
      slogan: "Scan. Value. Verify.",
      collection: "Ma collection",
      latest: "Dernières évaluations",
      empty: "Aucune évaluation",
    },
    hi: {
      eyebrow: "KISHIB",
      title: "KISHIB",
      slogan: "Scan. Value. Verify.",
      collection: "मेरा संग्रह",
      latest: "हाल की जाँच",
      empty: "अभी कोई मूल्यांकन नहीं",
    },
    fa: {
      eyebrow: "KISHIB",
      title: "KISHIB",
      slogan: "Scan. Value. Verify.",
      collection: "مجموعه من",
      latest: "آخرین ارزیابی‌ها",
      empty: "هنوز ارزیابی وجود ندارد",
    },
    tr: {
      eyebrow: "KISHIB",
      title: "KISHIB",
      slogan: "Scan. Value. Verify.",
      collection: "Koleksiyonum",
      latest: "Son değerlendirmeler",
      empty: "Henüz değerlendirme yok",
    },
    ru: {
      eyebrow: "KISHIB",
      title: "KISHIB",
      slogan: "Scan. Value. Verify.",
      collection: "Моя коллекция",
      latest: "Последние оценки",
      empty: "Оценок пока нет",
    },
    ku: {
      eyebrow: "KISHIB",
      title: "KISHIB",
      slogan: "Scan. Value. Verify.",
      collection: "کۆمەڵەکەم",
      latest: "دوایین هەڵسەنگاندن",
      empty: "هێشتا هەڵسەنگاندن نییە",
    },
  } satisfies Record<Locale, Record<string, string>>;

  return text[locale] || text.en;
}

export default function AntiqueLensShell() {
  const lens = useAntiqueLens();
  const [hasSession, setHasSession] = useState(false);
  const [authReady, setAuthReady] = useState(false);

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

          cacheAuthSession(Boolean(data.session));
          setHasSession(Boolean(data.session));
          setAuthReady(true);
        });

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
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

          const sessionIsActive = Boolean(session) && event !== "SIGNED_OUT";

          cacheAuthSession(sessionIsActive);
          setHasSession(sessionIsActive);
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

  function handleAuthenticated() {
    cacheAuthSession(true);
    setHasSession(true);
    setAuthReady(true);
  }

  if (!authReady) {
    return <main className="min-h-dvh bg-black" />;
  }

  if (!hasSession) {
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

  const activeLocale = String(lens.locale);
  const safeSimilarImages = getSafeSimilarImages(lens);
  const isSimilarLoading =
    Boolean(lens.isLoadingSimilar) && safeSimilarImages.length === 0;
  const canUseFollowUp = Boolean(
    lens.result && !lens.followUpOpen && !lens.followUpUsed,
  );
  const copy = homeCopy(lens.locale);
  const latestItems = lens.history.slice(0, 4);

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
      data-theme={lens.theme ?? "dark"}
      className="relative min-h-dvh overflow-x-hidden bg-black text-[#F8FAFC]"
    >
      <AntiqueBackground />

      <div className="relative z-10 min-h-dvh">
        <div className="fixed right-4 top-4 z-40">
          <UserMenu locale={lens.locale} setLocale={lens.changeLocale} />
        </div>

        {lens.isTranslatingResult && (
          <div className="fixed inset-x-0 top-20 z-50 mx-auto flex w-fit items-center gap-3 rounded-full border border-[#22D3EE]/20 bg-[#07111F]/90 px-5 py-3 text-[12px] font-medium text-[#BAE6FD] shadow-2xl shadow-black/30 backdrop-blur-2xl">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#22D3EE]" />
            <span>
              {activeLocale === "en"
                ? "Translating report..."
                : activeLocale === "fr"
                  ? "Traduction du rapport..."
                  : activeLocale === "tr"
                    ? "Rapor çevriliyor..."
                    : "جاري ترجمة التقرير..."}
            </span>
          </div>
        )}

        <section className="relative z-10 mx-auto min-h-dvh w-full max-w-5xl px-4 pb-28 pt-24 md:px-8">
          {!lens.result && !lens.isAnalyzing && (
            <div className="mx-auto flex w-full max-w-[560px] flex-col gap-7">
              <div className="pt-4 text-center">
                <h1 className="text-4xl font-semibold leading-tight tracking-[0.08em] text-white sm:text-5xl">
                  {copy.title}
                </h1>
                <p className="mx-auto mt-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#67E8F9]/72">
                  {copy.slogan}
                </p>
              </div>

              <div id="kishib-evaluation-card">
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

              <LatestCollection
                title={copy.collection}
                subtitle={copy.latest}
                empty={copy.empty}
                items={latestItems}
                onOpenItem={lens.openHistoryItem}
              />
            </div>
          )}

          {lens.isAnalyzing && (
            <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
             <ThinkingMotion
  locale={lens.locale}
  imagePreview={lens.imagePreview ?? null}
/>
            </div>
          )}

          {lens.result && !lens.isAnalyzing && (
            <div className="mx-auto w-full max-w-[980px] pt-2">
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

function LatestCollection({
  title,
  subtitle,
  empty,
  items,
  onOpenItem,
}: {
  title: string;
  subtitle: string;
  empty: string;
  items: HistoryItem[];
  onOpenItem: (item: HistoryItem) => void;
}) {
  return (
    <section className="pb-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="mt-1 text-xs text-[#94A3B8]">{subtitle}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-[rgba(34,211,238,0.18)] bg-[#07111F]/70 px-4 py-5 text-sm text-[#94A3B8]">
          {empty}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenItem(item)}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-[#0B1220] text-start transition hover:border-[#22D3EE]/45"
            >
              <div className="aspect-square bg-black">
                {item.imagePreview ? (
                  <img
                    src={item.imagePreview}
                    alt={item.title}
                    className="h-full w-full object-cover opacity-90 transition group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-[#64748B]">
                    KISHIB
                  </div>
                )}
              </div>
              <p className="truncate px-3 py-3 text-xs font-medium text-[#E2E8F0]">
                {item.title}
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
