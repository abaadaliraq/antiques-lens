"use client";

import {
  BadgeCheck,
  Check,
  Cookie,
  Crown,
  ExternalLink,
  FileText,
  Globe2,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { Locale } from "./types";

type UserMenuProps = {
  locale: Locale;
  setLocale?: (locale: Locale) => void;
};

const AUTH_CACHE_KEY = "kishib:auth-session-active";
const SUBSCRIPTIONS_URL = "";

type ProfileInfo = {
  name: string;
  email: string;
  country: string;
  city: string;
  birthdate: string;
  avatarUrl: string;
};

type MenuCopy = {
  profile: string;
  account: string;
  country: string;
  province: string;
  birthDate: string;
  subscriptions: string;
  packages: string;
  cookies: string;
  terms: string;
  privacy: string;
  logout: string;
  freePlan: string;
  comingSoon: string;
  unknown: string;
  editProfile: string;
};

const COPY: Record<Locale, MenuCopy> = {
  ar: {
    profile: "الملف الشخصي",
    account: "الحساب",
    country: "الدولة",
    province: "المحافظة",
    birthDate: "المواليد",
    subscriptions: "الاشتراكات",
    packages: "الباقات",
    cookies: "الكوكيز",
    terms: "الشروط والأحكام",
    privacy: "سياسة الخصوصية",
    logout: "تسجيل خروج",
    freePlan: "الخطة المجانية",
    comingSoon: "قريباً",
    unknown: "غير مضاف",
    editProfile: "تعديل الملف الشخصي",
  },
  en: {
    profile: "Profile",
    account: "Account",
    country: "Country",
    province: "Province",
    birthDate: "Birth date",
    subscriptions: "Subscriptions",
    packages: "Plans",
    cookies: "Cookies",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    logout: "Log out",
    freePlan: "Free plan",
    comingSoon: "Coming soon",
    unknown: "Not added",
    editProfile: "Edit profile",
  },
  fr: {
    profile: "Profil",
    account: "Compte",
    country: "Pays",
    province: "Province",
    birthDate: "Date de naissance",
    subscriptions: "Abonnements",
    packages: "Forfaits",
    cookies: "Cookies",
    terms: "Conditions",
    privacy: "Confidentialité",
    logout: "Déconnexion",
    freePlan: "Forfait gratuit",
    comingSoon: "Bientôt",
    unknown: "Non ajouté",
    editProfile: "Modifier le profil",
  },
  hi: {
    profile: "प्रोफ़ाइल",
    account: "खाता",
    country: "देश",
    province: "प्रदेश",
    birthDate: "जन्म तारीख",
    subscriptions: "सदस्यता",
    packages: "पैकेज",
    cookies: "कुकीज़",
    terms: "नियम और शर्तें",
    privacy: "गोपनीयता नीति",
    logout: "लॉग आउट",
    freePlan: "मुफ़्त योजना",
    comingSoon: "जल्द",
    unknown: "जोड़ा नहीं गया",
    editProfile: "प्रोफ़ाइल संपादित करें",
  },
  fa: {
    profile: "پروفایل",
    account: "حساب",
    country: "کشور",
    province: "استان",
    birthDate: "تاریخ تولد",
    subscriptions: "اشتراک‌ها",
    packages: "بسته‌ها",
    cookies: "کوکی‌ها",
    terms: "شرایط و قوانین",
    privacy: "حریم خصوصی",
    logout: "خروج",
    freePlan: "پلن رایگان",
    comingSoon: "به‌زودی",
    unknown: "اضافه نشده",
    editProfile: "ویرایش پروفایل",
  },
  tr: {
    profile: "Profil",
    account: "Hesap",
    country: "Ülke",
    province: "İl",
    birthDate: "Doğum tarihi",
    subscriptions: "Abonelikler",
    packages: "Paketler",
    cookies: "Çerezler",
    terms: "Şartlar ve Koşullar",
    privacy: "Gizlilik Politikası",
    logout: "Çıkış yap",
    freePlan: "Ücretsiz plan",
    comingSoon: "Yakında",
    unknown: "Eklenmedi",
    editProfile: "Profili düzenle",
  },
  ru: {
    profile: "Профиль",
    account: "Аккаунт",
    country: "Страна",
    province: "Регион",
    birthDate: "Дата рождения",
    subscriptions: "Подписки",
    packages: "Пакеты",
    cookies: "Cookies",
    terms: "Условия",
    privacy: "Политика конфиденциальности",
    logout: "Выйти",
    freePlan: "Бесплатный план",
    comingSoon: "Скоро",
    unknown: "Не добавлено",
    editProfile: "Редактировать профиль",
  },
  ku: {
    profile: "پرۆفایل",
    account: "هەژمار",
    country: "وڵات",
    province: "پارێزگا",
    birthDate: "لەدایکبوون",
    subscriptions: "بەشداربوونەکان",
    packages: "پاکێجەکان",
    cookies: "کوکیز",
    terms: "مەرج و ڕێساکان",
    privacy: "تایبەتمەندی",
    logout: "چوونەدەرەوە",
    freePlan: "پلانی خۆڕایی",
    comingSoon: "بەم زووانە",
    unknown: "زیاد نەکراوە",
    editProfile: "دەستکاری پرۆفایل",
  },
};

const MENU_LANGUAGES: { code: Locale; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "ar", label: "العربية", short: "AR" },
  { code: "tr", label: "Türkçe", short: "TR" },
  { code: "fa", label: "فارسی", short: "FA" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "hi", label: "हिन्दी", short: "HI" },
  { code: "ru", label: "Русский", short: "RU" },
  { code: "ku", label: "Kurdî", short: "KU" },
];

function isRtl(locale: Locale) {
  return locale === "ar" || locale === "fa" || locale === "ku";
}

function getInitial(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "K";
  return source.charAt(0).toUpperCase();
}

function getFallbackName(email?: string | null) {
  if (!email) return "مستخدم كيشيب";
  return email.split("@")[0] || "مستخدم كيشيب";
}

function readMetadataText(
  metadata: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function buildProfileInfo(
  user: {
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  } | null,
  notAdded: string,
): ProfileInfo {
  const metadata = user?.user_metadata ?? {};
  const email = user?.email || notAdded;

  return {
    name:
      readMetadataText(metadata, ["full_name", "name"]) ||
      getFallbackName(user?.email),
    email,
    country:
      readMetadataText(metadata, ["country", "country_name"]) || notAdded,
    city:
      readMetadataText(metadata, ["city", "governorate", "province"]) ||
      notAdded,
    birthdate:
      readMetadataText(metadata, ["birthdate", "date_of_birth", "birth_date"]) ||
      notAdded,
    avatarUrl: readMetadataText(metadata, ["avatar_url", "picture", "photo_url"]),
  };
}

function formatBirthDate(value: string) {
  if (!value) return value;
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value;
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

export default function UserMenu({ locale, setLocale }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const copy = COPY[locale];
  const rtl = isRtl(locale);

  const displayName = profileInfo?.name || getFallbackName(null);
  const displayEmail = profileInfo?.email || copy.unknown;
  const avatarUrl = profileInfo?.avatarUrl || "";

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function loadUser() {
      const supabase = getSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!mounted) return;

      setProfileInfo(buildProfileInfo(userData.user, copy.unknown));
    }

    void loadUser();

    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        setProfileInfo(buildProfileInfo(session?.user ?? null, copy.unknown));
      });

      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      unsubscribe = undefined;
    }

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [copy.unknown]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
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

  function handleSubscriptionsClick() {
    if (!SUBSCRIPTIONS_URL) return;
    window.location.href = SUBSCRIPTIONS_URL;
  }

  return (
    <div ref={menuRef} dir={rtl ? "rtl" : "ltr"} className="relative z-50">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="grid h-11 w-11 place-items-center rounded-full border border-[#d2b98f] bg-[#fff4e2]/88 text-[#241913] shadow-[0_14px_38px_rgba(62,39,22,0.14)] backdrop-blur-2xl transition hover:border-[#b88a3d]/55 hover:bg-[#fff4e2]"
        aria-label={copy.profile}
      >
        <Avatar
          name={displayName}
          email={displayEmail}
          avatarUrl={avatarUrl}
          className="h-8 w-8 text-xs"
        />
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Close user menu"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[9998] bg-[#241913]/20 backdrop-blur-[2px]"
          />

          <div
            className={[
              "fixed inset-x-3 bottom-3 z-[9999] h-[54dvh] min-h-[320px] max-h-[520px] overflow-hidden rounded-[22px] border border-[#d2b98f] bg-[#fff4e2]/96 shadow-[0_26px_82px_rgba(62,39,22,0.18)] backdrop-blur-2xl",
              "md:inset-x-auto md:bottom-auto md:top-16 md:h-auto md:max-h-[calc(100dvh-5rem)] md:w-[340px] md:rounded-[1.35rem]",
              rtl ? "md:left-4" : "md:right-4",
            ].join(" ")}
          >
            <div className="flex h-full flex-col overflow-y-auto p-3">
            <div className="rounded-[18px] border border-[#d2b98f] bg-[#efe3cf]/70 p-3.5">
              <div className="flex items-center gap-3">
                <Avatar
                  name={displayName}
                  email={displayEmail}
                  avatarUrl={avatarUrl}
                  className="h-10 w-10 shrink-0 rounded-2xl text-sm"
                />

                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#241913]">
                    {displayName}
                  </p>
                  <p className="truncate text-[11px] text-[#735f4b]">
                    {displayEmail || copy.account}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2 rounded-[16px] border border-[#d2b98f] bg-[#fff4e2]/55 p-1.5">
              <MenuButton
                icon={<UserRound className="h-4 w-4" />}
                label={copy.profile}
                value={displayEmail}
              />
              <InfoRow label={copy.country} value={profileInfo?.country || copy.unknown} />
              <InfoRow label={copy.province} value={profileInfo?.city || copy.unknown} />
              <InfoRow
                label={copy.birthDate}
                value={formatBirthDate(profileInfo?.birthdate || copy.unknown)}
              />
              <button
                type="button"
                disabled
                title={copy.comingSoon}
                className="mt-1 flex h-9 w-full cursor-not-allowed items-center justify-center rounded-[12px] border border-[#d2b98f] bg-[#efe3cf]/55 px-3 text-[11.5px] font-medium text-[#735f4b]/55"
              >
                {copy.editProfile}
              </button>
            </div>

            {setLocale ? (
              <LanguageMenu
                activeLocale={locale}
                onChange={(nextLocale) => setLocale(nextLocale)}
              />
            ) : null}

            <div className="mt-2 rounded-[16px] border border-[#d2b98f] bg-[#fff4e2]/55 p-1.5">
              <MenuButton
                icon={<Crown className="h-4 w-4" />}
                label={copy.subscriptions}
                value={copy.comingSoon}
                onClick={handleSubscriptionsClick}
                trailing={<ExternalLink className="h-3.5 w-3.5 text-[#735f4b]/55" />}
              />
            </div>

            <div className="mt-2 rounded-[16px] border border-[#d2b98f] bg-[#fff4e2]/55 p-1.5">
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

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-2 flex h-10 w-full items-center gap-3 rounded-[12px] px-3 text-start text-[12px] font-medium text-[#6d241d] transition hover:bg-[#d9b59e]/55"
            >
              <LogOut className="h-4 w-4 text-[#a35a44]" />
              <span className="flex-1">{copy.logout}</span>
            </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MenuButton({
  icon,
  label,
  value,
  onClick,
  trailing,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
  trailing?: ReactNode;
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
      <span className="flex max-w-[126px] items-center gap-1.5 truncate text-[10.5px] font-medium text-[#735f4b]">
        <span className="truncate">{value}</span>
        {trailing}
      </span>
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-8 items-center justify-between gap-3 rounded-xl px-2.5">
      <span className="text-[11px] font-medium text-[#735f4b]">{label}</span>
      <span className="max-w-[142px] truncate text-[11px] font-medium text-[#241913]/72">
        {value}
      </span>
    </div>
  );
}

function LanguageMenu({
  activeLocale,
  onChange,
}: {
  activeLocale: Locale;
  onChange: (locale: Locale) => void;
}) {
  return (
    <div className="mt-2 rounded-[16px] border border-[#d2b98f] bg-[#fff4e2]/55 p-2">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-[12px] bg-[#d9b59e]/55 text-[#986f2e]">
            <Globe2 className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-[#241913]">Language</p>
            <p className="text-[9.5px] text-[#735f4b]">Interface language</p>
          </div>
        </div>
        <span className="rounded-[10px] border border-[#d2b98f] bg-[#efe3cf] px-2 py-1 text-[10px] font-semibold text-[#735f4b]">
          {activeLocale.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1">
        {MENU_LANGUAGES.map((item) => {
          const active = item.code === activeLocale;

          return (
            <button
              key={item.code}
              type="button"
              onClick={() => onChange(item.code)}
              className={[
                "flex h-8 items-center gap-2 rounded-xl px-2 text-start text-[11px] transition",
                active
                  ? "bg-[#b88a3d] text-[#fff4e2]"
                  : "text-[#735f4b] hover:bg-[#d9b59e]/55 hover:text-[#241913]",
              ].join(" ")}
            >
              <span
                className={[
                  "grid h-5 w-6 shrink-0 place-items-center rounded-lg text-[9px] font-semibold",
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
              {active ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
            </button>
          );
        })}
      </div>
    </div>
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
