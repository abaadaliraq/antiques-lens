"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";

const TEMP_ACCESS_PASSWORD = "202020";
const TEMP_ACCESS_KEY = "kishib_temp_access";
const TEMP_ACCESS_VALUE = "granted";
const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/private-preview")) return "/";
  return value;
}

function getCopy() {
  if (typeof navigator !== "undefined" && navigator.language.startsWith("ar")) {
    return {
      dir: "rtl" as const,
      title: "KISHIB Private Preview",
      text: "أدخل كلمة المرور المؤقتة للمتابعة",
      placeholder: "كلمة المرور المؤقتة",
      button: "متابعة",
      error: "كلمة المرور غير صحيحة",
      note: "هذه بوابة مؤقتة لمرحلة الاختبار والعرض فقط.",
    };
  }

  return {
    dir: "ltr" as const,
    title: "KISHIB Private Preview",
    text: "Enter the temporary access password to continue",
    placeholder: "Temporary password",
    button: "Continue",
    error: "Incorrect password",
    note: "This is a temporary preview gate for testing and demos only.",
  };
}

export default function PasswordGateClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = useMemo(getCopy, []);
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function grantTemporaryAccess() {
    window.localStorage.setItem(TEMP_ACCESS_KEY, TEMP_ACCESS_VALUE);
    document.cookie = `${TEMP_ACCESS_KEY}=${TEMP_ACCESS_VALUE}; Max-Age=${ACCESS_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
    router.replace(nextPath);
  }

  useEffect(() => {
    if (window.localStorage.getItem(TEMP_ACCESS_KEY) === TEMP_ACCESS_VALUE) {
      grantTemporaryAccess();
    }
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = password.trim();

    if (normalized !== TEMP_ACCESS_PASSWORD) {
      setError(copy.error);
      return;
    }

    setError("");
    grantTemporaryAccess();
  }

  return (
    <main
      dir={copy.dir}
      className="min-h-dvh bg-[#efe3cf] text-[#241913]"
    >
      <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,rgba(184,138,61,0.28),transparent_34%),linear-gradient(145deg,#fff8ea_0%,#efe3cf_48%,#d8c19b_100%)] px-4 py-10">
        <section className="w-full max-w-[390px] rounded-[24px] border border-[#d2b98f] bg-[#fff8ea]/88 p-5 shadow-[0_26px_80px_rgba(62,39,22,0.18)] backdrop-blur-xl sm:p-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#b88a3d]/30 bg-[#efe3cf] text-[#6d241d] shadow-inner">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <div className="mt-5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#b88a3d]">
              KISHIB
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#241913]">
              {copy.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#735f4b]">
              {copy.text}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <label className="block">
              <span className="sr-only">{copy.placeholder}</span>
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#986f2e] ltr:left-3 rtl:right-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder={copy.placeholder}
                  autoComplete="current-password"
                  autoFocus
                  className="h-12 w-full rounded-[15px] border border-[#d2b98f] bg-[#fffaf0] px-10 text-center text-base font-semibold tracking-[0.22em] text-[#241913] outline-none transition placeholder:text-center placeholder:text-sm placeholder:font-medium placeholder:tracking-normal placeholder:text-[#9c8770] focus:border-[#b88a3d] focus:ring-4 focus:ring-[#b88a3d]/18"
                />
              </span>
            </label>

            {error ? (
              <p className="rounded-[12px] border border-[#a35a44]/25 bg-[#a35a44]/10 px-3 py-2 text-center text-xs font-semibold text-[#6d241d]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="h-12 w-full rounded-[15px] bg-[#6d241d] px-4 text-sm font-bold text-[#fff4e2] shadow-[0_14px_32px_rgba(109,36,29,0.22)] transition hover:bg-[#7d2d23] focus:outline-none focus:ring-4 focus:ring-[#b88a3d]/24"
            >
              {copy.button}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] leading-5 text-[#735f4b]">
            {copy.note}
          </p>
        </section>
      </div>
    </main>
  );
}
