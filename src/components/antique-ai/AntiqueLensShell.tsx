"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import AntiqueBackground from "@/components/antique-ai/AntiqueBackground";
import AuthScreen from "@/components/antique-ai/AuthScreen";
import BottomBar from "@/components/antique-ai/BottomBar";
import CompleteProfileModal from "@/components/antique-ai/CompleteProfileModal";
import CookieBar from "@/components/antique-ai/CookieBar";
import EvaluationComposer from "@/components/antique-ai/EvaluationComposer";
import ExpertContactButton from "@/components/antique-ai/ExpertContactButton";
import FollowUpEvaluationPanel from "@/components/antique-ai/FollowUpEvaluationPanel";
import KishibLoader from "@/components/antique-ai/KishibLoader";
import PlatformNewsTicker from "@/components/antique-ai/PlatformNewsTicker";
import ResultView from "@/components/antique-ai/ResultView";
import ThinkingMotion from "@/components/antique-ai/ThinkingMotion";
import UserMenu from "@/components/antique-ai/UserMenu";
import { getMarketplaceNavLabel } from "@/lib/marketplaceI18n";
import {
  ensureCurrentUserProfile,
  PROFILE_UPDATED_EVENT,
  type UserProfile,
} from "@/lib/profilesSupabase";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Coins, Lock, ShoppingBag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatArchiveDate, type ArchiveItem } from "./archiveStore";
import type { Locale, SimilarImageResult } from "./types";
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
const USER_LOCALE_STORAGE_KEY = "antiques-lens:locale";
const AUTH_CACHE_KEY = "kishib:auth-session-active";
const NATIVE_AUTH_CALLBACK_URL = "com.kishib.app://auth/callback";

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

function getSavedUserLocale(): Locale | null {
  const savedLocale = window.localStorage.getItem(USER_LOCALE_STORAGE_KEY);

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
  const result = lens.result as
    | (Record<string, unknown> & {
        similar?: SimilarImageResult[];
        similarItems?: SimilarImageResult[];
        similarPhotos?: SimilarImageResult[];
        similarImages?: SimilarImageResult[];
        similarPieces?: SimilarImageResult[];
        imageMatches?: SimilarImageResult[];
        visualMatches?: SimilarImageResult[];
        storeMatches?: SimilarImageResult[];
        matches?: SimilarImageResult[];
        houseOfAntiquesMatches?: SimilarImageResult[];
        houseOfAntiques?: {
          matches?: SimilarImageResult[];
        };
      })
    | null;

  if (Array.isArray(lens.similarImages) && lens.similarImages.length > 0) {
    return lens.similarImages;
  }

  const restoredSimilarImages =
    result?.similarItems ||
    result?.similarPhotos ||
    result?.similarImages ||
    result?.imageMatches ||
    result?.visualMatches ||
    result?.storeMatches ||
    result?.matches ||
    result?.houseOfAntiquesMatches ||
    result?.houseOfAntiques?.matches ||
    result?.similar ||
    result?.similarPieces ||
    [];

  if (Array.isArray(restoredSimilarImages) && restoredSimilarImages.length > 0) {
    return restoredSimilarImages;
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

function getMetalPricesNavLabel(locale: Locale) {
  const labels: Record<Locale, string> = {
    ar: "بورصة المعادن",
    en: "Metal Prices",
    fr: "Prix des métaux",
    hi: "Metal Prices",
    fa: "قیمت فلزات",
    tr: "Metal Fiyatları",
    ru: "Цены на металлы",
    ku: "نرخی کانزاکان",
  };

  return labels[locale] ?? labels.en;
}

export default function AntiqueLensShell() {
  const router = useRouter();
  const lens = useAntiqueLens();
  const [hasSession, setHasSession] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appRestoring, setAppRestoring] = useState(false);

  async function refreshProfile() {
    try {
      setProfileReady(false);
      const result = await ensureCurrentUserProfile();
      setProfile(result.profile);
      setProfileComplete(result.complete);
    } catch (error) {
      console.error("Failed to load required profile", error);
      setProfile(null);
      setProfileComplete(false);
    } finally {
      setProfileReady(true);
    }
  }

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const timer = window.setTimeout(() => {
      try {
        const supabase = getSupabaseBrowserClient();

        void supabase.auth.getSession().then(({ data }) => {
          if (!isMounted) return;
          const pendingLocale = getPendingOAuthLocale();
          const savedUserLocale = getSavedUserLocale();
          const sessionLocale = getSessionLocale(data.session);
          const preferredLocale = pendingLocale || savedUserLocale || sessionLocale;

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

          const sessionIsActive = Boolean(data.session);

          cacheAuthSession(sessionIsActive);
          setHasSession(sessionIsActive);
          if (sessionIsActive) {
            void refreshProfile();
          } else {
            setProfile(null);
            setProfileComplete(false);
            setProfileReady(true);
          }
          setAuthReady(true);
        });

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          const pendingLocale = getPendingOAuthLocale();
          const savedUserLocale = getSavedUserLocale();
          const sessionLocale = getSessionLocale(session);
          const preferredLocale = pendingLocale || savedUserLocale || sessionLocale;

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
          if (sessionIsActive) {
            void refreshProfile();
          } else {
            setProfile(null);
            setProfileComplete(false);
            setProfileReady(true);
          }
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
    void refreshProfile();
  }

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const subscription = App.addListener("appUrlOpen", async ({ url }) => {
      console.log("Native appUrlOpen URL:", url);

      if (!url?.startsWith(NATIVE_AUTH_CALLBACK_URL)) return;

      try {
        const parsedUrl = new URL(url);
        const code = parsedUrl.searchParams.get("code");
        const supabase = getSupabaseBrowserClient();

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const sessionIsActive = Boolean(session);

        cacheAuthSession(sessionIsActive);
        setHasSession(sessionIsActive);
        setAuthReady(true);
        if (sessionIsActive) {
          void refreshProfile();
        }
        router.replace("/");
      } catch (error) {
        console.error("Native auth callback failed:", error);
        setAuthReady(true);
        router.replace("/");
      }
    });

    return () => {
      void subscription.then((listener) => listener.remove());
    };
  }, [router]);

  useEffect(() => {
    let isRestoring = false;
    let appStateSubscription: Promise<{ remove: () => Promise<void> }> | null = null;

    async function restoreVisibleSession() {
      if (isRestoring) return;

      isRestoring = true;
      setAppRestoring(true);

      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const sessionIsActive = Boolean(data.session);

        cacheAuthSession(sessionIsActive);
        setHasSession(sessionIsActive);
        setAuthReady(true);

        if (sessionIsActive) {
          await refreshProfile();
        } else {
          setProfile(null);
          setProfileComplete(false);
          setProfileReady(true);
        }
      } catch (error) {
        console.error("Failed to restore visible app session", error);
      } finally {
        isRestoring = false;
        setAppRestoring(false);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void restoreVisibleSession();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (Capacitor.isNativePlatform()) {
      appStateSubscription = App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          void restoreVisibleSession();
        }
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void appStateSubscription?.then((listener) => listener.remove());
    };
  }, []);

  useEffect(() => {
    function handleProfileUpdated() {
      void refreshProfile();
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () =>
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
  }, []);

  if (!authReady) {
    return <KishibLoader />;
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

  if (!profileReady) {
    return <KishibLoader />;
  }

  if (!profileComplete) {
    return (
      <main className="relative min-h-dvh overflow-hidden kishib-bg-auth">
        <CompleteProfileModal
          locale={lens.locale}
          profile={profile}
          onCompleted={() => void refreshProfile()}
        />
        <CookieBar />
      </main>
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
  const latestItems = lens.history;
  const showHomeTicker = !lens.result && !lens.isAnalyzing;

  function handleDeleteArchiveItem(id: string) {
    const confirmed = window.confirm(
      lens.locale === "en"
        ? "Delete this item from your collection?"
        : "هل تريد حذف هذه القطعة من الأرشيف؟",
    );

    if (!confirmed) return;

    lens.deleteHistoryItem(id);
  }

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
      data-theme={lens.theme ?? "light"}
      className={[
        "relative min-h-dvh overflow-x-hidden text-[#241913]",
        lens.result ? "kishib-bg-result" : "kishib-bg-home",
      ].join(" ")}
    >
      {!lens.result ? <AntiqueBackground /> : null}

      <div className="relative z-10 min-h-dvh">
        {appRestoring ? <KishibLoader overlay /> : null}

        {showHomeTicker ? (
<div className="kishib-app-chrome fixed inset-x-0 top-0 z-50">
            <PlatformNewsTicker locale={lens.locale} />
          </div>
        ) : null}
{showHomeTicker ? (
  <div className="kishib-app-chrome">
    <ExpertContactButton locale={lens.locale} />
  </div>
) : null}

        {showHomeTicker ? (
          <div
            dir="ltr"
            className="kishib-app-chrome fixed inset-x-0 top-[34px] z-40 flex items-center gap-2 border-y ... border-white/10 bg-[#241913]/18 px-2 py-1 shadow-[0_8px_22px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:top-[34px] sm:px-3"
          >
            <UserMenu
              locale={lens.locale}
              setLocale={lens.changeLocale}
              compact
            />

            <div
              dir={lens.t.dir}
              className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <button
                type="button"
                disabled
                aria-disabled="true"
                title={lens.t.soon}
                className="inline-flex h-7 shrink-0 cursor-not-allowed items-center gap-1 rounded-full px-1.5 text-[10.5px] font-normal text-white/90 opacity-90 sm:px-2 sm:text-[11px]"
              >
                <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-white/10 text-white/80">
                  <ShoppingBag className="h-2.5 w-2.5" />
                </span>
                {getMarketplaceNavLabel(lens.locale)}
                <Lock className="h-2.5 w-2.5 text-white/65" aria-hidden="true" />
              </button>

              <button
                type="button"
                disabled
                aria-disabled="true"
                title={lens.t.soon}
                className="inline-flex h-7 shrink-0 cursor-not-allowed items-center gap-1 rounded-full px-1.5 text-[10.5px] font-normal text-white/90 opacity-90 sm:px-2 sm:text-[11px]"
              >
                <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-white/10 text-white/80">
                  <Coins className="h-2.5 w-2.5" />
                </span>
                {getMetalPricesNavLabel(lens.locale)}
                <Lock className="h-2.5 w-2.5 text-white/65" aria-hidden="true" />
              </button>
            </div>

          </div>
        ) : (
          <>
           <div className="kishib-app-chrome fixed right-4 top-4 z-40 lg:right-8 lg:top-8">
              <UserMenu
                locale={lens.locale}
                setLocale={lens.changeLocale}
              />
            </div>

           <div className="kishib-app-chrome fixed left-3 top-3 z-40 flex max-w-[calc(100vw-7.25rem)] items-center gap-0.5 rounded-full border border-[#d2b98f]/20 bg-[#11100f]/28 p-0.5 shadow-[0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-2xl lg:left-8 lg:top-8 lg:gap-1 lg:p-1">
              <button
                type="button"
                disabled
                aria-disabled="true"
                title={lens.t.soon}
                className="inline-flex h-8 shrink-0 cursor-not-allowed items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-[#fff4e2]/55 opacity-75 sm:px-2.5 sm:text-xs lg:h-9 lg:gap-1.5 lg:px-3 lg:text-sm"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#fff4e2]/10 text-[#dcc18a] lg:h-6 lg:w-6">
                  <ShoppingBag className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                </span>
                {getMarketplaceNavLabel(lens.locale)}
                <Lock className="h-3 w-3 text-[#dcc18a]/80" aria-hidden="true" />
              </button>

              <button
                type="button"
                disabled
                aria-disabled="true"
                title={lens.t.soon}
                className="inline-flex h-8 shrink-0 cursor-not-allowed items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-[#fff4e2]/55 opacity-75 sm:px-2.5 sm:text-xs lg:h-9 lg:gap-1.5 lg:px-3 lg:text-sm"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#fff4e2]/10 text-[#dcc18a] lg:h-6 lg:w-6">
                  <Coins className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                </span>
                {getMetalPricesNavLabel(lens.locale)}
                <Lock className="h-3 w-3 text-[#dcc18a]/80" aria-hidden="true" />
              </button>
            </div>
          </>
        )}

        {lens.isTranslatingResult && (
          <div className="fixed inset-x-0 top-20 z-50 mx-auto flex w-fit items-center gap-3 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/92 px-5 py-3 text-[12px] font-medium text-[#735f4b] shadow-[0_16px_38px_rgba(62,39,22,0.12)] backdrop-blur-2xl">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#b88a3d]" />
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

        <section
          className={[
            "relative z-10 mx-auto min-h-dvh w-full max-w-md px-4 pb-24 sm:max-w-xl md:px-8 lg:max-w-6xl lg:px-10 lg:pb-28 xl:px-14",
            showHomeTicker ? "pt-20 lg:pt-24" : "pt-10 lg:pt-10",
          ].join(" ")}
        >
          {!lens.result && !lens.isAnalyzing && (
            <div className="mx-auto flex w-full max-w-[520px] flex-col gap-5 lg:max-w-6xl lg:gap-10">
              <section className="mx-auto w-full lg:max-w-[720px]">
                <div className="mb-5 text-center lg:text-center">
                  <h1 className="text-3xl font-semibold leading-tight tracking-[0.08em] text-[#fff4e2] sm:text-4xl lg:text-5xl">
                    {copy.title}
                  </h1>
                  <p className="mx-auto mt-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#dcc18a] lg:mx-auto lg:text-[11px]">
                    {copy.slogan}
                  </p>
                </div>

                <div id="kishib-evaluation-card" className="mx-auto w-full lg:max-w-[720px]">
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
                    handleTakePhoto={lens.handleTakePhoto}
                    removeImage={lens.removeImage}
                    removeImageAt={lens.removeImageAt}
                    handleAnalyze={lens.handleAnalyze}
                    isAnalyzing={lens.isAnalyzing}
                  />
                </div>
              </section>

              <LatestCollection
                title={copy.collection}
                subtitle={copy.latest}
                empty={copy.empty}
                items={latestItems}
                locale={lens.locale}
                onOpenItem={lens.openHistoryItem}
                onDeleteItem={handleDeleteArchiveItem}
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
            <div className="mx-auto w-full max-w-md pt-2 sm:max-w-xl lg:max-w-5xl xl:max-w-6xl">
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
                userNote={lens.prompt}
                onShare={lens.handleShare}
                onAddInfo={canUseFollowUp ? lens.handleAddInfo : undefined}
                followUpPanel={followUpPanel}
              />
            </div>
          )}
        </section>

       <div className="kishib-app-chrome">
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
</div>

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
  locale,
  onOpenItem,
  onDeleteItem,
}: {
  title: string;
  subtitle: string;
  empty: string;
  items: ArchiveItem[];
  locale: Locale;
  onOpenItem: (item: ArchiveItem) => void;
  onDeleteItem: (id: string) => void;
}) {
  return (
    <section className="mx-auto w-full pb-4 lg:max-w-6xl lg:pb-0">
      <div className="mb-3 flex items-end justify-between lg:mb-4">
        <div>
          <h2 className="text-base font-semibold text-[#fff4e2] lg:text-xl">
            {title}
          </h2>
          <p className="mt-1 text-xs text-[#dcc18a] lg:text-sm">{subtitle}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[18px] border border-[#d2b98f] bg-[#fff4e2]/80 px-4 py-5 text-sm text-[#735f4b] lg:max-w-md">
          {empty}
        </div>
      ) : (
        <div className="grid max-h-[520px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-4 lg:max-h-[calc(100dvh-430px)] lg:grid-cols-5 lg:gap-4 lg:pr-2 xl:grid-cols-6 2xl:grid-cols-7">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-[18px] border border-[#d2b98f] bg-[#fff4e2]/88 text-[#241913] shadow-[0_12px_28px_rgba(62,39,22,0.1)] transition hover:border-[#b88a3d]/60 lg:rounded-[20px]"
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteItem(item.id);
                }}
                className="absolute end-2 top-2 z-10 rounded-[10px] bg-[#fff4e2]/82 p-1.5 text-[#735f4b] backdrop-blur transition hover:bg-[#6d241d] hover:text-[#fff4e2]"
                aria-label="Delete archive item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onOpenItem(item)}
                className="block w-full text-start"
              >
                <div className="aspect-square bg-[#d9b59e]">
                  {item.imagePreview ? (
                    <img
                      src={item.imagePreview}
                      alt={item.title}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                      className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_center,rgba(184,138,61,0.2),rgba(255,244,226,0.92))] text-xs font-semibold tracking-[0.24em] text-[#735f4b]">
                      KISHIB
                    </div>
                  )}
                </div>

                <div className="px-3 py-3 lg:px-4">
                  <p className="truncate text-xs font-medium text-[#241913] lg:text-sm">
                    {item.title}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-[#735f4b] lg:text-[11px]">
                    {formatArchiveDate(item.createdAt, locale)}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-[#735f4b] lg:text-[11px]">
                    {[item.result?.itemType || item.result?.lookup, item.locale]
                      .filter(Boolean)
                      .join(" - ")}
                  </p>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
