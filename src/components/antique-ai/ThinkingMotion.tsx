"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "./types";

const LOGO_SRC = "/brand/kishib-logo.png";

const STEP_DURATION_MS = 5200;
const STAMP_DURATION = 1.9;
const SEAL_DURATION = 2.25;

type ThinkingStep = {
  title: string;
  subtitle: string;
};

type ThinkingCopy = {
  eyebrow: string;
  headline: string;
  stage: string;
  finalNote: string;
  steps: ThinkingStep[];
};

const THINKING_COPY: Record<Locale, ThinkingCopy> = {
  ar: {
    eyebrow: "KISHIB",
    headline: "يتم ختم مراحل التقييم خطوة بخطوة",
    stage: "المرحلة",
    finalNote:
      "قد تستغرق صياغة التقرير النهائي وقتاً أطول حسب الصورة والتفاصيل المدخلة.",
    steps: [
      {
        title: "جمع البيانات",
        subtitle: "نقرأ الصورة، نوع القطعة، المادة، العلامات، والملاحظات المدخلة",
      },
      {
        title: "تحليل المؤشرات",
        subtitle: "نراجع العمر، المنشأ، الأسلوب، الحالة، واحتمالات الأصالة",
      },
      {
        title: "تقدير القيمة",
        subtitle: "نوازن بين قيمة المادة، الندرة، التوثيق، السوق، والنواقص",
      },
      {
        title: "صياغة التقرير",
        subtitle: "نرتب النتيجة النهائية بسعر مشروط وتنبيه واضح",
      },
    ],
  },

  en: {
    eyebrow: "KISHIB",
    headline: "Sealing the evaluation stages step by step",
    stage: "Stage",
    finalNote:
      "Preparing the final report may take longer depending on the image and submitted details.",
    steps: [
      {
        title: "Collecting data",
        subtitle: "Reading the image, object type, material, marks, and submitted notes",
      },
      {
        title: "Analyzing indicators",
        subtitle: "Reviewing age, origin, style, condition, and authenticity signals",
      },
      {
        title: "Estimating value",
        subtitle: "Balancing material value, rarity, documentation, market context, and flaws",
      },
      {
        title: "Preparing report",
        subtitle: "Structuring the final result with conditional value and clear notice",
      },
    ],
  },

  fr: {
    eyebrow: "KISHIB",
    headline: "Validation des étapes d’évaluation une par une",
    stage: "Étape",
    finalNote:
      "La préparation du rapport final peut prendre plus de temps selon l’image et les détails fournis.",
    steps: [
      {
        title: "Collecte des données",
        subtitle: "Lecture de l’image, du type d’objet, de la matière, des marques et des notes",
      },
      {
        title: "Analyse des indices",
        subtitle: "Vérification de l’âge, de l’origine, du style, de l’état et des signes d’authenticité",
      },
      {
        title: "Estimation de la valeur",
        subtitle: "Équilibre entre matière, rareté, documentation, marché et défauts",
      },
      {
        title: "Préparation du rapport",
        subtitle: "Organisation du résultat final avec valeur conditionnelle et avertissement clair",
      },
    ],
  },

  hi: {
    eyebrow: "KISHIB",
    headline: "मूल्यांकन चरणों को क्रम से सील किया जा रहा है",
    stage: "चरण",
    finalNote:
      "अंतिम रिपोर्ट तैयार होने में तस्वीर और दी गई जानकारी के अनुसार अधिक समय लग सकता है.",
    steps: [
      {
        title: "डेटा एकत्र करना",
        subtitle: "तस्वीर, वस्तु का प्रकार, सामग्री, निशान और दर्ज नोट्स पढ़े जा रहे हैं",
      },
      {
        title: "संकेतों का विश्लेषण",
        subtitle: "उम्र, उत्पत्ति, शैली, स्थिति और प्रामाणिकता संकेतों की समीक्षा हो रही है",
      },
      {
        title: "मूल्य अनुमान",
        subtitle: "सामग्री, दुर्लभता, प्रमाण, बाज़ार संदर्भ और कमियों को संतुलित किया जा रहा है",
      },
      {
        title: "रिपोर्ट तैयार करना",
        subtitle: "अंतिम परिणाम को शर्तों वाले मूल्य और स्पष्ट सूचना के साथ व्यवस्थित किया जा रहा है",
      },
    ],
  },

  fa: {
    eyebrow: "KISHIB",
    headline: "مراحل ارزیابی مرحله‌به‌مرحله مهر می‌شود",
    stage: "مرحله",
    finalNote:
      "آماده‌سازی گزارش نهایی ممکن است بسته به تصویر و جزئیات واردشده زمان بیشتری ببرد.",
    steps: [
      {
        title: "جمع‌آوری داده‌ها",
        subtitle: "تصویر، نوع قطعه، جنس، نشانه‌ها و یادداشت‌های واردشده بررسی می‌شود",
      },
      {
        title: "تحلیل شاخص‌ها",
        subtitle: "سن، منشأ، سبک، وضعیت و نشانه‌های اصالت بررسی می‌شود",
      },
      {
        title: "برآورد ارزش",
        subtitle: "ارزش جنس، کمیابی، مستندات، بازار و نواقص با هم سنجیده می‌شود",
      },
      {
        title: "تهیه گزارش",
        subtitle: "نتیجه نهایی با ارزش مشروط و هشدار روشن تنظیم می‌شود",
      },
    ],
  },

  tr: {
    eyebrow: "KISHIB",
    headline: "Değerlendirme aşamaları adım adım mühürleniyor",
    stage: "Aşama",
    finalNote:
      "Son raporun hazırlanması, görsel ve girilen detaylara göre daha uzun sürebilir.",
    steps: [
      {
        title: "Veri toplama",
        subtitle: "Görsel, parça türü, malzeme, işaretler ve girilen notlar okunuyor",
      },
      {
        title: "Göstergeleri analiz etme",
        subtitle: "Yaş, köken, stil, durum ve özgünlük sinyalleri inceleniyor",
      },
      {
        title: "Değer tahmini",
        subtitle: "Malzeme değeri, nadirlik, belge, piyasa ve kusurlar dengeleniyor",
      },
      {
        title: "Raporu hazırlama",
        subtitle: "Sonuç, koşullu değer ve açık uyarı ile düzenleniyor",
      },
    ],
  },

  ru: {
    eyebrow: "KISHIB",
    headline: "Этапы оценки подтверждаются шаг за шагом",
    stage: "Этап",
    finalNote:
      "Подготовка итогового отчёта может занять больше времени в зависимости от изображения и введённых данных.",
    steps: [
      {
        title: "Сбор данных",
        subtitle: "Считываем изображение, тип предмета, материал, отметки и введённые заметки",
      },
      {
        title: "Анализ признаков",
        subtitle: "Проверяем возраст, происхождение, стиль, состояние и признаки подлинности",
      },
      {
        title: "Оценка стоимости",
        subtitle: "Сопоставляем материал, редкость, документы, рынок и недостатки",
      },
      {
        title: "Подготовка отчёта",
        subtitle: "Формируем итоговый результат с условной стоимостью и понятным предупреждением",
      },
    ],
  },

  ku: {
    eyebrow: "KISHIB",
    headline: "قۆناغەکانی هەڵسەنگاندن یەک بە یەک مۆر دەکرێن",
    stage: "قۆناغ",
    finalNote:
      "ئامادەکردنی ڕاپۆرتی کۆتایی لەوانەیە کاتی زیاتر بخایەنێت بەپێی وێنە و وردەکارییەکان.",
    steps: [
      {
        title: "کۆکردنەوەی داتا",
        subtitle: "وێنە، جۆری پارچە، مادە، نیشانەکان و تێبینییەکان دەخوێنرێنەوە",
      },
      {
        title: "شیکردنەوەی نیشانەکان",
        subtitle: "تەمەن، سەرچاوە، شێواز، دۆخ و نیشانەکانی ڕەسەنایەتی دەبینرێن",
      },
      {
        title: "خەملاندنی نرخ",
        subtitle: "بەهای مادە، دەگمەنی، بەڵگە، بازاڕ و کەموکوڕییەکان هەڵدەسەنگێنرێن",
      },
      {
        title: "ئامادەکردنی ڕاپۆرت",
        subtitle: "ئەنجامی کۆتایی بە نرخێکی مەرجدار و ئاگادارییەکی ڕوون ڕێکدەخرێت",
      },
    ],
  },
};

type ThinkingMotionProps = {
  locale?: Locale;
};

export default function ThinkingMotion({ locale = "ar" }: ThinkingMotionProps) {
  const copy = THINKING_COPY[locale] ?? THINKING_COPY.ar;
  const steps = copy.steps;

  const [activeStep, setActiveStep] = useState(0);
  const [sealedSteps, setSealedSteps] = useState<number[]>([]);

  useEffect(() => {
    let current = 0;

    const resetTimer = window.setTimeout(() => {
      setActiveStep(0);
      setSealedSteps([]);
    }, 0);

    const interval = window.setInterval(() => {
      current += 1;

      setSealedSteps((prev) => {
        const completedStep = current - 1;

        if (completedStep < 0) return prev;
        if (prev.includes(completedStep)) return prev;

        return [...prev, completedStep];
      });

      if (current >= steps.length) {
        window.clearInterval(interval);

        setActiveStep(steps.length - 1);
        setSealedSteps(steps.map((_, index) => index));

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

  const progressText = useMemo(() => {
    return `${activeStep + 1} / ${steps.length}`;
  }, [activeStep, steps.length]);

  const progressWidth = `${((activeStep + 1) / steps.length) * 100}%`;

  return (
    <div className="flex w-full items-center justify-center px-4 py-5">
      <div
        className={[
          "relative w-full max-w-[500px] overflow-hidden rounded-[2.25rem]",
          "border border-[#a9653a]/20 bg-[#1b1009]/92",
          "px-5 py-7 shadow-[0_28px_90px_rgba(39,20,10,0.58)] backdrop-blur-2xl",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(236,210,166,0.16),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(169,101,58,0.26),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ecd2a6]/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[#a9653a]/42 to-transparent" />

        <div className="relative">
          <div className="mb-6 text-center">
            <p className="text-[11px] font-semibold tracking-[0.42em] text-[#d7a066]">
              {copy.eyebrow}
            </p>

            <p className="mt-2 text-[12px] leading-5 text-[#f3dfbd]/58">
              {copy.headline}
            </p>
          </div>

          <div className="relative mx-auto mb-7 flex h-[210px] w-full items-center justify-center">
            <motion.div
              animate={{
                opacity: [0.18, 0.32, 0.18],
                scale: [0.95, 1.05, 0.95],
              }}
              transition={{
                duration: 4.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={[
                "absolute h-[164px] w-[164px] rounded-full",
                "border border-[#d7a066]/16 bg-[#ecd2a6]/[0.035]",
              ].join(" ")}
            />

            <motion.div
              animate={{
                opacity: [0.06, 0.16, 0.06],
                scale: [0.86, 1.18, 0.86],
              }}
              transition={{
                duration: 5.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute h-[120px] w-[120px] rounded-full border border-[#ecd2a6]/16"
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={`${locale}-${activeStep}`}
                initial={{
                  opacity: 0,
                  y: 18,
                  scale: 0.97,
                  filter: "blur(8px)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)",
                }}
                exit={{
                  opacity: 0,
                  y: -14,
                  scale: 0.97,
                  filter: "blur(8px)",
                }}
                transition={{
                  duration: 0.58,
                  ease: "easeOut",
                }}
                className="absolute inset-x-0 bottom-0 text-center"
              >
                <p className="text-[18px] font-bold text-[#fff0d4]">
                  {currentStep.title}
                </p>

                <p className="mx-auto mt-2 max-w-[330px] text-[12px] leading-6 text-[#f3dfbd]/58">
                  {currentStep.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            <motion.div
              key={`stamp-${locale}-${activeStep}`}
              initial={{
                y: -46,
                rotate: -7,
                scale: 1.05,
                opacity: 0,
              }}
              animate={{
                y: [-46, -18, 12, -7],
                rotate: [-7, -3, 0, 1.5],
                scale: [1.05, 1, 0.8, 0.95],
                opacity: [0, 1, 1, 1],
              }}
              transition={{
                duration: STAMP_DURATION,
                times: [0, 0.42, 0.66, 1],
                ease: "easeInOut",
              }}
              className="absolute top-1 z-20 h-[96px] w-[96px]"
            >
              <Image
                src={LOGO_SRC}
                alt="KISHIB stamp"
                fill
                sizes="96px"
                className="object-contain drop-shadow-[0_20px_34px_rgba(35,16,7,0.55)]"
                priority
              />
            </motion.div>

            <motion.div
              key={`seal-${locale}-${activeStep}`}
              initial={{
                opacity: 0,
                scale: 0.52,
                rotate: -7,
              }}
              animate={{
                opacity: [0, 0, 0.5, 0.18, 0],
                scale: [0.52, 0.52, 1.06, 1.2, 1.3],
                rotate: [-7, -7, 0, 0, 0],
              }}
              transition={{
                duration: SEAL_DURATION,
                times: [0, 0.46, 0.64, 0.82, 1],
                ease: "easeOut",
              }}
              className={[
                "absolute top-[62px] z-10 grid h-[104px] w-[104px] place-items-center rounded-full",
                "border border-[#d7a066]/70 bg-[#a9653a]/10 text-[#d7a066]",
                "shadow-[0_0_48px_rgba(215,160,102,0.16)]",
              ].join(" ")}
            >
              <div className="relative h-[62px] w-[62px] opacity-75">
                <Image
                  src={LOGO_SRC}
                  alt=""
                  fill
                  sizes="62px"
                  className="object-contain"
                />
              </div>
            </motion.div>
          </div>

          <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-[#d7a066]/16 bg-[#ecd2a6]/[0.045] px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d7a066]" />
            <span className="text-[11px] font-medium text-[#f3dfbd]/62">
              {copy.stage} {progressText}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2">
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              const isSealed = sealedSteps.includes(index);

              return (
                <div
                  key={`${step.title}-${index}`}
                  className={[
                    "relative grid h-8 w-8 place-items-center rounded-full border transition duration-300",
                    isActive
                      ? "border-[#d7a066]/65 bg-[#d7a066]/16 text-[#d7a066]"
                      : isSealed
                        ? "border-[#a9653a]/42 bg-[#a9653a]/12 text-[#d7a066]/78"
                        : "border-[#ecd2a6]/10 bg-[#ecd2a6]/[0.025] text-[#f3dfbd]/25",
                  ].join(" ")}
                >
                  {isSealed ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : (
                    <span className="text-[10px] font-bold">{index + 1}</span>
                  )}

                  {isActive ? (
                    <motion.span
                      layoutId="active-thinking-dot"
                      className="absolute -bottom-2 h-1 w-1 rounded-full bg-[#d7a066]"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-6 h-1 w-full max-w-[320px] overflow-hidden rounded-full bg-[#ecd2a6]/10">
            <motion.div
              animate={{
                width: progressWidth,
              }}
              transition={{
                duration: 1,
                ease: "easeOut",
              }}
              className="h-full rounded-full bg-gradient-to-r from-[#7a3f22] via-[#d7a066] to-[#ecd2a6]"
            />
          </div>

          {activeStep === steps.length - 1 ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.55 }}
              className="mx-auto mt-5 max-w-[320px] text-center text-[11px] leading-5 text-[#f3dfbd]/42"
            >
              {copy.finalNote}
            </motion.p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
