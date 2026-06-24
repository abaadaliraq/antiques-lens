"use client";

import { Home, Plus } from "lucide-react";

type BottomBarLabels = {
  new: string;
};

type BottomBarProps = {
  theme: "dark" | "light";
  labels: BottomBarLabels;
  hasResult: boolean;
  onNew: () => void;
};

export default function BottomBar({
  theme,
  labels,
  hasResult,
  onNew,
}: BottomBarProps) {
  if (!hasResult) return null;

  const isLight = theme === "light";

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 px-4">
      <div
        className={[
          "mx-auto flex h-14 w-fit items-center gap-1 rounded-full border px-2 shadow-[0_18px_50px_rgba(55,35,20,0.16)] backdrop-blur-2xl",
          isLight
            ? "border-[#d2b98f] bg-[#fff4e2]/90 text-[#241913]"
            : "border-[rgba(34,211,238,0.18)] bg-[#020617]/88 text-[#E2E8F0]",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onNew}
          title={labels.new}
          aria-label={labels.new}
          className="grid h-10 w-10 place-items-center rounded-[12px] text-[#735f4b] transition hover:bg-[#d9b59e]/55 hover:text-[#241913]"
        >
          <Home className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onNew}
          title={labels.new}
          aria-label={labels.new}
          className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#b88a3d] text-[#fff4e2] transition hover:bg-[#986f2e]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
