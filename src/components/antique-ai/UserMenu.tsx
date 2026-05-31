"use client";

import {
  BadgeCheck,
  ChevronDown,
  Check,
  Cookie,
  CreditCard,
  Crown,
  FileText,
  Globe2,
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
  setLocale?: (locale: Locale) => void;
};

const AUTH_CACHE_KEY = "kishib:auth-session-active";

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

function formatBirthDate(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function getPlanCards(locale: Locale) {
  if (locale === "ar") {
    return [
      { title: "الباقة الشهرية", price: "$5", note: "شهرياً" },
      { title: "الباقة السنوية", price: "$42", note: "سنوياً" },
      { title: "تفعيل التقارير", price: "$50", note: "سنوياً" },
    ];
  }

  return [
    { title: "Monthly plan", price: "$5", note: "per month" },
    { title: "Annual plan", price: "$42", note: "per year" },
    { title: "Reports add-on", price: "$50", note: "per year" },
  ];
}

export default function UserMenu({ locale, setLocale }: UserMenuProps) {
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
  const planCards = getPlanCards(locale);

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
    window.localStorage.removeItem(AUTH_CACHE_KEY);
    window.location.reload();
  }

  return (
    <div ref={menuRef} dir={rtl ? "rtl" : "ltr"} className="relative z-50">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-[#120c08]/82 px-2.5 text-white shadow-[0_14px_38px_rgba(0,0,0,0.34)] backdrop-blur-2xl transition hover:border-[#d89a4f]/30 hover:bg-[#1b110c]/90 md:h-11 md:px-3"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#d89a4f] text-xs font-bold text-[#130905] md:h-8 md:w-8">
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
            className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[1px] md:hidden"
          />

          <div
            className={[
              "fixed right-3 top-16 z-[9999] max-h-[calc(100dvh-5rem)] w-[268px] overflow-y-auto rounded-[1.25rem] border border-white/10 bg-[#100905]/96 p-2 shadow-[0_26px_82px_rgba(0,0,0,0.68)] backdrop-blur-2xl",
              "md:absolute md:top-auto md:mt-3 md:max-h-[calc(100dvh-6rem)] md:w-[300px] md:rounded-[1.35rem]",
              rtl ? "md:left-0 md:right-auto" : "md:right-0",
            ].join(" ")}
          >
            <div className="rounded-[1rem] border border-[#d89a4f]/12 bg-[#1b100b]/68 p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#d89a4f] text-sm font-bold text-[#130905]">
                  {getInitial(displayName, displayEmail)}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-white/90">
                    {displayName}
                  </p>
                  <p className="truncate text-[11px] text-white/38">
                    {displayEmail || copy.account}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2 rounded-[1rem] border border-white/[0.07] bg-white/[0.025] p-1.5">
              <MenuButton
                icon={<UserRound className="h-4 w-4" />}
                label={copy.profile}
                value={copy.account}
              />
              <InfoRow label={copy.country} value={profile?.country || copy.unknown} />
              <InfoRow label={copy.province} value={profile?.province || copy.unknown} />
              <InfoRow
                label={copy.birthDate}
                value={formatBirthDate(profile?.birth_date) || copy.unknown}
              />
            </div>

            {setLocale ? (
              <LanguageMenu
                activeLocale={locale}
                onChange={(nextLocale) => setLocale(nextLocale)}
              />
            ) : null}

            <div className="mt-2 rounded-[1rem] border border-white/[0.07] bg-white/[0.025] p-1.5">
              <MenuButton
                icon={<Crown className="h-4 w-4" />}
                label={copy.subscriptions}
                value={copy.freePlan}
              />

              <div className="my-1 h-px bg-white/[0.06]" />

              <div className="px-2 py-1.5">
                <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-white/56">
                  <CreditCard className="h-3.5 w-3.5 text-[#d89a4f]" />
                  {copy.packages}
                </div>
                <div className="grid gap-1">
                  {planCards.map((plan) => (
                    <PlanButton
                      key={plan.title}
                      title={plan.title}
                      price={plan.price}
                      note={plan.note}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-2 rounded-[1rem] border border-white/[0.07] bg-white/[0.025] p-1.5">
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
              className="mt-2 flex h-10 w-full items-center gap-3 rounded-xl px-3 text-start text-[12px] font-medium text-red-100/88 transition hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4 text-red-300/82" />
              <span className="flex-1">{copy.logout}</span>
            </button>
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
      className="flex h-9 w-full items-center gap-3 rounded-xl px-2.5 text-start transition hover:bg-white/[0.055]"
    >
      <span className="text-[#d89a4f]/78">{icon}</span>
      <span className="flex-1 text-[12px] font-medium text-white/76">
        {label}
      </span>
      <span className="max-w-[110px] truncate text-[10.5px] font-medium text-white/34">
        {value}
      </span>
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-8 items-center justify-between gap-3 rounded-xl px-2.5">
      <span className="text-[11px] font-medium text-white/40">{label}</span>
      <span className="max-w-[142px] truncate text-[11px] font-medium text-white/68">
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
    <div className="mt-2 rounded-[1rem] border border-white/[0.07] bg-white/[0.025] p-2">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#d89a4f]/12 text-[#d89a4f]">
            <Globe2 className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-white/74">Language</p>
            <p className="text-[9.5px] text-white/32">Interface language</p>
          </div>
        </div>
        <span className="rounded-full border border-[#d89a4f]/18 bg-[#d89a4f]/10 px-2 py-1 text-[10px] font-semibold text-[#efc783]">
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
                  ? "bg-[#d89a4f] text-[#120804]"
                  : "text-white/58 hover:bg-white/[0.055] hover:text-white/82",
              ].join(" ")}
            >
              <span
                className={[
                  "grid h-5 w-6 shrink-0 place-items-center rounded-lg text-[9px] font-semibold",
                  active
                    ? "bg-black/12 text-[#120804]"
                    : "border border-white/8 text-white/34",
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

function PlanButton({
  title,
  price,
  note,
}: {
  title: string;
  price: string;
  note: string;
}) {
  return (
    <button
      type="button"
      className="flex min-h-10 w-full items-center justify-between gap-3 rounded-xl bg-[#d89a4f]/7 px-2.5 py-1.5 text-start transition hover:bg-[#d89a4f]/12"
    >
      <span className="min-w-0">
        <span className="block truncate text-[11.5px] font-medium text-white/78">
          {title}
        </span>
        <span className="block text-[9.5px] text-white/32">{note}</span>
      </span>
      <span className="rounded-full bg-[#d89a4f] px-2.5 py-1 text-[10.5px] font-bold text-[#130905]">
        {price}
      </span>
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
      className="flex h-9 w-full items-center gap-3 rounded-xl px-2.5 text-start transition hover:bg-white/[0.055]"
    >
      <span className="text-[#d89a4f]/78">{icon}</span>
      <span className="flex-1 text-[12px] font-medium text-white/76">
        {label}
      </span>
      <BadgeCheck className="h-3.5 w-3.5 text-white/20" />
    </Link>
  );
}
