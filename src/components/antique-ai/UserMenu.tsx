"use client";

import {
  BadgeCheck,
  ChevronDown,
  Cookie,
  CreditCard,
  Crown,
  FileText,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { Locale } from "./types";

type UserMenuProps = {
  locale: Locale;
};

type Profile = {
  full_name?: string | null;
  email?: string | null;
  country?: string | null;
  province?: string | null;
  birth_date?: string | null;
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
  },
};

function isRtl(locale: Locale) {
  return locale === "ar" || locale === "fa" || locale === "ku";
}

function getInitial(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "K";
  return source.charAt(0).toUpperCase();
}

function formatBirthDate(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function UserMenu({ locale }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const copy = COPY[locale];
  const rtl = isRtl(locale);

  const displayName = useMemo(() => {
    return profile?.full_name?.trim() || email || copy.account;
  }, [copy.account, email, profile?.full_name]);

  const displayEmail = profile?.email || email;

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const supabase = getSupabaseBrowserClient();

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!mounted || !user) return;

      const userEmail = user.email || "";
      const metaName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : "";

      setEmail(userEmail);

    const { data } = await supabase
  .from("profiles")
  .select("full_name,email,country,province,birth_date")
  .eq("id", user.id)
  .maybeSingle();

if (!mounted) return;

const profileData = data as Profile | null;

setProfile({
  full_name: profileData?.full_name || metaName,
  email: profileData?.email || userEmail,
  country: profileData?.country || null,
  province: profileData?.province || null,
  birth_date: profileData?.birth_date || null,
});
    }

    void loadUser();

    return () => {
      mounted = false;
    };
  }, []);

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
    window.location.reload();
  }

  return (
    <div
      ref={menuRef}
      dir={rtl ? "rtl" : "ltr"}
      className="relative z-50"
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 items-center gap-2 rounded-full border border-[#b66b3d]/24 bg-[#120b08]/82 px-2.5 text-white shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-2xl transition hover:bg-[#20120c]/90 md:h-11 md:px-3"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#d89a4f] text-xs font-black text-[#130905] md:h-8 md:w-8">
          {getInitial(displayName, displayEmail)}
        </span>

        <span className="hidden max-w-[130px] truncate text-[12px] font-semibold text-white/82 md:block">
          {displayName}
        </span>

        <ChevronDown
          className={[
            "h-4 w-4 text-white/45 transition",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
     </button>

{isOpen ? (
  <>
    <button
      type="button"
      aria-label="Close user menu"
      onClick={() => setIsOpen(false)}
      className="fixed inset-0 z-[9998] bg-black/35 backdrop-blur-[1px] md:hidden"
    />

    <div
      className={[
        "fixed right-0 top-0 z-[9999] h-dvh w-[58vw] min-w-[230px] max-w-[340px] overflow-y-auto rounded-l-[1.5rem] border-l border-[#b66b3d]/24 bg-[#100905]/98 p-2 shadow-[0_28px_90px_rgba(0,0,0,0.72)] backdrop-blur-2xl",
        "md:absolute md:top-auto md:mt-3 md:h-auto md:w-[285px] md:min-w-0 md:max-w-none md:overflow-hidden md:rounded-[1.35rem] md:border md:border-[#b66b3d]/22 md:bg-[#100905]/96 md:shadow-[0_28px_90px_rgba(0,0,0,0.55)]",
        rtl ? "md:left-0 md:right-auto" : "md:right-0",
      ].join(" ")}
    >
      <div className="rounded-[1.05rem] border border-[#b66b3d]/16 bg-[#21140e]/78 p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d89a4f] text-sm font-black text-[#130905]">
            {getInitial(displayName, displayEmail)}
          </span>

          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-white">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-white/42">
              {displayEmail || copy.account}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-1.5 text-[11px] text-white/58">
          <div className="flex items-center justify-between gap-3">
            <span>{copy.country}</span>
            <span className="max-w-[135px] truncate font-semibold text-white/78">
              {profile?.country || copy.unknown}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span>{copy.province}</span>
            <span className="max-w-[135px] truncate font-semibold text-white/78">
              {profile?.province || copy.unknown}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span>{copy.birthDate}</span>
            <span className="max-w-[135px] truncate font-semibold text-white/78">
              {formatBirthDate(profile?.birth_date) || copy.unknown}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <MenuButton
          icon={<UserRound className="h-4 w-4" />}
          label={copy.profile}
          value={copy.account}
        />

        <MenuButton
          icon={<Crown className="h-4 w-4" />}
          label={copy.subscriptions}
          value={copy.freePlan}
        />

        <MenuButton
          icon={<CreditCard className="h-4 w-4" />}
          label={copy.packages}
          value={copy.comingSoon}
        />

        <div className="my-2 h-px bg-white/8" />

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

        <div className="my-2 h-px bg-white/8" />

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-start text-[12px] font-semibold text-red-100 transition hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4 text-red-300" />
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <button
      type="button"
      className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-start transition hover:bg-white/[0.055]"
    >
      <span className="text-[#d89a4f]/82">{icon}</span>
      <span className="flex-1 text-[12px] font-semibold text-white/78">
        {label}
      </span>
      <span className="text-[10.5px] font-medium text-white/36">{value}</span>
    </button>
  );
}

function MenuLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-start transition hover:bg-white/[0.055]"
    >
      <span className="text-[#d89a4f]/82">{icon}</span>
      <span className="flex-1 text-[12px] font-semibold text-white/78">
        {label}
      </span>
      <BadgeCheck className="h-3.5 w-3.5 text-white/20" />
    </Link>
  );
}