"use client";

import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import {
  NativeBiometric,
  type AvailableResult,
} from "@capgo/capacitor-native-biometric";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Locale } from "./types";

const BIOMETRIC_ENABLED_KEY = "kishibBiometricEnabled";
const BIOMETRIC_DISMISSED_KEY = "kishibBiometricPromptDismissedAt";

type UnlockState = "checking" | "unlocked" | "locked" | "unavailable";

type BiometricCopy = {
  enableTitle: string;
  enableDescription: string;
  enable: string;
  later: string;
  unlockTitle: string;
  tryAgain: string;
  useSignIn: string;
  disable: string;
  unavailable: string;
  promptTitle: string;
  promptReason: string;
  cancel: string;
};

const COPY: Record<"ar" | "en", BiometricCopy> = {
  ar: {
    enableTitle: "تفعيل الدخول بالبصمة",
    enableDescription: "افتح KISHIB بسرعة وأمان باستخدام بصمة جهازك.",
    enable: "تفعيل",
    later: "لاحقًا",
    unlockTitle: "افتح بالبصمة",
    tryAgain: "حاول مرة أخرى",
    useSignIn: "استخدم تسجيل الدخول",
    disable: "إيقاف الدخول بالبصمة",
    unavailable: "البصمة غير متاحة على هذا الجهاز",
    promptTitle: "افتح KISHIB بالبصمة",
    promptReason: "تأكيد هوية مالك الجهاز لفتح KISHIB",
    cancel: "إلغاء",
  },
  en: {
    enableTitle: "Enable biometric unlock",
    enableDescription:
      "Open KISHIB quickly and securely using your device biometrics.",
    enable: "Enable",
    later: "Later",
    unlockTitle: "Unlock with biometrics",
    tryAgain: "Try again",
    useSignIn: "Use sign in",
    disable: "Disable biometric unlock",
    unavailable: "Biometrics are not available on this device",
    promptTitle: "Unlock KISHIB with biometrics",
    promptReason: "Confirm device owner presence to open KISHIB",
    cancel: "Cancel",
  },
};

function isNativeBiometricPlatform() {
  return (
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  );
}

function readFlag(key: string) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key) === "true";
}

function writeFlag(key: string, enabled: boolean) {
  if (typeof window === "undefined") return;

  if (enabled) {
    window.localStorage.setItem(key, "true");
  } else {
    window.localStorage.removeItem(key);
  }
}

function hasDismissedPrompt() {
  if (typeof window === "undefined") return true;
  return Boolean(window.localStorage.getItem(BIOMETRIC_DISMISSED_KEY));
}

function markPromptDismissed() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BIOMETRIC_DISMISSED_KEY, new Date().toISOString());
}

function getBiometricCopy(locale: Locale): BiometricCopy {
  return locale === "ar" ? COPY.ar : COPY.en;
}

export function useBiometricUnlock(locale: Locale, hasSession: boolean) {
  const copy = useMemo(() => getBiometricCopy(locale), [locale]);
  const [availability, setAvailability] = useState<AvailableResult | null>(null);
  const [enabled, setEnabled] = useState(() => readFlag(BIOMETRIC_ENABLED_KEY));
  const [dismissed, setDismissed] = useState(() => hasDismissedPrompt());
  const [unlockState, setUnlockState] = useState<UnlockState>(() =>
    readFlag(BIOMETRIC_ENABLED_KEY) ? "checking" : "unlocked",
  );
  const [message, setMessage] = useState("");

  const isNative = isNativeBiometricPlatform();
  const available = Boolean(isNative && availability?.isAvailable);
  const shouldOfferEnable = Boolean(
    hasSession && available && !enabled && !dismissed,
  );
  const shouldLock = Boolean(hasSession && isNative && enabled);

  const verify = useCallback(async (lockOnFailure = true) => {
    if (!isNative) {
      setUnlockState("unlocked");
      return true;
    }

    try {
      await NativeBiometric.verifyIdentity({
        title: copy.promptTitle,
        reason: copy.promptReason,
        negativeButtonText: copy.cancel,
        maxAttempts: 3,
      });
      setMessage("");
      setUnlockState("unlocked");
      return true;
    } catch {
      setUnlockState(lockOnFailure ? "locked" : "unlocked");
      return false;
    }
  }, [copy.cancel, copy.promptReason, copy.promptTitle, isNative]);

  useEffect(() => {
    let mounted = true;

    async function loadAvailability() {
      if (!hasSession || !isNative) {
        setAvailability(null);
        setEnabled(false);
        setDismissed(true);
        setUnlockState("unlocked");
        return;
      }

      const savedEnabled = readFlag(BIOMETRIC_ENABLED_KEY);
      const savedDismissed = hasDismissedPrompt();

      setEnabled(savedEnabled);
      setDismissed(savedDismissed);
      setUnlockState(savedEnabled ? "checking" : "unlocked");

      try {
        const result = await NativeBiometric.isAvailable({
          useFallback: false,
        });

        if (!mounted) return;

        setAvailability(result);

        if (!result.isAvailable) {
          writeFlag(BIOMETRIC_ENABLED_KEY, false);
          setEnabled(false);
          setUnlockState("unavailable");
          return;
        }

        if (savedEnabled) {
          void verify();
        }
      } catch {
        if (!mounted) return;
        writeFlag(BIOMETRIC_ENABLED_KEY, false);
        setEnabled(false);
        setUnlockState("unavailable");
      }
    }

    void loadAvailability();

    return () => {
      mounted = false;
    };
  }, [hasSession, isNative, verify]);

  useEffect(() => {
    if (!hasSession || !isNative || !available || !enabled) return;

    const subscription = App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) return;
      setUnlockState("checking");
      void verify();
    });

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      setUnlockState("checking");
      void verify();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void subscription.then((listener) => listener.remove());
    };
  }, [available, enabled, hasSession, isNative, verify]);

  async function enableBiometric() {
    if (!available) {
      setMessage(copy.unavailable);
      return false;
    }

    const verified = await verify(false);
    if (!verified) return false;

    writeFlag(BIOMETRIC_ENABLED_KEY, true);
    window.localStorage.removeItem(BIOMETRIC_DISMISSED_KEY);
    setEnabled(true);
    setDismissed(false);
    setUnlockState("unlocked");
    setMessage("");
    return true;
  }

  function disableBiometric() {
    writeFlag(BIOMETRIC_ENABLED_KEY, false);
    setEnabled(false);
    setUnlockState("unlocked");
    setMessage("");
  }

  function dismissPrompt() {
    markPromptDismissed();
    setDismissed(true);
  }

  return {
    available,
    copy,
    enabled,
    isNative,
    message,
    setMessage,
    shouldLock,
    shouldOfferEnable,
    unlockState,
    disableBiometric,
    dismissPrompt,
    enableBiometric,
    retryUnlock: verify,
  };
}
