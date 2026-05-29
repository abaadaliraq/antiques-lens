"use client";

import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type LangCode = "ar" | "en" | "fr" | "hi" | "fa" | "tr" | "ru" | "ku";

type LanguagePillsProps = {
  value?: LangCode;
  onChange?: (lang: LangCode) => void;

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

  return (
    <div ref={menuRef} className="relative z-[90]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "flex h-10 items-center gap-2 rounded-full",
          "border border-white/10 bg-[#17110c]/70 px-3",
          "text-xs font-semibold text-white/86",
          "shadow-[0_16px_45px_rgba(0,0,0,0.35)] backdrop-blur-2xl",
          "transition hover:border-[#d6a25f]/35 hover:bg-[#21160f]/82 hover:text-white",
        ].join(" ")}
        aria-label="Change language"
        aria-expanded={open}
      >
        <Globe2 className="h-4 w-4 text-[#d6a25f]/80" />

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
  "fixed right-4 top-[68px] z-[120] w-[286px] max-w-[calc(100vw-2rem)] rounded-[1.35rem]",
  "border border-[#d6a25f]/18 bg-[#100b07]/96 p-3",
  "shadow-[0_26px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl",
].join(" ")}
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d6a25f]/70">
                Language
              </p>
              <p className="mt-0.5 text-[11px] text-white/38">
                Choose interface language
              </p>
            </div>

            <div className="grid h-8 w-8 place-items-center rounded-xl border border-[#d6a25f]/18 bg-[#d6a25f]/8">
              <Globe2 className="h-4 w-4 text-[#d6a25f]/80" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((item) => {
              const active = item.code === activeCode;

              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleChange(item.code)}
                  className={[
                    "group relative min-h-[62px] rounded-2xl border px-3 py-2 text-start transition",
                    active
                      ? "border-[#d6a25f]/55 bg-[#d6a25f]/14 text-[#f4d29b]"
                      : "border-white/8 bg-white/[0.035] text-white/68 hover:border-[#d6a25f]/28 hover:bg-white/[0.055] hover:text-white",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold leading-5">
                        {item.native}
                      </p>
                      <p
                        className={[
                          "mt-0.5 truncate text-[10px] leading-4",
                          active ? "text-[#f4d29b]/58" : "text-white/34",
                        ].join(" ")}
                      >
                        {item.label}
                      </p>
                    </div>

                    <span
                      className={[
                        "shrink-0 rounded-lg px-1.5 py-0.5 text-[9px] font-bold",
                        active
                          ? "bg-[#d6a25f] text-black"
                          : "border border-white/10 text-white/35 group-hover:text-white/55",
                      ].join(" ")}
                    >
                      {item.short}
                    </span>
                  </div>

                  {active && (
                    <span className="absolute bottom-2 end-2 grid h-5 w-5 place-items-center rounded-full bg-[#d6a25f] text-black">
                      <Check className="h-3.5 w-3.5" />
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