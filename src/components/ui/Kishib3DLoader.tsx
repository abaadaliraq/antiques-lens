"use client";

import dynamic from "next/dynamic";

const Kishib3DScene = dynamic(() => import("./Kishib3DScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

type Kishib3DLoaderProps = {
  overlay?: boolean;
  compact?: boolean;
  label?: string;
};

export default function Kishib3DLoader({
  overlay = false,
  compact = false,
  label = "نكشف الأثر",
}: Kishib3DLoaderProps) {
  return (
    <div
      className={
        overlay
          ? "fixed inset-0 z-[9997] grid place-items-center bg-[rgba(20,10,7,0.06)] backdrop-blur-[1.5px]"
          : compact
            ? "flex w-full flex-col items-center justify-center py-2"
            : "fixed inset-0 z-[9997] grid place-items-center bg-[rgba(20,10,7,0.05)] backdrop-blur-[1.5px]"
      }
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={compact ? "h-24 w-24 sm:h-28 sm:w-28" : "h-36 w-36 sm:h-44 sm:w-44"}
          aria-hidden="true"
        >
          <Kishib3DScene />
        </div>
        <p className="kishib-3d-loader-caption text-[12px] font-medium tracking-[0.1em] text-[#6D241D]">
          {label}
          <span className="kishib-3d-loader-dots" aria-hidden="true">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </p>
      </div>

      <style jsx>{`
        .kishib-3d-loader-caption { animation: caption-breathe 2.4s ease-in-out infinite; }
        .kishib-3d-loader-dots span { animation: dot-breathe 1.4s ease-in-out infinite; opacity: .3; }
        .kishib-3d-loader-dots span:nth-child(2) { animation-delay: .18s; }
        .kishib-3d-loader-dots span:nth-child(3) { animation-delay: .36s; }
        @keyframes caption-breathe { 0%, 100% { opacity: .72; } 50% { opacity: 1; } }
        @keyframes dot-breathe { 0%, 60%, 100% { opacity: .25; } 30% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .kishib-3d-loader-caption, .kishib-3d-loader-dots span { animation: none; }
        }
      `}</style>
    </div>
  );
}
