"use client";

export type Locale = "ar" | "en" | "ku" | "fr";

type Props = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const languages: { code: Locale; label: string }[] = [
  { code: "ar", label: "AR" },
  { code: "en", label: "EN" },
  { code: "ku", label: "KU" },
  { code: "fr", label: "FR" },
];

export default function LanguagePills({ locale, setLocale }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-white/[0.055] p-1 backdrop-blur-2xl">
      {languages.map((item) => {
        const active = locale === item.code;

        return (
          <button
            key={item.code}
            type="button"
            onClick={() => setLocale(item.code)}
            className={[
              "h-8 min-w-9 rounded-full px-3 text-[11px] font-medium tracking-[0.04em] transition",
              active
                ? "bg-white text-black shadow-[0_8px_22px_rgba(255,255,255,0.13)]"
                : "text-white/38 hover:bg-white/[0.05] hover:text-white/75",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}