"use client";

type KishibLoaderProps = {
  visible?: boolean;
  label?: string;
};

export default function KishibLoader({
  visible = true,
  label = "loading ...",
}: KishibLoaderProps) {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <img
          src="/images/kishib-loader-logo.png"
          alt="KISHIB"
          width={118}
          height={236}
          draggable={false}
className="h-[86px] w-auto select-none object-contain kishib-loader-pulse"        />

        <span className="text-sm font-normal tracking-wide text-[#4c281d]">
          {label}
        </span>
      </div>

      <style jsx>{`
        .kishib-loader-pulse {
          animation: kishibPulse 1.8s ease-in-out infinite;
          transform-origin: center;
          will-change: transform, opacity;
        }

        @keyframes kishibPulse {
          0%,
          100% {
            transform: scale(0.96);
            opacity: 0.78;
          }

          50% {
            transform: scale(1.02);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .kishib-loader-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}