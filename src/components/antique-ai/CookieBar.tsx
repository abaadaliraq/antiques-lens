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
      <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-[18px] border border-[#d2b98f] bg-[#fff4e2]/90 px-4 py-3 text-[#241913] shadow-[0_16px_38px_rgba(62,39,22,0.12)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs leading-6 text-[#735f4b] sm:text-[13px]">
            We use cookies to improve your experience and remember basic preferences.
          </p>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-[#986f2e]">
            <Link href="/terms" className="transition hover:text-[#7b2f25]">
              Terms
            </Link>
            <Link href="/privacy" className="transition hover:text-[#7b2f25]">
              Privacy
            </Link>
            <Link href="/cookies" className="transition hover:text-[#7b2f25]">
              Cookies
            </Link>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => handleChoice("rejected")}
            className="h-9 rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/70 px-4 text-xs font-medium text-[#735f4b] transition hover:bg-[#d9b59e]/55 hover:text-[#241913]"
          >
            Reject
          </button>

          <button
            onClick={() => handleChoice("accepted")}
            className="h-9 rounded-[12px] bg-[#b88a3d] px-4 text-xs font-semibold text-[#fff4e2] transition hover:bg-[#986f2e]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
