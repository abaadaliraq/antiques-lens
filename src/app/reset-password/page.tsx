"use client";

import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const PASSWORD_RESET_SUCCESS_KEY = "kishib:password-reset-success";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    function hasLinkError() {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      return Boolean(searchParams.get("error") || hashParams.get("error"));
    }

    async function validateRecoveryLink() {
      if (hasLinkError()) {
        if (!mounted) return;
        setError("الرابط غير صالح أو انتهت صلاحيته، يرجى طلب رابط جديد.");
        setIsCheckingLink(false);
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data.session) {
        setIsReady(true);
        setIsCheckingLink(false);
        return;
      }

      window.setTimeout(async () => {
        const { data: retryData } = await supabase.auth.getSession();

        if (!mounted) return;

        if (retryData.session) {
          setIsReady(true);
        } else {
          setError("الرابط غير صالح أو انتهت صلاحيته، يرجى طلب رابط جديد.");
        }

        setIsCheckingLink(false);
      }, 900);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setIsReady(true);
        setError("");
        setIsCheckingLink(false);
      }
    });

    void validateRecoveryLink();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit() {
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("كلمة المرور يجب ألا تقل عن 8 أحرف.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("كلمة المرور وتأكيدها غير متطابقين.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setMessage("تم حفظ كلمة المرور الجديدة بنجاح.");
      window.sessionStorage.setItem(PASSWORD_RESET_SUCCESS_KEY, "true");

      await supabase.auth.signOut();

      window.setTimeout(() => {
        window.location.assign("/");
      }, 1200);
    } catch {
      setError("تعذر تحديث كلمة المرور حالياً، حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-dvh overflow-hidden kishib-bg-auth px-4 py-5 text-[#241913]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(181,138,69,0.16),transparent_58%)]" />
      <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#d9b59e]/55 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#d2b98f]/35 via-[#efe3cf]/18 to-transparent" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-[390px] flex-col justify-center">
        <div className="mb-5 flex items-center justify-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#241913]/78">
          <Image
            src="/kishib-logo.png"
            alt="KISHIB"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span>KISHIB</span>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
          className="rounded-[18px] border border-[#d2b98f] bg-[#fff4e2]/88 p-4 shadow-[0_20px_60px_rgba(62,39,22,0.16)] backdrop-blur-md"
        >
          <div className="mb-4 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#efe3cf] text-[#986f2e]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-[18px] font-bold text-[#241913]">
                إعادة تعيين كلمة المرور
              </h1>
              <p className="mt-1 text-[12px] leading-5 text-[#735f4b]">
                اكتب كلمة مرور جديدة لحسابك في KISHIB.
              </p>
            </div>
          </div>

          {isCheckingLink ? (
            <p className="rounded-[13px] border border-[#d2b98f] bg-[#fffaf0] px-3 py-2 text-[12px] text-[#735f4b]">
              جار التحقق من رابط الاستعادة...
            </p>
          ) : null}

          {isReady ? (
            <div className="grid gap-2.5">
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                show={showPassword}
                onToggleShow={() => setShowPassword((current) => !current)}
                placeholder="كلمة المرور الجديدة"
              />
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showPassword}
                onToggleShow={() => setShowPassword((current) => !current)}
                placeholder="تأكيد كلمة المرور"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 h-11 rounded-[14px] bg-[#b88a3d] text-[13px] font-bold text-[#fff4e2] transition hover:bg-[#986f2e] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "..." : "حفظ كلمة المرور الجديدة"}
              </button>
            </div>
          ) : null}

          {message ? (
            <p className="mt-3 rounded-[13px] border border-[#b88a3d]/30 bg-[#fffaf0] px-3 py-2 text-[11.5px] leading-5 text-[#735f4b]">
              {message}
            </p>
          ) : null}

          {error ? (
            <p className="mt-3 rounded-[13px] border border-[#8b3a2b]/30 bg-[#d9b59e]/70 px-3 py-2 text-[11.5px] leading-5 text-[#6d241d]">
              {error}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-11 items-center gap-3 rounded-[12px] border border-[#d2b98f] bg-[#fffaf0] px-4">
      <Lock className="h-4 w-4 shrink-0 text-[#b88a3d]" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-[#241913] outline-none placeholder:text-[#8c765e]"
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-[#735f4b] transition hover:bg-[#d9b59e]/50 hover:text-[#241913]"
        aria-label={placeholder}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </label>
  );
}
