"use client";

/* eslint-disable @next/next/no-img-element */

import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "./types";

const STEP_DURATION_MS = 3200;

type ThinkingStep = {
  title: string;
};

type ThinkingCopy = {
  eyebrow: string;
  fallbackTitle: string;
  steps: ThinkingStep[];
};

const THINKING_COPY: Record<Locale, ThinkingCopy> = {
  ar: {
    eyebrow: "KISHIB",
    fallbackTitle: "جاري الفحص",
    steps: [
      { title: "فحص الصورة" },
      { title: "قراءة المؤشرات" },
      { title: "تقدير القيمة" },
      { title: "إعداد التقرير" },
    ],
  },

  en: {
    eyebrow: "KISHIB",
    fallbackTitle: "Scanning",
    steps: [
      { title: "Scanning image" },
      { title: "Reading signals" },
      { title: "Valuing item" },
      { title: "Preparing report" },
    ],
  },

  fr: {
    eyebrow: "KISHIB",
    fallbackTitle: "Analyse",
    steps: [
      { title: "Analyse de l’image" },
      { title: "Lecture des indices" },
      { title: "Estimation" },
      { title: "Rapport" },
    ],
  },

  hi: {
    eyebrow: "KISHIB",
    fallbackTitle: "स्कैन हो रहा है",
    steps: [
      { title: "तस्वीर स्कैन" },
      { title: "संकेत पढ़ना" },
      { title: "मूल्य अनुमान" },
      { title: "रिपोर्ट तैयार" },
    ],
  },

  fa: {
    eyebrow: "KISHIB",
    fallbackTitle: "در حال اسکن",
    steps: [
      { title: "اسکن تصویر" },
      { title: "خواندن نشانه‌ها" },
      { title: "برآورد ارزش" },
      { title: "آماده‌سازی گزارش" },
    ],
  },

  tr: {
    eyebrow: "KISHIB",
    fallbackTitle: "Taranıyor",
    steps: [
      { title: "Görsel tarama" },
      { title: "Sinyalleri okuma" },
      { title: "Değerleme" },
      { title: "Rapor" },
    ],
  },

  ru: {
    eyebrow: "KISHIB",
    fallbackTitle: "Сканирование",
    steps: [
      { title: "Сканирование" },
      { title: "Признаки" },
      { title: "Оценка" },
      { title: "Отчёт" },
    ],
  },

  ku: {
    eyebrow: "KISHIB",
    fallbackTitle: "پشکنین",
    steps: [
      { title: "پشکنینی وێنە" },
      { title: "خوێندنەوەی نیشانەکان" },
      { title: "خەملاندنی نرخ" },
      { title: "ئامادەکردنی ڕاپۆرت" },
    ],
  },
};

type ThinkingMotionProps = {
  locale?: Locale;
  imagePreview?: string | null;
};

function isRtlLocale(locale: Locale) {
  return locale === "ar" || locale === "fa" || locale === "ku";
}

export default function ThinkingMotion({
  locale = "ar",
  imagePreview = null,
}: ThinkingMotionProps) {
  const copy = THINKING_COPY[locale] ?? THINKING_COPY.ar;
  const steps = copy.steps;
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    let current = 0;

    setActiveStep(0);
    setCompletedSteps([]);

    const interval = window.setInterval(() => {
      current += 1;

      setCompletedSteps((prev) => {
        const completedStep = current - 1;

        if (completedStep < 0) return prev;
        if (prev.includes(completedStep)) return prev;

        return [...prev, completedStep];
      });

      if (current >= steps.length) {
        window.clearInterval(interval);
        setActiveStep(steps.length - 1);
        setCompletedSteps(steps.map((_, index) => index));
        return;
      }

      setActiveStep(current);
    }, STEP_DURATION_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [steps]);

  const currentStep = steps[activeStep] ?? steps[0];

  const progressWidth = useMemo(() => {
    return `${((activeStep + 1) / steps.length) * 100}%`;
  }, [activeStep, steps.length]);

  return (
    <div
      dir={dir}
     className="flex min-h-[calc(100dvh-5rem)] w-full items-start justify-center px-4 pb-3 pt-2"
    >
      <div
       className={[
  "relative mt-1 w-full max-w-[390px] overflow-hidden rounded-[1.7rem]",
          "border border-cyan-300/15 bg-[#030712]/95",
          "p-4 shadow-[0_24px_80px_rgba(0,0,0,0.72)] backdrop-blur-2xl",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.14),transparent_36%),radial-gradient(circle_at_50%_100%,rgba(37,99,235,0.12),transparent_44%)]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent" />

        <div className="relative">
          <div className="mb-3 text-center">
            <p className="text-[10px] font-bold tracking-[0.48em] text-cyan-300">
              {copy.eyebrow}
            </p>
          </div>

          <div
            className={[
              "relative mx-auto overflow-hidden rounded-[1.35rem]",
              "border border-cyan-300/18 bg-black",
              "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.035),0_18px_55px_rgba(0,0,0,0.5)]",
            ].join(" ")}
          >
            <div className="relative flex h-[330px] items-center justify-center bg-black p-2">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt=""
                  className="max-h-[306px] w-full select-none rounded-[1rem] object-contain"
                  draggable={false}
                />
              ) : (
                <div className="grid h-full w-full place-items-center rounded-[1rem] border border-cyan-300/10 bg-[#07111F]">
                  <div className="text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300">
                      <Camera className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-white">
                      {copy.fallbackTitle}
                    </p>
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute inset-2 rounded-[1rem] bg-[linear-gradient(rgba(34,211,238,0.045)_1px,transparent_1px)] bg-[length:100%_16px] opacity-45" />

              <div className="pointer-events-none absolute inset-2 rounded-[1rem] bg-gradient-to-b from-cyan-300/10 via-transparent to-blue-500/10" />

              <motion.div
                className="pointer-events-none absolute left-2 right-2 top-2 z-20"
                animate={{
                  y: ["0%", "calc(100% - 8px)", "0%"],
                }}
                transition={{
                  duration: 2.65,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  height: "calc(100% - 16px)",
                }}
              >
                <div className="relative h-[3px] w-full rounded-full bg-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.95)]">
                  <div className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_28px_rgba(34,211,238,1)]" />
                  <div className="absolute inset-x-0 -top-6 h-12 bg-gradient-to-b from-cyan-300/20 via-cyan-300/8 to-transparent blur-sm" />
                </div>
              </motion.div>

              <ScanCorners />
            </div>
          </div>

          <div className="mt-3">
            <AnimatePresence mode="wait">
              <motion.p
                key={`${locale}-${activeStep}`}
                initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="text-center text-[15px] font-bold text-white"
              >
                {currentStep.title}
              </motion.p>
            </AnimatePresence>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {steps.map((step, index) => {
                const isActive = index === activeStep;
                const isDone = completedSteps.includes(index);

                return (
                  <div
                    key={`${step.title}-${index}`}
                    className={[
                      "flex min-h-[58px] flex-col items-center justify-center rounded-2xl border px-1.5 py-2 text-center transition duration-300",
                      isActive
                        ? "border-cyan-300/45 bg-cyan-300/[0.09]"
                        : isDone
                          ? "border-blue-400/22 bg-blue-500/[0.06]"
                          : "border-white/6 bg-white/[0.025]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "mb-1.5 grid h-6 w-6 place-items-center rounded-full border transition duration-300",
                        isDone
                          ? "border-cyan-300 bg-cyan-300 text-black"
                          : isActive
                            ? "border-cyan-300/70 bg-cyan-300/15 text-cyan-200"
                            : "border-white/10 bg-white/[0.03] text-slate-500",
                      ].join(" ")}
                    >
                      {isDone ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : (
                        <span className="text-[9px] font-black">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <p
                      className={[
                        "line-clamp-2 text-[9px] font-bold leading-3",
                        isActive
                          ? "text-cyan-100"
                          : isDone
                            ? "text-slate-200"
                            : "text-slate-500",
                      ].join(" ")}
                    >
                      {step.title}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/7">
              <motion.div
                animate={{ width: progressWidth }}
                transition={{ duration: 0.75, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-300 to-blue-500 shadow-[0_0_22px_rgba(34,211,238,0.45)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScanCorners() {
  return (
    <div className="pointer-events-none absolute inset-2 z-30 rounded-[1rem]">
      <span className="absolute left-0 top-0 h-9 w-9 rounded-tl-[1rem] border-l-2 border-t-2 border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.55)]" />
      <span className="absolute right-0 top-0 h-9 w-9 rounded-tr-[1rem] border-r-2 border-t-2 border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.55)]" />
      <span className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-[1rem] border-b-2 border-l-2 border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.55)]" />
      <span className="absolute bottom-0 right-0 h-9 w-9 rounded-br-[1rem] border-b-2 border-r-2 border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.55)]" />
    </div>
  );
}