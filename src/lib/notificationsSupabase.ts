"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { Locale } from "@/components/antique-ai/types";

type LocalizedText = Record<string, unknown>;

type NotificationRow = {
  id: string;
  title: LocalizedText | null;
  body: LocalizedText | null;
  link_url: string | null;
  kind: string | null;
  created_at: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  kind: string;
  createdAt: string;
  read: boolean;
};

type NotificationReadPayload = {
  user_id: string;
  notification_id: string;
  read_at: string;
};

function localizedText(value: LocalizedText | null, locale: Locale) {
  if (!value || typeof value !== "object") return "";

  const direct = value[locale];
  const fallback = value.ar || value.en || Object.values(value)[0];

  return typeof direct === "string"
    ? direct
    : typeof fallback === "string"
      ? fallback
      : "";
}

export async function fetchAppNotifications(locale: Locale) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("app_notifications")
    .select("id,title,body,link_url,kind,created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    console.warn("[KISHIB notifications] load skipped", error.message);
    return [];
  }

  const rows = Array.isArray(data) ? (data as NotificationRow[]) : [];
  const ids = rows.map((item) => item.id).filter(Boolean);
  const readIds = new Set<string>();

  if (ids.length > 0) {
    const { data: reads, error: readsError } = await supabase
      .from("app_notification_reads")
      .select("notification_id")
      .eq("user_id", user.id)
      .in("notification_id", ids);

    if (!readsError && Array.isArray(reads)) {
      reads.forEach((item) => {
        const notificationId = (item as { notification_id?: string })
          .notification_id;
        if (notificationId) readIds.add(notificationId);
      });
    }
  }

  return rows.map((row) => ({
    id: row.id,
    title: localizedText(row.title, locale),
    body: localizedText(row.body, locale),
    linkUrl: row.link_url,
    kind: row.kind || "info",
    createdAt: row.created_at,
    read: readIds.has(row.id),
  }));
}

export async function markNotificationRead(notificationId: string) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const payload: NotificationReadPayload = {
      user_id: user.id,
      notification_id: notificationId,
      read_at: new Date().toISOString(),
    };

  const { error } = await supabase.from("app_notification_reads").upsert(
    payload as never,
    {
      onConflict: "user_id,notification_id",
    },
  );

  if (error) {
    console.warn("[KISHIB notifications] mark read skipped", error.message);
  }
}

export async function markAllNotificationsRead(notificationIds: string[]) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || notificationIds.length === 0) return;

  const now = new Date().toISOString();
  const rows: NotificationReadPayload[] = notificationIds.map((notificationId) => ({
    user_id: user.id,
    notification_id: notificationId,
    read_at: now,
  }));

  const { error } = await supabase
    .from("app_notification_reads")
    .upsert(rows as never, { onConflict: "user_id,notification_id" });

  if (error) {
    console.warn("[KISHIB notifications] mark all read skipped", error.message);
  }
}
