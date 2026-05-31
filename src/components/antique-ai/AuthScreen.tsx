"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Eye,
  EyeOff,
  Globe2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import LanguagePills from "./LanguagePills";
import type { Locale } from "./types";

type AuthMode = "login" | "signup";

type AuthScreenProps = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  onAuthenticated: () => void;
};

const AUTH_CACHE_KEY = "kishib:auth-session-active";

function cacheAuthSession() {
  window.localStorage.setItem(AUTH_CACHE_KEY, "true");
}

type AuthCopy = {
  eyebrow: string;
  intro: string[];
  subtitle: string;
  login: string;
  signup: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  province: string;
  birthDate: string;
  forgot: string;
  continue: string;
  google: string;
  back: string;
  or: string;
  legal: string;
  terms: string;
  privacy: string;
  cookies: string;
  checkEmail: string;
  configError: string;
};

const PHONE_CODES = [
  { flag: "🇮🇶", name: "Iraq", code: "+964" },
  { flag: "🇺🇸", name: "United States", code: "+1" },
  { flag: "🇬🇧", name: "United Kingdom", code: "+44" },
  { flag: "🇦🇪", name: "United Arab Emirates", code: "+971" },
  { flag: "🇸🇦", name: "Saudi Arabia", code: "+966" },
  { flag: "🇹🇷", name: "Turkey", code: "+90" },
  { flag: "🇮🇷", name: "Iran", code: "+98" },
  { flag: "🇰🇼", name: "Kuwait", code: "+965" },
  { flag: "🇶🇦", name: "Qatar", code: "+974" },
  { flag: "🇯🇴", name: "Jordan", code: "+962" },
  { flag: "🇱🇧", name: "Lebanon", code: "+961" },
  { flag: "🇫🇷", name: "France", code: "+33" },
  { flag: "🇩🇪", name: "Germany", code: "+49" },
  { flag: "🇮🇳", name: "India", code: "+91" },
  { flag: "🇷🇺", name: "Russia", code: "+7" },
] as const;

const COPY: Record<Locale, AuthCopy> = {
  en: {
    eyebrow: "Authenticate • Evaluate • Preserve",
    intro: [
      "Photograph any piece and let KISHIB evaluate it.",
      "Know the value of your antiques and collectibles.",
      "Keep your evaluations, notes, and corrections in one account.",
    ],
    subtitle: "AI-assisted antique evaluation for collectors, dealers, and heritage lovers.",
    login: "Log in",
    signup: "Create account",
    name: "Full name",
    email: "Email",
    password: "Password",
    phone: "Phone number",
    country: "Country",
    province: "Province / City",
    birthDate: "Birth date",
    forgot: "Forgot password?",
    continue: "Continue",
    google: "Continue with Google",
    back: "Back",
    or: "or",
    legal: "By continuing, you agree to",
    terms: "Terms",
    privacy: "Privacy",
    cookies: "Cookies",
    checkEmail: "Account created. A confirmation link has been sent to your email.",
    configError: "Supabase setup is incomplete. Add the anon key to the environment file.",
  },
  ar: {
    eyebrow: "وثّق • قيّم • احفظ",
    intro: [
      "صوّر أي قطعة وسيتم تقييمها.",
      "اعرف قيمة مقتنياتك بثقة أكبر.",
      "احفظ تقييماتك وملاحظاتك وتصحيحاتك في حساب واحد.",
    ],
    subtitle: "منصة ذكية لتقييم التحف والقطع التراثية لهواة الجمع والتجار.",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    phone: "رقم الهاتف",
    country: "الدولة",
    province: "المحافظة / المدينة",
    birthDate: "تاريخ الميلاد",
    forgot: "نسيت كلمة المرور؟",
    continue: "متابعة",
    google: "المتابعة بحساب Google",
    back: "رجوع",
    or: "أو",
    legal: "بالمتابعة أنت توافق على",
    terms: "الشروط",
    privacy: "الخصوصية",
    cookies: "الكوكيز",
    checkEmail: "تم إنشاء الحساب. سيصلك رابط التأكيد على بريدك الإلكتروني.",
    configError: "إعدادات Supabase غير مكتملة. أضف anon key في ملف البيئة.",
  },
  fr: {
    eyebrow: "Authentifier • Évaluer • Préserver",
    intro: [
      "Photographiez une pièce et KISHIB l'évalue.",
      "Découvrez la valeur de vos objets anciens.",
      "Gardez vos évaluations et corrections dans un compte.",
    ],
    subtitle: "Évaluation assistée par IA pour antiquités et objets patrimoniaux.",
    login: "Connexion",
    signup: "Créer un compte",
    name: "Nom complet",
    email: "E-mail",
    password: "Mot de passe",
    phone: "Téléphone",
    country: "Pays",
    province: "Province / Ville",
    birthDate: "Date de naissance",
    forgot: "Mot de passe oublié ?",
    continue: "Continuer",
    google: "Continuer avec Google",
    back: "Retour",
    or: "ou",
    legal: "En continuant, vous acceptez",
    terms: "Conditions",
    privacy: "Confidentialité",
    cookies: "Cookies",
    checkEmail: "Compte créé. Un lien de confirmation a été envoyé à votre e-mail.",
    configError: "La configuration Supabase est incomplète. Ajoutez la clé anon au fichier d'environnement.",
  },
  hi: {
    eyebrow: "प्रमाणित • मूल्यांकन • सुरक्षित",
    intro: [
      "किसी भी वस्तु की तस्वीर लें और KISHIB उसका मूल्यांकन करेगा.",
      "अपनी प्राचीन वस्तुओं का मूल्य बेहतर तरीके से जानें.",
      "अपने मूल्यांकन और सुधार एक खाते में रखें.",
    ],
    subtitle: "संग्रहकर्ताओं और विरासत प्रेमियों के लिए AI-सहायता मूल्यांकन.",
    login: "लॉग इन",
    signup: "खाता बनाएं",
    name: "पूरा नाम",
    email: "ईमेल",
    password: "पासवर्ड",
    phone: "फ़ोन नंबर",
    country: "देश",
    province: "प्रदेश / शहर",
    birthDate: "जन्म तारीख",
    forgot: "पासवर्ड भूल गए?",
    continue: "जारी रखें",
    google: "Google के साथ जारी रखें",
    back: "वापस",
    or: "या",
    legal: "जारी रखकर आप सहमत हैं",
    terms: "शर्तें",
    privacy: "गोपनीयता",
    cookies: "कुकीज़",
    checkEmail: "खाता बन गया. पुष्टि लिंक आपके ईमेल पर भेजा गया है.",
    configError: "Supabase setup अधूरा है. environment file में anon key जोड़ें.",
  },
  fa: {
    eyebrow: "اعتبارسنجی • ارزیابی • نگهداری",
    intro: [
      "از هر قطعه عکس بگیرید و KISHIB آن را ارزیابی می‌کند.",
      "ارزش عتیقه‌ها و مجموعه‌های خود را بهتر بشناسید.",
      "ارزیابی‌ها و اصلاحات را در یک حساب نگه دارید.",
    ],
    subtitle: "ارزیابی هوشمند عتیقه‌ها برای مجموعه‌داران و علاقه‌مندان میراث.",
    login: "ورود",
    signup: "ثبت‌نام",
    name: "نام کامل",
    email: "ایمیل",
    password: "رمز عبور",
    phone: "شماره تلفن",
    country: "کشور",
    province: "استان / شهر",
    birthDate: "تاریخ تولد",
    forgot: "رمز را فراموش کرده‌اید؟",
    continue: "ادامه",
    google: "ادامه با Google",
    back: "بازگشت",
    or: "یا",
    legal: "با ادامه، می‌پذیرید",
    terms: "شرایط",
    privacy: "حریم خصوصی",
    cookies: "کوکی‌ها",
    checkEmail: "حساب ساخته شد. لینک تأیید به ایمیل شما ارسال شد.",
    configError: "تنظیمات Supabase کامل نیست. anon key را به فایل محیط اضافه کنید.",
  },
  tr: {
    eyebrow: "Doğrula • Değerlendir • Koru",
    intro: [
      "Herhangi bir parçayı fotoğraflayın, KISHIB değerlendirsin.",
      "Antika ve koleksiyonlarınızın değerini öğrenin.",
      "Değerlendirmeleri ve düzeltmeleri tek hesapta saklayın.",
    ],
    subtitle: "Koleksiyonerler ve miras meraklıları için yapay zekâ destekli değerlendirme.",
    login: "Giriş yap",
    signup: "Hesap oluştur",
    name: "Ad soyad",
    email: "E-posta",
    password: "Şifre",
    phone: "Telefon numarası",
    country: "Ülke",
    province: "İl / Şehir",
    birthDate: "Doğum tarihi",
    forgot: "Şifremi unuttum",
    continue: "Devam et",
    google: "Google ile devam et",
    back: "Geri",
    or: "veya",
    legal: "Devam ederek kabul edersiniz",
    terms: "Şartlar",
    privacy: "Gizlilik",
    cookies: "Çerezler",
    checkEmail: "Hesap oluşturuldu. Onay bağlantısı e-postanıza gönderildi.",
    configError: "Supabase kurulumu eksik. Ortam dosyasına anon key ekleyin.",
  },
  ru: {
    eyebrow: "Проверить • Оценить • Сохранить",
    intro: [
      "Сфотографируйте предмет, и KISHIB оценит его.",
      "Узнайте ценность антиквариата и коллекций.",
      "Храните оценки и исправления в одном аккаунте.",
    ],
    subtitle: "AI-оценка антиквариата для коллекционеров и любителей наследия.",
    login: "Войти",
    signup: "Создать аккаунт",
    name: "Полное имя",
    email: "Эл. почта",
    password: "Пароль",
    phone: "Телефон",
    country: "Страна",
    province: "Регион / Город",
    birthDate: "Дата рождения",
    forgot: "Забыли пароль?",
    continue: "Продолжить",
    google: "Продолжить с Google",
    back: "Назад",
    or: "или",
    legal: "Продолжая, вы соглашаетесь с",
    terms: "Условиями",
    privacy: "Конфиденциальностью",
    cookies: "Cookies",
    checkEmail: "Аккаунт создан. Ссылка подтверждения отправлена на вашу почту.",
    configError: "Настройка Supabase не завершена. Добавьте anon key в файл окружения.",
  },
  ku: {
    eyebrow: "پشتڕاستکردن • هەڵسەنگاندن • پاراستن",
    intro: [
      "وێنەی هەر پارچەیەک بگرە و KISHIB هەڵی بسەنگێنێت.",
      "نرخی کۆنەکانی خۆت باشتر بناسە.",
      "هەڵسەنگاندن و ڕاستکردنەوەکانت لە هەژمارێکدا هەڵبگرە.",
    ],
    subtitle: "هەڵسەنگاندنی زیرەک بۆ پارچە کۆن و میراتییەکان.",
    login: "چوونەژوورەوە",
    signup: "هەژمار دروستکردن",
    name: "ناوی تەواو",
    email: "ئیمەیڵ",
    password: "وشەی نهێنی",
    phone: "ژمارەی تەلەفۆن",
    country: "وڵات",
    province: "پارێزگا / شار",
    birthDate: "ڕێکەوتی لەدایکبوون",
    forgot: "وشەی نهێنیت لەبیر کرد؟",
    continue: "بەردەوامبوون",
    google: "بە Google بەردەوام ببە",
    back: "گەڕانەوە",
    or: "یان",
    legal: "بە بەردەوامبوون ڕازیت بە",
    terms: "مەرجەکان",
    privacy: "تایبەتمەندی",
    cookies: "کوکیز",
    checkEmail: "هەژمار دروستکرا. بەستەری پشتڕاستکردنەوە بۆ ئیمەیڵەکەت نێردرا.",
    configError: "ڕێکخستنی Supabase تەواو نییە. anon key زیاد بکە بۆ فایلەکانی ژینگە.",
  },
};

function isRtl(locale: Locale) {
  return locale === "ar" || locale === "fa" || locale === "ku";
}

export default function AuthScreen({
  locale,
  setLocale,
  onAuthenticated,
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [activeLine, setActiveLine] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phoneCode, setPhoneCode] = useState<string>(PHONE_CODES[0].code);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const copy = COPY[locale] || COPY.en;
  const direction = isRtl(locale) ? "rtl" : "ltr";
  const activeIntro = copy.intro[activeLine] || copy.intro[0];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveLine((current) => (current + 1) % copy.intro.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [copy.intro.length]);

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
              country: country.trim(),
              province: province.trim(),
              birth_date: birthDate,
              phone_code: phoneCode,
              phone_number: phone.trim(),
              phone: `${phoneCode}${phone.trim()}`,
              preferred_locale: locale,
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        if (data.session) {
          await supabase.auth.signOut();
        }

        setAuthMessage(copy.checkEmail);
        setMode("login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      cacheAuthSession();
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
      className="relative h-dvh overflow-hidden bg-[#070403] text-white"
    >
      <Image
        src="/bg-1.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-42"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(206,87,35,0.42),transparent_28%),radial-gradient(circle_at_18%_78%,rgba(190,92,48,0.36),transparent_32%),linear-gradient(135deg,rgba(8,5,3,0.78),rgba(21,10,5,0.9)_52%,rgba(5,3,2,0.96))]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/62 to-transparent" />

      <div className="relative z-10 flex h-dvh flex-col px-4 py-4 md:px-10 md:py-8">
        <header className="flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/78">
            <Image
              src="/kishib-logo.png"
              alt="KISHIB"
              width={30}
              height={30}
              className="h-7 w-7 object-contain"
            />
            <span>KISHIB</span>
          </div>
          <LanguagePills lang={locale} setLang={setLocale} />
        </header>

        <section className="mx-auto grid min-h-0 w-full max-w-[1120px] flex-1 items-center gap-8 py-4 md:grid-cols-[390px_minmax(0,1fr)] md:gap-16">
          <motion.aside
            initial={{ opacity: 0, x: direction === "rtl" ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            className="mx-auto w-full max-w-[390px] md:mx-0"
          >
            <div className="mb-5 grid grid-cols-2 rounded-full border border-white/12 bg-black/18 p-1 backdrop-blur-md">
              {(["login", "signup"] as AuthMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={[
                    "h-10 rounded-full px-4 text-[12px] font-bold transition",
                    mode === item
                      ? "bg-[#d96b32] text-white shadow-[0_14px_34px_rgba(217,107,50,0.28)]"
                      : "text-white/62 hover:bg-white/8 hover:text-white",
                  ].join(" ")}
                >
                  {item === "login" ? copy.login : copy.signup}
                </button>
              ))}
            </div>

            <h2 className="text-[27px] font-semibold tracking-normal text-white">
              {mode === "login" ? copy.login : copy.signup}
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-white/52">
              {copy.subtitle}
            </p>

            <form
              className="mt-5 space-y-2.5"
              onSubmit={(event) => {
                event.preventDefault();
                void handleAuthSubmit();
              }}
            >
              {mode === "signup" && (
                <div className="grid gap-2.5 md:grid-cols-2">
                  <AuthInput icon={<User />} value={fullName} onChange={setFullName} placeholder={copy.name} autoComplete="name" required />
                  <AuthInput icon={<Globe2 />} value={country} onChange={setCountry} placeholder={copy.country} autoComplete="country-name" required />
                  <AuthInput icon={<MapPin />} value={province} onChange={setProvince} placeholder={copy.province} autoComplete="address-level1" required />
                  <PhoneInput
                    phoneCode={phoneCode}
                    phone={phone}
                    onCodeChange={setPhoneCode}
                    onPhoneChange={setPhone}
                    placeholder={copy.phone}
                  />
                  <AuthInput icon={<CalendarDays />} type="date" value={birthDate} onChange={setBirthDate} placeholder={copy.birthDate} autoComplete="bday" required />
                </div>
              )}

              <AuthInput icon={<Mail />} type="email" value={email} onChange={setEmail} placeholder={copy.email} autoComplete="email" required />

              <label className="flex h-11 items-center gap-3 rounded-full border border-white/14 bg-white/9 px-4 backdrop-blur-md">
                <Lock className="h-4 w-4 shrink-0 text-[#e7a15e]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={copy.password}
                  className="min-w-0 flex-1 bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/38"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
                  aria-label={copy.password}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </label>

              {mode === "login" && (
                <button
                  type="button"
                  className="block w-full text-end text-[11px] font-semibold text-[#e7a15e]"
                >
                  {copy.forgot}
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#cf4f22] to-[#e5a052] text-[13px] font-bold text-white shadow-[0_18px_42px_rgba(207,79,34,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "..." : mode === "signup" ? copy.signup : copy.continue}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </button>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-white/12" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
                  {copy.or}
                </span>
                <span className="h-px flex-1 bg-white/12" />
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleGoogleSignIn()}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-white/12 bg-white/10 text-[12.5px] font-bold text-white backdrop-blur-md transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[15px] font-bold text-[#1f1f1f]">
                  G
                </span>
                {copy.google}
              </button>

              {authMessage ? (
                <p className="rounded-2xl border border-[#d96b32]/25 bg-[#d96b32]/12 px-3 py-2 text-[11.5px] leading-5 text-[#ffd3b6]">
                  {authMessage}
                </p>
              ) : null}

              {authError ? (
                <p className="rounded-2xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-[11.5px] leading-5 text-red-100">
                  {authError}
                </p>
              ) : null}
            </form>

            <p className="mt-4 text-center text-[10.5px] leading-5 text-white/42">
              {copy.legal}{" "}
              <Link href="/terms" className="font-semibold text-[#e7a15e] hover:text-[#ffd3a8]">
                {copy.terms}
              </Link>
              {" · "}
              <Link href="/privacy" className="font-semibold text-[#e7a15e] hover:text-[#ffd3a8]">
                {copy.privacy}
              </Link>
              {" · "}
              <Link href="/cookies" className="font-semibold text-[#e7a15e] hover:text-[#ffd3a8]">
                {copy.cookies}
              </Link>
            </p>
          </motion.aside>

          <motion.aside
            initial={{ opacity: 0, x: direction === "rtl" ? -24 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            className="order-first text-center md:order-last md:text-start"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#e7a15e] md:text-[12px]">
              {copy.eyebrow}
            </p>
            <div className="mt-4 flex min-h-[118px] items-center justify-center md:min-h-[255px] md:justify-start">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={activeIntro}
                  initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
                  transition={{ duration: 0.45 }}
                  className="max-w-[760px] text-[38px] font-semibold leading-[0.98] tracking-normal text-white md:text-[76px]"
                >
                  {activeIntro}
                </motion.h1>
              </AnimatePresence>
            </div>
            <p className="mx-auto mt-3 max-w-[520px] text-[12px] leading-6 text-white/58 md:mx-0 md:text-[15px] md:leading-7">
              {copy.subtitle}
            </p>
          </motion.aside>
        </section>
      </div>
    </main>
  );
}

type AuthInputProps = {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
};

type PhoneInputProps = {
  phoneCode: string;
  phone: string;
  onCodeChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  placeholder: string;
};

function PhoneInput({
  phoneCode,
  phone,
  onCodeChange,
  onPhoneChange,
  placeholder,
}: PhoneInputProps) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-full border border-white/14 bg-white/9 px-3 backdrop-blur-md">
      <Phone className="h-4 w-4 shrink-0 text-[#e7a15e]" />

      <select
        value={phoneCode}
        onChange={(event) => onCodeChange(event.target.value)}
        aria-label="Country phone code"
        className="h-8 max-w-[94px] shrink-0 rounded-full border border-white/10 bg-[#1a100c] px-2 text-[11px] font-semibold text-white outline-none"
      >
        {PHONE_CODES.map((item) => (
          <option key={`${item.code}-${item.name}`} value={item.code}>
            {item.flag} {item.code}
          </option>
        ))}
      </select>

      <input
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={(event) => onPhoneChange(event.target.value)}
        required
        autoComplete="tel-national"
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/38"
      />
    </label>
  );
}

function AuthInput({
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  required = false,
}: AuthInputProps) {
  return (
    <label className="flex h-11 items-center gap-3 rounded-full border border-white/14 bg-white/9 px-4 backdrop-blur-md">
      <span className="[&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-[#e7a15e]">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/38"
      />
    </label>
  );
}
