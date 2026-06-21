import type { Locale } from "@/components/antique-ai/types";

export type CountryOption = {
  code: string;
  nameEn: string;
  labels?: Partial<Record<Locale, string>>;
};

export type ProvinceOption = {
  code: string;
  nameEn: string;
  labels?: Partial<Record<Locale, string>>;
};

export type GenderOption = {
  value: "male" | "female" | "prefer_not_to_say";
  labels: Partial<Record<Locale, string>> & { en: string };
};

export const countries: CountryOption[] = [
  { code: "IQ", nameEn: "Iraq", labels: { ar: "العراق", ku: "عێراق", fa: "عراق" } },
  { code: "AE", nameEn: "United Arab Emirates", labels: { ar: "الإمارات العربية المتحدة", fa: "امارات متحده عربی" } },
  { code: "SA", nameEn: "Saudi Arabia", labels: { ar: "السعودية", fa: "عربستان سعودی" } },
  { code: "KW", nameEn: "Kuwait", labels: { ar: "الكويت", fa: "کویت" } },
  { code: "QA", nameEn: "Qatar", labels: { ar: "قطر" } },
  { code: "BH", nameEn: "Bahrain", labels: { ar: "البحرين" } },
  { code: "OM", nameEn: "Oman", labels: { ar: "عُمان" } },
  { code: "JO", nameEn: "Jordan", labels: { ar: "الأردن" } },
  { code: "LB", nameEn: "Lebanon", labels: { ar: "لبنان" } },
  { code: "SY", nameEn: "Syria", labels: { ar: "سوريا" } },
  { code: "EG", nameEn: "Egypt", labels: { ar: "مصر" } },
  { code: "TR", nameEn: "Turkey", labels: { ar: "تركيا", tr: "Türkiye" } },
  { code: "IR", nameEn: "Iran", labels: { ar: "إيران", fa: "ایران" } },
  { code: "IN", nameEn: "India", labels: { ar: "الهند", hi: "भारत" } },
  { code: "PK", nameEn: "Pakistan", labels: { ar: "باكستان" } },
  { code: "ES", nameEn: "Spain", labels: { ar: "إسبانيا", fr: "Espagne" } },
  { code: "FR", nameEn: "France", labels: { ar: "فرنسا", fr: "France" } },
  { code: "RU", nameEn: "Russia", labels: { ar: "روسيا", ru: "Россия" } },
  { code: "GB", nameEn: "United Kingdom", labels: { ar: "المملكة المتحدة" } },
  { code: "US", nameEn: "United States", labels: { ar: "الولايات المتحدة" } },
  { code: "DE", nameEn: "Germany", labels: { ar: "ألمانيا", fr: "Allemagne" } },
  { code: "IT", nameEn: "Italy", labels: { ar: "إيطاليا", fr: "Italie" } },
  { code: "NL", nameEn: "Netherlands", labels: { ar: "هولندا" } },
  { code: "SE", nameEn: "Sweden", labels: { ar: "السويد" } },
  { code: "NO", nameEn: "Norway", labels: { ar: "النرويج" } },
  { code: "CA", nameEn: "Canada", labels: { ar: "كندا" } },
  { code: "AU", nameEn: "Australia", labels: { ar: "أستراليا" } },
  { code: "MA", nameEn: "Morocco", labels: { ar: "المغرب", fr: "Maroc" } },
  { code: "DZ", nameEn: "Algeria", labels: { ar: "الجزائر", fr: "Algérie" } },
  { code: "TN", nameEn: "Tunisia", labels: { ar: "تونس", fr: "Tunisie" } },
  { code: "CN", nameEn: "China", labels: { ar: "الصين" } },
  { code: "JP", nameEn: "Japan", labels: { ar: "اليابان" } },
];

export const iraqProvinces: ProvinceOption[] = [
  { code: "BGD", nameEn: "Baghdad", labels: { ar: "بغداد", ku: "بەغدا" } },
  { code: "BSR", nameEn: "Basra", labels: { ar: "البصرة" } },
  { code: "NIN", nameEn: "Nineveh", labels: { ar: "نينوى" } },
  { code: "EBL", nameEn: "Erbil", labels: { ar: "أربيل", ku: "هەولێر" } },
  { code: "SUL", nameEn: "Sulaymaniyah", labels: { ar: "السليمانية", ku: "سلێمانی" } },
  { code: "DUH", nameEn: "Duhok", labels: { ar: "دهوك", ku: "دهۆک" } },
  { code: "KRK", nameEn: "Kirkuk", labels: { ar: "كركوك", ku: "کەرکووک" } },
  { code: "NJF", nameEn: "Najaf", labels: { ar: "النجف" } },
  { code: "KRB", nameEn: "Karbala", labels: { ar: "كربلاء" } },
  { code: "BAB", nameEn: "Babil", labels: { ar: "بابل" } },
  { code: "WAS", nameEn: "Wasit", labels: { ar: "واسط" } },
  { code: "DIY", nameEn: "Diyala", labels: { ar: "ديالى" } },
  { code: "ANB", nameEn: "Anbar", labels: { ar: "الأنبار" } },
  { code: "SAL", nameEn: "Salah Al-Din", labels: { ar: "صلاح الدين" } },
  { code: "DQR", nameEn: "Dhi Qar", labels: { ar: "ذي قار" } },
  { code: "MIS", nameEn: "Maysan", labels: { ar: "ميسان" } },
  { code: "MTH", nameEn: "Muthanna", labels: { ar: "المثنى" } },
  { code: "QAD", nameEn: "Qadisiyah", labels: { ar: "القادسية" } },
];

export const genderOptions: GenderOption[] = [
  {
    value: "male",
    labels: { en: "Male", ar: "ذكر", fa: "مرد", tr: "Erkek", ru: "Мужской", ku: "نێر" },
  },
  {
    value: "female",
    labels: { en: "Female", ar: "أنثى", fa: "زن", tr: "Kadın", ru: "Женский", ku: "مێ" },
  },
  {
    value: "prefer_not_to_say",
    labels: { en: "Prefer not to say", ar: "أفضل عدم الإجابة", fa: "ترجیح می‌دهم نگویم", tr: "Belirtmek istemiyorum", ru: "Предпочитаю не указывать", ku: "پێم باشە نەڵێم" },
  },
];

function clean(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[أإآا]/g, "ا")
    .replace(/[ى]/g, "ي")
    .replace(/[ة]/g, "ه")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ي")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ");
}

export function getCountryByCode(code?: string | null) {
  return countries.find((country) => country.code === code) || null;
}

export function getProvinceByCode(code?: string | null) {
  return iraqProvinces.find((province) => province.code === code) || null;
}

export function countryLabel(country: CountryOption, locale: Locale) {
  void locale;
  return country.nameEn;
}

export function provinceLabel(province: ProvinceOption, locale: Locale) {
  void locale;
  return province.nameEn;
}

export function genderLabel(value: string | undefined | null, locale: Locale) {
  const option = genderOptions.find((item) => item.value === value);
  return option?.labels[locale] || option?.labels.en || "";
}

export function normalizeCountry(value?: string | null) {
  const raw = (value || "").trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const byCode = countries.find((country) => country.code === upper);
  if (byCode) return byCode;

  const normalized = clean(raw);
  const aliases: Record<string, string> = {
    iraq: "IQ",
    العراق: "IQ",
    عراق: "IQ",
    "united arab emirates": "AE",
    uae: "AE",
    الامارات: "AE",
    "الامارات العربيه المتحده": "AE",
    dubai: "AE",
    دبي: "AE",
    "saudi arabia": "SA",
    السعوديه: "SA",
    kuwait: "KW",
    الكويت: "KW",
    qatar: "QA",
    قطر: "QA",
    turkey: "TR",
    turkiye: "TR",
    تركيا: "TR",
    iran: "IR",
    ايران: "IR",
    india: "IN",
    الهند: "IN",
    spain: "ES",
    اسبانيا: "ES",
    france: "FR",
    فرنسا: "FR",
    russia: "RU",
    روسيا: "RU",
  };
  const code = aliases[normalized];
  return code ? getCountryByCode(code) : null;
}

export function normalizeProvince(value?: string | null) {
  const raw = (value || "").trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const byCode = iraqProvinces.find((province) => province.code === upper);
  if (byCode) return byCode;

  const normalized = clean(raw);
  const aliases: Record<string, string> = {
    baghdad: "BGD",
    بغداد: "BGD",
    "بغداد محافظه": "BGD",
    basra: "BSR",
    البصره: "BSR",
    nineveh: "NIN",
    نينوي: "NIN",
    erbil: "EBL",
    اربيل: "EBL",
    sulaymaniyah: "SUL",
    السليمانيه: "SUL",
    duhok: "DUH",
    دهوك: "DUH",
    kirkuk: "KRK",
    كركوك: "KRK",
    najaf: "NJF",
    النجف: "NJF",
    karbala: "KRB",
    كربلاء: "KRB",
    babil: "BAB",
    بابل: "BAB",
    wasit: "WAS",
    واسط: "WAS",
    diyala: "DIY",
    ديالي: "DIY",
    anbar: "ANB",
    الانبار: "ANB",
    "salah al-din": "SAL",
    "salah al din": "SAL",
    "صلاح الدين": "SAL",
    "dhi qar": "DQR",
    "ذي قار": "DQR",
    maysan: "MIS",
    ميسان: "MIS",
    muthanna: "MTH",
    المثني: "MTH",
    qadisiyah: "QAD",
    القادسيه: "QAD",
  };
  const code = aliases[normalized];
  return code ? getProvinceByCode(code) : null;
}
