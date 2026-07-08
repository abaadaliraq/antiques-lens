"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const HEARTBEAT_INTERVAL_MS = 60_000;
const HEARTBEAT_TIMEOUT_MS = 15_000;

type UserActivityHeartbeatOptions = {
  enabled: boolean;
  currentPage: string;
  deviceLocale?: string | null;
};

function getPlatform() {
  try {
    return Capacitor.getPlatform() || "web";
  } catch {
    return "web";
  }
}

function getDeviceLocale(preferredLocale?: string | null) {
  if (preferredLocale) return preferredLocale;

  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }

  return null;
}

export function useUserActivityHeartbeat({
  enabled,
  currentPage,
  deviceLocale,
}: UserActivityHeartbeatOptions) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let inFlight = false;

    const supabase = getSupabaseBrowserClient();

    async function sendHeartbeat() {
      if (cancelled || inFlight) return;

      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }

      inFlight = true;

      const abortController = new AbortController();
      const timeout = window.setTimeout(() => {
        abortController.abort();
      }, HEARTBEAT_TIMEOUT_MS);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (
          cancelled ||
          sessionError ||
          !session?.access_token
        ) {
          return;
        }

        const response = await fetch("/api/user-activity", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPage,
            platform: getPlatform(),
            appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? null,
            deviceLocale: getDeviceLocale(deviceLocale),
          }),
          cache: "no-store",
          signal: abortController.signal,
        });

        if (!response.ok) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "[KISHIB heartbeat] Request failed:",
              response.status,
            );
          }

          return;
        }

        const data = (await response.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null;

        if (!data?.ok) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "[KISHIB heartbeat] Server did not confirm update.",
              data?.error,
            );
          }

          return;
        }

        if (process.env.NODE_ENV === "development") {
          console.info("[KISHIB heartbeat] Activity updated.");
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[KISHIB heartbeat] Request timed out.");
          }

          return;
        }

        if (process.env.NODE_ENV === "development") {
          console.warn("[KISHIB heartbeat] Request skipped.", error);
        }
      } finally {
        window.clearTimeout(timeout);
        inFlight = false;
      }
    }

    void sendHeartbeat();

    const interval = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void sendHeartbeat();
      }
    }

    function handleOnline() {
      void sendHeartbeat();
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.addEventListener("online", handleOnline);

    return () => {
      cancelled = true;

      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      window.removeEventListener("online", handleOnline);
    };
  }, [currentPage, deviceLocale, enabled]);
}