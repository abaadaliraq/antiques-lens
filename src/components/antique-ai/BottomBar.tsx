"use client";

import { Home, Plus, Share2 } from "lucide-react";

type BottomBarLabels = {
  new: string;
  share: string;
};

type BottomBarProps = {
  theme: "dark" | "light";
  labels: BottomBarLabels;
  hasResult: boolean;
  onNew: () => void;
  onShare: () => void;
};

export default function BottomBar({
  theme,
  labels,
  hasResult,
  onNew,
  onShare,
}: BottomBarProps) {
  if (!hasResult) return null;

  const isLight = theme === "light";

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 px-4">
      <div
        className={[
          "mx-auto flex h-14 w-fit items-center gap-1 rounded-full border px-2 shadow-[0_20px_70px_rgba(0,0,0,0.42)] backdrop-blur-2xl",
          isLight
            ? "border-black/10 bg-white/80 text-black"
            : "border-[rgba(34,211,238,0.18)] bg-[#020617]/88 text-[#E2E8F0]",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onNew}
          title={labels.new}
          aria-label={labels.new}
          className="grid h-10 w-10 place-items-center rounded-full text-[#94A3B8] transition hover:bg-white/10 hover:text-white"
        >
          <Home className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onShare}
          title={labels.share}
          aria-label={labels.share}
          className="grid h-10 w-10 place-items-center rounded-full text-[#94A3B8] transition hover:bg-white/10 hover:text-white"
        >
          <Share2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onNew}
          title={labels.new}
          aria-label={labels.new}
          className="grid h-10 w-10 place-items-center rounded-full bg-[#2563EB] text-white transition hover:bg-[#1D4ED8]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
