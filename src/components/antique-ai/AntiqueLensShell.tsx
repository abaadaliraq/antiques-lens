"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import AntiqueBackground from "@/components/antique-ai/AntiqueBackground";
import AuthScreen from "@/components/antique-ai/AuthScreen";
import BottomBar from "@/components/antique-ai/BottomBar";
import CompleteProfileModal from "@/components/antique-ai/CompleteProfileModal";
import CookieBar from "@/components/antique-ai/CookieBar";
import EvaluationComposer from "@/components/antique-ai/EvaluationComposer";
import FollowUpEvaluationPanel from "@/components/antique-ai/FollowUpEvaluationPanel";
import ThinkingMotion from "@/components/antique-ai/ThinkingMotion";
import KishibLoader from "@/components/antique-ai/KishibLoader";
import NotificationsButton from "@/components/antique-ai/NotificationsButton";
import PlatformNewsTicker from "@/components/antique-ai/PlatformNewsTicker";
import ResultView from "@/components/antique-ai/ResultView";
import SubscriptionModal from "@/components/antique-ai/SubscriptionModal";
import UserMenu from "@/components/antique-ai/UserMenu";
import {
  buildReportFileName,
  createReportPdfBlob,
  createReportPngBlob,
  shareOrDownloadFile,
} from "@/components/antique-ai/reportExport";
import {
  ensureCurrentUserProfile,
  PROFILE_UPDATED_EVENT,
  type UserProfile,
} from "@/lib/profilesSupabase";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  SUPPORTED_LOCALES as SUPPORTED_AUTH_LOCALES,
  isRtlLocale,
} from "@/i18n/common";
import { Coins, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatArchiveDate, type ArchiveItem } from "./archiveStore";
import type { Locale, SimilarImageResult } from "./types";
import { useAntiqueLens } from "./useAntiqueLens";
import { useUserActivityHeartbeat } from "./useUserActivityHeartbeat";

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

function isHouseStoreImage(item: SimilarImageResult) {
  const sourceText = `${item.source || ""} ${item.link || ""} ${item.imageUrl || ""}`
    .toLowerCase();

  return (
    item.isHouseOfAntiques === true ||
    sourceText.includes("house_store") ||
    sourceText.includes("house of antiques") ||
    sourceText.includes("houseofantiques.store")
  );
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
    const externalSimilarImages = lens.similarImages.filter(
      (item: SimilarImageResult) => !isHouseStoreImage(item),
    );
    if (externalSimilarImages.length > 0) return externalSimilarImages;
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
    return restoredSimilarImages.filter((item) => !isHouseStoreImage(item));
  }

  return [];
}

function homeCopy(locale: Locale) {
  const text = {
    ar: { eyebrow: "KISHIB", title: "KISHIB", slogan: "Scan. Value. Verify.", collection: "مجموعتي", latest: "آخر التقييمات", empty: "لا توجد تقييمات بعد" },
    en: { eyebrow: "KISHIB", title: "KISHIB", slogan: "Scan. Value. Verify.", collection: "My collection", latest: "Latest evaluations", empty: "No evaluations yet" },
    fr: { eyebrow: "KISHIB", title: "KISHIB", slogan: "Scan. Value. Verify.", collection: "Ma collection", latest: "Dernières évaluations", empty: "Aucune évaluation" },
    hi: { eyebrow: "KISHIB", title: "KISHIB", slogan: "Scan. Value. Verify.", collection: "मेरा संग्रह", latest: "नवीनतम मूल्यांकन", empty: "अभी कोई मूल्यांकन नहीं" },
    fa: { eyebrow: "KISHIB", title: "KISHIB", slogan: "Scan. Value. Verify.", collection: "مجموعه من", latest: "آخرین ارزیابی‌ها", empty: "هنوز ارزیابی وجود ندارد" },
    tr: { eyebrow: "KISHIB", title: "KISHIB", slogan: "Scan. Value. Verify.", collection: "Koleksiyonum", latest: "Son değerlendirmeler", empty: "Henüz değerlendirme yok" },
    ru: { eyebrow: "KISHIB", title: "KISHIB", slogan: "Scan. Value. Verify.", collection: "Моя коллекция", latest: "Последние оценки", empty: "Оценок пока нет" },
    ku: { eyebrow: "KISHIB", title: "KISHIB", slogan: "Scan. Value. Verify.", collection: "کۆمەڵەکەم", latest: "دوایین هەڵسەنگاندن", empty: "هێشتا هەڵسەنگاندن نییە" },
    es: { eyebrow: "KISHIB", title: "KISHIB", slogan: "Scan. Value. Verify.", collection: "Mi colección", latest: "Últimas evaluaciones", empty: "Todavía no hay evaluaciones" },
  } satisfies Record<Locale, Record<string, string>>;

  return text[locale] || text.en;
}
function getMetalPricesNavLabel(locale: Locale) {
  const labels: Record<Locale, string> = {
    ar: "بورصة المعادن",
    en: "Metal Prices",
    fr: "Prix des métaux",
    hi: "धातु कीमतें",
    fa: "قیمت فلزات",
    tr: "Metal fiyatları",
    ru: "Цены на металлы",
    ku: "نرخی کانزاکان",
    es: "Precios de metales",
  };

  return labels[locale] ?? labels.en;
}

function getHomeInteractionCopy(locale: Locale) {
  const labels: Record<
    Locale,
    {
      deleteConfirm: string;
      translating: string;
      archiveLoading: string;
      archiveRefreshing: string;
      archiveLoadMore: string;
      archiveLoadingMore: string;
      addInfo: string;
    }
  > = {
    ar: {
      deleteConfirm: "هل تريد حذف هذه القطعة من الأرشيف؟",
      translating: "جاري ترجمة التقرير...",
      archiveLoading: "جارٍ تحميل أرشيفك...",
      archiveRefreshing: "جارٍ تحديث الأرشيف...",
      archiveLoadMore: "تحميل المزيد",
      archiveLoadingMore: "جارٍ التحميل...",
      addInfo: "إضافة معلومة",
    },
    en: {
      deleteConfirm: "Delete this item from your collection?",
      translating: "Translating report...",
      archiveLoading: "Loading your archive...",
      archiveRefreshing: "Refreshing archive...",
      archiveLoadMore: "Load more",
      archiveLoadingMore: "Loading...",
      addInfo: "Add Info",
    },
    ku: {
      deleteConfirm: "دەتەوێت ئەم پارچەیە لە کۆمەڵەکەت بسڕیتەوە؟",
      translating: "ڕاپۆرت وەردەگێڕدرێت...",
      archiveLoading: "ئەرشیفەکەت بار دەکرێت...",
      archiveRefreshing: "ئەرشیف نوێ دەکرێتەوە...",
      archiveLoadMore: "زیاتر باربکە",
      archiveLoadingMore: "بارکردن...",
      addInfo: "زانیاری زیاد بکە",
    },
    fr: {
      deleteConfirm: "Supprimer cette pièce de votre collection ?",
      translating: "Traduction du rapport...",
      archiveLoading: "Chargement de votre archive...",
      archiveRefreshing: "Actualisation de l’archive...",
      archiveLoadMore: "Charger plus",
      archiveLoadingMore: "Chargement...",
      addInfo: "Ajouter info",
    },
    hi: {
      deleteConfirm: "क्या इस वस्तु को अपने संग्रह से हटाना चाहते हैं?",
      translating: "रिपोर्ट का अनुवाद हो रहा है...",
      archiveLoading: "आपका संग्रह लोड हो रहा है...",
      archiveRefreshing: "संग्रह रीफ़्रेश हो रहा है...",
      archiveLoadMore: "और लोड करें",
      archiveLoadingMore: "लोड हो रहा है...",
      addInfo: "जानकारी जोड़ें",
    },
    fa: {
      deleteConfirm: "آیا می‌خواهید این قطعه را از مجموعه خود حذف کنید؟",
      translating: "در حال ترجمه گزارش...",
      archiveLoading: "در حال بارگذاری آرشیو شما...",
      archiveRefreshing: "در حال به‌روزرسانی آرشیو...",
      archiveLoadMore: "بارگذاری بیشتر",
      archiveLoadingMore: "در حال بارگذاری...",
      addInfo: "افزودن اطلاعات",
    },
    tr: {
      deleteConfirm: "Bu parçayı koleksiyonunuzdan silmek istiyor musunuz?",
      translating: "Rapor çevriliyor...",
      archiveLoading: "Arşiviniz yükleniyor...",
      archiveRefreshing: "Arşiv yenileniyor...",
      archiveLoadMore: "Daha fazla yükle",
      archiveLoadingMore: "Yükleniyor...",
      addInfo: "Bilgi ekle",
    },
    ru: {
      deleteConfirm: "Удалить этот предмет из вашей коллекции?",
      translating: "Перевод отчета...",
      archiveLoading: "Загрузка вашего архива...",
      archiveRefreshing: "Обновление архива...",
      archiveLoadMore: "Загрузить ещё",
      archiveLoadingMore: "Загрузка...",
      addInfo: "Добавить информацию",
    },
    es: {
      deleteConfirm: "¿Quieres eliminar esta pieza de tu colección?",
      translating: "Traduciendo el informe...",
      archiveLoading: "Cargando tu archivo...",
      archiveRefreshing: "Actualizando el archivo...",
      archiveLoadMore: "Cargar más",
      archiveLoadingMore: "Cargando...",
      addInfo: "Añadir información",
    },
  };

  return labels[locale] || labels.en;
}
export default function AntiqueLensShell() {
  const router = useRouter();
  const lens = useAntiqueLens();
  const [hasSession, setHasSession] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSharingReport, setIsSharingReport] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  async function refreshProfile({ silent = false }: { silent?: boolean } = {}) {
    try {
      if (!silent) setProfileReady(false);
      const result = await ensureCurrentUserProfile();
      setProfile(result.profile);
      setProfileComplete(result.complete);
    } catch {
      console.warn("Required profile load skipped.");
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
            void lens.refreshUsageStatus();
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
            void lens.refreshUsageStatus();
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
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const sessionIsActive = Boolean(data.session);

        cacheAuthSession(sessionIsActive);
        setHasSession(sessionIsActive);
        setAuthReady(true);

        if (sessionIsActive) {
          await refreshProfile({ silent: true });
        } else {
          setProfile(null);
          setProfileComplete(false);
          setProfileReady(true);
        }
      } catch {
        console.warn("Visible app session restore skipped.");
      } finally {
        isRestoring = false;
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

  const currentPage = lens.isSubscriptionModalOpen
    ? "pricing"
    : lens.isAnalyzing
      ? "evaluation"
      : lens.result
        ? "result"
        : "home";

  useUserActivityHeartbeat({
    enabled: hasSession && profileComplete,
    currentPage,
    deviceLocale: String(lens.locale),
  });

  if (!authReady) {
    return (
      <main
        dir={lens.t.dir}
        data-theme={lens.theme ?? "light"}
        className="relative min-h-dvh overflow-hidden kishib-bg-home text-[#241913]"
      >
        <AntiqueBackground />
        <KishibLoader label="loading..." />
      </main>
    );
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
    return (
      <main
        dir={lens.t.dir}
        data-theme={lens.theme ?? "light"}
        className="relative min-h-dvh overflow-hidden kishib-bg-home text-[#241913]"
      >
        <AntiqueBackground />
        <KishibLoader label="loading..." />
      </main>
    );
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

  if (lens.isAnalyzing) {
    return (
      <main
        dir={lens.t.dir}
        data-theme={lens.theme ?? "light"}
        className="relative min-h-dvh overflow-hidden kishib-bg-home text-[#241913]"
      >
        <AntiqueBackground />
        <div className="relative z-10 min-h-dvh">
          <ThinkingMotion
            locale={lens.locale}
            imagePreview={lens.imagePreview}
            cancelLabel={lens.t.cancelAnalysis}
            cancellingLabel={lens.t.cancellingAnalysis}
            isCancellingAnalysis={lens.isCancellingAnalysis}
            onCancelAnalysis={lens.cancelAnalysis}
          />
        </div>
      </main>
    );
  }

  const safeSimilarImages = getSafeSimilarImages(lens);
  const isSimilarLoading =
    Boolean(lens.isLoadingSimilar) && safeSimilarImages.length === 0;
  const canUseFollowUp = Boolean(
    lens.result && !lens.followUpOpen,
  );
  const copy = homeCopy(lens.locale);
  const latestItems = lens.history;
  const showHomeTicker = !lens.result;
  const isHomeRtl = isRtlLocale(lens.locale);
  const metalPricesLabel = lens.t.metalPrices || getMetalPricesNavLabel(lens.locale);
  const statusMessage = exportMessage || lens.analysisNotice;
  const homeInteractionCopy = getHomeInteractionCopy(lens.locale);

  function handleDeleteArchiveItem(id: string) {
    const confirmed = window.confirm(homeInteractionCopy.deleteConfirm);

    if (!confirmed) return;

    lens.deleteHistoryItem(id);
  }

  function getReportExportCopy() {
    const copyByLocale: Record<Locale, {
      title: string;
      text: string;
      imageShareText: string;
      pdf: string;
      print: string;
      preparingReport: string;
      reportReady: string;
      missing: string;
      reportImageFailed: string;
      pdfGenerationFailed: string;
      printFailed: string;
      shareFailed: string;
    }> = {
      ar: { title: lens.result?.title || "KISHIB", text: "تقرير تقييمي من KISHIB", imageShareText: "عندك قطعة قديمة؟ اكتشف قصتها وقيمتها مع KISHIB\n\nhttps://play.google.com/store/apps/details?id=com.kishib.app", pdf: "PDF", print: "طباعة / حفظ", preparingReport: "جارٍ تجهيز التقرير...", reportReady: "تم تجهيز التقرير", missing: "تعذر العثور على نسخة التقرير للتصدير.", reportImageFailed: "تعذر إنشاء صورة التقرير.", pdfGenerationFailed: "تعذر إنشاء ملف PDF.", printFailed: "تعذر تجهيز الطباعة.", shareFailed: "تعذر مشاركة الملف." },
      en: { title: lens.result?.title || "KISHIB", text: "My KISHIB evaluation report", imageShareText: "Have an old piece? Discover its story and value with KISHIB\n\nhttps://play.google.com/store/apps/details?id=com.kishib.app", pdf: "PDF", print: "Print / Save", preparingReport: "Preparing report...", reportReady: "Report is ready", missing: "The export report could not be found.", reportImageFailed: "Could not create the report image.", pdfGenerationFailed: "Could not create the PDF file.", printFailed: "Could not prepare printing.", shareFailed: "Could not share the file." },
      ku: { title: lens.result?.title || "KISHIB", text: "ڕاپۆرتی هەڵسەنگاندنی KISHIB", imageShareText: "پارچەیەکی کۆنت هەیە؟ چیرۆک و بەهای لەگەڵ KISHIB بدۆزەرەوە\n\nhttps://play.google.com/store/apps/details?id=com.kishib.app", pdf: "PDF", print: "چاپ / پاشەکەوت", preparingReport: "ڕاپۆرت ئامادە دەکرێت...", reportReady: "ڕاپۆرت ئامادەیە", missing: "نەتوانرا وەشانی ڕاپۆرت بۆ هەناردن بدۆزرێتەوە.", reportImageFailed: "نەتوانرا وێنەی ڕاپۆرت دروست بکرێت.", pdfGenerationFailed: "نەتوانرا فایلێکی PDF دروست بکرێت.", printFailed: "نەتوانرا چاپ ئامادە بکرێت.", shareFailed: "نەتوانرا فایل هاوبەش بکرێت." },
      fr: { title: lens.result?.title || "KISHIB", text: "Mon rapport d’évaluation KISHIB", imageShareText: "Vous avez un objet ancien ? Découvrez son histoire et sa valeur avec KISHIB\n\nhttps://play.google.com/store/apps/details?id=com.kishib.app", pdf: "PDF", print: "Imprimer / Enregistrer", preparingReport: "Préparation du rapport...", reportReady: "Le rapport est prêt", missing: "Le rapport d’export est introuvable.", reportImageFailed: "Impossible de créer l’image du rapport.", pdfGenerationFailed: "Impossible de créer le fichier PDF.", printFailed: "Impossible de préparer l’impression.", shareFailed: "Impossible de partager le fichier." },
      hi: { title: lens.result?.title || "KISHIB", text: "मेरी KISHIB मूल्यांकन रिपोर्ट", imageShareText: "क्या आपके पास कोई पुरानी वस्तु है? KISHIB के साथ उसकी कहानी और कीमत जानें\n\nhttps://play.google.com/store/apps/details?id=com.kishib.app", pdf: "PDF", print: "प्रिंट / सहेजें", preparingReport: "रिपोर्ट तैयार हो रही है...", reportReady: "रिपोर्ट तैयार है", missing: "निर्यात रिपोर्ट नहीं मिली.", reportImageFailed: "रिपोर्ट की छवि नहीं बन सकी.", pdfGenerationFailed: "PDF फ़ाइल नहीं बन सकी.", printFailed: "प्रिंट तैयार नहीं हो सका.", shareFailed: "फ़ाइल साझा नहीं हो सकी." },
      fa: { title: lens.result?.title || "KISHIB", text: "گزارش ارزیابی KISHIB", imageShareText: "یک قطعه قدیمی دارید؟ داستان و ارزش آن را با KISHIB کشف کنید\n\nhttps://play.google.com/store/apps/details?id=com.kishib.app", pdf: "PDF", print: "چاپ / ذخیره", preparingReport: "در حال آماده‌سازی گزارش...", reportReady: "گزارش آماده است", missing: "نسخه خروجی گزارش پیدا نشد.", reportImageFailed: "ایجاد تصویر گزارش ممکن نشد.", pdfGenerationFailed: "ایجاد فایل PDF ممکن نشد.", printFailed: "آماده‌سازی چاپ ممکن نشد.", shareFailed: "اشتراک‌گذاری فایل ممکن نشد." },
      tr: { title: lens.result?.title || "KISHIB", text: "KISHIB değerlendirme raporum", imageShareText: "Eski bir parçanız mı var? Hikâyesini ve değerini KISHIB ile keşfedin\n\nhttps://play.google.com/store/apps/details?id=com.kishib.app", pdf: "PDF", print: "Yazdır / Kaydet", preparingReport: "Rapor hazırlanıyor...", reportReady: "Rapor hazır", missing: "Dışa aktarılacak rapor bulunamadı.", reportImageFailed: "Rapor görseli oluşturulamadı.", pdfGenerationFailed: "PDF dosyası oluşturulamadı.", printFailed: "Yazdırma hazırlanamadı.", shareFailed: "Dosya paylaşılamadı." },
      ru: { title: lens.result?.title || "KISHIB", text: "Мой отчет оценки KISHIB", imageShareText: "У вас есть старинная вещь? Узнайте её историю и ценность с KISHIB\n\nhttps://play.google.com/store/apps/details?id=com.kishib.app", pdf: "PDF", print: "Печать / сохранить", preparingReport: "Подготовка отчета...", reportReady: "Отчет готов", missing: "Версия отчета для экспорта не найдена.", reportImageFailed: "Не удалось создать изображение отчета.", pdfGenerationFailed: "Не удалось создать PDF-файл.", printFailed: "Не удалось подготовить печать.", shareFailed: "Не удалось поделиться файлом." },
      es: { title: lens.result?.title || "KISHIB", text: "Mi informe de evaluación KISHIB", imageShareText: "¿Tienes una pieza antigua? Descubre su historia y su valor con KISHIB\n\nhttps://play.google.com/store/apps/details?id=com.kishib.app", pdf: "PDF", print: "Imprimir / Guardar", preparingReport: "Preparando informe...", reportReady: "El informe está listo", missing: "No se encontró el informe para exportar.", reportImageFailed: "No se pudo crear la imagen del informe.", pdfGenerationFailed: "No se pudo crear el archivo PDF.", printFailed: "No se pudo preparar la impresión.", shareFailed: "No se pudo compartir el archivo." },
    };

    return copyByLocale[lens.locale] || copyByLocale.en;
  }

  function getReportElement() {
    return document.querySelector<HTMLElement>(
      ".report-print-area .antique-report-document",
    );
  }

  function isLikelyShareCancel(error: unknown) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message || "")
        : String(error || "");

    return /cancel|abort|dismiss|canceled|cancelled/i.test(message);
  }

  function showExportMessage(message: string) {
    setExportMessage(message);
    window.setTimeout(() => {
      setExportMessage((current) => (current === message ? "" : current));
    }, 2_400);
  }

  async function handleShareReportImage() {
    if (isSharingReport) return;

    const copy = getReportExportCopy();
    const report = getReportElement();

    if (!report) {
      showExportMessage(copy.missing);
      return;
    }

    try {
      setIsSharingReport(true);
      setExportMessage(copy.preparingReport);
      const blob = await createReportPngBlob(report);

      await shareOrDownloadFile({
        blob,
        fileName: buildReportFileName(Capacitor.isNativePlatform() ? "jpg" : "png"),
        title: copy.title,
        text: copy.imageShareText,
        dialogTitle: lens.t.share,
        mimeType: Capacitor.isNativePlatform() ? "image/jpeg" : "image/png",
        action: "share",
      });

      showExportMessage(copy.reportReady);
    } catch (error) {
      if (!isLikelyShareCancel(error)) {
        console.error("[Report Export][Share Button]", error);
        showExportMessage(copy.reportImageFailed || copy.shareFailed);
      }
    } finally {
      setIsSharingReport(false);
    }
  }

  async function handleSaveReportPdf() {
    if (isSavingPdf) return;

    const copy = getReportExportCopy();
    const report = getReportElement();

    if (!report) {
      showExportMessage(copy.missing);
      return;
    }

    try {
      setIsSavingPdf(true);
      setExportMessage(copy.preparingReport);
      const blob = await createReportPdfBlob(report);

      await shareOrDownloadFile({
        blob,
        fileName: buildReportFileName("pdf"),
        title: copy.title,
        text: copy.text,
        dialogTitle: copy.pdf,
        mimeType: "application/pdf",
        action: "pdf",
      });

      showExportMessage(copy.reportReady);
    } catch (error) {
      if (!isLikelyShareCancel(error)) {
        console.error("[Report Export][PDF Button]", error);
        showExportMessage(copy.pdfGenerationFailed);
      }
    } finally {
      setIsSavingPdf(false);
    }
  }

  async function handlePrintReport() {
    if (isPreparingPrint) return;

    const copy = getReportExportCopy();
    const report = getReportElement();

    if (!report) {
      showExportMessage(copy.missing);
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      window.print();
      return;
    }

    try {
      setIsPreparingPrint(true);
      setExportMessage(copy.preparingReport);
      const blob = await createReportPdfBlob(report);

      await shareOrDownloadFile({
        blob,
        fileName: buildReportFileName("pdf"),
        title: copy.title,
        text: copy.text,
        dialogTitle: copy.print,
        mimeType: "application/pdf",
        action: "print",
      });

      showExportMessage(copy.reportReady);
    } catch (error) {
      if (!isLikelyShareCancel(error)) {
        console.error("[Report Export][Print Button]", error);
        showExportMessage(copy.printFailed);
      }
    } finally {
      setIsPreparingPrint(false);
    }
  }

  const followUpPanel =
    lens.followUpOpen ? (
      <FollowUpEvaluationPanel
        locale={lens.locale}
        error={lens.error}
        followUpText={lens.followUpText}
        followUpPreviews={lens.followUpPreviews}
        isFollowUpAnalyzing={lens.isFollowUpAnalyzing}
        isReadingFollowUpImage={lens.isReadingFollowUpImage}
        chatMessages={lens.chatMessages}
        chatUsedTurns={lens.chatUsedTurns}
        chatMaxTurns={lens.chatMaxTurns}
        setFollowUpText={lens.setFollowUpText}
        handleFollowUpImageChange={lens.handleFollowUpImageChange}
        removeFollowUpImageAt={lens.removeFollowUpImageAt}
        handleFollowUpAnalyze={lens.handleFollowUpAnalyze}
        handleFinalSummary={lens.handleFinalSummary}
        handleSuggestionClick={lens.handleSuggestionClick}
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
        {showHomeTicker ? (
          <div className="kishib-app-chrome fixed inset-x-0 top-0 z-50">
            <PlatformNewsTicker locale={lens.locale} />
          </div>
        ) : null}

        {showHomeTicker ? (
          <div
            dir="ltr"
            className="kishib-app-chrome fixed inset-x-0 top-[34px] z-40 flex items-center justify-between gap-2 border-y border-white/10 bg-[#241913]/20 px-2 py-1.5 shadow-[0_8px_22px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:top-[34px] sm:px-3"
          >
            {isHomeRtl ? (
              <Link
                href="/metal-prices"
                className="inline-flex h-9 max-w-[48vw] shrink-0 items-center gap-1.5 rounded-full border border-[#dcc18a]/35 bg-[#fff4e2]/12 px-3 text-[11px] font-bold text-[#fff4e2] transition hover:bg-[#fff4e2]/18 sm:max-w-none sm:text-[12px]"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#dcc18a]/20 text-[#f3d99b]">
                  <Coins className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{metalPricesLabel}</span>
              </Link>
            ) : (
              <div className="flex shrink-0 items-center gap-1.5">
                <NotificationsButton locale={lens.locale} compact />
                <UserMenu
                  locale={lens.locale}
                  setLocale={lens.changeLocale}
                  compact
                />
              </div>
            )}

            {isHomeRtl ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <NotificationsButton locale={lens.locale} compact />
                <UserMenu
                  locale={lens.locale}
                  setLocale={lens.changeLocale}
                  compact
                />
              </div>
            ) : (
              <Link
                href="/metal-prices"
                className="inline-flex h-9 max-w-[48vw] shrink-0 items-center gap-1.5 rounded-full border border-[#dcc18a]/35 bg-[#fff4e2]/12 px-3 text-[11px] font-bold text-[#fff4e2] transition hover:bg-[#fff4e2]/18 sm:max-w-none sm:text-[12px]"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#dcc18a]/20 text-[#f3d99b]">
                  <Coins className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{metalPricesLabel}</span>
              </Link>
            )}
          </div>
        ) : !lens.result ? (
          <>
           <div className="kishib-app-chrome fixed right-4 top-4 z-40 flex items-center gap-2 lg:right-8 lg:top-8">
              <NotificationsButton locale={lens.locale} />
              <UserMenu
                locale={lens.locale}
                setLocale={lens.changeLocale}
              />
            </div>

          </>
        ) : null}

        {lens.isTranslatingResult && (
          <div className="fixed inset-x-0 top-20 z-50 mx-auto flex w-fit items-center gap-3 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/92 px-5 py-3 text-[12px] font-medium text-[#735f4b] shadow-[0_16px_38px_rgba(62,39,22,0.12)] backdrop-blur-2xl">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#b88a3d]" />
            <span>
              {homeInteractionCopy.translating}
            </span>
          </div>
        )}

        <section
          className={[
            "relative z-10 mx-auto min-h-dvh w-full max-w-md px-4 pb-24 sm:max-w-xl md:px-8 lg:max-w-6xl lg:px-10 lg:pb-28 xl:px-14",
            showHomeTicker ? "pt-20 lg:pt-24" : "pt-10 lg:pt-10",
          ].join(" ")}
        >
          {!lens.result && (
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
                    isAnalyzing={lens.isAnalyzing || lens.isCancellingAnalysis}
                    usageStatus={lens.usageStatus}
                    isUsageLoading={lens.isUsageLoading}
                    onOpenSubscription={lens.openSubscriptionModal}
                  />
                </div>
              </section>

              <LatestCollection
                title={copy.collection}
                subtitle={copy.latest}
                empty={copy.empty}
                items={latestItems}
                locale={lens.locale}
                isLoading={lens.isArchiveLoading}
                isRefreshing={lens.isArchiveRefreshing}
                error={lens.archiveError}
                hasMore={lens.archiveHasMore}
                isLoadingMore={lens.isArchiveLoadingMore}
                onLoadMore={lens.loadMoreArchiveItems}
                onOpenItem={lens.openHistoryItem}
                onDeleteItem={handleDeleteArchiveItem}
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
                  historicalReading: lens.t.historicalReading,
                  description: lens.t.description,
                  condition: lens.t.condition,
                  authenticity: lens.t.authenticity,
                  safeInitialChecks: lens.t.safeInitialChecks,
                  safeInitialChecksNote: lens.t.safeInitialChecksNote,
                  carePreservation: lens.t.carePreservation,
                  carePreservationNote: lens.t.carePreservationNote,
                  priceReason: lens.t.priceReason,
                  valueDrivers: lens.t.valueDrivers,
                  valueReducers: lens.t.valueReducers,
                  similar: lens.t.similar,
                  similarHint: lens.t.similarHint,
                  soon: lens.t.soon,
                  neededPhotos: lens.t.neededPhotos,
                  followUp: lens.t.followUp,
                  notice: lens.t.notice,
                  addInfo: lens.t.addInfo,
                }}
                result={lens.result}
                imagePreview={lens.imagePreview}
                imagePreviews={lens.imagePreviews}
                similarImages={safeSimilarImages}
                isLoadingSimilar={isSimilarLoading}
                userNote={lens.prompt}
                followUpPanel={followUpPanel}
                onBack={lens.resetEvaluation}
                onSavePdf={() => void handleSaveReportPdf()}
                onPrintReport={() => void handlePrintReport()}
                isSavingPdf={isSavingPdf}
                isPreparingPrint={isPreparingPrint}
              />
            </div>
          )}
        </section>

       <div className="kishib-app-chrome">
  <BottomBar
    labels={{
                  new: lens.t.new,
                  share: lens.t.share,
                  pdf: getReportExportCopy().pdf,
      addInfo: lens.t.addInfo || homeInteractionCopy.addInfo,
    }}
    hasResult={Boolean(lens.result)}
    onNew={lens.resetEvaluation}
    onShare={() => void handleShareReportImage()}
    onPdf={() => void handleSaveReportPdf()}
    onAddInfo={canUseFollowUp ? lens.handleAddInfo : undefined}
    isSharing={isSharingReport}
    isPdfLoading={isSavingPdf}
  />
</div>

        {statusMessage ? (
          <div className="fixed inset-x-4 bottom-[calc(5.2rem+env(safe-area-inset-bottom))] z-[70] mx-auto max-w-sm rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/95 px-4 py-3 text-center text-[12px] font-semibold text-[#735f4b] shadow-[0_14px_34px_rgba(62,39,22,0.16)] backdrop-blur-xl">
            {statusMessage}
          </div>
        ) : null}

        <SubscriptionModal
          open={lens.isSubscriptionModalOpen}
          locale={lens.locale}
          onClose={lens.closeSubscriptionModal}
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
  locale,
  isLoading,
  isRefreshing,
  error,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onOpenItem,
  onDeleteItem,
}: {
  title: string;
  subtitle: string;
  empty: string;
  items: ArchiveItem[];
  locale: Locale;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onOpenItem: (item: ArchiveItem) => void;
  onDeleteItem: (id: string) => void;
}) {
  const archiveCopy = getHomeInteractionCopy(locale);

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

      {isLoading ? (
        <div className="rounded-[18px] border border-[#d2b98f] bg-[#fff4e2]/80 px-4 py-5 text-sm font-semibold text-[#735f4b] lg:max-w-md">
          {archiveCopy.archiveLoading}
        </div>
      ) : error ? (
        <div className="rounded-[18px] border border-[#a23b2a]/25 bg-[#fff2ed]/90 px-4 py-5 text-sm font-semibold text-[#8f2e24] lg:max-w-md">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[18px] border border-[#d2b98f] bg-[#fff4e2]/80 px-4 py-5 text-sm text-[#735f4b] lg:max-w-md">
          {empty}
        </div>
      ) : (
        <>
          {isRefreshing ? (
            <p className="mb-2 text-[11px] font-semibold text-[#dcc18a]">
              {archiveCopy.archiveRefreshing}
            </p>
          ) : null}
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
          {hasMore && onLoadMore ? (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="mt-4 h-10 rounded-full border border-[#dcc18a]/55 bg-[#fff4e2]/88 px-5 text-[12px] font-bold text-[#6d241d] shadow-[0_12px_30px_rgba(62,39,22,0.12)] transition hover:bg-[#fff4e2] disabled:cursor-wait disabled:opacity-60"
            >
              {isLoadingMore
                ? archiveCopy.archiveLoadingMore
                : archiveCopy.archiveLoadMore}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}



