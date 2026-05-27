"use client";

import { Moon, Sun } from "lucide-react";

type ThemeMode = "dark" | "light";

type Props = {
  theme: ThemeMode;
  onToggle: () => void;
};

export default function ThemeToggle({ theme, onToggle }: Props) {
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "grid h-10 w-10 place-items-center rounded-full border backdrop-blur-2xl transition",
        isLight
          ? "border-black/10 bg-white/55 text-black shadow-[0_18px_55px_rgba(30,80,130,0.16)] hover:bg-white/75"
          : "border-white/10 bg-white/[0.075] text-white shadow-[0_18px_55px_rgba(0,0,0,0.28)] hover:bg-white/[0.12]",
      ].join(" ")}
      aria-label="Toggle theme"
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}