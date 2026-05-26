"use client";
import AntiqueBackground from "@/components/antique-ai/AntiqueBackground";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Archive, Gem, ImagePlus, Send, Sparkles, X } from "lucide-react";

import type { AnalysisResult } from "@/components/antique-ai/types";
import ThinkingMotion from "@/components/antique-ai/ThinkingMotion";
import CookieBar from "@/components/antique-ai/CookieBar";
import HistorySidebar, {
  type HistoryItem,
} from "@/components/antique-ai/HistorySidebar";

type Locale = "ar" | "en" | "ku" | "fr";

const HISTORY_KEY = "antiques-lens:history";

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
    title: "قيّم قطعتك الأثرية بالذكاء الاصطناعي",
    hint: "ارفع صورة واضحة، وأضف وصفاً قصيراً. ستحصل على قراءة أولية للنوع، الفترة، الحالة، والقيمة التقريبية.",
    placeholder:
      "مثال: مزهرية قديمة عليها ختم في القاعدة، أريد معرفة الفترة والقيمة التقريبية...",
    upload: "رفع صورة",
    send: "إرسال",
    analyzing: "جاري التحليل...",
    emptyError: "أضف وصفاً أو ارفع صورة للقطعة أولاً.",
    imageReady: "الصورة مرفقة",
    footer: "لنتيجة أدق: صورة كاملة + صورة للختم أو التوقيع إن وجد.",
    result: "نتيجة أولية",
    type: "النوع",
    material: "المادة",
    value: "القيمة",
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
    title: "Evaluate your antique with AI",
    hint: "Upload a clear image and add a short description. Get an initial reading of type, period, condition, and estimated value.",
    placeholder:
      "Example: An old vase with a mark on the base. I want to know the period and estimated value...",
    upload: "Upload image",
    send: "Send",
    analyzing: "Analyzing...",
    emptyError: "Add a description or upload an image first.",
    imageReady: "Image attached",
    footer: "For better accuracy: full image + mark or signature if available.",
    result: "Initial result",
    type: "Type",
    material: "Material",
    value: "Value",
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
    title: "هەڵسەنگاندنی پارچەی کۆن بە زیرەکی دەستکرد",
    hint: "وێنەیەکی ڕوون باربکە و وەسفێکی کورت زیاد بکە. خوێندنەوەیەکی سەرەتایی بۆ جۆر، سەردەم، دۆخ و نرخی نزیک وەردەگریت.",
    placeholder:
      "نموونە: گوڵدانێکی کۆنە و مۆرێکی لە بنەوە هەیە، دەمەوێت سەردەم و نرخی نزیک بزانم...",
    upload: "بارکردنی وێنە",
    send: "ناردن",
    analyzing: "شیکردنەوە...",
    emptyError: "سەرەتا وەسفێک زیاد بکە یان وێنەیەک باربکە.",
    imageReady: "وێنە هاوپێچ کرا",
    footer:
      "بۆ ئەنجامی وردتر: وێنەی تەواو + وێنەی مۆر یان واژۆ ئەگەر هەبوو.",
    result: "ئەنجامی سەرەتایی",
    type: "جۆر",
    material: "مادە",
    value: "نرخ",
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
    title: "Évaluez votre antiquité avec l’IA",
    hint: "Ajoutez une image claire et une courte description. Recevez une première lecture du type, de la période, de l’état et de la valeur estimée.",
    placeholder:
      "Exemple : un ancien vase avec une marque sous la base. Je veux connaître la période et la valeur estimée...",
    upload: "Ajouter une image",
    send: "Envoyer",
    analyzing: "Analyse en cours...",
    emptyError: "Ajoutez une description ou une image d’abord.",
    imageReady: "Image jointe",
    footer:
      "Pour plus de précision : image complète + marque ou signature si disponible.",
    result: "Résultat initial",
    type: "Type",
    material: "Matière",
    value: "Valeur",
    notice:
      "Cette évaluation est indicative et ne constitue pas un certificat d’authenticité ni une estimation finale.",
  },
} as const;

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
        setHistory(parsed.slice(0, 20));
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

    setSelectedFile(file);
    setResult(null);
    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(typeof reader.result === "string" ? reader.result : null);
    };

    reader.readAsDataURL(file);
  }

  function removeImage() {
    setSelectedFile(null);
    setImagePreview(null);
    setError("");
  }

  function saveHistory(item: HistoryItem) {
    setHistory((current) => {
      const next = [item, ...current].slice(0, 20);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }

  function openHistoryItem(item: HistoryItem) {
    setPrompt(item.prompt);
    setResult(item.result);
    setImagePreview(item.imagePreview);
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
    return data.title || data.itemType || data.material || "تقييم قطعة قديمة";
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

      const analyzedResult = data as AnalysisResult;
      setResult(analyzedResult);

      saveHistory({
        id: crypto.randomUUID(),
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

  return (
    <main
      dir={t.dir}
      className="relative min-h-dvh overflow-hidden bg-[#070812] text-white"
    >
      <HistorySidebar
        open={historyOpen}
        history={history}
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
        onOpenItem={openHistoryItem}
        onClearHistory={clearHistory}
      />
      <AntiqueBackground />

      <header className="relative z-20 flex h-16 items-center justify-between px-4 sm:px-6 lg:pl-[306px] lg:pr-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryOpen(true)}
            className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/85 backdrop-blur-xl transition hover:bg-white/18 lg:hidden"
            aria-label={t.openArchive}
          >
            <Archive className="h-4 w-4" />
          </button>

          <button
            onClick={resetEvaluation}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white/85 backdrop-blur-xl transition hover:bg-white/18"
          >
            {t.new}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitch locale={locale} setLocale={setLocale} />

          <div className={isRtl ? "text-right" : "text-left"}>
            <p className="text-sm font-semibold tracking-wide text-white">
              {t.badge}
            </p>
            <p className="text-[11px] text-white/55">{t.sub}</p>
          </div>

          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_0_34px_rgba(132,91,255,0.35)] backdrop-blur-xl">
            <Gem className="h-5 w-5 text-white" />
          </div>
        </div>
      </header>

      <section className="relative z-10 flex min-h-[calc(100dvh-64px)] items-center justify-center px-4 pb-6 pt-3 sm:px-6 lg:pl-[306px] lg:pr-10">
        <div className="w-full max-w-[760px]">
          {!result && !isAnalyzing && (
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-white/20 bg-white/10 shadow-[0_0_60px_rgba(132,91,255,0.45)] backdrop-blur-2xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>

              <h1 className="mx-auto max-w-xl text-3xl font-semibold leading-[1.25] tracking-[-0.035em] text-white sm:text-5xl">
                {t.title}
              </h1>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/62">
                {t.hint}
              </p>
            </div>
          )}

          {isAnalyzing && <ThinkingMotion />}

          {result && (
            <div className="mb-5 rounded-[1.8rem] border border-white/16 bg-white/[0.10] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <p className="mb-2 text-xs text-cyan-100/70">{t.result}</p>

              <h2 className="text-xl font-semibold leading-snug text-white sm:text-2xl">
                {result.title}
              </h2>

              <p className="mt-4 text-sm leading-8 text-white/70">
                {result.description}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MiniResult label={t.type} value={result.itemType} />
                <MiniResult label={t.material} value={result.material} />
                <MiniResult label={t.value} value={result.priceRange} />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-white/55">
                {t.notice}
              </div>
            </div>
          )}

          <div className="rounded-[1.8rem] border border-white/20 bg-white/[0.12] p-3 shadow-[0_28px_110px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
            {error && (
              <div className="mb-3 rounded-2xl border border-red-300/25 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            {imagePreview && (
              <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/14 bg-black/20 p-2">
                <div className="relative h-14 w-14 overflow-hidden rounded-xl">
                  <Image
                    src={imagePreview}
                    alt="Selected antique"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/90">
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
            )}

            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={t.placeholder}
              rows={3}
              className="max-h-40 min-h-24 w-full resize-none bg-transparent px-3 py-3 text-sm leading-7 text-white outline-none placeholder:text-white/40"
            />

            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
              <label className="flex h-11 cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white/75 transition hover:bg-white/18">
                <ImagePlus className="h-4 w-4" />
                {t.upload}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!prompt.trim() && !selectedFile)}
                className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#0b0b13] shadow-[0_0_35px_rgba(255,255,255,0.20)] transition hover:scale-[1.02] hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isAnalyzing ? t.analyzing : t.send}
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-xs leading-6 text-white/42">
            {t.footer}
          </p>
        </div>
      </section>
      <CookieBar />
    </main>
  );
}

function LanguageSwitch({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}) {
  return (
    <div className="hidden rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur-xl sm:flex">
      {(["ar", "en", "ku", "fr"] as Locale[]).map((item) => (
        <button
          key={item}
          onClick={() => setLocale(item)}
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
            locale === item
              ? "bg-white text-[#0b0b13]"
              : "text-white/62 hover:text-white"
          }`}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function MiniResult({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.08] p-4">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/85">
        {value || "—"}
      </p>
    </div>
  );
}