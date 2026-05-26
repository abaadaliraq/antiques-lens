"use client";

import AntiqueBackground from "@/components/antique-ai/AntiqueBackground";
import ThinkingMotion from "@/components/antique-ai/ThinkingMotion";
import CookieBar from "@/components/antique-ai/CookieBar";
import HistorySidebar from "@/components/antique-ai/HistorySidebar";
import MobileTopBar from "@/components/antique-ai/MobileTopBar";
import ResultView from "@/components/antique-ai/ResultView";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Archive,
  Camera,
  Gem,
  ImagePlus,
  Plus,
  Search,
  Send,
  Share2,
  Sparkles,
  X,
} from "lucide-react";

type Locale = "ar" | "en" | "ku" | "fr";

type AnalysisResult = {
  title: string;
  lookup: string;
  timePeriod: string;
  origin: string;
  material: string;
  style: string;
  condition: string;
  authenticity: string;
  estimatedValue: string;
  priceReasoning: string;
  history: string;
  valueDrivers: string[];
  valueReducers: string[];
  visualSearchKeywords: string[];
  neededPhotos: string[];
  followUpQuestion: string;
  confidence: number;
  confidenceNote: string;
  disclaimer: string;

  // fallback للنسخ القديمة إذا عندك نتائج محفوظة بالأرشيف
  description?: string;
  itemType?: string;
  priceRange?: string;
};

type HistoryItem = {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  imagePreview: string | null;
  result: AnalysisResult;
};

const HISTORY_KEY = "antiques-lens:history-v2";

const content = {
  ar: {
    dir: "rtl",
    new: "تقييم جديد",
    archive: "أرشيف القطع",
    emptyArchive: "لا توجد تقييمات بعد.",
    clearArchive: "مسح",
    openArchive: "الأرشيف",
    badge: "Antiques Lens",
    sub: "AI antique evaluator",
    title: "صوّر أي قطعة أنتيكة",
    hint: "ارفع صورة واضحة أو التقط صورة للقطعة، وسنحاول تحديد العمر، المادة، الحالة، السعر، والقطع المشابهة.",
    placeholder:
      "اكتب أي معلومة تعرفها: العمر، بلد الشراء، القياس، وجود ختم أو توقيع...",
    upload: "رفع صورة",
    camera: "الكاميرا",
    send: "تحليل",
    analyzing: "جاري التحليل...",
    emptyError: "أضف وصفاً أو ارفع صورة للقطعة أولاً.",
    imageReady: "الصورة مرفقة",
    footer: "لنتيجة أدق: صورة كاملة + صورة للختم أو التوقيع إن وجد.",
    result: "نتيجة أولية",
    age: "العمر / الحقبة",
    value: "السعر التقريبي",
    material: "المادة",
    origin: "المنشأ",
    lookup: "التعريف",
    description: "الوصف والتحليل",
    condition: "الحالة الظاهرة",
    authenticity: "مؤشرات الأصالة",
    priceReason: "سبب السعر",
    valueDrivers: "ما الذي يرفع القيمة؟",
    valueReducers: "ما الذي يخفض القيمة؟",
    similar: "قطع مشابهة",
    similarHint:
      "حالياً هذه كلمات بحث ذكية للعثور على قطع مشابهة. بعد ربط eBay ستظهر هنا صور وأسعار وروابط حقيقية.",
    soon: "قريباً eBay",
    neededPhotos: "صور مطلوبة لتقييم أدق",
    followUp: "السؤال التالي",
    confidence: "درجة الثقة",
    share: "مشاركة",
    addInfo: "أضف معلومات",
    notice: "التقييم استرشادي ولا يعتبر شهادة أصالة أو تسعيراً نهائياً.",
  },
  en: {
    dir: "ltr",
    new: "New evaluation",
    archive: "Pieces archive",
    emptyArchive: "No evaluations yet.",
    clearArchive: "Clear",
    openArchive: "Archive",
    badge: "Antiques Lens",
    sub: "AI antique evaluator",
    title: "Scan any antique object",
    hint: "Upload or capture a clear image, and we will estimate age, material, condition, value, and similar references.",
    placeholder:
      "Add anything you know: age, country of purchase, dimensions, mark, signature...",
    upload: "Upload image",
    camera: "Camera",
    send: "Analyze",
    analyzing: "Analyzing...",
    emptyError: "Add a description or upload an image first.",
    imageReady: "Image attached",
    footer: "For better accuracy: full image + mark or signature if available.",
    result: "Initial result",
    age: "Age / Period",
    value: "Estimated value",
    material: "Material",
    origin: "Origin",
    lookup: "Look up",
    description: "Description",
    condition: "Visible condition",
    authenticity: "Authenticity indicators",
    priceReason: "Price reasoning",
    valueDrivers: "What increases value?",
    valueReducers: "What reduces value?",
    similar: "Similar pieces",
    similarHint:
      "For now, these are smart search keywords. After connecting eBay, real images, prices, and links will appear here.",
    soon: "eBay soon",
    neededPhotos: "Photos needed",
    followUp: "Next question",
    confidence: "Confidence",
    share: "Share",
    addInfo: "Add info",
    notice:
      "This is an indicative evaluation, not an authenticity certificate or final appraisal.",
  },
  ku: {
    dir: "rtl",
    new: "هەڵسەنگاندنی نوێ",
    archive: "ئەرشیفی پارچەکان",
    emptyArchive: "هێشتا هیچ هەڵسەنگاندنێک نییە.",
    clearArchive: "سڕینەوە",
    openArchive: "ئەرشیف",
    badge: "Antiques Lens",
    sub: "AI antique evaluator",
    title: "هەر پارچەیەکی کۆن وێنە بگرە",
    hint: "وێنەیەکی ڕوون باربکە و هەوڵ دەدەین تەمەن، مادە، دۆخ، نرخ و هاوشێوەکانی دیاری بکەین.",
    placeholder:
      "هەر زانیارییەک دەزانیت بنووسە: تەمەن، وڵاتی کڕین، قەبارە، مۆر یان واژۆ...",
    upload: "بارکردنی وێنە",
    camera: "کامێرا",
    send: "شیکردنەوە",
    analyzing: "شیکردنەوە...",
    emptyError: "سەرەتا وەسفێک زیاد بکە یان وێنەیەک باربکە.",
    imageReady: "وێنە هاوپێچ کرا",
    footer:
      "بۆ ئەنجامی وردتر: وێنەی تەواو + وێنەی مۆر یان واژۆ ئەگەر هەبوو.",
    result: "ئەنجامی سەرەتایی",
    age: "تەمەن / سەردەم",
    value: "نرخی نزیک",
    material: "مادە",
    origin: "سەرچاوە",
    lookup: "ناسینەوە",
    description: "وەسف و شیکردنەوە",
    condition: "دۆخی دیار",
    authenticity: "نیشانەکانی ڕەسەنایەتی",
    priceReason: "هۆکاری نرخ",
    valueDrivers: "چی نرخ زیاد دەکات؟",
    valueReducers: "چی نرخ کەم دەکات؟",
    similar: "پارچەی هاوشێوە",
    similarHint:
      "ئێستا ئەمانە وشەی گەڕانی زیرەکن. دوای بەستنەوەی eBay، وێنە و نرخ و لینک ڕاستەقینە دەردەکەون.",
    soon: "eBay بە زوویی",
    neededPhotos: "وێنەی پێویست",
    followUp: "پرسیاری دواتر",
    confidence: "ئاستی دڵنیایی",
    share: "هاوبەشکردن",
    addInfo: "زانیاری زیاد بکە",
    notice:
      "ئەمە هەڵسەنگاندنێکی ڕێنماییە، نە بڕوانامەی ڕەسەنایەتی یان نرخاندنی کۆتایی.",
  },
  fr: {
    dir: "ltr",
    new: "Nouvelle évaluation",
    archive: "Archive des pièces",
    emptyArchive: "Aucune évaluation pour le moment.",
    clearArchive: "Effacer",
    openArchive: "Archive",
    badge: "Antiques Lens",
    sub: "AI antique evaluator",
    title: "Scannez n’importe quelle antiquité",
    hint: "Ajoutez ou prenez une image claire, et nous estimerons l’âge, la matière, l’état, la valeur et les références similaires.",
    placeholder:
      "Ajoutez ce que vous savez : âge, pays d’achat, dimensions, marque, signature...",
    upload: "Ajouter une image",
    camera: "Caméra",
    send: "Analyser",
    analyzing: "Analyse en cours...",
    emptyError: "Ajoutez une description ou une image d’abord.",
    imageReady: "Image jointe",
    footer:
      "Pour plus de précision : image complète + marque ou signature si disponible.",
    result: "Résultat initial",
    age: "Âge / Période",
    value: "Valeur estimée",
    material: "Matière",
    origin: "Origine",
    lookup: "Identification",
    description: "Description",
    condition: "État visible",
    authenticity: "Indices d’authenticité",
    priceReason: "Justification du prix",
    valueDrivers: "Ce qui augmente la valeur",
    valueReducers: "Ce qui réduit la valeur",
    similar: "Pièces similaires",
    similarHint:
      "Pour l’instant, ce sont des mots-clés de recherche. Après la connexion à eBay, les images, prix et liens réels apparaîtront ici.",
    soon: "eBay bientôt",
    neededPhotos: "Photos nécessaires",
    followUp: "Question suivante",
    confidence: "Confiance",
    share: "Partager",
    addInfo: "Ajouter info",
    notice:
      "Cette évaluation est indicative et ne constitue pas un certificat d’authenticité ni une estimation finale.",
  },
} as const;

function normalizeResult(data: Partial<AnalysisResult>): AnalysisResult {
  return {
    title: data.title || data.itemType || "Antique item",
    lookup: data.lookup || data.description || "",
    timePeriod: data.timePeriod || "غير واضح",
    origin: data.origin || "غير واضح",
    material: data.material || "غير واضح",
    style: data.style || "غير واضح",
    condition: data.condition || "غير واضح",
    authenticity: data.authenticity || "لا يمكن الجزم من الصورة فقط.",
    estimatedValue: data.estimatedValue || data.priceRange || "غير واضح",
    priceReasoning: data.priceReasoning || "",
    history: data.history || data.description || "",
    valueDrivers: Array.isArray(data.valueDrivers) ? data.valueDrivers : [],
    valueReducers: Array.isArray(data.valueReducers) ? data.valueReducers : [],
    visualSearchKeywords: Array.isArray(data.visualSearchKeywords)
      ? data.visualSearchKeywords
      : [],
    neededPhotos: Array.isArray(data.neededPhotos) ? data.neededPhotos : [],
    followUpQuestion: data.followUpQuestion || "",
    confidence:
      typeof data.confidence === "number"
        ? Math.min(10, Math.max(1, data.confidence))
        : 3,
    confidenceNote: data.confidenceNote || "",
    disclaimer: data.disclaimer || "",
    description: data.description,
    itemType: data.itemType,
    priceRange: data.priceRange,
  };
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("ar");
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const t = useMemo(() => content[locale], [locale]);
  const isRtl = t.dir === "rtl";

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(HISTORY_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved) as HistoryItem[];

      if (Array.isArray(parsed)) {
        const clean = parsed.slice(0, 20).map((item) => ({
          ...item,
          result: normalizeResult(item.result || {}),
        }));

        setHistory(clean);
      }
    } catch {
      window.localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  function resetEvaluation() {
    setPrompt("");
    setSelectedFile(null);
    setImagePreview(null);
    setResult(null);
    setError("");
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError("الصورة كبيرة جداً. اختاري صورة أقل من 8MB.");
      return;
    }

    setSelectedFile(file);
    setResult(null);
    setError("");

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  function removeImage() {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedFile(null);
    setImagePreview(null);
    setError("");
  }

  function saveHistory(item: HistoryItem) {
    setHistory((current) => {
      const lightItem: HistoryItem = {
        ...item,
        imagePreview: item.imagePreview || null,
      };

      const next = [lightItem, ...current].slice(0, 20);

      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // لا نخزن صور base64 كبيرة. إذا فشل التخزين، نخزن بدون صورة.
        const lighter = next.map((entry) => ({
          ...entry,
          imagePreview: null,
        }));

        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(lighter));
        return lighter;
      }

      return next;
    });
  }

  function openHistoryItem(item: HistoryItem) {
    setPrompt(item.prompt);
    setResult(normalizeResult(item.result));
    setImagePreview(item.imagePreview || null);
    setSelectedFile(null);
    setError("");
    setHistoryOpen(false);
  }

  function clearHistory() {
    setHistory([]);
    window.localStorage.removeItem(HISTORY_KEY);
  }

  function deleteHistoryItem(id: string) {
    setHistory((current) => {
      const next = current.filter((item) => item.id !== id);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }

  function createHistoryTitle(data: AnalysisResult) {
    return data.title || data.lookup || "تقييم قطعة قديمة";
  }

  async function handleAnalyze() {
    if (!selectedFile && !prompt.trim()) {
      setError(t.emptyError);
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      formData.append("notes", prompt);
      formData.append("locale", locale);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to analyze request.");
      }

      const analyzedResult = normalizeResult(data);

      setResult(analyzedResult);

      saveHistory({
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : String(Date.now()),
        title: createHistoryTitle(analyzedResult),
        prompt,
        createdAt: new Date().toISOString(),
        imagePreview,
        result: analyzedResult,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleShare() {
    if (!result) return;

    const text = [
      result.title,
      "",
      `${t.age}: ${result.timePeriod}`,
      `${t.value}: ${result.estimatedValue}`,
      `${t.material}: ${result.material}`,
      "",
      result.lookup,
      "",
      result.disclaimer || t.notice,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: result.title,
          text,
        });
        return;
      }

      await navigator.clipboard.writeText(text);
      alert("تم نسخ النتيجة.");
    } catch {
      await navigator.clipboard.writeText(text);
      alert("تم نسخ النتيجة.");
    }
  }

  return (
    <main
      dir={t.dir}
      className="relative min-h-dvh overflow-hidden bg-[#050505] text-white"
    >
      <HistorySidebar
        open={historyOpen}
        history={history as any}
        labels={{
          brand: t.badge,
          sub: t.sub,
          new: t.new,
          archive: t.archive,
          empty: t.emptyArchive,
          clear: t.clearArchive,
          notice: t.notice,
        }}
        onOpen={() => setHistoryOpen(true)}
        onClose={() => setHistoryOpen(false)}
        onDeleteItem={deleteHistoryItem}
        onNewEvaluation={() => {
          resetEvaluation();
          setHistoryOpen(false);
        }}
        onOpenItem={(item: any) => openHistoryItem(item)}
        onClearHistory={clearHistory}
      />

      <AntiqueBackground />

      <section className="relative z-10 min-h-dvh px-4 pb-28 pt-20 lg:pl-[306px] lg:pr-8">
        <div className="mx-auto w-full max-w-[460px]">
          {!result && !isAnalyzing && (
            <StartPanel
              t={t}
              prompt={prompt}
              setPrompt={setPrompt}
              imagePreview={imagePreview}
              selectedFile={selectedFile}
              error={error}
              handleImageChange={handleImageChange}
              removeImage={removeImage}
              handleAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          )}

          {isAnalyzing && (
            <div className="flex min-h-[calc(100dvh-160px)] items-center justify-center">
              <ThinkingMotion />
            </div>
          )}

          {result && (
            <ResultScreen
              t={t}
              result={result}
              imagePreview={imagePreview}
              onShare={handleShare}
            />
          )}
        </div>
      </section>

      <BottomBar
        t={t}
        hasResult={Boolean(result)}
        onNew={resetEvaluation}
        onShare={handleShare}
        onAddInfo={() => {
          setResult(null);
          setTimeout(() => {
            const textarea = document.querySelector("textarea");
            textarea?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 80);
        }}
      />

      <CookieBar />
    </main>
  );
}

function StartPanel({
  t,
  prompt,
  setPrompt,
  imagePreview,
  selectedFile,
  error,
  handleImageChange,
  removeImage,
  handleAnalyze,
  isAnalyzing,
}: {
  t: (typeof content)[Locale];
  prompt: string;
  setPrompt: (value: string) => void;
  imagePreview: string | null;
  selectedFile: File | null;
  error: string;
  handleImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: () => void;
  handleAnalyze: () => void;
  isAnalyzing: boolean;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-150px)] flex-col justify-center">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/15 bg-white/10 shadow-[0_0_60px_rgba(201,154,91,0.35)] backdrop-blur-2xl">
          <Sparkles className="h-7 w-7 text-[#e8bd7b]" />
        </div>

        <h1 className="mx-auto max-w-sm text-3xl font-bold leading-[1.18] tracking-[-0.04em] text-white">
          {t.title}
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-white/62">
          {t.hint}
        </p>
      </div>

      <div className="rounded-[2rem] border border-white/15 bg-[#1b1b1f]/88 p-3 shadow-[0_28px_110px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        {error && (
          <div className="mb-3 rounded-2xl border border-red-300/25 bg-red-500/15 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {imagePreview ? (
          <div className="mb-3 overflow-hidden rounded-[1.4rem] border border-white/12 bg-black">
            <div className="relative h-[250px] w-full">
              <Image
                src={imagePreview}
                alt="Selected antique"
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            <div className="flex items-center justify-between gap-3 bg-white/[0.04] p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white/90">
                  {selectedFile?.name || t.imageReady}
                </p>
                <p className="text-xs text-white/45">{t.imageReady}</p>
              </div>

              <button
                onClick={removeImage}
                className="grid h-9 w-9 place-items-center rounded-xl bg-white/8 text-white/65 transition hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-3 grid grid-cols-2 gap-3">
            <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.4rem] border border-dashed border-white/18 bg-white/[0.05] text-sm text-white/75 transition hover:bg-white/[0.09]">
              <Camera className="h-6 w-6 text-[#e8bd7b]" />
              {t.camera}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.4rem] border border-dashed border-white/18 bg-white/[0.05] text-sm text-white/75 transition hover:bg-white/[0.09]">
              <ImagePlus className="h-6 w-6 text-[#e8bd7b]" />
              {t.upload}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={t.placeholder}
          rows={4}
          className="max-h-44 min-h-28 w-full resize-none rounded-[1.3rem] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-white/35"
        />

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || (!prompt.trim() && !imagePreview)}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#d19a58] px-5 text-sm font-bold text-black shadow-[0_0_35px_rgba(209,154,88,0.22)] transition hover:scale-[1.01] hover:bg-[#e7b675] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isAnalyzing ? t.analyzing : t.send}
          <Send className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-4 text-center text-xs leading-6 text-white/42">
        {t.footer}
      </p>
    </div>
  );
}

function ResultScreen({
  t,
  result,
  imagePreview,
  onShare,
}: {
  t: (typeof content)[Locale];
  result: AnalysisResult;
  imagePreview: string | null;
  onShare: () => void;
}) {
  const similarKeywords = result.visualSearchKeywords?.length
    ? result.visualSearchKeywords
    : [
        result.title,
        result.material,
        result.timePeriod,
        result.style,
      ].filter(Boolean);

  return (
    <section className="pb-4">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#171717] text-white shadow-2xl">
        {imagePreview && (
          <div className="relative h-[310px] w-full overflow-hidden bg-black">
            <Image
              src={imagePreview}
              alt={result.title}
              fill
              unoptimized
              className="object-cover"
            />

            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#171717] to-transparent" />

            <button
              onClick={onShare}
              className="absolute end-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-xl"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="space-y-5 p-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d19a58]">
              {t.result}
            </p>

            <h1 className="text-2xl font-bold leading-snug text-white">
              {result.title}
            </h1>

            <p className="mt-3 text-[15px] leading-7 text-white/75">
              {result.lookup}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoCard label={t.age} value={result.timePeriod} />
            <InfoCard label={t.value} value={result.estimatedValue} highlight />
            <InfoCard label={t.material} value={result.material} />
            <InfoCard label={t.origin} value={result.origin} />
          </div>

          <ResultBlock title={t.description} body={result.history || result.lookup} />
          <ResultBlock title={t.condition} body={result.condition} />
          <ResultBlock title={t.priceReason} body={result.priceReasoning} />
          <ResultBlock title={t.authenticity} body={result.authenticity} />

          <ResultList title={t.valueDrivers} items={result.valueDrivers} />
          <ResultList title={t.valueReducers} items={result.valueReducers} />

          <div className="rounded-[1.6rem] border border-[#d19a58]/25 bg-[#d19a58]/10 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-[#f1c27d]">
                {t.similar}
              </h2>

              <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] text-white/60">
                {t.soon}
              </span>
            </div>

            <p className="mb-4 text-sm leading-6 text-white/65">
              {t.similarHint}
            </p>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {similarKeywords.slice(0, 8).map((keyword, index) => (
                <div
                  key={`${keyword}-${index}`}
                  className="min-w-[170px] rounded-2xl border border-white/10 bg-black/25 p-3"
                >
                  <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-white/5">
                    <Search className="h-8 w-8 text-[#d19a58]" />
                  </div>

                  <p className="line-clamp-2 text-sm font-semibold text-white">
                    {keyword}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-white/50">
                    Market reference keyword
                  </p>
                </div>
              ))}
            </div>
          </div>

          <ResultList title={t.neededPhotos} items={result.neededPhotos} />

          {result.followUpQuestion && (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-bold text-white">{t.followUp}</p>

              <p className="mt-2 text-sm leading-6 text-white/70">
                {result.followUpQuestion}
              </p>
            </div>
          )}

          <div className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4">
            <p className="text-xs leading-6 text-white/45">
              {result.disclaimer || t.notice}
            </p>

            <p className="mt-2 text-xs text-white/35">
              {t.confidence}: {result.confidence}/10
              {result.confidenceNote ? ` — ${result.confidenceNote}` : ""}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BottomBar({
  t,
  hasResult,
  onNew,
  onShare,
  onAddInfo,
}: {
  t: (typeof content)[Locale];
  hasResult: boolean;
  onNew: () => void;
  onShare: () => void;
  onAddInfo: () => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#202023]/95 px-4 py-3 backdrop-blur-xl lg:pl-[306px]">
      <div className="mx-auto flex max-w-[460px] items-center gap-3">
        <button
          onClick={onNew}
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs text-white/75"
        >
          <Plus className="h-5 w-5" />
          {t.new}
        </button>

        <button
          onClick={onShare}
          disabled={!hasResult}
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs text-white/75 disabled:opacity-35"
        >
          <Share2 className="h-5 w-5" />
          {t.share}
        </button>

        <button
          onClick={onAddInfo}
          className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-full bg-[#d19a58] px-5 text-sm font-bold text-black shadow-[0_0_30px_rgba(209,154,88,0.22)]"
        >
          <Sparkles className="h-5 w-5" />
          {t.addInfo}
        </button>
      </div>
    </nav>
  );
}
function InfoCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value?: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-[11px] font-medium tracking-wide text-white/35">
        {label}
      </p>

      <p
        className={[
          "text-[15px] leading-7 tracking-[-0.01em]",
          highlight
            ? "font-semibold text-[#d6a25f]"
            : "font-light text-white/78",
        ].join(" ")}
      >
        {value && value.trim() ? value : "غير واضح"}
      </p>
    </div>
  );
}

function ResultBlock({ title, body }: { title: string; body?: string }) {
  if (!body || !body.trim()) return null;

  return (
    <section className="mt-9 border-t border-white/10 pt-7">
      <h2 className="mb-3 text-[18px] font-semibold leading-7 tracking-[-0.025em] text-white">
        {title}
      </h2>

      <p className="text-[15px] font-light leading-8 tracking-[-0.01em] text-white/68">
        {body}
      </p>
    </section>
  );
}

function ResultList({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mt-9 border-t border-white/10 pt-7">
      <h2 className="mb-4 text-[18px] font-semibold leading-7 tracking-[-0.025em] text-white">
        {title}
      </h2>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex gap-3 text-[15px] font-light leading-7 tracking-[-0.01em] text-white/66"
          >
            <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d6a25f]/90" />
            <p>{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LanguageSwitch({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}) {
  const labels: Record<Locale, string> = {
    ar: "AR",
    en: "EN",
    ku: "KU",
    fr: "FR",
  };

  return (
    <div className="flex items-center rounded-full bg-white/[0.07] p-1 backdrop-blur-xl">
      {(["ar", "en", "ku", "fr"] as Locale[]).map((item) => {
        const active = locale === item;

        return (
          <button
            key={item}
            type="button"
            onClick={() => setLocale(item)}
            className={[
              "h-9 min-w-9 rounded-full px-3 text-[11px] font-medium tracking-wide transition",
              active
                ? "bg-white text-[#090909] shadow-[0_8px_24px_rgba(255,255,255,0.16)]"
                : "text-white/45 hover:bg-white/[0.06] hover:text-white/80",
            ].join(" ")}
          >
            {labels[item]}
          </button>
        );
      })}
    </div>
  );
}