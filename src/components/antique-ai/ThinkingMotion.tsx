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
    fallbackTitle: "جاري تكوين الصورة",
    steps: [
      { title: "تجميع ملامح الصورة" },
      { title: "قراءة العلامات" },
      { title: "مطابقة المؤشرات" },
      { title: "إعداد التقييم" },
    ],
  },

  en: {
    eyebrow: "KISHIB",
    fallbackTitle: "Revealing image",
    steps: [
      { title: "Revealing image" },
      { title: "Reading details" },
      { title: "Matching signals" },
      { title: "Preparing value" },
    ],
  },

  fr: {
    eyebrow: "KISHIB",
    fallbackTitle: "Révélation",
    steps: [
      { title: "Révélation" },
      { title: "Lecture des détails" },
      { title: "Correspondances" },
      { title: "Estimation" },
    ],
  },

  hi: {
    eyebrow: "KISHIB",
    fallbackTitle: "छवि बन रही है",
    steps: [
      { title: "छवि बन रही है" },
      { title: "विवरण पढ़ना" },
      { title: "संकेत मिलाना" },
      { title: "मूल्यांकन" },
    ],
  },

  fa: {
    eyebrow: "KISHIB",
    fallbackTitle: "نمایان‌سازی تصویر",
    steps: [
      { title: "نمایان‌سازی تصویر" },
      { title: "خواندن جزئیات" },
      { title: "تطبیق نشانه‌ها" },
      { title: "آماده‌سازی ارزیابی" },
    ],
  },

  tr: {
    eyebrow: "KISHIB",
    fallbackTitle: "Görsel oluşuyor",
    steps: [
      { title: "Görsel oluşuyor" },
      { title: "Detaylar okunuyor" },
      { title: "İşaretler eşleşiyor" },
      { title: "Değerleme" },
    ],
  },

  ru: {
    eyebrow: "KISHIB",
    fallbackTitle: "Проявление",
    steps: [
      { title: "Проявление" },
      { title: "Детали" },
      { title: "Сопоставление" },
      { title: "Оценка" },
    ],
  },

  ku: {
    eyebrow: "KISHIB",
    fallbackTitle: "وێنەکە دەردەکەوێت",
    steps: [
      { title: "دەرخستنی وێنە" },
      { title: "خوێندنەوەی وردەکاری" },
      { title: "بەراوردکردنی نیشانەکان" },
      { title: "ئامادەکردنی نرخاندن" },
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

    const resetTimer = window.setTimeout(() => {
      setActiveStep(0);
      setCompletedSteps([]);
    }, 0);

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
      window.clearTimeout(resetTimer);
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
      className="flex min-h-[calc(100dvh-5rem)] w-full items-start justify-center px-4 pb-4 pt-3 lg:items-center lg:pt-0"
    >
      <div
        className={[
          "relative mt-1 w-full max-w-[390px] overflow-hidden rounded-[24px] lg:max-w-[560px]",
          "border border-[#b88a3d]/25 bg-[#f6ead5]/90",
          "p-4 text-[#241913] shadow-[0_18px_50px_rgba(58,36,20,0.18)] lg:p-5",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(184,138,61,0.16),transparent_36%)]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#b88a3d]/55 to-transparent" />

        <div className="relative">
          <div className="mb-3 text-center">
            <p className="text-[10px] font-bold tracking-[0.48em] text-[#986f2e]">
              {copy.eyebrow}
            </p>
          </div>

          <div
            className={[
              "relative mx-auto overflow-hidden rounded-[22px]",
              "border border-[#d2b98f] bg-[#fff4e2]",
              "shadow-[inset_0_0_0_1px_rgba(255,248,236,0.35),0_16px_42px_rgba(55,35,20,0.16)]",
            ].join(" ")}
          >
            <div className="relative flex h-[330px] items-center justify-center bg-[#f3eadc] p-2 lg:h-[430px]">
              {imagePreview ? (
                <ParticleReveal imagePreview={imagePreview} />
              ) : (
                <div className="grid h-full w-full place-items-center rounded-[18px] border border-[#d2b98f] bg-[#fff4e2]">
                  <div className="text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-[16px] border border-[#b88a3d]/25 bg-[#ead2c2] text-[#8b3a2b]">
                      <Camera className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-[#241913]">
                      {copy.fallbackTitle}
                    </p>
                  </div>
                </div>
              )}
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
                className="text-center text-[15px] font-bold text-[#241913]"
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
                      "flex min-h-[58px] flex-col items-center justify-center rounded-[16px] border px-1.5 py-2 text-center transition duration-300",
                      isActive
                        ? "border-[#b88a3d]/45 bg-[#fff4e2]/80"
                        : isDone
                          ? "border-[#233f32]/25 bg-[#dfe6d8]/70"
                          : "border-[#d2b98f] bg-[#fff4e2]/50",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "mb-1.5 grid h-6 w-6 place-items-center rounded-full border transition duration-300",
                        isDone
                          ? "border-[#b88a3d] bg-[#b88a3d] text-[#fff4e2]"
                          : isActive
                            ? "border-[#b88a3d]/70 bg-[#ead2c2] text-[#6d2e1d]"
                            : "border-[#d2b98f] bg-[#fff4e2] text-[#735f4b]",
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
                          ? "text-[#241913]"
                          : isDone
                            ? "text-[#233f32]"
                            : "text-[#735f4b]",
                      ].join(" ")}
                    >
                      {step.title}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#d2b98f]/35">
              <motion.div
                animate={{ width: progressWidth }}
                transition={{ duration: 0.75, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#6d2e1d] via-[#b88a3d] to-[#233f32] shadow-[0_0_16px_rgba(184,138,61,0.35)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticleReveal({ imagePreview }: { imagePreview: string }) {
  const particles = useMemo(() => {
    return Array.from({ length: 96 }, (_, index) => {
      const row = Math.floor(index / 12);
      const col = index % 12;

      return {
        id: index,
        left: `${col * 8.33 + 4}%`,
        top: `${row * 12.5 + 6}%`,
        delay: (row + col) * 0.035,
        size: 3 + ((index * 7) % 10),
      };
    });
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-[#0d181e]">
      <motion.img
        src={imagePreview}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full select-none rounded-[18px] object-contain"
        initial={{
          opacity: 0.18,
          filter: "blur(18px) contrast(0.82) saturate(0.65)",
          scale: 0.98,
        }}
        animate={{
          opacity: [0.18, 0.42, 0.78, 1],
          filter: [
            "blur(18px) contrast(0.82) saturate(0.65)",
            "blur(10px) contrast(0.9) saturate(0.8)",
            "blur(4px) contrast(1) saturate(0.95)",
            "blur(0px) contrast(1.03) saturate(1)",
          ],
          scale: [0.98, 1.01, 1],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,248,194,0.1),transparent_42%),linear-gradient(to_bottom,rgba(13,24,30,0.38),rgba(13,24,30,0.08),rgba(13,24,30,0.42))]" />

      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            background:
              particle.id % 3 === 0
                ? "#fff8c2"
                : particle.id % 3 === 1
                  ? "#ffc271"
                  : "#99782e",
            boxShadow: "0 0 16px rgba(255, 194, 113, 0.48)",
          }}
          initial={{
            opacity: 0,
            scale: 0,
            x: 0,
            y: 0,
          }}
          animate={{
            opacity: [0, 1, 0.8, 0],
            scale: [0.2, 1.15, 0.75, 0.05],
            x: [0, ((particle.id % 5) - 2) * 8, 0],
            y: [0, ((particle.id % 7) - 3) * 6, 0],
          }}
          transition={{
            duration: 3.1,
            delay: particle.delay,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[18px]"
        initial={{ opacity: 0.65 }}
        animate={{ opacity: [0.65, 0.25, 0.08, 0.28] }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
        style={{
          background:
            "radial-gradient(circle at center, transparent 26%, rgba(13,24,30,0.62) 72%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 rounded-[18px] border border-[#b88a3d]/30" />
    </div>
  );
}
