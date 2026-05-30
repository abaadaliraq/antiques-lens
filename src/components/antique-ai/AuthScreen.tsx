"use client";

import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import LanguagePills from "./LanguagePills";
import type { Locale } from "./types";

type AuthMode = "login" | "signup";

type AuthScreenProps = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  onAuthenticated: () => void;
};

type AuthCopy = {
  welcome: string;
  subtitle: string;
  login: string;
  signup: string;
  name: string;
  email: string;
  password: string;
  forgot: string;
  continue: string;
  legal: string;
  terms: string;
  privacy: string;
  cookies: string;
  checkEmail: string;
  configError: string;
};

const COPY: Record<Locale, AuthCopy> = {
  ar: {
    welcome: "أهلاً بك في KISHIB",
    subtitle: "ادخل إلى منصة تقييم التحف والقطع التراثية.",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    forgot: "نسيت كلمة المرور؟",
    continue: "متابعة",
    legal: "بالمتابعة أنت توافق على",
    terms: "الشروط",
    privacy: "الخصوصية",
    cookies: "الكوكيز",
    checkEmail: "تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيد الدخول.",
    configError: "إعدادات Supabase غير مكتملة. أضف anon key في ملف البيئة.",
  },
  en: {
    welcome: "Welcome to KISHIB",
    subtitle: "Sign in to evaluate antiques and heritage objects.",
    login: "Log in",
    signup: "Sign up",
    name: "Full name",
    email: "Email",
    password: "Password",
    forgot: "Forgot password?",
    continue: "Continue",
    legal: "By continuing, you agree to",
    terms: "Terms",
    privacy: "Privacy",
    cookies: "Cookies",
    checkEmail: "Account created. Please check your email to confirm sign in.",
    configError: "Supabase setup is incomplete. Add the anon key to the environment file.",
  },
  fr: {
    welcome: "Bienvenue sur KISHIB",
    subtitle: "Connectez-vous pour évaluer les antiquités.",
    login: "Connexion",
    signup: "Créer un compte",
    name: "Nom complet",
    email: "E-mail",
    password: "Mot de passe",
    forgot: "Mot de passe oublié ?",
    continue: "Continuer",
    legal: "En continuant, vous acceptez",
    terms: "Conditions",
    privacy: "Confidentialité",
    cookies: "Cookies",
    checkEmail: "Compte créé. Veuillez vérifier votre e-mail pour confirmer la connexion.",
    configError: "La configuration Supabase est incomplète. Ajoutez la clé anon au fichier d’environnement.",
  },
  hi: {
    welcome: "KISHIB में आपका स्वागत है",
    subtitle: "प्राचीन वस्तुओं के मूल्यांकन के लिए साइन इन करें।",
    login: "लॉग इन",
    signup: "साइन अप",
    name: "पूरा नाम",
    email: "ईमेल",
    password: "पासवर्ड",
    forgot: "पासवर्ड भूल गए?",
    continue: "जारी रखें",
    legal: "जारी रखकर आप सहमत हैं",
    terms: "शर्तें",
    privacy: "गोपनीयता",
    cookies: "कुकीज़",
    checkEmail: "खाता बन गया। साइन इन की पुष्टि के लिए अपना ईमेल देखें।",
    configError: "Supabase सेटअप अधूरा है। environment file में anon key जोड़ें।",
  },
  fa: {
    welcome: "به KISHIB خوش آمدید",
    subtitle: "برای ارزیابی عتیقه‌ها وارد شوید.",
    login: "ورود",
    signup: "ثبت‌نام",
    name: "نام کامل",
    email: "ایمیل",
    password: "رمز عبور",
    forgot: "رمز را فراموش کرده‌اید؟",
    continue: "ادامه",
    legal: "با ادامه، می‌پذیرید",
    terms: "شرایط",
    privacy: "حریم خصوصی",
    cookies: "کوکی‌ها",
    checkEmail: "حساب ساخته شد. برای تأیید ورود ایمیل خود را بررسی کنید.",
    configError: "تنظیمات Supabase کامل نیست. anon key را به فایل محیط اضافه کنید.",
  },
  tr: {
    welcome: "KISHIB’e hoş geldiniz",
    subtitle: "Antika ve miras parçalarını değerlendirmek için giriş yapın.",
    login: "Giriş yap",
    signup: "Kayıt ol",
    name: "Ad soyad",
    email: "E-posta",
    password: "Şifre",
    forgot: "Şifremi unuttum",
    continue: "Devam et",
    legal: "Devam ederek kabul edersiniz",
    terms: "Şartlar",
    privacy: "Gizlilik",
    cookies: "Çerezler",
    checkEmail: "Hesap oluşturuldu. Girişi onaylamak için e-postanızı kontrol edin.",
    configError: "Supabase kurulumu eksik. Ortam dosyasına anon key ekleyin.",
  },
  ru: {
    welcome: "Добро пожаловать в KISHIB",
    subtitle: "Войдите, чтобы оценивать антиквариат и предметы наследия.",
    login: "Войти",
    signup: "Регистрация",
    name: "Полное имя",
    email: "Эл. почта",
    password: "Пароль",
    forgot: "Забыли пароль?",
    continue: "Продолжить",
    legal: "Продолжая, вы соглашаетесь с",
    terms: "Условиями",
    privacy: "Конфиденциальностью",
    cookies: "Cookies",
    checkEmail: "Аккаунт создан. Проверьте почту, чтобы подтвердить вход.",
    configError: "Настройка Supabase не завершена. Добавьте anon key в файл окружения.",
  },
  ku: {
    welcome: "بەخێربێیت بۆ KISHIB",
    subtitle: "بچۆ ژوورەوە بۆ هەڵسەنگاندنی پارچە کۆنەکان.",
    login: "چوونەژوورەوە",
    signup: "هەژمار دروستکردن",
    name: "ناوی تەواو",
    email: "ئیمەیل",
    password: "وشەی نهێنی",
    forgot: "وشەی نهێنیت لەبیر کرد؟",
    continue: "بەردەوامبوون",
    legal: "بە بەردەوامبوون ڕازیت بە",
    terms: "مەرجەکان",
    privacy: "تایبەتمەندی",
    cookies: "کوکیز",
    checkEmail: "هەژمار دروستکرا. تکایە ئیمەیلەکەت بپشکنە بۆ پشتڕاستکردنەوە.",
    configError: "ڕێکخستنی Supabase تەواو نییە. anon key زیاد بکە بۆ فایلەکانی ژینگە.",
  },
};

function isRtl(locale: Locale) {
  return locale === "ar" || locale === "fa" || locale === "ku";
}

function getGoogleLabel(locale: Locale) {
  const labels: Partial<Record<Locale, string>> = {
    ar: "المتابعة بحساب Google",
    en: "Continue with Google",
    fr: "Continuer avec Google",
    hi: "Google के साथ जारी रखें",
    fa: "ادامه با Google",
    tr: "Google ile devam et",
    ru: "Продолжить с Google",
    ku: "بە Google بەردەوام ببە",
  };

  return labels[locale] || labels.en;
}

function getDividerLabel(locale: Locale) {
  const labels: Partial<Record<Locale, string>> = {
    ar: "أو",
    en: "or",
    fr: "ou",
    hi: "या",
    fa: "یا",
    tr: "veya",
    ru: "или",
    ku: "یان",
  };

  return labels[locale] || labels.en;
}

export default function AuthScreen({
  locale,
  setLocale,
  onAuthenticated,
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const copy = COPY[locale];
  const direction = isRtl(locale) ? "rtl" : "ltr";

  async function handleAuthSubmit() {
    setAuthError("");
    setAuthMessage("");
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              preferred_locale: locale,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          onAuthenticated();
          return;
        }

        setAuthMessage(copy.checkEmail);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      onAuthenticated();
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes("NEXT_PUBLIC_SUPABASE")
          ? copy.configError
          : error instanceof Error
            ? error.message
            : copy.configError;

      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setAuthError("");
    setAuthMessage("");
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();

      window.localStorage.setItem("kishib:pending-oauth-locale", locale);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes("NEXT_PUBLIC_SUPABASE")
          ? copy.configError
          : error instanceof Error
            ? error.message
            : copy.configError;

      setAuthError(message);
      setIsSubmitting(false);
    }
  }

  return (
    <main
      dir={direction}
      className="relative h-dvh overflow-hidden bg-[#090503] text-white"
    >
      <Image
        src="/bg-1.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-58"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35),rgba(13,6,3,0.72)_48%,rgba(5,2,1,0.96))]" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(214,162,95,0.16),transparent_34%),linear-gradient(to_bottom,rgba(5,2,1,0.06),rgba(5,2,1,0.78))]" />

      <div className="relative z-10 flex h-dvh flex-col px-4 py-3 md:px-10 md:py-8">
        <div className="flex shrink-0 items-center justify-start md:justify-end">
          <LanguagePills lang={locale} setLang={setLocale} />
        </div>

        <section className="mx-auto grid min-h-0 w-full max-w-[1060px] flex-1 items-center gap-5 md:grid-cols-[minmax(0,1fr)_410px] md:gap-12">
          <div className="mx-auto w-full max-w-[360px] text-center md:mx-0 md:max-w-[520px] md:text-start">
            <Image
              src="/kishib-logo.png"
              alt="KISHIB"
              width={96}
              height={96}
              className="mx-auto mb-2 h-14 w-14 object-contain drop-shadow-[0_18px_42px_rgba(214,104,55,0.32)] md:mx-0 md:mb-5 md:h-28 md:w-28"
            />
            <h1 className="text-[28px] font-semibold leading-[1.05] tracking-normal text-white md:text-[52px]">
              {copy.welcome}
            </h1>
            <p className="mx-auto mt-2 max-w-[310px] text-[12px] leading-5 text-white/58 md:mx-0 md:mt-4 md:max-w-[430px] md:text-[15px] md:leading-7">
              {copy.subtitle}
            </p>
          </div>

          <div className="mx-auto w-full max-w-[390px] rounded-[1.45rem] border border-[#b66b3d]/24 bg-[#100905]/86 p-3 shadow-[0_22px_90px_rgba(0,0,0,0.46)] backdrop-blur-2xl md:max-w-none md:rounded-[1.75rem] md:p-5">
            <div className="mb-3 grid grid-cols-2 rounded-[1.15rem] border border-[#b66b3d]/18 bg-black/30 p-1 md:mb-4">
              {(["login", "signup"] as AuthMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={[
                    "h-9 rounded-[0.9rem] text-[12px] font-semibold transition md:h-11 md:text-[13px]",
                    mode === item
                      ? "bg-[#d89a4f] text-[#140905] shadow-[0_12px_30px_rgba(216,154,79,0.22)]"
                      : "text-white/55 hover:bg-white/[0.055] hover:text-white",
                  ].join(" ")}
                >
                  {item === "login" ? copy.login : copy.signup}
                </button>
              ))}
            </div>

            <form
              className="space-y-2.5 md:space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void handleAuthSubmit();
              }}
            >
              {mode === "signup" && (
                <label className="flex h-11 items-center gap-3 rounded-[1rem] border border-[#b66b3d]/18 bg-[#221813]/78 px-3 md:h-[52px] md:rounded-2xl">
                  <User className="h-4 w-4 shrink-0 text-[#d89a4f]/80" />
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    placeholder={copy.name}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/34"
                  />
                </label>
              )}

              <label className="flex h-11 items-center gap-3 rounded-[1rem] border border-[#b66b3d]/18 bg-[#221813]/78 px-3 md:h-[52px] md:rounded-2xl">
                <Mail className="h-4 w-4 shrink-0 text-[#d89a4f]/80" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder={copy.email}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/34"
                />
              </label>

              <label className="flex h-11 items-center gap-3 rounded-[1rem] border border-[#b66b3d]/18 bg-[#221813]/78 px-3 md:h-[52px] md:rounded-2xl">
                <Lock className="h-4 w-4 shrink-0 text-[#d89a4f]/80" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={copy.password}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/34"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white/45 transition hover:bg-white/8 hover:text-white"
                  aria-label={copy.password}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </label>

              {mode === "login" && (
                <button
                  type="button"
                  className="block w-full text-end text-[11px] font-medium text-[#d89a4f]/80"
                >
                  {copy.forgot}
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-[1rem] bg-[#d89a4f] text-[13px] font-bold text-[#130905] shadow-[0_18px_45px_rgba(216,154,79,0.18)] transition hover:bg-[#efbd75] disabled:cursor-not-allowed disabled:opacity-70 md:h-12 md:rounded-2xl"
              >
                {isSubmitting ? "..." : copy.continue}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </button>

              <div className="flex items-center gap-3 py-0.5 md:py-1">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/28">
                  {getDividerLabel(locale)}
                </span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleGoogleSignIn()}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-[1rem] border border-[#b66b3d]/20 bg-[#241813]/82 text-[12.5px] font-semibold text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-60 md:h-12 md:rounded-2xl md:text-[13px]"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[15px] font-bold text-[#1f1f1f]">
                  G
                </span>
                {getGoogleLabel(locale)}
              </button>

              {authMessage ? (
                <p className="rounded-2xl border border-[#d6a25f]/18 bg-[#d6a25f]/8 px-3 py-2 text-[11.5px] leading-5 text-[#f0c987]">
                  {authMessage}
                </p>
              ) : null}

              {authError ? (
                <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-[11.5px] leading-5 text-red-100">
                  {authError}
                </p>
              ) : null}
            </form>

            <p className="mt-3 text-center text-[9.5px] leading-4 text-white/38 md:mt-4 md:text-[10.5px] md:leading-5">
              {copy.legal}{" "}
              <Link href="/terms" className="text-[#d6a25f]/82 hover:text-[#f0c987]">
                {copy.terms}
              </Link>
              {" · "}
              <Link href="/privacy" className="text-[#d6a25f]/82 hover:text-[#f0c987]">
                {copy.privacy}
              </Link>
              {" · "}
              <Link href="/cookies" className="text-[#d6a25f]/82 hover:text-[#f0c987]">
                {copy.cookies}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
