"use client";

type ThemeMode = "dark" | "light";

export default function GlassAtmosphere({ theme }: { theme: ThemeMode }) {
  const isLight = theme === "light";

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className={[
          "absolute inset-0 transition-colors duration-500",
          isLight
            ? "bg-[radial-gradient(circle_at_50%_0%,#ffffff_0%,#eef6ff_40%,#e7edf5_100%)]"
            : "bg-[radial-gradient(circle_at_50%_0%,#231938_0%,#07080e_46%,#020305_100%)]",
        ].join(" ")}
      />

      <div
        className={[
          "absolute left-1/2 top-[12%] h-[420px] w-[520px] -translate-x-1/2 rounded-full blur-[90px] transition-opacity duration-500",
          isLight ? "bg-cyan-300/35" : "bg-violet-600/28",
        ].join(" ")}
      />

      <div
        className={[
          "absolute bottom-[-120px] left-[-90px] h-[360px] w-[360px] rounded-full blur-[80px] transition-opacity duration-500",
          isLight ? "bg-blue-300/38" : "bg-cyan-500/24",
        ].join(" ")}
      />

      <div
        className={[
          "absolute bottom-[18%] right-[-120px] h-[320px] w-[320px] rounded-full blur-[85px] transition-opacity duration-500",
          isLight ? "bg-fuchsia-200/40" : "bg-fuchsia-600/16",
        ].join(" ")}
      />

      <div
        className={[
          "absolute inset-0 transition-opacity duration-500",
          isLight
            ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.35),rgba(255,255,255,0.08))]"
            : "bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.12))]",
        ].join(" ")}
      />
    </div>
  );
}