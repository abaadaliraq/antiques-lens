"use client";

import {
  fetchAppNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/notificationsSupabase";
import { isRtlLocale } from "@/i18n/common";
import { Bell, CheckCheck, ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "./types";

type Props = {
  locale: Locale;
  compact?: boolean;
};

function copy(locale: Locale) {
  const text = {
    ar: { title: "الإشعارات", empty: "لا توجد إشعارات حالياً.", markAll: "تحديد الكل كمقروء", open: "فتح", loading: "جاري التحميل...", aria: "الإشعارات" },
    en: { title: "Notifications", empty: "No notifications right now.", markAll: "Mark all as read", open: "Open", loading: "Loading...", aria: "Notifications" },
    fr: { title: "Notifications", empty: "Aucune notification pour le moment.", markAll: "Tout marquer comme lu", open: "Ouvrir", loading: "Chargement...", aria: "Notifications" },
    hi: { title: "सूचनाएँ", empty: "अभी कोई सूचना नहीं है.", markAll: "सबको पढ़ा हुआ करें", open: "खोलें", loading: "लोड हो रहा है...", aria: "सूचनाएँ" },
    fa: { title: "اعلان‌ها", empty: "فعلاً اعلانی وجود ندارد.", markAll: "همه را خوانده‌شده کن", open: "باز کردن", loading: "در حال بارگذاری...", aria: "اعلان‌ها" },
    tr: { title: "Bildirimler", empty: "Şu anda bildirim yok.", markAll: "Tümünü okundu yap", open: "Aç", loading: "Yükleniyor...", aria: "Bildirimler" },
    ru: { title: "Уведомления", empty: "Пока нет уведомлений.", markAll: "Отметить все как прочитанные", open: "Открыть", loading: "Загрузка...", aria: "Уведомления" },
    ku: { title: "ئاگادارییەکان", empty: "لە ئێستادا ئاگاداری نییە.", markAll: "هەموویان وەک خوێندراو دیاری بکە", open: "کردنەوە", loading: "بارکردن...", aria: "ئاگادارییەکان" },
    es: { title: "Notificaciones", empty: "No hay notificaciones por ahora.", markAll: "Marcar todo como leído", open: "Abrir", loading: "Cargando...", aria: "Notificaciones" },
  } satisfies Record<Locale, Record<string, string>>;

  return text[locale] || text.en;
}
function formatDate(value: string, locale: Locale) {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-IQ" : locale, {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function NotificationsButton({ locale, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const text = copy(locale);
  const rtl = isRtlLocale(locale);
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchAppNotifications(locale);
      setNotifications(items);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void loadNotifications(), 0);
    const timer = window.setInterval(() => void loadNotifications(), 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [loadNotifications]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (!open) return;
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  async function handleOpenNotification(item: AppNotification) {
    if (!item.read) {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === item.id
            ? { ...notification, read: true }
            : notification,
        ),
      );
      await markNotificationRead(item.id);
    }

    if (item.linkUrl) {
      window.open(item.linkUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function handleMarkAllRead() {
    const unreadIds = notifications
      .filter((item) => !item.read)
      .map((item) => item.id);

    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
    await markAllNotificationsRead(unreadIds);
  }

  return (
    <div ref={containerRef} className="relative" dir={rtl ? "rtl" : "ltr"}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={text.aria}
        className={[
          "relative grid shrink-0 place-items-center rounded-full border border-[#d2b98f]/35 bg-[#fff4e2]/90 text-[#233f32] shadow-[0_10px_24px_rgba(62,39,22,0.12)] backdrop-blur-xl transition hover:border-[#b88a3d]/70 hover:bg-[#fff8ec]",
          compact ? "h-8 w-8" : "h-10 w-10",
        ].join(" ")}
      >
        <Bell className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} />
        {unreadCount > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#fff4e2] bg-red-600 shadow-[0_3px_10px_rgba(220,38,38,0.55)]"
            aria-label={`${unreadCount} unread`}
          />
        ) : null}
      </button>

      {open ? (
        <div
          className={[
            "fixed left-3 right-3 top-20 z-[9999] max-h-[calc(100dvh-6rem)] overflow-hidden rounded-[18px] border border-[#d2b98f]/70 bg-[#fff4e2]/98 text-[#241913] shadow-[0_24px_70px_rgba(62,39,22,0.18)] backdrop-blur-2xl sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[22rem]",
            compact ? "sm:left-0 sm:right-auto" : "",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#d2b98f]/45 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#233f32]">
                {text.title}
              </p>
              {unreadCount > 0 ? (
                <p className="mt-0.5 text-[11px] text-[#986f2e]">
                  {unreadCount}
                </p>
              ) : null}
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d2b98f]/70 bg-white/45 px-2.5 py-1.5 text-[11px] font-medium text-[#735f4b] transition hover:bg-white/80"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {text.markAll}
              </button>
            ) : null}
          </div>

          <div className="max-h-[calc(100dvh-11rem)] overflow-y-auto p-2 sm:max-h-[420px]">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-7 text-sm text-[#735f4b]">
                <Loader2 className="h-4 w-4 animate-spin" />
                {text.loading}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-7 text-center text-sm text-[#735f4b]">
                {text.empty}
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void handleOpenNotification(item)}
                  className={[
                    "mb-2 block w-full rounded-[14px] border p-3 text-start transition last:mb-0",
                    item.read
                      ? "border-[#d2b98f]/35 bg-white/35"
                      : "border-[#b88a3d]/55 bg-white/70 shadow-[0_8px_20px_rgba(62,39,22,0.08)]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px] font-semibold leading-5 text-[#233f32]">
                      {item.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-[#986f2e]">
                      {formatDate(item.createdAt, locale)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-5 text-[#735f4b]">
                    {item.body}
                  </p>
                  {item.linkUrl ? (
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#986f2e]">
                      <ExternalLink className="h-3 w-3" />
                      {text.open}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

