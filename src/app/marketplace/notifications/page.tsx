"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MarketShell from "@/components/marketplace/MarketShell";
import {
  getMarketplaceNotifications,
  markMarketplaceNotificationRead,
} from "@/lib/marketplaceSupabase";
import { marketplaceCopy, useMarketplaceLocale } from "@/lib/marketplaceI18n";
import type { MarketplaceNotification } from "@/types/marketplace";

export default function MarketplaceNotificationsPage() {
  const locale = useMarketplaceLocale();
  const t = marketplaceCopy(locale);
  const router = useRouter();
  const [notifications, setNotifications] = useState<MarketplaceNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function loadNotifications() {
    setError("");
    setIsLoading(true);

    try {
      setNotifications(await getMarketplaceNotifications());
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Unable to load notifications.";

      if (message.includes("تسجيل الدخول") || message.includes("login")) {
        router.push("/");
        return;
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function markRead(notificationId: string) {
    setBusyId(notificationId);

    try {
      await markMarketplaceNotificationRead(notificationId);
      await loadNotifications();
    } finally {
      setBusyId("");
    }
  }

  return (
    <MarketShell title={t.notificationTitle} subtitle={t.notificationSubtitle}>
      {isLoading ? (
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
          {t.loadingMarket}
        </div>
      ) : error ? (
        <div className="rounded-[8px] border border-[#8e3c32]/50 bg-[#7a2f25]/38 p-6 text-sm text-[#ffd7cf]">
          {error}
        </div>
      ) : (
        <section className="space-y-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-4 text-sm text-[#f8ead6]"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-semibold">{notification.title}</h2>
                <span className="text-xs text-[#dcc18a]">
                  {new Date(notification.createdAt).toLocaleString("ar-IQ")}
                </span>
              </div>
              <p className="mt-2 leading-7 text-[#dcc18a]">{notification.message}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#fff4e2]/10 px-3 py-1 text-xs">
                  {notification.type}
                </span>
                <span className="text-xs text-[#dcc18a]">
                  {notification.readAt ? t.read : t.unread}
                </span>
                {!notification.readAt ? (
                  <button
                    onClick={() => void markRead(notification.id)}
                    disabled={busyId === notification.id}
                    className="rounded-[8px] bg-[#b88a3d] px-3 py-2 text-xs font-semibold text-[#fff4e2] disabled:opacity-50"
                  >
                    {t.markRead}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
          {notifications.length === 0 ? (
            <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
              {t.noNotifications}
            </div>
          ) : null}
        </section>
      )}
    </MarketShell>
  );
}
