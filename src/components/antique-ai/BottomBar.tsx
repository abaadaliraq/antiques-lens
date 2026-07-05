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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#C79A45]/35 bg-[#F3E7D2] px-3 pt-2 shadow-[0_-12px_36px_rgba(35,12,8,0.2)] [padding-bottom:max(0.6rem,env(safe-area-inset-bottom))]">
      <div
        className="mx-auto flex h-14 w-full max-w-md items-center justify-between gap-2"
      >
        <button
          type="button"
          onClick={onNew}
          title={labels.new}
          aria-label={labels.new}
          className="flex min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[#3B1712] transition hover:bg-[#C79A45]/12 active:scale-[0.98]"
        >
          <Plus className="h-[18px] w-[18px] text-[#9A3D2A]" />
          <span className="text-[11px] font-semibold leading-tight text-[#3B1712]">{labels.new}</span>
        </button>

        <button
          type="button"
          onClick={onShare}
          title={labels.share}
          aria-label={labels.share}
          className="flex min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[#3B1712] transition hover:bg-[#C79A45]/12 active:scale-[0.98]"
        >
          <Share2 className="h-[18px] w-[18px] text-[#9A3D2A]" />
          <span className="text-[11px] font-semibold leading-tight text-[#3B1712]">{labels.share}</span>
        </button>

        {onAddInfo && (
          <button
            type="button"
            onClick={onAddInfo}
            title={labels.addInfo}
            aria-label={labels.addInfo}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#9A3D2A] px-4 text-[12px] font-semibold text-[#FFF8EB] shadow-[0_7px_20px_rgba(59,23,18,0.24)] transition hover:bg-[#873422] active:scale-[0.98]"
          >
            <Pencil className="h-4 w-4" />
            <span>{labels.addInfo}</span>
          </button>
        )}
      </div>
    </nav>
  );
}
