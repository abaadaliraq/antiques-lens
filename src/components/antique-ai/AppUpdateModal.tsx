"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { ArrowUpRight, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AppVersionResponse = {
  latestVersionCode: number;
  minimumRequiredVersionCode: number;
  playStoreUrl: string;
};

type UpdateState = {
  required: boolean;
  latestVersionCode: number;
  minimumRequiredVersionCode: number;
  playStoreUrl: string;
};

const FALLBACK_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.kishib.app";

function parseBuildNumber(build: string | undefined) {
  if (!build) return null;

  const versionCode = Number.parseInt(build, 10);
  return Number.isFinite(versionCode) ? versionCode : null;
}

function isValidVersionResponse(value: unknown): value is AppVersionResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<AppVersionResponse>;
  return (
    typeof candidate.latestVersionCode === "number" &&
    typeof candidate.minimumRequiredVersionCode === "number" &&
    typeof candidate.playStoreUrl === "string"
  );
}

export default function AppUpdateModal() {
  const [updateState, setUpdateState] = useState<UpdateState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkForUpdate() {
      if (Capacitor.getPlatform() !== "android") return;

      try {
        const [appInfo, response] = await Promise.all([
          App.getInfo(),
          fetch("/api/app-version", { cache: "no-store" }),
        ]);
        const currentVersionCode = parseBuildNumber(appInfo.build);

        if (!response.ok || currentVersionCode === null) return;

        const versionConfig: unknown = await response.json();
        if (!isValidVersionResponse(versionConfig)) return;

        const needsRequiredUpdate =
          currentVersionCode < versionConfig.minimumRequiredVersionCode;
        const needsOptionalUpdate =
          currentVersionCode < versionConfig.latestVersionCode;

        if (!cancelled && (needsRequiredUpdate || needsOptionalUpdate)) {
          setUpdateState({
            required: needsRequiredUpdate,
            latestVersionCode: versionConfig.latestVersionCode,
            minimumRequiredVersionCode: versionConfig.minimumRequiredVersionCode,
            playStoreUrl: versionConfig.playStoreUrl || FALLBACK_PLAY_STORE_URL,
          });
        }
      } catch (error) {
        console.warn("App update check failed:", error);
      }
    }

    void checkForUpdate();

    return () => {
      cancelled = true;
    };
  }, []);

  const copy = useMemo(() => {
    if (!updateState) return null;

    return updateState.required
      ? {
          title: "Update required",
          text:
            "A newer version of KISHIB is required to continue. Please update from Google Play.",
          badge: "Required",
        }
      : {
          title: "Update available",
          text:
            "A newer version of KISHIB is available with the latest improvements.",
          badge: "Optional",
        };
  }, [updateState]);

  if (!updateState || dismissed || !copy) return null;

  function openStore() {
    window.open(
      updateState?.playStoreUrl || FALLBACK_PLAY_STORE_URL,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100000] grid place-items-center bg-[#241913]/50 px-4 py-6 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-update-title"
    >
      <div className="w-full max-w-[390px] rounded-[20px] border border-[#d2b98f] bg-[#fff4e2] p-4 text-[#241913] shadow-[0_26px_80px_rgba(36,25,19,0.24)]">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[#efe3cf] text-[#986f2e]">
            <RefreshCw className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#986f2e]">
                  {copy.badge}
                </p>
                <h2
                  id="app-update-title"
                  className="text-[18px] font-black leading-6 text-[#241913]"
                >
                  {copy.title}
                </h2>
              </div>

              {!updateState.required ? (
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  aria-label="Close"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d2b98f] bg-[#fffaf0] text-[#735f4b] transition hover:bg-[#efe3cf]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <p className="mt-2 text-[12.5px] leading-5 text-[#735f4b]">
              {copy.text}
            </p>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-[#986f2e]">
              Latest version code: {updateState.latestVersionCode}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={openStore}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#6d241d] px-4 text-[13px] font-bold text-[#fff4e2] transition hover:bg-[#7d2d23]"
          >
            Update now
            <ArrowUpRight className="h-4 w-4" />
          </button>

          {!updateState.required ? (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="h-10 w-full rounded-[14px] border border-[#d2b98f] bg-[#fffaf0] px-4 text-[13px] font-bold text-[#735f4b] transition hover:bg-[#efe3cf]"
            >
              Later
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
