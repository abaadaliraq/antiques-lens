"use client";

import { MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import {
  updateCurrentUserProfile,
  type RequiredProfileInput,
  type UserProfile,
} from "@/lib/profilesSupabase";
import type { Locale } from "./types";

type CompleteProfileModalProps = {
  locale: Locale;
  profile: UserProfile | null;
  onCompleted: () => void;
};

const COPY = {
  ar: {
    title: "أكمل بيانات حسابك",
    text: "لأمان التقييمات وحفظ سجلك داخل KISHIB، يجب إكمال رقم الهاتف والموقع قبل استخدام المنصة.",
    name: "الاسم الكامل",
    phone: "رقم الهاتف",
    country: "الدولة",
    city: "المدينة / المحافظة",
    save: "حفظ ومتابعة",
    required: "جميع الحقول مطلوبة.",
    failed: "تعذر حفظ البيانات حالياً، حاول مرة أخرى.",
  },
  en: {
    title: "Complete your account details",
    text: "To keep evaluations secure and save your KISHIB history, phone number and location are required before using the platform.",
    name: "Full name",
    phone: "Phone number",
    country: "Country",
    city: "City / Province",
    save: "Save and continue",
    required: "All fields are required.",
    failed: "Could not save your details right now. Please try again.",
  },
};

function getCopy(locale: Locale) {
  return locale === "ar" ? COPY.ar : COPY.en;
}

function isRtl(locale: Locale) {
  return locale === "ar" || locale === "fa" || locale === "ku";
}

export default function CompleteProfileModal({
  locale,
  profile,
  onCompleted,
}: CompleteProfileModalProps) {
  const copy = getCopy(locale);
  const [form, setForm] = useState<RequiredProfileInput>({
    full_name: "",
    phone: "",
    country: "",
    city: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      country: profile?.country || "",
      city: profile?.city || profile?.province || "",
    });
  }, [profile]);

  async function handleSubmit() {
    setError("");

    const nextForm = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      country: form.country.trim(),
      city: form.city.trim(),
    };

    if (
      !nextForm.full_name ||
      !nextForm.phone ||
      !nextForm.country ||
      !nextForm.city
    ) {
      setError(copy.required);
      return;
    }

    try {
      setSaving(true);
      const result = await updateCurrentUserProfile(nextForm);

      if (!result.complete) {
        setError(copy.required);
        return;
      }

      onCompleted();
    } catch (saveError) {
      console.error("Failed to complete profile", saveError);
      setError(copy.failed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className="fixed inset-0 z-[9999] grid place-items-center bg-[#241913]/42 px-4 py-6 backdrop-blur-[3px]"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
        className="w-full max-w-[390px] rounded-[20px] border border-[#d2b98f] bg-[#fff4e2] p-4 text-[#241913] shadow-[0_26px_80px_rgba(36,25,19,0.24)]"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[#efe3cf] text-[#986f2e]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-[#241913]">
              {copy.title}
            </h2>
            <p className="mt-1 text-[12px] leading-5 text-[#735f4b]">
              {copy.text}
            </p>
          </div>
        </div>

        <div className="grid gap-2.5">
          <ProfileField
            icon={<UserRound />}
            value={form.full_name}
            onChange={(value) =>
              setForm((current) => ({ ...current, full_name: value }))
            }
            placeholder={copy.name}
            autoComplete="name"
          />
          <ProfileField
            icon={<Phone />}
            value={form.phone}
            onChange={(value) =>
              setForm((current) => ({ ...current, phone: value }))
            }
            placeholder={copy.phone}
            autoComplete="tel"
            inputMode="tel"
          />
          <ProfileField
            icon={<MapPin />}
            value={form.country}
            onChange={(value) =>
              setForm((current) => ({ ...current, country: value }))
            }
            placeholder={copy.country}
            autoComplete="country-name"
          />
          <ProfileField
            icon={<MapPin />}
            value={form.city}
            onChange={(value) =>
              setForm((current) => ({ ...current, city: value }))
            }
            placeholder={copy.city}
            autoComplete="address-level1"
          />
        </div>

        {error ? (
          <p className="mt-3 rounded-[13px] border border-[#8b3a2b]/30 bg-[#d9b59e]/55 px-3 py-2 text-[11.5px] leading-5 text-[#6d241d]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 h-11 w-full rounded-[14px] bg-[#6d241d] text-[13px] font-bold text-[#fff4e2] transition hover:bg-[#7d2d23] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "..." : copy.save}
        </button>
      </form>
    </div>
  );
}

function ProfileField({
  icon,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="flex h-11 items-center gap-3 rounded-[12px] border border-[#d2b98f] bg-[#fffaf0] px-4">
      <span className="[&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-[#b88a3d]">
        {icon}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-[#241913] outline-none placeholder:text-[#8c765e]"
      />
    </label>
  );
}
