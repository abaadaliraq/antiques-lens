"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const HEARTBEAT_INTERVAL_MS = 60_000;

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
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

      inFlight = true;

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (cancelled || sessionError || !session?.access_token) return;

        const response = await fetch("/api/user-activity", {
          method: "POST",
          headers: {
            authorization: `Bearer ${session.access_token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            currentPage,
            platform: getPlatform(),
            appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? null,
            deviceLocale: getDeviceLocale(deviceLocale),
          }),
        });

        if (!response.ok) {
          if (process.env.NODE_ENV === "development") {
            console.error("KISHIB activity heartbeat failed", response.status);
          }
          return;
        }

        const data = (await response.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null;

        if (!data?.ok) return;

        if (process.env.NODE_ENV === "development") {
          console.log("KISHIB activity heartbeat updated");
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("KISHIB activity heartbeat failed", error);
        }
      } finally {
        inFlight = false;
      }
    }

    void sendHeartbeat();
    const interval = window.setInterval(() => void sendHeartbeat(), HEARTBEAT_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void sendHeartbeat();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentPage, deviceLocale, enabled]);
}
