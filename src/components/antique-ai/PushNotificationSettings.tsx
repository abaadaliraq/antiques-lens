"use client";
import { BellRing, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "./types";
import { enablePushNotifications, getPushPermission, openPushSettings, type PushPermissionState } from "@/lib/pushNotifications";

const COPY: Record<Locale, [string, string, string, string, string]> = {
  ar: ["إشعارات الهاتف", "مفعّل", "غير مفعّل", "تفعيل الإشعارات", "فتح الإعدادات"],
  en: ["Phone notifications", "Enabled", "Disabled", "Enable notifications", "Open settings"],
  ku: ["ئاگادارکردنەوەکانی مۆبایل", "چالاکە", "ناچالاکە", "چالاککردن", "کردنەوەی ڕێکخستنەکان"],
  fr: ["Notifications du téléphone", "Activées", "Désactivées", "Activer", "Ouvrir les réglages"],
  hi: ["फ़ोन सूचनाएँ", "चालू", "बंद", "सूचनाएँ चालू करें", "सेटिंग खोलें"],
  fa: ["اعلان‌های تلفن", "فعال", "غیرفعال", "فعال‌سازی", "بازکردن تنظیمات"],
  tr: ["Telefon bildirimleri", "Etkin", "Devre dışı", "Bildirimleri etkinleştir", "Ayarları aç"],
  ru: ["Уведомления телефона", "Включены", "Выключены", "Включить", "Открыть настройки"],
  es: ["Notificaciones del teléfono", "Activadas", "Desactivadas", "Activar", "Abrir ajustes"],
};
export default function PushNotificationSettings({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState<PushPermissionState>("unsupported");
  const copy = COPY[locale] || COPY.en;
  useEffect(() => { void getPushPermission().then(setStatus); }, []);
  if (status === "unsupported") return null;
  return <div className="mt-2 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/55 p-3">
    <div className="flex items-center gap-2 text-[12px] font-semibold text-[#241913]">
      <BellRing className="h-4 w-4 text-[#b88a3d]" /><span className="flex-1">{copy[0]}</span>
      <span>{status === "granted" ? copy[1] : copy[2]}</span>
    </div>
    {status !== "granted" && <button type="button"
      onClick={() => void (status === "denied" ? openPushSettings() : enablePushNotifications(locale).then(setStatus))}
      className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#b88a3d] px-3 text-[11px] font-semibold text-white">
      {status === "denied" && <Settings className="h-3.5 w-3.5" />}{status === "denied" ? copy[4] : copy[3]}
    </button>}
  </div>;
}
