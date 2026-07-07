"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

type KishibLoaderProps = {
  visible?: boolean;
  label?: string;
};

export default function KishibLoader({
  visible = true,
  label = "loading...",
}: KishibLoaderProps) {
  const [logoSrc, setLogoSrc] = useState("/images/kishib-loader-logo.png");
  const [logoFailed, setLogoFailed] = useState(false);

  if (!visible) return null;

  function handleLogoError() {
    if (logoSrc !== "/brand/kishib-logo.png") {
      setLogoSrc("/brand/kishib-logo.png");
      return;
    }

    setLogoFailed(true);
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center px-4 py-[calc(1rem+env(safe-area-inset-top))]"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {logoFailed ? (
          <span className="kishib-loader-pulse text-[15px] font-black tracking-[0.32em] text-[#6d2e1d] drop-shadow-sm">
            KISHIB
          </span>
        ) : (
          <img
            src={logoSrc}
            alt="KISHIB"
            width={96}
            height={96}
            draggable={false}
            onError={handleLogoError}
            className="kishib-loader-pulse h-[64px] w-[64px] select-none object-contain drop-shadow-[0_8px_18px_rgba(36,25,19,0.18)] sm:h-[76px] sm:w-[76px]"
          />
        )}

        <span className="text-[13px] font-semibold tracking-wide text-[#4c281d] drop-shadow-sm">
          {label}
        </span>
      </div>

      <style jsx>{`
        .kishib-loader-pulse {
          animation: kishibPulse 1.9s ease-in-out infinite;
          transform-origin: center;
          will-change: transform, opacity;
        }

        @keyframes kishibPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.82;
          }

          50% {
            transform: scale(1.06);
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
