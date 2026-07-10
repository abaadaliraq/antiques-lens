"use client";

import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type PermissionStatus,
  type PushNotificationSchema,
  type Token,
} from "@capacitor/push-notifications";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const CHANNEL_ID = "kishib_general";
const SAFE_ROUTES = /^\/(?:archive|notifications|subscription|result\/[A-Za-z0-9_-]+)\/?$/;
let listenersReady = false;
let currentLocale = "en";

export type PushPermissionState = PermissionStatus["receive"] | "unsupported";

function safeRoute(data?: Record<string, unknown>) {
  const candidate = data?.route ?? data?.link;
  if (typeof candidate !== "string") return "/";
  const path = candidate.startsWith("/") ? candidate : "";
  return SAFE_ROUTES.test(path) ? path : "/";
}

function openRoute(data?: Record<string, unknown>) {
  window.location.assign(safeRoute(data));
}

async function saveToken(token: Token) {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.rpc("claim_push_token", {
    p_token: token.value,
    p_platform: "android",
    p_locale: currentLocale,
    p_country: null,
    p_app_version: process.env.NEXT_PUBLIC_APP_VERSION || null,
  } as never);
  if (error) console.error("[PUSH][FAILED] token save", error.message);
}

function showForegroundBanner(notification: PushNotificationSchema) {
  window.dispatchEvent(new CustomEvent("kishib:push-received", {
    detail: {
      title: notification.title || "KISHIB",
      body: notification.body || "",
      data: notification.data || {},
    },
  }));
  document.getElementById("kishib-push-banner")?.remove();
  const banner = document.createElement("button");
  banner.id = "kishib-push-banner";
  banner.type = "button";
  banner.dir = "auto";
  banner.style.cssText = "position:fixed;z-index:2147483647;top:16px;left:16px;right:16px;max-width:420px;margin:auto;padding:14px 16px;border:1px solid #d2b98f;border-radius:16px;background:#fff4e2;color:#241913;box-shadow:0 12px 36px #24191340;text-align:start;font:500 14px system-ui";
  banner.textContent = `${notification.title || "KISHIB"}${notification.body ? ` — ${notification.body}` : ""}`;
  banner.onclick = () => { banner.remove(); openRoute(notification.data); };
  document.body.appendChild(banner);
  window.setTimeout(() => banner.remove(), 6000);
}

async function attachListeners() {
  if (listenersReady) return;
  listenersReady = true;
  await PushNotifications.addListener("registration", (token) => {
    console.log("[PUSH][TOKEN_RECEIVED]", token.value);
    void saveToken(token);
  });
  await PushNotifications.addListener("registrationError", (error) => {
    console.error("[PUSH][FAILED] registration error", error);
  });
  await PushNotifications.addListener("pushNotificationReceived", (notification) => {
    showForegroundBanner(notification);
  });
  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    openRoute(action.notification.data);
  });
}

async function createAndroidChannel() {
  await PushNotifications.createChannel({
    id: CHANNEL_ID,
    name: "KISHIB Notifications",
    description: "Updates, evaluations and important KISHIB announcements",
    importance: 5,
    visibility: 1,
    sound: "default",
    vibration: true,
  });
}

export async function getPushPermission(): Promise<PushPermissionState> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return "unsupported";
  }
  return (await PushNotifications.checkPermissions()).receive;
}

export async function enablePushNotifications(locale: string, request = true) {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return "unsupported";

  try {
    currentLocale = locale;
    console.log("[PUSH][BOOT]", { locale, request });
    await attachListeners();
    await createAndroidChannel();

    let status = await PushNotifications.checkPermissions();
    console.log("[PUSH][PERMISSION_BEFORE]", status.receive);
    if (status.receive === "prompt" && request) {
      status = await PushNotifications.requestPermissions();
      console.log("[PUSH][PERMISSION_REQUESTED]", status.receive);
    }
    console.log("[PUSH][PERMISSION_AFTER]", status.receive);
    if (status.receive !== "granted") return status.receive;
    console.log("[PUSH][REGISTER_CALLED]");
    await PushNotifications.register();
    return status.receive;
  } catch (error) {
    console.error("[PUSH][FAILED]", error);
    return "denied";
  }
}

export async function initializePushNotifications(locale: string) {
  return enablePushNotifications(locale, true);
}

export async function deactivateCurrentPushTokens() {
  if (!Capacitor.isNativePlatform()) return;
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("push_tokens")
    .update({ active: false, updated_at: new Date().toISOString() } as never)
    .eq("user_id", user.id)
    .eq("platform", "android");
}

export async function openPushSettings() {
  if (!Capacitor.isNativePlatform()) return;
  window.location.href = "app-settings:";
}
