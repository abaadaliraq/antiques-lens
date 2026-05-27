"use client";

import { Plus, Share2, Sparkles } from "lucide-react";

type ThemeMode = "dark" | "light";

type Props = {
  theme: ThemeMode;
  labels: {
    new: string;
    share: string;
    addInfo: string;
  };
  hasResult: boolean;
  onNew: () => void;
  onShare: () => void;
  onAddInfo: () => void;
};

export default function BottomBar({
  theme,
  labels,
  hasResult,
  onNew,
  onShare,
  onAddInfo,
}: Props) {
  const isLight = theme === "light";

  const itemClass = [
    "grid h-11 w-11 place-items-center rounded-full transition active:scale-95",
    isLight
      ? "text-black/58 hover:bg-white/65 hover:text-black"
      : "text-white/58 hover:bg-white/[0.10] hover:text-white",
  ].join(" ");

  return (
    <nav className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 lg:pl-[280px]">
      <div
        className={[
          "flex h-14 items-center gap-2 rounded-full border px-2 backdrop-blur-2xl transition",
          isLight
            ? "border-white/70 bg-white/42 shadow-[0_24px_70px_rgba(60,110,160,0.16)]"
            : "border-white/10 bg-white/[0.075] shadow-[0_24px_70px_rgba(0,0,0,0.34)]",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onNew}
          className={itemClass}
          aria-label={labels.new}
          title={labels.new}
        >
          <Plus className="h-[18px] w-[18px]" />
        </button>

        <button
          type="button"
          onClick={onShare}
          disabled={!hasResult}
          className={[
            itemClass,
            "disabled:cursor-not-allowed disabled:opacity-25",
          ].join(" ")}
          aria-label={labels.share}
          title={labels.share}
        >
          <Share2 className="h-[17px] w-[17px]" />
        </button>

        <div
          className={[
            "mx-0.5 h-7 w-px",
            isLight ? "bg-black/10" : "bg-white/10",
          ].join(" ")}
        />

       
      </div>
    </nav>
  );
}