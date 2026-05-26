"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { Archive, Gem, Plus, Trash2, X } from "lucide-react";
import type { AnalysisResult } from "./types";

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

      const endX = touch.clientX;
      const endY = touch.clientY;

      const diffX = endX - startX;
      const diffY = endY - startY;

      const isHorizontalSwipe = Math.abs(diffX) > Math.abs(diffY);
      if (!isHorizontalSwipe) return;

      const startedNearLeftEdge = startX < 36;
      const swipeRight = diffX > 70;
      const swipeLeft = diffX < -70;

      if (!open && startedNearLeftEdge && swipeRight) {
        onOpen();
      }

      if (open && swipeLeft) {
        onClose();
      }

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
        onClick={onOpen}
        aria-label={labels.archive}
        className={`fixed left-3 top-1/2 z-30 grid h-11 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/10 text-white/70 shadow-[0_0_30px_rgba(0,0,0,0.25)] backdrop-blur-xl transition lg:hidden ${
          open ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <span className="h-8 w-1 rounded-full bg-white/45" />
      </button>

      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/45 backdrop-blur-sm transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-dvh w-[286px] flex-col border-r border-white/12 bg-[#070812]/66 px-4 py-4 text-white shadow-[0_0_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/18 bg-white/10 shadow-[0_0_28px_rgba(132,91,255,0.35)]">
              <Gem className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {labels.brand}
              </p>
              <p className="truncate text-[11px] text-white/50">
                {labels.sub}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/8 text-white/60 transition hover:bg-white/14 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={onNewEvaluation}
          className="mb-5 flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/12 text-sm font-medium text-white/90 transition hover:bg-white/18"
        >
          <Plus className="h-4 w-4" />
          {labels.new}
        </button>

        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-medium text-white/55">
            <Archive className="h-4 w-4" />
            {labels.archive}
          </div>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[11px] text-white/38 transition hover:text-red-200"
            >
              {labels.clear}
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {history.length === 0 ? (
            <p className="px-2 py-4 text-xs leading-6 text-white/35">
              {labels.empty}
            </p>
          ) : (
            <div className="space-y-1.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 transition hover:bg-white/10"
                >
                  <button
                    onClick={() => onOpenItem(item)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-start"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/8">
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
                          <Gem className="h-4 w-4 text-white/45" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white/78 group-hover:text-white">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10.5px] text-white/35">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white/28 opacity-0 transition hover:bg-red-500/12 hover:text-red-200 group-hover:opacity-100"
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

        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-[11px] leading-5 text-white/35">
            {labels.notice}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/32">
            <Link href="/cookies" className="transition hover:text-white/70">
              Cookies
            </Link>

            <span className="text-white/18">•</span>

            <Link href="/terms" className="transition hover:text-white/70">
              Terms
            </Link>

            <span className="text-white/18">•</span>

            <Link href="/privacy" className="transition hover:text-white/70">
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