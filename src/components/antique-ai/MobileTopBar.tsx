"use client";

import { Menu } from "lucide-react";
import LanguagePills from "./LanguagePills";
import type { Locale } from "./types";

type Props = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  onOpenArchive: () => void;
};

export default function MobileTopBar({
  locale,
  setLocale,
  onOpenArchive,
}: Props) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-12 max-w-[430px] items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-2 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
        <button
          type="button"
          onClick={onOpenArchive}
          aria-label="Open history"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.065] text-white/75 backdrop-blur-2xl transition hover:bg-white/[0.1] hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>

        <LanguagePills lang={locale} setLang={setLocale} />
      </div>
    </header>
  );
}