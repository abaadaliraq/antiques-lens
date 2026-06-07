"use client";

import { BadgeCheck, LockKeyhole, X } from "lucide-react";
import { useState } from "react";
import type { Locale } from "./types";

const EXPERT_CHAT_ENABLED = false;
const EXPERT_WHATSAPP_URL = "https://wa.me/964777045599";

type ExpertCopy = {
  button: string;
  badge: string;
  title: string;
  text: string;
  gotIt: string;
};

const COPY: Record<Locale, ExpertCopy> = {
  ar: {
    button: "خبير تقييم",
    badge: "قريباً",
    title: "تواصل مباشر مع خبير تقييم",
    text: "هذه الخدمة ستكون متاحة قريباً ضمن اشتراك خاص للقطع الثمينة والتقييمات الاحترافية.",
    gotIt: "فهمت",
  },
  en: {
    button: "Valuation Expert",
    badge: "Soon",
    title: "Direct Contact with a Valuation Expert",
    text: "This service will be available soon as a special subscription for valuable items and professional evaluations.",
    gotIt: "Got it",
  },
  ku: {
    button: "پسپۆڕی نرخاندن",
    badge: "بەم نزیکانە",
    title: "پەیوەندی ڕاستەوخۆ لەگەڵ پسپۆڕی نرخاندن",
    text: "ئەم خزمەتگوزارییە بەم نزیکانە بە شێوەی بەشداربوونی تایبەت بۆ پارچە گرانبەهاکان و نرخاندنی پیشەیی بەردەست دەبێت.",
    gotIt: "تێگەیشتم",
  },
  fr: {
    button: "Expert d'évaluation",
    badge: "Bientôt",
    title: "Contact direct avec un expert d'évaluation",
    text: "Ce service sera bientôt disponible avec un abonnement spécial pour les pièces précieuses et les évaluations professionnelles.",
    gotIt: "Compris",
  },
  hi: {
    button: "मूल्यांकन विशेषज्ञ",
    badge: "जल्द",
    title: "मूल्यांकन विशेषज्ञ से सीधा संपर्क",
    text: "यह सेवा जल्द ही मूल्यवान वस्तुओं और पेशेवर मूल्यांकन के लिए विशेष सदस्यता के रूप में उपलब्ध होगी.",
    gotIt: "समझ गया",
  },
  fa: {
    button: "کارشناس ارزیابی",
    badge: "به‌زودی",
    title: "ارتباط مستقیم با کارشناس ارزیابی",
    text: "این سرویس به‌زودی به‌عنوان یک اشتراک ویژه برای اشیای ارزشمند و ارزیابی‌های حرفه‌ای فعال می‌شود.",
    gotIt: "متوجه شدم",
  },
  ru: {
    button: "Эксперт оценки",
    badge: "Скоро",
    title: "Прямой контакт с экспертом по оценке",
    text: "Эта услуга скоро будет доступна по специальной подписке для ценных предметов и профессиональной оценки.",
    gotIt: "Понятно",
  },
  tr: {
    button: "Değerleme Uzmanı",
    badge: "Yakında",
    title: "Değerleme Uzmanıyla Doğrudan İletişim",
    text: "Bu hizmet yakında değerli parçalar ve profesyonel değerlendirmeler için özel abonelik kapsamında sunulacaktır.",
    gotIt: "Anladım",
  },
};

const RTL_LOCALES: Locale[] = ["ar", "ku", "fa"];

export default function ExpertContactButton({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const copy = COPY[locale] || COPY.en;
  const isRtl = RTL_LOCALES.includes(locale);

  function handleClick() {
    if (EXPERT_CHAT_ENABLED) {
      window.open(EXPERT_WHATSAPP_URL, "_blank", "noopener,noreferrer");
      return;
    }

    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={copy.button}
        aria-label={copy.button}
        className="fixed bottom-4 left-3 z-40 grid h-12 w-12 place-items-center rounded-full border border-[#d2b98f]/45 bg-[#11100f]/50 text-[#fff4e2] shadow-[0_14px_34px_rgba(36,25,19,0.18)] backdrop-blur-2xl transition hover:border-[#dcc18a]/80 hover:bg-[#6d241d]/78 sm:bottom-[18px] sm:left-[18px] sm:h-[52px] sm:w-[52px]"
      >
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-[#b88a3d]/92 text-[#fff4e2] shadow-inner shadow-white/10">
          <BadgeCheck className="h-5 w-5" aria-hidden="true" />
          <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border border-[#fff4e2]/80 bg-[#241913]">
            <LockKeyhole className="h-2.5 w-2.5" />
          </span>
        </span>
      </button>

      {open ? (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="fixed inset-0 z-[9999] grid place-items-center bg-[#241913]/28 px-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-[360px] rounded-[18px] border border-[#d2b98f] bg-[#fff4e2] p-4 text-[#241913] shadow-[0_24px_70px_rgba(36,25,19,0.22)]">
            <div className="mb-3 flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#efe3cf] text-[#986f2e]">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-bold text-[#241913]">
                  {copy.title}
                </h3>
                <p className="mt-1 text-[12px] leading-5 text-[#735f4b]">
                  {copy.text}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={copy.gotIt}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d2b98f] text-[#735f4b] transition hover:bg-[#efe3cf]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 h-10 w-full rounded-[13px] bg-[#6d241d] text-[12px] font-bold text-[#fff4e2] transition hover:bg-[#7d2d23]"
            >
              {copy.gotIt}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
