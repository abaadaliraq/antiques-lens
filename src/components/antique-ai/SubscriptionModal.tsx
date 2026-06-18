"use client";

import { Check, Crown, MessageCircle, X } from "lucide-react";
import type { Locale } from "./types";

const KISHIB_SUBSCRIPTION_WHATSAPP_URL =
  "https://wa.me/964777045599?text=Hello%20KISHIB%2C%20I%20want%20to%20activate%20a%20subscription.";

type Props = {
  open: boolean;
  locale: Locale;
  onClose: () => void;
};

const RTL_LOCALES: Locale[] = ["ar", "ku", "fa"];

function getCopy(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "Subscription",
      title: "Activate KISHIB analysis",
      text:
        "Online payment is being activated soon. You can currently contact the KISHIB team to activate your subscription manually.",
      monthly: "Monthly Plan",
      yearly: "Yearly Plan",
      monthPrice: "$7 / month",
      yearPrice: "$50 / year",
      save: "Save $34",
      action: "Contact to subscribe",
      soon: "Online payment is coming soon.",
      close: "Close",
      perks: ["Unlimited evaluations while active", "Saved reports", "Smart follow-up session"],
    };
  }

  return {
    eyebrow: "الاشتراك",
    title: "تفعيل تحليل KISHIB",
    text:
      "الدفع الإلكتروني قيد التفعيل قريبًا. يمكنك حاليًا التواصل مع فريق KISHIB لتفعيل الاشتراك يدويًا.",
    monthly: "Monthly Plan",
    yearly: "Yearly Plan",
    monthPrice: "7$ / month",
    yearPrice: "50$ / year",
    save: "وفر 34$",
    action: "تواصل للاشتراك",
    soon: "الدفع الإلكتروني قيد التفعيل قريبًا.",
    close: "إغلاق",
    perks: ["تحليلات غير محدودة أثناء الاشتراك", "حفظ التقارير", "جلسة تقييم ذكية"],
  };
}

export default function SubscriptionModal({ open, locale, onClose }: Props) {
  if (!open) return null;

  const copy = getCopy(locale);
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  function contactTeam() {
    window.open(KISHIB_SUBSCRIPTION_WHATSAPP_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[99999] grid place-items-center bg-[#241913]/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-[22px] border border-[#d2b98f] bg-[#fff4e2] p-4 text-[#241913] shadow-[0_28px_90px_rgba(36,25,19,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[#241913] text-[#f5d8a7]">
            <Crown className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#986f2e]">
              {copy.eyebrow}
            </p>
            <h2 className="mt-1 text-[20px] font-bold leading-7 text-[#233f32]">
              {copy.title}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-[#735f4b]">
              {copy.text}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d2b98f] text-[#735f4b] transition hover:bg-[#efe3cf]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3">
          <PlanCard
            title={copy.monthly}
            price={copy.monthPrice}
            action={copy.action}
            onAction={contactTeam}
          />
          <PlanCard
            title={copy.yearly}
            price={copy.yearPrice}
            badge={copy.save}
            action={copy.action}
            onAction={contactTeam}
          />
        </div>

        <div className="mt-4 rounded-[16px] border border-[#d2b98f] bg-[#efe3cf]/60 p-3">
          <p className="text-[12px] font-semibold text-[#6d241d]">{copy.soon}</p>
          <div className="mt-2 grid gap-1.5">
            {copy.perks.map((perk) => (
              <div
                key={perk}
                className="flex items-center gap-2 text-[12px] leading-5 text-[#735f4b]"
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-[#986f2e]" />
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  title,
  price,
  badge,
  action,
  onAction,
}: {
  title: string;
  price: string;
  badge?: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[18px] border border-[#d2b98f] bg-[#fffaf3] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-[#241913]">{title}</h3>
          <p className="mt-1 text-[18px] font-black text-[#986f2e]">{price}</p>
        </div>

        {badge ? (
          <span className="rounded-full bg-[#233f32] px-2.5 py-1 text-[10px] font-bold text-[#fff4e2]">
            {badge}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onAction}
        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-[13px] bg-[#6d241d] px-4 text-[12px] font-bold text-[#fff4e2] transition hover:bg-[#7d2d23]"
      >
        <MessageCircle className="h-4 w-4" />
        {action}
      </button>
    </div>
  );
}
