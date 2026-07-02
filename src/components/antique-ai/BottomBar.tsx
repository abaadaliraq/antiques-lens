"use client";

import { Pencil, Plus, Share2 } from "lucide-react";

type BottomBarLabels = {
  new: string;
  share: string;
  addInfo: string;
};

type BottomBarProps = {
  labels: BottomBarLabels;
  hasResult: boolean;
  onNew: () => void;
  onShare: () => void;
  onAddInfo?: () => void;
};

export default function BottomBar({
  labels,
  hasResult,
  onNew,
  onShare,
  onAddInfo,
}: BottomBarProps) {
  if (!hasResult) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#d6b576]/25 bg-[#230c08]/95 px-3 pt-2 shadow-[0_-12px_36px_rgba(35,12,8,0.22)] backdrop-blur-xl [padding-bottom:max(0.6rem,env(safe-area-inset-bottom))]">
      <div
        className="mx-auto flex h-14 w-full max-w-md items-center justify-between gap-2"
      >
        <button
          type="button"
          onClick={onNew}
          title={labels.new}
          aria-label={labels.new}
          className="flex min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-white transition hover:bg-white/10"
        >
          <Plus className="h-[18px] w-[18px] text-white" />
          <span className="text-[11px] font-semibold leading-tight text-white">{labels.new}</span>
        </button>

        <button
          type="button"
          onClick={onShare}
          title={labels.share}
          aria-label={labels.share}
          className="flex min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-white transition hover:bg-white/10"
        >
          <Share2 className="h-[18px] w-[18px] text-white" />
          <span className="text-[11px] font-semibold leading-tight text-white">{labels.share}</span>
        </button>

        {onAddInfo && (
          <button
            type="button"
            onClick={onAddInfo}
            title={labels.addInfo}
            aria-label={labels.addInfo}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#e5c47f]/50 bg-[#b88a3d] px-4 text-[12px] font-semibold text-[#fff9ed] shadow-[0_7px_20px_rgba(184,138,61,0.24)] transition hover:bg-[#c69a4b] active:scale-[0.98]"
          >
            <Pencil className="h-4 w-4" />
            <span>{labels.addInfo}</span>
          </button>
        )}
      </div>
    </nav>
  );
}
