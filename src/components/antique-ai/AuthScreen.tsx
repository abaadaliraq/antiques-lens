"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from "@capacitor/core";
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
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
const PASSWORD_RESET_SUCCESS_KEY = "kishib:password-reset-success";
const NATIVE_AUTH_CALLBACK_URL = "com.kishib.app://auth/callback";
const GOOGLE_WEB_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "";

let nativeGoogleInitialized = false;

function isAndroidNativeAuthEnvironment() {
  if (Capacitor.getPlatform() === "android" && Capacitor.isNativePlatform()) {
    return true;
  }

  if (typeof window === "undefined") return false;

  const capacitorGlobal = (
    window as typeof window & {
      Capacitor?: {
        getPlatform?: () => string;
        isNativePlatform?: () => boolean;
      };
    }
  ).Capacitor;
  const platform = capacitorGlobal?.getPlatform?.();

  if (platform === "android" && capacitorGlobal?.isNativePlatform?.()) {
    return true;
  }
  if (platform === "android") return true;

  return /Android/i.test(navigator.userAgent) && /;\s*wv\)/i.test(navigator.userAgent);
}

function cacheAuthSession() {
  window.localStorage.setItem(AUTH_CACHE_KEY, "true");
}

async function initializeNativeGoogleSignIn() {
  if (nativeGoogleInitialized) return;

  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error("Missing NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID.");
  }

  await SocialLogin.initialize({
    google: {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      mode: "online",
    },
  });
  nativeGoogleInitialized = true;
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
  gender: string;
  male: string;
  female: string;
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
  resetTitle: string;
  resetInstruction: string;
  resetSubmit: string;
  resetSuccess: string;
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
    gender: "Gender",
    male: "Male",
    female: "Female",
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
    resetTitle: "Reset password",
    resetInstruction: "Enter your email and we will send a password reset link.",
    resetSubmit: "Send reset link",
    resetSuccess: "A password reset link has been sent to your email if the account exists.",
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
    gender: "الجنس",
    male: "ذكر",
    female: "أنثى",
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
    resetTitle: "استعادة كلمة المرور",
    resetInstruction: "اكتب بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.",
    resetSubmit: "إرسال رابط الاستعادة",
    resetSuccess: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني إن كان الحساب موجوداً.",
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
    gender: "Genre",
    male: "Homme",
    female: "Femme",
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
    resetTitle: "Réinitialiser le mot de passe",
    resetInstruction: "Saisissez votre e-mail pour recevoir un lien de réinitialisation.",
    resetSubmit: "Envoyer le lien",
    resetSuccess: "Un lien de réinitialisation a été envoyé si le compte existe.",
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
    gender: "लिंग",
    male: "पुरुष",
    female: "महिला",
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
    resetTitle: "पासवर्ड रीसेट",
    resetInstruction: "रीसेट लिंक पाने के लिए अपना ईमेल लिखें.",
    resetSubmit: "रीसेट लिंक भेजें",
    resetSuccess: "यदि खाता मौजूद है तो रीसेट लिंक ईमेल पर भेजा गया है.",
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
    gender: "جنسیت",
    male: "مرد",
    female: "زن",
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
    resetTitle: "بازیابی رمز عبور",
    resetInstruction: "ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود.",
    resetSubmit: "ارسال لینک بازیابی",
    resetSuccess: "اگر حساب وجود داشته باشد، لینک بازیابی به ایمیل شما ارسال شد.",
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
    gender: "Cinsiyet",
    male: "Erkek",
    female: "Kadın",
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
    resetTitle: "Şifre sıfırla",
    resetInstruction: "Sıfırlama bağlantısı için e-postanızı yazın.",
    resetSubmit: "Sıfırlama bağlantısı gönder",
    resetSuccess: "Hesap varsa sıfırlama bağlantısı e-postanıza gönderildi.",
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
    gender: "Пол",
    male: "Мужчина",
    female: "Женщина",
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
    resetTitle: "Сброс пароля",
    resetInstruction: "Введите e-mail, чтобы получить ссылку для сброса.",
    resetSubmit: "Отправить ссылку",
    resetSuccess: "Если аккаунт существует, ссылка для сброса отправлена на e-mail.",
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
    gender: "ڕەگەز",
    male: "نێر",
    female: "مێ",
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
    resetTitle: "گۆڕینی وشەی نهێنی",
    resetInstruction: "ئیمەیڵەکەت بنووسە بۆ ناردنی بەستەری گۆڕین.",
    resetSubmit: "ناردنی بەستەر",
    resetSuccess: "ئەگەر هەژمارەکە هەبێت، بەستەری گۆڕین بۆ ئیمەیڵەکەت نێردرا.",
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
  const [gender, setGender] = useState("");
  const [phoneCode, setPhoneCode] = useState<string>(PHONE_CODES[0].code);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const copy = COPY[locale] || COPY.en;
  const direction = isRtl(locale) ? "rtl" : "ltr";
  const activeIntro = copy.intro[activeLine] || copy.intro[0];
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const resetSucceeded = window.sessionStorage.getItem(
      PASSWORD_RESET_SUCCESS_KEY,
    );

    if (resetSucceeded) {
      window.sessionStorage.removeItem(PASSWORD_RESET_SUCCESS_KEY);
      setAuthMessage("تم حفظ كلمة المرور الجديدة بنجاح. يمكنك تسجيل الدخول الآن.");
      setMode("login");
    }
  }, []);

  useEffect(() => {
  let mounted = true;

  async function restoreSession() {
    try {
      const supabase = getSupabaseBrowserClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        cacheAuthSession();
        onAuthenticated();
      }
    } catch {
      // نخلي شاشة الدخول تظهر إذا صار خطأ
    }
  }

  restoreSession();

  const supabase = getSupabaseBrowserClient();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      cacheAuthSession();
      onAuthenticated();
    }
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, [onAuthenticated]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveLine((current) => (current + 1) % copy.intro.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [copy.intro.length]);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setAuthError("");
    setAuthMessage("");

    if (nextMode === "signup") {
      window.setTimeout(() => {
        formRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }, 80);
    } else {
      window.setTimeout(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }, 80);
    }
  }

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
              gender,
              phone_code: phoneCode,
              phone_number: phone.trim(),
              phone: `${phoneCode}${phone.trim()}`,
              preferred_locale: locale,
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        if (data.session?.user) {
          cacheAuthSession();
          onAuthenticated();
          return;
        }

        setAuthMessage(copy.checkEmail);
        setMode("login");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (!data.session) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error(copy.configError);
        }
      }

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
      const platform = Capacitor.getPlatform();
      const isNative = isAndroidNativeAuthEnvironment();

      console.log("Google Login platform:", platform);
      console.log("Google Login isNative:", isNative);

      window.localStorage.setItem("kishib:pending-oauth-locale", locale);

      if (isNative) {
        console.log("Entering native Google login");
        await initializeNativeGoogleSignIn();

        const googleLogin = await SocialLogin.login({
          provider: "google",
          options: {},
        });
        const idToken =
          googleLogin.result.responseType === "online"
            ? googleLogin.result.idToken
            : null;

        console.log("Google idToken exists:", Boolean(idToken));

        if (!idToken) {
          console.error("Native Google login did not return an idToken.");
          throw new Error("No Google idToken returned.");
        }

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });

        if (error) {
          console.error("Supabase signInWithIdToken error:", error);
          throw error;
        }

        if (!data.session) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) throw new Error(copy.configError);
        }

        console.log("Supabase signInWithIdToken success:", Boolean(data.session));
        cacheAuthSession();
        onAuthenticated();
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log("Entering web Google OAuth login");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
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

  async function handlePasswordResetSubmit() {
    setResetError("");
    setResetMessage("");
    setIsResetSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (error) throw error;

      setResetMessage(copy.resetSuccess);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("NEXT_PUBLIC_SUPABASE")
      ) {
        setResetError(copy.configError);
      } else {
        setResetMessage(copy.resetSuccess);
      }
    } finally {
      setIsResetSubmitting(false);
    }
  }

  return (
    <main
      dir={direction}
      className="relative h-dvh overflow-hidden kishib-bg-auth text-[#241913]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(181,138,69,0.16),transparent_58%)]" />
      <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#d9b59e]/55 blur-3xl" />
      <div className="absolute left-1/2 top-0 h-64 w-[82vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(181,138,69,0.14),transparent_62%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#d2b98f]/35 via-[#efe3cf]/18 to-transparent" />

      <div
        ref={scrollRef}
        className="relative z-10 flex h-dvh flex-col overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-width:thin] md:overflow-hidden md:px-10 md:py-8"
      >
        <header className="flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#241913]/78">
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
            className="mx-auto w-full max-w-[390px] pb-8 md:mx-0 md:pb-0"
          >
            <div className="mb-5 grid grid-cols-2 rounded-[16px] border border-[#d2b98f] bg-[#f8edda]/78 p-1 backdrop-blur-md">
              {(["login", "signup"] as AuthMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeMode(item)}
                  className={[
                    "h-9 rounded-[12px] px-4 text-[12px] font-bold transition",
                    mode === item
                      ? "bg-[#b88a3d] text-[#fff4e2] shadow-[0_10px_24px_rgba(62,39,22,0.14)]"
                      : "text-[#735f4b] hover:bg-[#d9b59e]/50 hover:text-[#241913]",
                  ].join(" ")}
                >
                  {item === "login" ? copy.login : copy.signup}
                </button>
              ))}
            </div>

            <h2 className="text-[25px] font-semibold tracking-normal text-[#241913]">
              {mode === "login" ? copy.login : copy.signup}
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[#735f4b]">
              {copy.subtitle}
            </p>

            <form
              ref={formRef}
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
                  <GenderInput
                    value={gender}
                    onChange={setGender}
                    label={copy.gender}
                    male={copy.male}
                    female={copy.female}
                  />
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

              <label className="flex h-11 items-center gap-3 rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/78 px-4 backdrop-blur-md">
                <Lock className="h-4 w-4 shrink-0 text-[#b88a3d]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={copy.password}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-[#241913] outline-none placeholder:text-[#8c765e]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-[#735f4b] transition hover:bg-[#d9b59e]/50 hover:text-[#241913]"
                  aria-label={copy.password}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </label>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetError("");
                    setResetMessage("");
                    setResetOpen(true);
                  }}
                  className="block w-full text-end text-[11px] font-semibold text-[#986f2e]"
                >
                  {copy.forgot}
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#b88a3d] text-[13px] font-bold text-[#fff4e2] shadow-[0_12px_28px_rgba(62,39,22,0.14)] transition hover:bg-[#986f2e] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "..." : mode === "signup" ? copy.signup : copy.continue}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </button>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-[#d2b98f]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#735f4b]">
                  {copy.or}
                </span>
                <span className="h-px flex-1 bg-[#d2b98f]" />
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleGoogleSignIn()}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/78 text-[12.5px] font-bold text-[#241913] backdrop-blur-md transition hover:bg-[#f4e2c4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[15px] font-bold text-[#1f1f1f]">
                  G
                </span>
                {copy.google}
              </button>

              {authMessage ? (
                <p className="rounded-[14px] border border-[#b88a3d]/30 bg-[#fff4e2]/80 px-3 py-2 text-[11.5px] leading-5 text-[#735f4b]">
                  {authMessage}
                </p>
              ) : null}

              {authError ? (
                <p className="rounded-[14px] border border-[#8b3a2b]/30 bg-[#d9b59e]/70 px-3 py-2 text-[11.5px] leading-5 text-[#6d241d]">
                  {authError}
                </p>
              ) : null}
            </form>

            <p className="mt-4 text-center text-[10.5px] leading-5 text-[#735f4b]">
              {copy.legal}{" "}
              <Link href="/terms" className="font-semibold text-[#986f2e] hover:text-[#6d241d]">
                {copy.terms}
              </Link>
              {" · "}
              <Link href="/privacy" className="font-semibold text-[#986f2e] hover:text-[#6d241d]">
                {copy.privacy}
              </Link>
              {" · "}
              <Link href="/cookies" className="font-semibold text-[#986f2e] hover:text-[#6d241d]">
                {copy.cookies}
              </Link>
            </p>
          </motion.aside>

          <motion.aside
            initial={{ opacity: 0, x: direction === "rtl" ? -24 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            className="order-first text-center md:order-last md:text-start"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#986f2e] md:text-[12px]">
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
                  className="max-w-[760px] text-[38px] font-semibold leading-[0.98] tracking-normal text-[#241913] md:text-[76px]"
                >
                  {activeIntro}
                </motion.h1>
              </AnimatePresence>
            </div>
            <p className="mx-auto mt-3 max-w-[520px] text-[12px] leading-6 text-[#735f4b] md:mx-0 md:text-[15px] md:leading-7">
              {copy.subtitle}
            </p>
          </motion.aside>
        </section>
      </div>

      {resetOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#241913]/24 px-4 py-6 backdrop-blur-[2px]">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handlePasswordResetSubmit();
            }}
            className="w-full max-w-[360px] rounded-[18px] border border-[#d2b98f] bg-[#fff4e2]/98 p-4 shadow-[0_24px_70px_rgba(62,39,22,0.2)]"
          >
            <div className="mb-3 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-bold text-[#241913]">
                  {copy.resetTitle}
                </h3>
                <p className="mt-1 text-[11.5px] leading-5 text-[#735f4b]">
                  {copy.resetInstruction}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetOpen(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d2b98f] text-[#735f4b] transition hover:bg-[#efe3cf]"
                aria-label={copy.back}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AuthInput
              icon={<Mail />}
              type="email"
              value={resetEmail}
              onChange={setResetEmail}
              placeholder={copy.email}
              autoComplete="email"
              required
            />

            <button
              type="submit"
              disabled={isResetSubmitting}
              className="mt-3 flex h-10 w-full items-center justify-center rounded-[13px] bg-[#b88a3d] text-[12px] font-bold text-[#fff4e2] transition hover:bg-[#986f2e] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isResetSubmitting ? "..." : copy.resetSubmit}
            </button>

            {resetMessage ? (
              <p className="mt-3 rounded-[13px] border border-[#b88a3d]/30 bg-[#fffaf0] px-3 py-2 text-[11.5px] leading-5 text-[#735f4b]">
                {resetMessage}
              </p>
            ) : null}

            {resetError ? (
              <p className="mt-3 rounded-[13px] border border-[#8b3a2b]/30 bg-[#d9b59e]/70 px-3 py-2 text-[11.5px] leading-5 text-[#6d241d]">
                {resetError}
              </p>
            ) : null}
          </form>
        </div>
      ) : null}
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

type GenderInputProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  male: string;
  female: string;
};

function GenderInput({
  value,
  onChange,
  label,
  male,
  female,
}: GenderInputProps) {
  return (
    <label className="flex h-11 items-center gap-3 rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/78 px-4 backdrop-blur-md">
      <Users className="h-4 w-4 shrink-0 text-[#b88a3d]" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-[#241913] outline-none"
      >
        <option value="" className="bg-[#fff4e2] text-[#241913]">
          {label}
        </option>
        <option value="male" className="bg-[#fff4e2] text-[#241913]">
          {male}
        </option>
        <option value="female" className="bg-[#fff4e2] text-[#241913]">
          {female}
        </option>
      </select>
    </label>
  );
}

function PhoneInput({
  phoneCode,
  phone,
  onCodeChange,
  onPhoneChange,
  placeholder,
}: PhoneInputProps) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/78 px-3 backdrop-blur-md">
      <Phone className="h-4 w-4 shrink-0 text-[#b88a3d]" />

      <select
        value={phoneCode}
        onChange={(event) => onCodeChange(event.target.value)}
        aria-label="Country phone code"
        className="h-8 max-w-[94px] shrink-0 rounded-[10px] border border-[#d2b98f] bg-[#fff4e2] px-2 text-[11px] font-semibold text-[#241913] outline-none"
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
        className="min-w-0 flex-1 bg-transparent text-[13px] text-[#241913] outline-none placeholder:text-[#8c765e]"
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
    <label className="flex h-11 items-center gap-3 rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/78 px-4 backdrop-blur-md">
      <span className="[&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-[#b88a3d]">
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
        className="min-w-0 flex-1 bg-transparent text-[13px] text-[#241913] outline-none placeholder:text-[#8c765e]"
      />
    </label>
  );
}
