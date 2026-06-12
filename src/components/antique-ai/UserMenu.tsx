"use client";

import {
  BadgeCheck,
  AlertTriangle,
  Check,
  ChevronDown,
  Cookie,
  Crown,
  ExternalLink,
  FileText,
  Globe2,
  LifeBuoy,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";import type { FormEvent, ReactNode } from "react";
import {
  getCurrentUserProfile,
  PROFILE_UPDATED_EVENT,
  updateCurrentUserProfile,
  type UserProfile,
} from "@/lib/profilesSupabase";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { Locale } from "./types";

type UserMenuProps = {
  locale: Locale;
  setLocale?: (locale: Locale) => void;
  compact?: boolean;
};

const AUTH_CACHE_KEY = "kishib:auth-session-active";
const PROFILE_CACHE_PREFIX = "kishib:user-profile:";
const SUPPORT_EMAIL = "support@kishibapp.com";
const KISHIB_WEBSITE_URL = "https://kishib-website.vercel.app/";

type EditableProfile = {
  name: string;
  phone: string;
  country: string;
  city: string;
};

type ProfileInfo = EditableProfile & {
  email: string;
  avatarUrl: string;
  userId: string;
};

type MenuCopy = {
  profile: string;
  account: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  province?: string;
  language: string;
  subscriptions: string;
  support: string;
  website: string;
  cookies: string;
  terms: string;
  privacy: string;
  logout: string;
  deleteAccount: string;
  deleteAccountTitle: string;
  deleteAccountWarning: string;
  deleteAccountDataWarning: string;
  deleteAccountConfirmHint: string;
  deleteAccountConfirmButton: string;
  deleteAccountSuccess: string;
  deleteAccountFailed: string;
  comingSoon: string;
  paymentDisabled: string;
  unknown: string;
  editProfile: string;
  save: string;
  cancel: string;
  saved: string;
  supportText: string;
  close: string;
  monthlyPlan: string;
  annualPlan: string;
  reportsPack: string;
  price: string;
  includes: string;
};

const COPY: Record<Locale, MenuCopy> = {
  ar: {
    profile: "الملف الشخصي",
    account: "الحساب",
    name: "الاسم",
    email: "الإيميل",
    phone: "رقم الهاتف",
    country: "الدولة",
    language: "اللغة",
    subscriptions: "الاشتراكات",
    support: "الدعم",
    website: "موقع KISHIB",
    cookies: "الكوكيز",
    terms: "الشروط والأحكام",
    privacy: "سياسة الخصوصية",
    logout: "تسجيل خروج",
    deleteAccount: "حذف الحساب",
    deleteAccountTitle: "حذف الحساب",
    deleteAccountWarning: "هذا الإجراء نهائي ولا يمكن التراجع عنه.",
    deleteAccountDataWarning: "سيتم حذف الحساب وبيانات الملف الشخصي وسجل التقييمات والصور والملاحظات المرتبطة بالحساب قدر الإمكان.",
    deleteAccountConfirmHint: "اكتب DELETE أو حذف لتفعيل الحذف.",
    deleteAccountConfirmButton: "حذف الحساب نهائيًا",
    deleteAccountSuccess: "تم حذف الحساب وبياناته بنجاح.",
    deleteAccountFailed: "تعذر حذف الحساب. حاولي مرة أخرى.",
    comingSoon: "قريباً",
    paymentDisabled: "الدفع غير مفعل حالياً",
    unknown: "غير مضاف",
    editProfile: "تعديل الملف الشخصي",
    save: "حفظ",
    cancel: "إلغاء",
    saved: "تم الحفظ",
    supportText: "للدعم والمساعدة تواصل معنا عبر البريد الإلكتروني",
    close: "إغلاق",
    monthlyPlan: "الاشتراك الشهري",
    annualPlan: "الاشتراك السنوي",
    reportsPack: "باقة التقارير",
    price: "السعر",
    includes: "يشمل",
  },
  en: {
    profile: "Profile",
    account: "Account",
    name: "Name",
    email: "Email",
    phone: "Phone",
    country: "Country",
    language: "Language",
    subscriptions: "Subscriptions",
    support: "Support",
    website: "KISHIB Website",
    cookies: "Cookies",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    logout: "Log out",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or حذف to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "Coming soon",
    paymentDisabled: "Payment is not enabled yet",
    unknown: "Not added",
    editProfile: "Edit profile",
    save: "Save",
    cancel: "Cancel",
    saved: "Saved",
    supportText: "For support and help, contact us by email",
    close: "Close",
    monthlyPlan: "Monthly subscription",
    annualPlan: "Annual subscription",
    reportsPack: "Reports package",
    price: "Price",
    includes: "Includes",
  },
  fr: {
    profile: "Profil",
    account: "Compte",
    name: "Nom",
    email: "E-mail",
    phone: "Téléphone",
    country: "Pays",
    language: "Langue",
    subscriptions: "Abonnements",
    support: "Support",
    website: "Site KISHIB",
    cookies: "Cookies",
    terms: "Conditions",
    privacy: "Confidentialité",
    logout: "Déconnexion",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or حذف to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "Bientôt",
    paymentDisabled: "Paiement non activé",
    unknown: "Non ajouté",
    editProfile: "Modifier le profil",
    save: "Enregistrer",
    cancel: "Annuler",
    saved: "Enregistré",
    supportText: "Pour obtenir de l'aide, contactez-nous par e-mail",
    close: "Fermer",
    monthlyPlan: "Abonnement mensuel",
    annualPlan: "Abonnement annuel",
    reportsPack: "Pack de rapports",
    price: "Prix",
    includes: "Comprend",
  },
  hi: {
    profile: "प्रोफ़ाइल",
    account: "खाता",
    name: "नाम",
    email: "ईमेल",
    phone: "फ़ोन",
    country: "देश",
    language: "भाषा",
    subscriptions: "सदस्यता",
    support: "Support",
    website: "KISHIB Website",
    cookies: "कुकीज़",
    terms: "नियम और शर्तें",
    privacy: "गोपनीयता नीति",
    logout: "लॉग आउट",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or حذف to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "जल्द",
    paymentDisabled: "भुगतान अभी सक्रिय नहीं है",
    unknown: "जोड़ा नहीं गया",
    editProfile: "प्रोफ़ाइल संपादित करें",
    save: "सहेजें",
    cancel: "रद्द करें",
    saved: "सहेजा गया",
    supportText: "सहायता के लिए हमें ईमेल से संपर्क करें",
    close: "बंद करें",
    monthlyPlan: "मासिक सदस्यता",
    annualPlan: "वार्षिक सदस्यता",
    reportsPack: "रिपोर्ट पैकेज",
    price: "मूल्य",
    includes: "शामिल",
  },
  fa: {
    profile: "پروفایل",
    account: "حساب",
    name: "نام",
    email: "ایمیل",
    phone: "شماره تلفن",
    country: "کشور",
    language: "زبان",
    subscriptions: "اشتراک‌ها",
    support: "پشتیبانی",
    website: "وب‌سایت KISHIB",
    cookies: "کوکی‌ها",
    terms: "شرایط و قوانین",
    privacy: "حریم خصوصی",
    logout: "خروج",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or حذف to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "به‌زودی",
    paymentDisabled: "پرداخت فعلاً فعال نیست",
    unknown: "اضافه نشده",
    editProfile: "ویرایش پروفایل",
    save: "ذخیره",
    cancel: "لغو",
    saved: "ذخیره شد",
    supportText: "برای پشتیبانی و کمک از طریق ایمیل با ما تماس بگیرید",
    close: "بستن",
    monthlyPlan: "اشتراک ماهانه",
    annualPlan: "اشتراک سالانه",
    reportsPack: "بسته گزارش‌ها",
    price: "قیمت",
    includes: "شامل",
  },
  tr: {
    profile: "Profil",
    account: "Hesap",
    name: "Ad",
    email: "E-posta",
    phone: "Telefon",
    country: "Ülke",
    language: "Dil",
    subscriptions: "Abonelikler",
    support: "Destek",
    website: "KISHIB Website",
    cookies: "Çerezler",
    terms: "Şartlar ve Koşullar",
    privacy: "Gizlilik Politikası",
    logout: "Çıkış yap",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or حذف to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "Yakında",
    paymentDisabled: "Ödeme şu anda etkin değil",
    unknown: "Eklenmedi",
    editProfile: "Profili düzenle",
    save: "Kaydet",
    cancel: "İptal",
    saved: "Kaydedildi",
    supportText: "Destek ve yardım için bize e-posta ile ulaşın",
    close: "Kapat",
    monthlyPlan: "Aylık abonelik",
    annualPlan: "Yıllık abonelik",
    reportsPack: "Rapor paketi",
    price: "Fiyat",
    includes: "İçerir",
  },
  ru: {
    profile: "Профиль",
    account: "Аккаунт",
    name: "Имя",
    email: "Email",
    phone: "Телефон",
    country: "Страна",
    language: "Язык",
    subscriptions: "Подписки",
    support: "Поддержка",
    website: "KISHIB Website",
    cookies: "Cookies",
    terms: "Условия",
    privacy: "Политика конфиденциальности",
    logout: "Выйти",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or حذف to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "Скоро",
    paymentDisabled: "Оплата пока не включена",
    unknown: "Не добавлено",
    editProfile: "Редактировать профиль",
    save: "Сохранить",
    cancel: "Отмена",
    saved: "Сохранено",
    supportText: "Для поддержки и помощи свяжитесь с нами по электронной почте",
    close: "Закрыть",
    monthlyPlan: "Месячная подписка",
    annualPlan: "Годовая подписка",
    reportsPack: "Пакет отчетов",
    price: "Цена",
    includes: "Включает",
  },
  ku: {
    profile: "پرۆفایل",
    account: "هەژمار",
    name: "ناو",
    email: "ئیمەیل",
    phone: "ژمارەی تەلەفۆن",
    country: "وڵات",
    language: "زمان",
    subscriptions: "بەشداربوونەکان",
    support: "پاڵپشتی",
    website: "ماڵپەڕی KISHIB",
    cookies: "کوکیز",
    terms: "مەرج و ڕێساکان",
    privacy: "تایبەتمەندی",
    logout: "چوونەدەرەوە",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or حذف to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "بەم زووانە",
    paymentDisabled: "پارەدان لە ئێستادا چالاک نییە",
    unknown: "زیاد نەکراوە",
    editProfile: "دەستکاری پرۆفایل",
    save: "پاشەکەوت",
    cancel: "هەڵوەشاندنەوە",
    saved: "پاشەکەوت کرا",
    supportText: "بۆ پاڵپشتی و یارمەتی لە ڕێگەی ئیمەیل پەیوەندیمان پێوە بکە",
    close: "داخستن",
    monthlyPlan: "بەشداربوونی مانگانە",
    annualPlan: "بەشداربوونی ساڵانە",
    reportsPack: "پاکێجی ڕاپۆرتەکان",
    price: "نرخ",
    includes: "لەخۆدەگرێت",
  },
};

const MENU_LANGUAGES: { code: Locale; label: string; short: string }[] = [
  { code: "ar", label: "العربية", short: "AR" },
  { code: "en", label: "English", short: "EN" },
  { code: "fa", label: "فارسی", short: "FA" },
  { code: "tr", label: "Türkçe", short: "TR" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "hi", label: "हिन्दी", short: "HI" },
  { code: "ku", label: "Kurdî", short: "KU" },
  { code: "ru", label: "Русский", short: "RU" },
];

function isRtl(locale: Locale) {
  return locale === "ar" || locale === "fa" || locale === "ku";
}

function getInitial(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "K";
  return source.charAt(0).toUpperCase();
}

function getFallbackName(email?: string | null) {
  if (!email) return "KISHIB user";
  return email.split("@")[0] || "KISHIB user";
}

function readMetadataText(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function readCachedProfile(userId: string): EditableProfile | null {
  if (typeof window === "undefined" || !userId) return null;

  try {
    const raw = window.localStorage.getItem(`${PROFILE_CACHE_PREFIX}${userId}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<EditableProfile>;

    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      country: typeof parsed.country === "string" ? parsed.country : "",
      city: typeof parsed.city === "string" ? parsed.city : "",
    };
  } catch {
    return null;
  }
}

function cacheProfile(userId: string, profile: EditableProfile) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(
    `${PROFILE_CACHE_PREFIX}${userId}`,
    JSON.stringify(profile),
  );
}

function buildProfileInfo(
  user: {
    id?: string;
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  } | null,
  profile?: UserProfile | null,
): ProfileInfo | null {
  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  const userId = user.id || "";
  const cached = readCachedProfile(userId);
  const email = user.email || "";
  const metadataName = readMetadataText(metadata, [
    "full_name",
    "name",
    "display_name",
  ]);

  return {
    userId,
    name: profile?.full_name || cached?.name || metadataName || getFallbackName(email),
    email: profile?.email || email,
    phone:
      profile?.phone ||
      cached?.phone ||
      readMetadataText(metadata, ["phone", "phone_number", "mobile"]),
    country:
      profile?.country ||
      cached?.country ||
      readMetadataText(metadata, ["country", "country_name"]),
    city:
      profile?.city ||
      profile?.province ||
      cached?.city ||
      readMetadataText(metadata, ["city", "province", "governorate"]),
    avatarUrl:
      profile?.avatar_url ||
      readMetadataText(metadata, ["avatar_url", "picture", "photo_url"]),
  };
}

function isProfileIncomplete(profile: ProfileInfo | null) {
  return (
    !profile?.name?.trim() ||
    !profile.phone.trim() ||
    !profile.country.trim() ||
    !profile.city.trim()
  );
}

function Avatar({
  name,
  email,
  avatarUrl,
  className,
}: {
  name: string;
  email: string;
  avatarUrl?: string;
  className?: string;
}) {
  const initial = getInitial(name, email);
  const baseClass = [
    "grid place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#dcc18a] via-[#b88a3d] to-[#6d241d] font-bold text-[#fff4e2] ring-1 ring-[#b88a3d]/25",
    className || "",
  ].join(" ");

  if (avatarUrl) {
    return (
      <span className={baseClass}>
        <img
          src={avatarUrl}
          alt={name || email || "KISHIB user"}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </span>
    );
  }

  return <span className={baseClass}>{initial}</span>;
}

export default function UserMenu({
  locale,
  setLocale,
  compact = false,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [formProfile, setFormProfile] = useState<EditableProfile>({
    name: "",
    phone: "",
    country: "",
    city: "",
  });
  const menuRef = useRef<HTMLDivElement | null>(null);
const panelRef = useRef<HTMLDivElement | null>(null);
  const copy = COPY[locale];
  const rtl = isRtl(locale);
  const activeLanguage =
    MENU_LANGUAGES.find((item) => item.code === locale) ?? MENU_LANGUAGES[0];

  const displayName = profileInfo?.name || getFallbackName(profileInfo?.email);
  const displayEmail = profileInfo?.email || copy.unknown;
  const avatarUrl = profileInfo?.avatarUrl || "";
  const profileIncomplete = isProfileIncomplete(profileInfo);
  const provinceLabel =
    copy.province || (locale === "ar" ? "المدينة / المحافظة" : "City / Province");
  const canConfirmAccountDeletion =
    deleteConfirmation.trim().toUpperCase() === "DELETE" ||
    deleteConfirmation.trim() === "حذف";

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function loadUser() {
      const { user, profile } = await getCurrentUserProfile();

      if (!mounted) return;

      const nextProfile = buildProfileInfo(user, profile);
      setProfileInfo(nextProfile);
      if (nextProfile) {
        setFormProfile({
          name: nextProfile.name,
          phone: nextProfile.phone,
          country: nextProfile.country,
          city: nextProfile.city,
        });
        setEditOpen(isProfileIncomplete(nextProfile));
      }
    }

    void loadUser();

    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = supabase.auth.onAuthStateChange(() => {
        if (!mounted) return;
        void loadUser();
      });

      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      unsubscribe = undefined;
    }

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadUpdatedProfile() {
      const { user, profile } = await getCurrentUserProfile();
      if (!mounted) return;

      const nextProfile = buildProfileInfo(user, profile);
      setProfileInfo(nextProfile);
      if (nextProfile) {
        setFormProfile({
          name: nextProfile.name,
          phone: nextProfile.phone,
          country: nextProfile.country,
          city: nextProfile.city,
        });
      }
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, loadUpdatedProfile);

    return () => {
      mounted = false;
      window.removeEventListener(PROFILE_UPDATED_EVENT, loadUpdatedProfile);
    };
  }, []);

  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;

  if (menuRef.current?.contains(target)) return;
  if (panelRef.current?.contains(target)) return;

  setIsOpen(false);
  setLanguageOpen(false);
}

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.localStorage.removeItem(AUTH_CACHE_KEY);
    window.location.reload();
  }

  function clearLocalAccountData(userId?: string) {
    if (typeof window === "undefined") return;

    const keysToRemove = [
      AUTH_CACHE_KEY,
      "kishib:supabase-auth",
      "antiques-lens:history-v2",
      "antiques-lens:history",
      "kishib-history",
      "antique-history",
      "antiqueLensHistory",
      "history",
      "archive",
      "kishib:pending-oauth-locale",
    ];

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));

    if (userId) {
      window.localStorage.removeItem(`${PROFILE_CACHE_PREFIX}${userId}`);
    }

    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(PROFILE_CACHE_PREFIX)) {
        window.localStorage.removeItem(key);
      }
    }

    window.sessionStorage.clear();

    if (typeof indexedDB !== "undefined") {
      indexedDB.deleteDatabase("kishib-archive-images");
    }
  }

  function closeDeleteDialog() {
    if (deletingAccount) return;

    setDeleteOpen(false);
    setDeleteConfirmation("");
    setDeleteError("");
  }

  async function handleDeleteAccount() {
    const normalizedConfirmation = deleteConfirmation.trim().toUpperCase();

    if (
      normalizedConfirmation !== "DELETE" &&
      deleteConfirmation.trim() !== "حذف"
    ) {
      return;
    }

    setDeletingAccount(true);
    setDeleteError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      const userId = data.session?.user.id || profileInfo?.userId;

      if (error || !accessToken) {
        throw new Error("No active session.");
      }

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : copy.deleteAccountFailed,
        );
      }

      await supabase.auth.signOut();
      clearLocalAccountData(userId);
      window.alert(copy.deleteAccountSuccess);
      window.location.href = "/";
    } catch (error) {
      console.error("delete account error:", error);
      setDeleteError(copy.deleteAccountFailed);
    } finally {
      setDeletingAccount(false);
    }
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profileInfo) return;

    const nextProfile = {
      name: formProfile.name.trim(),
      phone: formProfile.phone.trim(),
      country: formProfile.country.trim(),
      city: formProfile.city.trim(),
    };

    setSaving(true);
    setSaveMessage("");

    try {
      cacheProfile(profileInfo.userId, nextProfile);

      const { profile } = await updateCurrentUserProfile({
        full_name: nextProfile.name,
        phone: nextProfile.phone,
        country: nextProfile.country,
        city: nextProfile.city,
      });

      setProfileInfo(
        buildProfileInfo(
          {
            id: profileInfo.userId,
            email: profileInfo.email,
            user_metadata: {
              full_name: nextProfile.name,
              phone: nextProfile.phone,
              country: nextProfile.country,
              city: nextProfile.city,
            },
          },
          profile,
        ) ?? {
          ...profileInfo,
          ...nextProfile,
        },
      );
      setEditOpen(false);
      setSaveMessage(copy.saved);
    } catch {
      setProfileInfo((current) =>
        current ? { ...current, ...nextProfile } : current,
      );
      setEditOpen(false);
      setSaveMessage(copy.saved);
    } finally {
      setSaving(false);
    }
  }

  function openPanel(panel: "support" | "plans" | "delete") {
    setLanguageOpen(false);
    setSupportOpen(panel === "support");
    setPlansOpen(panel === "plans");
    setDeleteOpen(panel === "delete");
    setDeleteConfirmation("");
    setDeleteError("");
  }

  function openKishibWebsite() {
    setIsOpen(false);
    window.open(KISHIB_WEBSITE_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <div ref={menuRef} dir={rtl ? "rtl" : "ltr"} className="relative z-50">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={[
          "grid place-items-center rounded-full border border-[#d2b98f] bg-[#fff4e2]/88 text-[#241913] shadow-[0_14px_38px_rgba(62,39,22,0.14)] backdrop-blur-2xl transition hover:border-[#b88a3d]/55 hover:bg-[#fff4e2]",
          compact ? "h-8 w-8" : "h-11 w-11",
        ].join(" ")}
        aria-label={copy.profile}
      >
        <Avatar
          name={displayName}
          email={displayEmail}
          avatarUrl={avatarUrl}
          className={compact ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs"}
        />
      </button>

      {isOpen && typeof document !== "undefined"
  ? createPortal(
      <>
        <button
          type="button"
          aria-label="Close user menu"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[9998] bg-[#241913]/20 backdrop-blur-[2px]"
        />

        <div
          ref={panelRef}
          className={[
            "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-[9999] overflow-hidden rounded-[22px] border border-[#d2b98f] bg-[#fff4e2]/96 shadow-[0_26px_82px_rgba(62,39,22,0.18)] backdrop-blur-2xl",
              compact
                ? "h-[54dvh] min-h-[310px] max-h-[430px]"
                : "h-[78dvh] min-h-[360px] max-h-[620px]",
              "md:inset-x-auto md:bottom-auto md:top-16 md:h-auto md:max-h-[calc(100dvh-5rem)] md:w-[350px] md:rounded-[1.25rem]",
              rtl ? "md:left-4" : "md:right-4",
            ].join(" ")}
          >
            <div className="flex h-full flex-col overflow-y-auto p-3">
              <div className="rounded-[16px] border border-[#d2b98f] bg-[#efe3cf]/70 p-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={displayName}
                    email={displayEmail}
                    avatarUrl={avatarUrl}
                    className="h-10 w-10 shrink-0 rounded-2xl text-sm"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#241913]">
                      {displayName}
                    </p>
                    <p className="truncate text-[11px] text-[#735f4b]">
                      {displayEmail || copy.account}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-1.5">
                  <ProfileLine
                    icon={<Mail className="h-3.5 w-3.5" />}
                    label={copy.email}
                    value={displayEmail}
                  />
                  <ProfileLine
                    icon={<Phone className="h-3.5 w-3.5" />}
                    label={copy.phone}
                    value={profileInfo?.phone || copy.unknown}
                  />
                  <ProfileLine
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label={copy.country}
                    value={profileInfo?.country || copy.unknown}
                  />
                  <ProfileLine
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label={provinceLabel}
                    value={profileInfo?.city || copy.unknown}
                  />
                </div>

                {profileIncomplete || saveMessage ? (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setEditOpen((current) => !current)}
                      className="h-8 rounded-[10px] border border-[#b88a3d]/35 bg-[#fff4e2]/70 px-3 text-[11px] font-semibold text-[#6d241d] transition hover:bg-[#fff4e2]"
                    >
                      {copy.editProfile}
                    </button>
                    {saveMessage ? (
                      <span className="text-[10.5px] font-medium text-[#2f6d3a]">
                        {saveMessage}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditOpen((current) => !current)}
                    className="mt-2 h-8 rounded-[10px] px-2 text-[11px] font-semibold text-[#6d241d] transition hover:bg-[#d9b59e]/45"
                  >
                    {copy.editProfile}
                  </button>
                )}
              </div>

              {editOpen ? (
                <form
                  onSubmit={(event) => void handleProfileSave(event)}
                  className="mt-2 rounded-[16px] border border-[#d2b98f] bg-[#fff4e2]/65 p-3"
                >
                  <ProfileInput
                    label={copy.name}
                    value={formProfile.name}
                    onChange={(value) =>
                      setFormProfile((current) => ({ ...current, name: value }))
                    }
                    autoComplete="name"
                  />
                  <ProfileInput
                    label={copy.phone}
                    value={formProfile.phone}
                    onChange={(value) =>
                      setFormProfile((current) => ({ ...current, phone: value }))
                    }
                    autoComplete="tel"
                  />
                  <ProfileInput
                    label={copy.country}
                    value={formProfile.country}
                    onChange={(value) =>
                      setFormProfile((current) => ({ ...current, country: value }))
                    }
                    autoComplete="country-name"
                  />
                  <ProfileInput
                    label={provinceLabel}
                    value={formProfile.city}
                    onChange={(value) =>
                      setFormProfile((current) => ({ ...current, city: value }))
                    }
                    autoComplete="address-level2"
                  />

                  <div className="mt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="h-9 flex-1 rounded-[11px] bg-[#6d241d] px-3 text-[11.5px] font-semibold text-[#fff4e2] transition hover:bg-[#7d2d23] disabled:opacity-60"
                    >
                      {saving ? `${copy.save}...` : copy.save}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditOpen(false)}
                      className="h-9 flex-1 rounded-[11px] border border-[#d2b98f] px-3 text-[11.5px] font-semibold text-[#735f4b] transition hover:bg-[#efe3cf]"
                    >
                      {copy.cancel}
                    </button>
                  </div>
                </form>
              ) : null}

              {setLocale ? (
                <div className="relative mt-2 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/55 p-1.5">
                  <button
                    type="button"
                    onClick={() => setLanguageOpen((current) => !current)}
                    className="flex h-9 w-full items-center gap-3 rounded-[11px] px-2.5 text-start transition hover:bg-[#d9b59e]/55"
                    aria-expanded={languageOpen}
                  >
                    <span className="text-[#986f2e]">
                      <Globe2 className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-[12px] font-medium text-[#241913]">
                      {copy.language}
                    </span>
                    <span className="flex items-center gap-2 text-[10.5px] font-semibold text-[#735f4b]">
                      {activeLanguage.label}
                      <ChevronDown
                        className={[
                          "h-3.5 w-3.5 transition",
                          languageOpen ? "rotate-180" : "",
                        ].join(" ")}
                      />
                    </span>
                  </button>

                  {languageOpen ? (
                    <div className="absolute inset-x-1.5 top-12 z-10 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2] p-1.5 shadow-[0_18px_48px_rgba(62,39,22,0.16)]">
                      <div className="grid max-h-[232px] grid-cols-1 gap-1 overflow-y-auto">
                        {MENU_LANGUAGES.map((item) => {
                          const active = item.code === locale;

                          return (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => {
                                setLocale(item.code);
                                setLanguageOpen(false);
                              }}
                              className={[
                                "flex h-8 items-center gap-2 rounded-[10px] px-2 text-start text-[11px] transition",
                                active
                                  ? "bg-[#b88a3d] text-[#fff4e2]"
                                  : "text-[#735f4b] hover:bg-[#d9b59e]/55 hover:text-[#241913]",
                              ].join(" ")}
                            >
                              <span
                                className={[
                                  "grid h-5 w-7 shrink-0 place-items-center rounded-lg text-[9px] font-semibold",
                                  active
                                    ? "bg-[#fff4e2]/20 text-[#fff4e2]"
                                    : "border border-[#d2b98f] text-[#735f4b]",
                                ].join(" ")}
                              >
                                {item.short}
                              </span>
                              <span className="min-w-0 flex-1 truncate font-medium">
                                {item.label}
                              </span>
                              {active ? <Check className="h-3.5 w-3.5" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-2 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/55 p-1.5">
                <MenuButton
                  icon={<Crown className="h-4 w-4" />}
                  label={copy.subscriptions}
                  value={copy.paymentDisabled}
                  onClick={() => openPanel("plans")}
                />
                <MenuButton
                  icon={<LifeBuoy className="h-4 w-4" />}
                  label={copy.support}
                  value={SUPPORT_EMAIL}
                  onClick={() => openPanel("support")}
                />
              </div>

              <div className="mt-2 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/55 p-1.5">
                <MenuExternalButton
                  icon={<ExternalLink className="h-4 w-4" />}
                  label={copy.website}
                  onClick={openKishibWebsite}
                />
                <MenuLink
                  href="/cookies"
                  icon={<Cookie className="h-4 w-4" />}
                  label={copy.cookies}
                />
                <MenuLink
                  href="/terms"
                  icon={<FileText className="h-4 w-4" />}
                  label={copy.terms}
                />
                <MenuLink
                  href="/privacy"
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label={copy.privacy}
                />
              </div>

              <div className="mt-2 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/55 p-1.5">
                <MenuButton
                  icon={<Trash2 className="h-4 w-4" />}
                  label={copy.deleteAccount}
                  value=""
                  danger
                  onClick={() => openPanel("delete")}
                />
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="mt-2 flex h-10 w-full items-center gap-3 rounded-[12px] px-3 text-start text-[12px] font-medium text-[#6d241d] transition hover:bg-[#d9b59e]/55"
              >
                <LogOut className="h-4 w-4 text-[#a35a44]" />
                <span className="flex-1">{copy.logout}</span>
              </button>
            </div>

            {supportOpen ? (
              <MenuModal title={copy.support} closeLabel={copy.close} onClose={() => setSupportOpen(false)}>
                <p className="text-[12px] leading-5 text-[#735f4b]">
                  {copy.supportText}
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="mt-3 flex h-10 items-center justify-center rounded-[12px] border border-[#b88a3d]/35 bg-[#efe3cf]/75 text-[12px] font-semibold text-[#6d241d]"
                >
                  {SUPPORT_EMAIL}
                </a>
              </MenuModal>
            ) : null}

            {plansOpen ? (
              <MenuModal title={copy.subscriptions} closeLabel={copy.close} onClose={() => setPlansOpen(false)}>
                <div className="grid gap-2">
                  <PlanCard
                    title={copy.monthlyPlan}
                    price="5$"
                    copy={copy}
                    features={["استخدام شهري", "إمكانية طباعة 5 تقارير"]}
                  />
                  <PlanCard
                    title={copy.annualPlan}
                    price="45$"
                    copy={copy}
                    features={["استخدام سنوي", "75 تقرير قابل للطباعة"]}
                  />
                  <PlanCard
                    title={copy.reportsPack}
                    price="20$"
                    copy={copy}
                    features={[
                      "150 تقرير",
                      "يمكن شراؤها بشكل منفصل عن الاشتراك",
                    ]}
                  />
                </div>
              </MenuModal>
            ) : null}

            {deleteOpen ? (
              <MenuModal
                title={copy.deleteAccountTitle}
                closeLabel={copy.close}
                onClose={closeDeleteDialog}
              >
                <div className="rounded-[14px] border border-[#a23b2a]/25 bg-[#fff2ed] p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#a23b2a]" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-[#8f2e24]">
                        {copy.deleteAccountWarning}
                      </p>
                      <p className="mt-2 text-[11.5px] leading-5 text-[#735f4b]">
                        {copy.deleteAccountDataWarning}
                      </p>
                    </div>
                  </div>
                </div>

                <label className="mt-3 block">
                  <span className="mb-1 block text-[10.5px] font-semibold text-[#735f4b]">
                    {copy.deleteAccountConfirmHint}
                  </span>
                  <input
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    disabled={deletingAccount}
                    autoCapitalize="characters"
                    className="h-10 w-full rounded-[11px] border border-[#d2b98f] bg-[#fffaf0] px-3 text-[12px] font-semibold text-[#241913] outline-none transition focus:border-[#a23b2a] focus:ring-2 focus:ring-[#a23b2a]/18 disabled:opacity-60"
                  />
                </label>

                {deleteError ? (
                  <p className="mt-2 rounded-[10px] bg-[#fff2ed] px-3 py-2 text-[11px] font-semibold text-[#8f2e24]">
                    {deleteError}
                  </p>
                ) : null}

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={closeDeleteDialog}
                    disabled={deletingAccount}
                    className="h-10 flex-1 rounded-[11px] border border-[#d2b98f] px-3 text-[11.5px] font-semibold text-[#735f4b] transition hover:bg-[#efe3cf] disabled:opacity-60"
                  >
                    {copy.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteAccount()}
                    disabled={!canConfirmAccountDeletion || deletingAccount}
                    className="h-10 flex-1 rounded-[11px] bg-[#8f2e24] px-3 text-[11.5px] font-semibold text-[#fff4e2] transition hover:bg-[#a23b2a] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {deletingAccount
                      ? `${copy.deleteAccountConfirmButton}...`
                      : copy.deleteAccountConfirmButton}
                  </button>
                </div>
              </MenuModal>
            ) : null}
               </div>
        </>,
      document.body,
    )
  : null}
    </div>
  );
}

function ProfileLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex h-7 items-center gap-2 rounded-[10px] bg-[#fff4e2]/42 px-2">
      <span className="text-[#986f2e]">{icon}</span>
      <span className="w-16 shrink-0 text-[10.5px] font-medium text-[#735f4b]">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#241913]/78">
        {value}
      </span>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="mb-2 block">
      <span className="mb-1 block text-[10.5px] font-semibold text-[#735f4b]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
        className="h-9 w-full rounded-[11px] border border-[#d2b98f] bg-[#fffaf0] px-3 text-[12px] font-medium text-[#241913] outline-none transition focus:border-[#b88a3d] focus:ring-2 focus:ring-[#b88a3d]/18"
      />
    </label>
  );
}

function MenuButton({
  icon,
  label,
  value,
  onClick,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-full items-center gap-3 rounded-[12px] px-2.5 text-start transition hover:bg-[#d9b59e]/55"
    >
      <span className={danger ? "text-[#a23b2a]" : "text-[#986f2e]"}>
        {icon}
      </span>
      <span
        className={[
          "flex-1 text-[12px] font-medium",
          danger ? "text-[#8f2e24]" : "text-[#241913]",
        ].join(" ")}
      >
        {label}
      </span>
      <span className="max-w-[132px] truncate text-[10.5px] font-medium text-[#735f4b]">
        {value}
      </span>
    </button>
  );
}

function MenuModal({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-20 bg-[#241913]/18 p-3 backdrop-blur-[2px]">
      <div className="flex max-h-full flex-col rounded-[18px] border border-[#d2b98f] bg-[#fff4e2] p-3 shadow-[0_18px_60px_rgba(62,39,22,0.18)]">
        <div className="mb-3 flex items-center gap-3">
          <h3 className="min-w-0 flex-1 truncate text-[14px] font-bold text-[#241913]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="grid h-8 w-8 place-items-center rounded-full border border-[#d2b98f] text-[#735f4b] transition hover:bg-[#efe3cf]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function PlanCard({
  title,
  price,
  copy,
  features,
}: {
  title: string;
  price: string;
  copy: MenuCopy;
  features: string[];
}) {
  return (
    <section className="rounded-[14px] border border-[#d2b98f] bg-[#fffaf0] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-[13px] font-bold text-[#241913]">
            {title}
          </h4>
          <p className="mt-0.5 text-[11px] font-semibold text-[#986f2e]">
            {copy.price}: {price}
          </p>
        </div>
        <span className="rounded-full bg-[#efe3cf] px-2 py-1 text-[10px] font-semibold text-[#6d241d]">
          {copy.comingSoon}
        </span>
      </div>
      <p className="mt-2 text-[10.5px] font-semibold text-[#735f4b]">
        {copy.includes}
      </p>
      <ul className="mt-1 grid gap-1">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-[11px] leading-4 text-[#241913]/78"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#986f2e]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled
        className="mt-3 h-9 w-full cursor-not-allowed rounded-[11px] border border-[#d2b98f] bg-[#efe3cf]/65 text-[11.5px] font-semibold text-[#735f4b]"
      >
        {copy.paymentDisabled}
      </button>
    </section>
  );
}

function MenuLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-9 w-full items-center gap-3 rounded-[12px] px-2.5 text-start transition hover:bg-[#d9b59e]/55"
    >
      <span className="text-[#986f2e]">{icon}</span>
      <span className="flex-1 text-[12px] font-medium text-[#241913]">
        {label}
      </span>
      <BadgeCheck className="h-3.5 w-3.5 text-[#735f4b]/45" />
    </Link>
  );
}

function MenuExternalButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-full items-center gap-3 rounded-[12px] px-2.5 text-start transition hover:bg-[#d9b59e]/55"
    >
      <span className="text-[#986f2e]">{icon}</span>
      <span className="flex-1 text-[12px] font-medium text-[#241913]">
        {label}
      </span>
      <ExternalLink className="h-3.5 w-3.5 text-[#735f4b]/45" />
    </button>
  );
}
