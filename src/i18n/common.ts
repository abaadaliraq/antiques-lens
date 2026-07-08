import type { Locale } from "@/components/antique-ai/types";

export const SUPPORTED_LOCALES = [
  "ar",
  "en",
  "ku",
  "fr",
  "hi",
  "fa",
  "tr",
  "ru",
  "es",
] as const satisfies readonly Locale[];

export const RTL_LOCALES = ["ar", "fa", "ku", "ckb"] as const;

export type LanguageOption = {
  code: Locale;
  native: string;
  label: string;
  short: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "ar", native: "العربية", label: "العربية", short: "AR" },
  { code: "en", native: "English", label: "English", short: "EN" },
  { code: "ku", native: "کوردی", label: "کوردی", short: "KU" },
  { code: "fr", native: "Français", label: "Français", short: "FR" },
  { code: "hi", native: "हिन्दी", label: "हिन्दी", short: "HI" },
  { code: "fa", native: "فارسی", label: "فارسی", short: "FA" },
  { code: "tr", native: "Türkçe", label: "Türkçe", short: "TR" },
  { code: "ru", native: "Русский", label: "Русский", short: "RU" },
  { code: "es", native: "Español", label: "Español", short: "ES" },
];

export const COMMON_COPY: Record<
  Locale,
  {
    loading: string;
    close: string;
    cancel: string;
    save: string;
    language: string;
  }
> = {
  ar: { loading: "جاري التحميل...", close: "إغلاق", cancel: "إلغاء", save: "حفظ", language: "اللغة" },
  en: { loading: "Loading...", close: "Close", cancel: "Cancel", save: "Save", language: "Language" },
  ku: { loading: "بارکردن...", close: "داخستن", cancel: "هەڵوەشاندنەوە", save: "پاشەکەوت", language: "زمان" },
  fr: { loading: "Chargement...", close: "Fermer", cancel: "Annuler", save: "Enregistrer", language: "Langue" },
  hi: { loading: "लोड हो रहा है...", close: "बंद करें", cancel: "रद्द करें", save: "सहेजें", language: "भाषा" },
  fa: { loading: "در حال بارگذاری...", close: "بستن", cancel: "لغو", save: "ذخیره", language: "زبان" },
  tr: { loading: "Yükleniyor...", close: "Kapat", cancel: "İptal", save: "Kaydet", language: "Dil" },
  ru: { loading: "Загрузка...", close: "Закрыть", cancel: "Отмена", save: "Сохранить", language: "Язык" },
  es: { loading: "Cargando...", close: "Cerrar", cancel: "Cancelar", save: "Guardar", language: "Idioma" },
};

export function isRtlLocale(locale: Locale | "ckb" | string) {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}
