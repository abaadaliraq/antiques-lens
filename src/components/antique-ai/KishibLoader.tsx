"use client";

type KishibLoaderProps = {
  overlay?: boolean;
};

export default function KishibLoader({ overlay = false }: KishibLoaderProps) {
  return (
    <div
      className={[
        "grid place-items-center bg-[#efe3cf]",
        overlay
          ? "fixed inset-0 z-[9997] bg-[#efe3cf]/86 backdrop-blur-sm"
          : "min-h-dvh",
      ].join(" ")}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative grid h-20 w-20 place-items-center rounded-full border border-[#b88a3d]/35 bg-[#fff4e2]/70 shadow-[0_22px_70px_rgba(62,39,22,0.14)]">
          <span className="absolute inset-1 rounded-full border border-[#d2b98f]/60" />
          <span className="absolute inset-0 animate-ping rounded-full border border-[#b88a3d]/25" />
          <span className="grid h-12 w-12 animate-pulse place-items-center rounded-full bg-[#6d241d] text-[18px] font-bold tracking-[0.16em] text-[#fff4e2]">
            K
          </span>
        </div>

        <div className="text-center">
          <p className="text-[12px] font-bold tracking-[0.32em] text-[#6d241d]">
            KISHIB
          </p>
          <div className="mt-2 flex justify-center gap-1.5">
            {[0, 1, 2].map((item) => (
              <span
                key={item}
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b88a3d]"
                style={{ animationDelay: `${item * 160}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
