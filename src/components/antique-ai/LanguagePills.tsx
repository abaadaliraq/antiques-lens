"use client";

import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type LangCode = "ar" | "en" | "fr" | "hi" | "fa" | "tr" | "ru" | "ku";

type LanguagePillsProps = {
  value?: LangCode;
  onChange?: (lang: LangCode) => void;
  variant?: "default" | "menu";

  lang?: LangCode;
  setLang?: (lang: LangCode) => void;

  currentLang?: LangCode;
  onSelect?: (lang: LangCode) => void;
};

const LANGUAGES: {
  code: LangCode;
  native: string;
  label: string;
  short: string;
}[] = [
  { code: "ar", native: "العربية", label: "Arabic", short: "AR" },
  { code: "en", native: "English", label: "English", short: "EN" },
  { code: "fr", native: "Français", label: "French", short: "FR" },
  { code: "hi", native: "हिन्दी", label: "Hindi", short: "HI" },
  { code: "fa", native: "فارسی", label: "Persian", short: "FA" },
  { code: "tr", native: "Türkçe", label: "Turkish", short: "TR" },
  { code: "ru", native: "Русский", label: "Russian", short: "RU" },
  { code: "ku", native: "Kurdî", label: "Kurdish", short: "KU" },
];

export default function LanguagePills({
  value,
  onChange,
  lang,
  setLang,
  variant = "default",
  currentLang,
  onSelect,
}: LanguagePillsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const activeCode: LangCode = value ?? lang ?? currentLang ?? "ar";
  const changeLanguage = onChange ?? setLang ?? onSelect;

  const activeLanguage =
    LANGUAGES.find((item) => item.code === activeCode) ?? LANGUAGES[0];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleChange(code: LangCode) {
    if (typeof changeLanguage !== "function") {
      console.error(
        "LanguagePills: no language change function was passed. Pass onChange or setLang."
      );
      setOpen(false);
      return;
    }

    changeLanguage(code);
    setOpen(false);
  }

  const isMenu = variant === "menu";

  return (
    <div ref={menuRef} className="relative z-[90]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "flex items-center gap-2 rounded-full transition",
          isMenu
            ? "h-8 border border-[#b66b3d]/18 bg-[#21140e]/78 px-2.5 text-[11px] font-bold text-white/78 hover:border-[#d89a4f]/34 hover:bg-[#2a1a12]"
            : "h-10 border border-white/10 bg-[#17110c]/70 px-3 text-xs font-semibold text-white/86 shadow-[0_16px_45px_rgba(0,0,0,0.35)] backdrop-blur-2xl hover:border-[#d6a25f]/35 hover:bg-[#21160f]/82 hover:text-white",
        ].join(" ")}
        aria-label="Change language"
        aria-expanded={open}
      >
        <Globe2 className={isMenu ? "h-3.5 w-3.5 text-[#d89a4f]" : "h-4 w-4 text-[#d6a25f]/80"} />

        <span className="min-w-[20px] text-center tracking-[0.08em]">
          {activeLanguage.short}
        </span>

        <ChevronDown
          className={[
            "h-3.5 w-3.5 text-white/45 transition",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div
        className={[
  isMenu
    ? "absolute right-0 top-10 z-[10000] w-[238px] rounded-[1rem] border border-[#b66b3d]/18 bg-[#100905]/98 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.68)] backdrop-blur-2xl"
    : "fixed right-4 top-[68px] z-[120] w-[286px] max-w-[calc(100vw-2rem)] rounded-[1.35rem] border border-[#d6a25f]/18 bg-[#100b07]/96 p-3 shadow-[0_26px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl",
].join(" ")}
        >
          <div className={isMenu ? "mb-2 flex items-center justify-between px-1" : "mb-2 flex items-center justify-between px-1"}>
            <div>
              <p className={isMenu ? "text-[9px] font-semibold uppercase tracking-[0.2em] text-[#d89a4f]/70" : "text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d6a25f]/70"}>
                Language
              </p>
              <p className={isMenu ? "mt-0.5 text-[10px] text-white/34" : "mt-0.5 text-[11px] text-white/38"}>
                Choose interface language
              </p>
            </div>

            <div className={isMenu ? "grid h-7 w-7 place-items-center rounded-lg border border-[#d89a4f]/16 bg-[#d89a4f]/8" : "grid h-8 w-8 place-items-center rounded-xl border border-[#d6a25f]/18 bg-[#d6a25f]/8"}>
              <Globe2 className={isMenu ? "h-3.5 w-3.5 text-[#d89a4f]/80" : "h-4 w-4 text-[#d6a25f]/80"} />
            </div>
          </div>

          <div className={isMenu ? "grid grid-cols-2 gap-1.5" : "grid grid-cols-2 gap-2"}>
            {LANGUAGES.map((item) => {
              const active = item.code === activeCode;

              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleChange(item.code)}
                  className={[
                    "group relative border text-start transition",
                    isMenu
                      ? "min-h-[46px] rounded-xl px-2.5 py-1.5"
                      : "min-h-[62px] rounded-2xl px-3 py-2",
                    active
                      ? "border-[#d6a25f]/55 bg-[#d6a25f]/14 text-[#f4d29b]"
                      : "border-white/8 bg-white/[0.035] text-white/68 hover:border-[#d6a25f]/28 hover:bg-white/[0.055] hover:text-white",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={isMenu ? "truncate text-[11.5px] font-semibold leading-4" : "truncate text-[13px] font-semibold leading-5"}>
                        {item.native}
                      </p>
                      <p
                        className={[
                          isMenu ? "mt-0.5 truncate text-[9px] leading-3" : "mt-0.5 truncate text-[10px] leading-4",
                          active ? "text-[#f4d29b]/58" : "text-white/34",
                        ].join(" ")}
                      >
                        {item.label}
                      </p>
                    </div>

                    <span
                      className={[
                        isMenu
                          ? "shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-bold"
                          : "shrink-0 rounded-lg px-1.5 py-0.5 text-[9px] font-bold",
                        active
                          ? "bg-[#d6a25f] text-black"
                          : "border border-white/10 text-white/35 group-hover:text-white/55",
                      ].join(" ")}
                    >
                      {item.short}
                    </span>
                  </div>

                  {active && (
                    <span className={isMenu ? "absolute bottom-1.5 end-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#d6a25f] text-black" : "absolute bottom-2 end-2 grid h-5 w-5 place-items-center rounded-full bg-[#d6a25f] text-black"}>
                      <Check className={isMenu ? "h-3 w-3" : "h-3.5 w-3.5"} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
