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

type Plan = {
  id: "free" | "monthly" | "yearly";
  name: string;
  price: string;
  period?: string;
  description: string;
  button: string;
  badge?: string;
  featured?: boolean;
  features: string[];
};

const RTL_LOCALES: Locale[] = ["ar", "ku", "fa"];

function getCopy(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "Pricing plans",
      title: "Choose your KISHIB access",
      text:
        "Online payment is coming soon. Please contact KISHIB to activate your subscription manually.",
      close: "Close",
      contactNote:
        "Online payment is coming soon. Please contact KISHIB to activate your subscription manually.",
      plans: [
        {
          id: "free",
          name: "Free Trial",
          price: "$0",
          description: "5 free evaluations",
          button: "Current Plan",
          features: ["5 evaluations", "Saved reports", "Smart session preview"],
        },
        {
          id: "monthly",
          name: "Monthly",
          price: "$7",
          period: "/ month",
          description: "Unlimited evaluations while active",
          button: "Contact to Subscribe",
          features: ["Unlimited evaluations", "Saved reports", "Smart follow-up session"],
        },
        {
          id: "yearly",
          name: "Yearly",
          price: "$50",
          period: "/ year",
          description: "Best value for continuous use",
          button: "Contact to Subscribe",
          badge: "Save more",
          featured: true,
          features: ["Best yearly value", "Unlimited evaluations", "Priority manual activation"],
        },
      ] satisfies Plan[],
    };
  }

  return {
    eyebrow: "خطط الاشتراك",
    title: "اختر وصولك إلى KISHIB",
    text:
      "الدفع الإلكتروني قيد التفعيل قريبًا. يرجى التواصل مع KISHIB لتفعيل الاشتراك يدويًا.",
    close: "إغلاق",
    contactNote:
      "الدفع الإلكتروني قيد التفعيل قريبًا. يرجى التواصل مع KISHIB لتفعيل الاشتراك يدويًا.",
    plans: [
      {
        id: "free",
        name: "Free Trial",
        price: "0$",
        description: "5 free evaluations",
        button: "Current Plan",
        features: ["5 تقييمات مجانية", "حفظ التقارير", "تجربة الجلسة الذكية"],
      },
      {
        id: "monthly",
        name: "Monthly",
        price: "7$",
        period: "/ month",
        description: "Unlimited evaluations while active",
        button: "تواصل للاشتراك",
        features: ["تقييمات غير محدودة", "حفظ التقارير", "جلسة تقييم ذكية"],
      },
      {
        id: "yearly",
        name: "Yearly",
        price: "50$",
        period: "/ year",
        description: "Best value for continuous use",
        button: "تواصل للاشتراك",
        badge: "Save more",
        featured: true,
        features: ["أفضل قيمة سنوية", "تقييمات غير محدودة", "تفعيل يدوي أولوية"],
      },
    ] satisfies Plan[],
  };
}

export default function SubscriptionModal({ open, locale, onClose }: Props) {
  if (!open) return null;

  const copy = getCopy(locale);
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  function contactTeam(plan: Plan) {
    if (plan.id === "free") return;

    window.open(KISHIB_SUBSCRIPTION_WHATSAPP_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[99999] grid place-items-center overflow-y-auto bg-[#241913]/42 px-3 py-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-[24px] border border-[#d2b98f]/80 bg-[#fff7ea] p-4 text-[#241913] shadow-[0_26px_80px_rgba(36,25,19,0.24)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4 text-center sm:mb-7">
          <div className="mx-auto max-w-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#986f2e]">
              {copy.eyebrow}
            </p>
            <h2 className="mt-2 text-[26px] font-black leading-8 tracking-[-0.04em] text-[#15110d] sm:text-[32px] sm:leading-10">
              {copy.title}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#735f4b]">
              {copy.text}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-[#d2b98f] bg-[#fffaf3] text-[#735f4b] transition hover:bg-[#efe3cf]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {copy.plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onAction={() => contactTeam(plan)} />
          ))}
        </div>

        <p className="mx-auto mt-5 max-w-2xl rounded-[14px] border border-[#d2b98f]/70 bg-[#efe3cf]/55 px-4 py-3 text-center text-[12px] font-semibold leading-5 text-[#6d241d]">
          {copy.contactNote}
        </p>
      </div>
    </div>
  );
}

function PlanCard({ plan, onAction }: { plan: Plan; onAction: () => void }) {
  return (
    <article
      className={[
        "group relative rounded-[22px] border bg-[#fffdf8] p-3.5 shadow-[0_16px_38px_rgba(62,39,22,0.10)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(62,39,22,0.14)] active:scale-[0.99]",
        plan.featured
          ? "border-[#b88a3d] ring-1 ring-[#b88a3d]/25"
          : "border-[#e1cfad]",
      ].join(" ")}
    >
      {plan.badge ? (
        <span className="absolute end-4 top-4 rounded-full bg-[#233f32] px-2.5 py-1 text-[10px] font-black text-[#fff8ec]">
          {plan.badge}
        </span>
      ) : null}

      <div
        className={[
          "rounded-[17px] p-4",
          plan.featured ? "bg-[#e4d8c8]" : "bg-[#f0ece6]",
        ].join(" ")}
      >
        <div className="mb-5 inline-flex rounded-full bg-[#fffaf3] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#241913]">
          {plan.name}
        </div>

        <div className="flex items-end gap-1">
          <span className="text-[32px] font-black leading-none tracking-[-0.05em] text-[#15110d]">
            {plan.price}
          </span>
          {plan.period ? (
            <span className="pb-1 text-[13px] font-bold text-[#4d3c2d]">
              {plan.period}
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-3 min-h-10 text-[13px] font-semibold leading-5 text-[#4d3c2d]">
        {plan.description}
      </p>

      <button
        type="button"
        onClick={onAction}
        disabled={plan.id === "free"}
        className={[
          "mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-[12px] font-black text-[#fff8ec] shadow-[0_10px_22px_rgba(36,25,19,0.18)] transition disabled:cursor-default disabled:opacity-80",
          plan.id === "free"
            ? "bg-[#735f4b]"
            : "bg-[#241913] hover:bg-[#6d241d]",
        ].join(" ")}
      >
        {plan.id === "free" ? (
          <Crown className="h-4 w-4" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        {plan.button}
      </button>

      <div className="mt-5 grid gap-2.5 px-1 pb-1">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-[12px] text-[#4d3c2d]">
            <Check className="h-3.5 w-3.5 shrink-0 text-[#986f2e]" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
