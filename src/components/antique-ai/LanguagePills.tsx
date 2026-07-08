"use client";

import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LANGUAGE_OPTIONS } from "@/i18n/common";
import type { Locale } from "./types";

type LangCode = Locale;

type LanguagePillsProps = {
  value?: LangCode;
  onChange?: (lang: LangCode) => void;
  variant?: "default" | "menu";
  lang?: LangCode;
  setLang?: (lang: LangCode) => void;
  currentLang?: LangCode;
  onSelect?: (lang: LangCode) => void;
};

const LANGUAGES = LANGUAGE_OPTIONS;

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

  const activeCode: LangCode = value ?? lang ?? currentLang ?? "en";
  const changeLanguage = onChange ?? setLang ?? onSelect;
  const activeLanguage =
    LANGUAGES.find((item) => item.code === activeCode) ?? LANGUAGES[0];
  const isMenu = variant === "menu";

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) setOpen(false);
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
    changeLanguage?.(code);
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="relative z-[90]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "flex items-center gap-2 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/88 text-[#241913] transition hover:border-[#b88a3d]/55 hover:bg-[#fff4e2]",
          isMenu ? "h-9 px-3 text-xs" : "h-10 px-3 text-xs font-semibold",
        ].join(" ")}
        aria-label="Change language"
        aria-expanded={open}
      >
        <Globe2 className="h-4 w-4 text-[#986f2e]" />
        <span className="min-w-[22px] text-center tracking-[0.08em]">
          {activeLanguage.short}
        </span>
        <ChevronDown
          className={[
            "h-3.5 w-3.5 text-[#735f4b] transition",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div
          className={[
            isMenu
              ? "absolute left-0 top-11 w-[244px]"
              : "absolute right-0 top-12 w-[286px] max-w-[calc(100vw-2rem)]",
            "rounded-[20px] border border-[#d2b98f] bg-[#fff4e2]/98 p-2 shadow-[0_26px_80px_rgba(62,39,22,0.18)] backdrop-blur-2xl",
          ].join(" ")}
        >
          <div className="px-2 pb-2 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#986f2e]">
              Language
            </p>
          </div>

          <div className="grid grid-cols-1 gap-1">
            {LANGUAGES.map((item) => {
              const active = item.code === activeCode;

              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleChange(item.code)}
                  className={[
                    "flex h-11 items-center justify-between rounded-2xl px-3 text-start transition",
                    active
                      ? "bg-[#b88a3d] text-[#fff4e2] ring-1 ring-[#b88a3d]/28"
                      : "text-[#735f4b] hover:bg-[#d9b59e]/55 hover:text-[#241913]",
                  ].join(" ")}
                >
                  <span>
                    <span className="block text-sm font-medium">{item.native}</span>
                    <span className="block text-[11px] text-current/55">
                      {item.label}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-current/60">
                      {item.short}
                    </span>
                    {active && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-[#22D3EE] text-black">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
