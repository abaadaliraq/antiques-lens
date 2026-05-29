"use client";

import { Plus, Share2 } from "lucide-react";

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

  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <div
        className={[
          "flex items-center gap-1 rounded-2xl border px-2 py-2 shadow-[0_20px_70px_rgba(0,0,0,0.34)] backdrop-blur-2xl",
          theme === "light"
            ? "border-black/10 bg-white/70 text-black"
            : "border-white/10 bg-[#120c08]/72 text-white",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onShare}
          title={labels.share}
          aria-label={labels.share}
          className="grid h-10 w-10 place-items-center rounded-xl text-current/62 transition hover:bg-white/10 hover:text-current"
        >
          <Share2 className="h-4 w-4" />
        </button>

        <div className="h-5 w-px bg-current/12" />

        <button
          type="button"
          onClick={onNew}
          title={labels.new}
          aria-label={labels.new}
          className="grid h-10 w-10 place-items-center rounded-xl text-current/72 transition hover:bg-white/10 hover:text-current"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}