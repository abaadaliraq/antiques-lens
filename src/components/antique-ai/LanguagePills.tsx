"use client";

import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type LangCode = "ar" | "en" | "ku" | "fr";

type LanguagePillsProps = {
  value?: LangCode;
  onChange?: (lang: LangCode) => void;

  lang?: LangCode;
  setLang?: (lang: LangCode) => void;

  currentLang?: LangCode;
  onSelect?: (lang: LangCode) => void;
};

const LANGUAGES: { code: LangCode; label: string; short: string }[] = [
  { code: "ar", label: "العربية", short: "AR" },
  { code: "en", label: "English", short: "EN" },
  { code: "ku", label: "Kurdî", short: "KU" },
  { code: "fr", label: "Français", short: "FR" },
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

  const changeLanguage =
    onChange ??
    setLang ??
    onSelect;

  const activeLanguage =
    LANGUAGES.find((item) => item.code === activeCode) ?? LANGUAGES[0];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
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
          "border border-white/10 bg-white/[0.075] px-3",
          "text-xs font-semibold text-white/85",
          "shadow-[0_16px_45px_rgba(0,0,0,0.35)] backdrop-blur-2xl",
          "transition hover:border-white/20 hover:bg-white/[0.12] hover:text-white",
        ].join(" ")}
        aria-label="Change language"
      >
        <span>{activeLanguage.short}</span>
        <Globe2 className="h-4 w-4 text-white/65" />
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
            "absolute end-0 mt-3 w-36 overflow-hidden rounded-2xl",
            "border border-white/10 bg-[#111111]/95 p-1.5",
            "shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl",
          ].join(" ")}
        >
          {LANGUAGES.map((item) => {
            const active = item.code === activeCode;

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleChange(item.code)}
                className={[
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5",
                  "text-sm transition",
                  active
                    ? "bg-white text-black"
                    : "text-white/65 hover:bg-white/[0.08] hover:text-white",
                ].join(" ")}
              >
                <span>{item.label}</span>

                {active ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-[10px] text-white/35">
                    {item.short}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}