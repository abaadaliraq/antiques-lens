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
        type="button"
        onClick={onOpen}
        aria-label="Open history"
        className={[
          "fixed left-3 top-24 z-50",
          "flex h-10 w-10 items-center justify-center",
          "rounded-full border border-[#d6aa73]/20",
          "bg-[#1b100a]/75 text-[#e8c99c]/80 shadow-[0_16px_45px_rgba(0,0,0,0.42)]",
          "backdrop-blur-xl transition-all duration-300",
          "hover:scale-105 hover:bg-[#2a170e] hover:text-[#fff2d6]",
          "md:left-4 md:top-28",
        ].join(" ")}
      >
        <Archive className="h-4 w-4" />
      </button>

      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-dvh w-[292px] flex-col border-r border-[#d6aa73]/16 bg-[#0f0906]/88 px-4 py-4 text-[#fff2d6] shadow-[0_0_90px_rgba(0,0,0,0.58)] backdrop-blur-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(214,170,115,0.14),transparent_34%),radial-gradient(circle_at_90%_80%,rgba(115,58,33,0.18),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[#d6aa73]/35 to-transparent" />

        <div className="relative mb-5 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#d6aa73]/24 bg-[#2a170e]/78 shadow-[0_0_36px_rgba(214,170,115,0.18)]">
              <Image
                src={LOGO_SRC}
                alt="KISHIB"
                width={44}
                height={44}
                className="h-10 w-10 object-contain"
                priority
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[0.12em] text-[#f1d8ab]">
                {labels.brand || "KISHIB"}
              </p>
              <p className="truncate text-[11px] text-[#f8e7c9]/48">
                {labels.sub || "AI antique evaluator"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#d6aa73]/12 bg-[#f3dfbf]/[0.06] text-[#f8e7c9]/55 transition hover:bg-[#f3dfbf]/[0.1] hover:text-[#fff2d6] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={onNewEvaluation}
          className="relative mb-5 flex h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-[#d6aa73]/22 bg-[#d6aa73]/13 text-sm font-medium text-[#fff2d6] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-[#e8c99c]/34 hover:bg-[#d6aa73]/18"
        >
          <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#f1d8ab]/45 to-transparent" />
          <Plus className="h-4 w-4" />
          {labels.new}
        </button>

        <div className="relative mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-medium text-[#f8e7c9]/55">
            <ScrollText className="h-4 w-4 text-[#d6aa73]/75" />
            {labels.archive}
          </div>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[11px] text-[#f8e7c9]/34 transition hover:text-[#ffb4a0]"
            >
              {labels.clear}
            </button>
          )}
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {history.length === 0 ? (
            <p className="rounded-2xl border border-[#d6aa73]/10 bg-[#f3dfbf]/[0.035] px-3 py-4 text-xs leading-6 text-[#f8e7c9]/36">
              {labels.empty}
            </p>
          ) : (
            <div className="space-y-1.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 transition hover:bg-[#f3dfbf]/[0.07]"
                >
                  <button
                    onClick={() => onOpenItem(item)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-start"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#d6aa73]/16 bg-[#2a170e]/70">
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
                      <p className="truncate text-sm text-[#fff2d6]/76 group-hover:text-[#fff2d6]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10.5px] text-[#f8e7c9]/34">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[#f8e7c9]/24 opacity-0 transition hover:bg-red-500/12 hover:text-red-200 group-hover:opacity-100"
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

        <div className="relative mt-4 border-t border-[#d6aa73]/12 pt-3">
          <p className="text-[11px] leading-5 text-[#f8e7c9]/35">
            {labels.notice}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#f8e7c9]/30">
            <Link href="/cookies" className="transition hover:text-[#f1d8ab]">
              Cookies
            </Link>

            <span className="text-[#f8e7c9]/15">•</span>

            <Link href="/terms" className="transition hover:text-[#f1d8ab]">
              Terms
            </Link>

            <span className="text-[#f8e7c9]/15">•</span>

            <Link href="/privacy" className="transition hover:text-[#f1d8ab]">
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