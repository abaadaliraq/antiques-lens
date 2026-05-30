"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Archive, Plus, ScrollText, Trash2, X } from "lucide-react";
import type { AnalysisResult } from "./types";

const LOGO_SRC = "/brand/kishib-logo.png";

export type HistoryItem = {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  imagePreview: string | null;
  result: AnalysisResult;
};

type Labels = {
  brand: string;
  sub: string;
  new: string;
  archive: string;
  empty: string;
  clear: string;
  notice: string;
};

type Props = {
  open: boolean;
  history: HistoryItem[];
  labels: Labels;
  onOpen: () => void;
  onClose: () => void;
  onNewEvaluation: () => void;
  onOpenItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
};

export default function HistorySidebar({
  open,
  history,
  labels,
  onOpen,
  onClose,
  onNewEvaluation,
  onOpenItem,
  onClearHistory,
  onDeleteItem,
}: Props) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    function handleTouchStart(event: TouchEvent) {
      const touch = event.touches[0];
      if (!touch) return;

      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    }

    function handleTouchEnd(event: TouchEvent) {
      const touch = event.changedTouches[0];
      if (!touch) return;

      const startX = touchStartX.current;
      const startY = touchStartY.current;

      if (startX === null || startY === null) return;

      const diffX = touch.clientX - startX;
      const diffY = touch.clientY - startY;

      if (Math.abs(diffX) <= Math.abs(diffY)) return;

      const startedNearLeftEdge = startX < 36;
      const swipeRight = diffX > 70;
      const swipeLeft = diffX < -70;

      if (!open && startedNearLeftEdge && swipeRight) onOpen();
      if (open && swipeLeft) onClose();

      touchStartX.current = null;
      touchStartY.current = null;
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [open, onOpen, onClose]);

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open history"
        className={[
          "fixed left-4 top-28 z-50 hidden",
          "h-10 w-10 items-center justify-center rounded-full",
          "border border-[#7b2424]/55 bg-[#240808]/90",
          "text-[#d9b7a2]/80 shadow-[0_18px_55px_rgba(0,0,0,0.45)]",
          "backdrop-blur-xl transition-all duration-300",
          "hover:scale-105 hover:bg-[#340b0b] hover:text-[#f2d4bd]",
          "lg:flex",
        ].join(" ")}
      >
        <Archive className="h-4 w-4" />
      </button>

      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-dvh w-[292px] flex-col",
          "border-r border-[#6f1f1f]/45 bg-[#210707]/95",
          "px-4 py-4 text-[#f4ddca]",
          "shadow-[0_0_90px_rgba(0,0,0,0.62)] backdrop-blur-2xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 bg-[#210707]/40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-[#8b2b2b]/40" />

        <div className="relative mb-5 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
           <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
  <Image
    src={LOGO_SRC}
    alt="KISHIB"
    width={64}
    height={64}
    className="h-14 w-14 object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.42)]"
    priority
  />
</div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[0.12em] text-[#efd1bb]">
                {labels.brand || "KISHIB"}
              </p>
              <p className="truncate text-[11px] text-[#e9c8b0]/45">
                {labels.sub || "AI antique evaluator"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#8b2b2b]/40 bg-[#3a0c0c]/55 text-[#e9c8b0]/58 transition hover:bg-[#4b1111] hover:text-[#f4ddca] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onNewEvaluation}
          className="relative mb-5 flex h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-[#8b2b2b]/55 bg-[#3a0c0c]/72 text-sm font-medium text-[#f4ddca] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:bg-[#4a1010]"
        >
          <Plus className="h-4 w-4" />
          {labels.new}
        </button>

        <div className="relative mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-medium text-[#e9c8b0]/55">
            <ScrollText className="h-4 w-4 text-[#c07b68]/75" />
            {labels.archive}
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="text-[11px] text-[#e9c8b0]/34 transition hover:text-[#f0b7a0]"
            >
              {labels.clear}
            </button>
          )}
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {history.length === 0 ? (
            <p className="rounded-2xl border border-[#8b2b2b]/35 bg-[#2b0909]/64 px-3 py-4 text-xs leading-6 text-[#e9c8b0]/38">
              {labels.empty}
            </p>
          ) : (
            <div className="space-y-1.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 transition hover:bg-[#3a0c0c]/70"
                >
                  <button
                    type="button"
                    onClick={() => onOpenItem(item)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-start"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#8b2b2b]/42 bg-[#2a0909]/72">
                      {item.imagePreview ? (
                        <Image
                          src={item.imagePreview}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover opacity-90"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center">
                          <Image
                            src={LOGO_SRC}
                            alt=""
                            width={28}
                            height={28}
                            className="h-7 w-7 object-contain opacity-55"
                          />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[#f4ddca]/76 group-hover:text-[#f4ddca]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10.5px] text-[#e9c8b0]/34">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[#e9c8b0]/24 opacity-0 transition hover:bg-[#6f1f1f]/48 hover:text-[#ffd1c0] group-hover:opacity-100"
                    aria-label="Delete conversation"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative mt-4 border-t border-[#8b2b2b]/38 pt-3">
          <p className="text-[11px] leading-5 text-[#e9c8b0]/34">
            {labels.notice}
          </p>

          <div className="hidden">
            <Link href="/cookies" className="transition hover:text-[#efd1bb]">
              Cookies
            </Link>

            <span className="text-[#e9c8b0]/14">•</span>

            <Link href="/terms" className="transition hover:text-[#efd1bb]">
              Terms
            </Link>

            <span className="text-[#e9c8b0]/14">•</span>

            <Link href="/privacy" className="transition hover:text-[#efd1bb]">
              Privacy
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
