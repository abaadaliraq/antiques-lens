"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_KEY = "antiques-lens:cookie-choice";

export default function CookieBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedChoice = window.localStorage.getItem(COOKIE_KEY);
      if (!savedChoice) {
        setVisible(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function handleChoice(choice: "accepted" | "rejected") {
    window.localStorage.setItem(COOKIE_KEY, choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-white/15 bg-[#070812]/72 px-4 py-3 text-white shadow-[0_18px_70px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs leading-6 text-white/62 sm:text-[13px]">
            We use cookies to improve your experience and remember basic preferences.
          </p>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-[#22D3EE]/80">
            <Link href="/terms" className="transition hover:text-[#BAE6FD]">
              Terms
            </Link>
            <Link href="/privacy" className="transition hover:text-[#BAE6FD]">
              Privacy
            </Link>
            <Link href="/cookies" className="transition hover:text-[#BAE6FD]">
              Cookies
            </Link>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => handleChoice("rejected")}
            className="h-9 rounded-full border border-white/15 bg-white/8 px-4 text-xs font-medium text-white/70 transition hover:bg-white/12 hover:text-white"
          >
            Reject
          </button>

          <button
            onClick={() => handleChoice("accepted")}
            className="h-9 rounded-full bg-white px-4 text-xs font-semibold text-[#080911] transition hover:bg-cyan-100"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
