"use client";

import { Archive } from "lucide-react";
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
    <header className="fixed inset-x-0 top-0 z-40 bg-black/20 px-4 pt-3 backdrop-blur-xl lg:pl-[306px]">
      <div className="mx-auto flex h-12 max-w-[430px] items-center justify-between">
        <LanguagePills locale={locale} setLocale={setLocale} />

        <button
          type="button"
          onClick={onOpenArchive}
          aria-label="Archive"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.065] text-white/55 backdrop-blur-2xl transition hover:bg-white/[0.1] hover:text-white"
        >
          <Archive className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}