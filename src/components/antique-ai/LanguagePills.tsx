"use client";

export type Locale = "ar" | "en" | "ku" | "fr";
type ThemeMode = "dark" | "light";

type Props = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme?: ThemeMode;
};

const languages: { code: Locale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "ku", label: "KU" },
  { code: "en", label: "EN" },
  { code: "ar", label: "AR" },
];

export default function LanguagePills({
  locale,
  setLocale,
  theme = "dark",
}: Props) {
  const isLight = theme === "light";

  return (
    <div
      className={[
        "flex items-center gap-1 rounded-full border p-1 backdrop-blur-2xl transition",
        isLight
          ? "border-black/10 bg-white/45 shadow-[0_18px_55px_rgba(30,80,130,0.14)]"
          : "border-white/10 bg-white/[0.075] shadow-[0_18px_55px_rgba(0,0,0,0.28)]",
      ].join(" ")}
    >
      {languages.map((item) => {
        const active = locale === item.code;

        return (
          <button
            key={item.code}
            type="button"
            onClick={() => setLocale(item.code)}
            className={[
              "h-9 min-w-10 rounded-full px-3 text-[11px] font-medium tracking-[0.04em] transition",
              active
                ? isLight
                  ? "bg-black text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
                  : "bg-white text-black shadow-[0_12px_28px_rgba(255,255,255,0.14)]"
                : isLight
                  ? "text-black/42 hover:bg-black/[0.05] hover:text-black"
                  : "text-white/38 hover:bg-white/[0.07] hover:text-white",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}