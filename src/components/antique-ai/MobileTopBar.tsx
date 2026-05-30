"use client";

import { Menu } from "lucide-react";
import UserMenu from "./UserMenu";
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
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 lg:hidden">
      <div dir="ltr" className="mx-auto flex h-11 max-w-[430px] items-center justify-between rounded-full border border-white/8 bg-[#11100f]/58 px-2 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
        <button
          type="button"
          onClick={onOpenArchive}
          aria-label="Open history"
          className="grid h-8 w-8 place-items-center rounded-full text-white/62 transition hover:bg-white/[0.08] hover:text-white"
        >
          <Menu className="h-4 w-4" />
        </button>

        <UserMenu locale={locale} setLocale={setLocale} />
      </div>
    </header>
  );
}
