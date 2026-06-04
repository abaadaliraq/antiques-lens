import type { Locale } from "@/components/antique-ai/types";

type LocalizedLabels = Record<Locale, string>;

export type MarketplaceCityOption = {
  value: string;
  labels: LocalizedLabels;
};

export type MarketplaceCountryOption = {
  code: string;
  value: string;
  flag: string;
  labels: LocalizedLabels;
  cities: MarketplaceCityOption[];
};

export const OTHER_CITY_VALUE = "__other_city__";

function labels(
  en: string,
  ar: string,
  ku: string,
  fa: string,
  tr: string,
  hi: string,
  ru: string,
  fr: string,
): LocalizedLabels {
  return { ar, en, ku, fa, tr, hi, ru, fr };
}

function city(value: string, ar = value): MarketplaceCityOption {
  return {
    value,
    labels: labels(value, ar, value, value, value, value, value, value),
  };
}

export const marketplaceLocations: MarketplaceCountryOption[] = [
  {
    code: "BH",
    value: "Bahrain",
    flag: "🇧🇭",
    labels: labels("Bahrain", "البحرين", "بەحرەین", "بحرین", "Bahreyn", "बहरीन", "Бахрейн", "Bahreïn"),
    cities: [city("Manama", "المنامة"), city("Muharraq", "المحرق"), city("Riffa", "الرفاع")],
  },
  {
    code: "FR",
    value: "France",
    flag: "🇫🇷",
    labels: labels("France", "فرنسا", "فەرەنسا", "فرانسه", "Fransa", "फ़्रांस", "Франция", "France"),
    cities: [city("Lyon", "ليون"), city("Marseille", "مرسيليا"), city("Paris", "باريس")],
  },
  {
    code: "DE",
    value: "Germany",
    flag: "🇩🇪",
    labels: labels("Germany", "ألمانيا", "ئەڵمانیا", "آلمان", "Almanya", "जर्मनी", "Германия", "Allemagne"),
    cities: [city("Berlin", "برلين"), city("Hamburg", "هامبورغ"), city("Munich", "ميونخ")],
  },
  {
    code: "IN",
    value: "India",
    flag: "🇮🇳",
    labels: labels("India", "الهند", "هیندستان", "هند", "Hindistan", "भारत", "Индия", "Inde"),
    cities: [city("Delhi", "دلهي"), city("Jaipur", "جايبور"), city("Mumbai", "مومباي"), city("New Delhi", "نيودلهي")],
  },
  {
    code: "IR",
    value: "Iran",
    flag: "🇮🇷",
    labels: labels("Iran", "إيران", "ئێران", "ایران", "İran", "ईरान", "Иран", "Iran"),
    cities: [city("Isfahan", "أصفهان"), city("Mashhad", "مشهد"), city("Shiraz", "شيراز"), city("Tabriz", "تبريز"), city("Tehran", "طهران")],
  },
  {
    code: "IQ",
    value: "Iraq",
    flag: "🇮🇶",
    labels: labels("Iraq", "العراق", "عێراق", "عراق", "Irak", "इराक", "Ирак", "Irak"),
    cities: [city("Baghdad", "بغداد"), city("Basra", "البصرة"), city("Erbil", "أربيل"), city("Karbala", "كربلاء"), city("Kirkuk", "كركوك"), city("Mosul", "الموصل"), city("Najaf", "النجف"), city("Sulaymaniyah", "السليمانية")],
  },
  {
    code: "KW",
    value: "Kuwait",
    flag: "🇰🇼",
    labels: labels("Kuwait", "الكويت", "کوەیت", "کویت", "Kuveyt", "कुवैत", "Кувейт", "Koweït"),
    cities: [city("Hawalli", "حولي"), city("Kuwait City", "مدينة الكويت"), city("Salmiya", "السالمية")],
  },
  {
    code: "OM",
    value: "Oman",
    flag: "🇴🇲",
    labels: labels("Oman", "عمان", "عومان", "عمان", "Umman", "ओमान", "Оман", "Oman"),
    cities: [city("Muscat", "مسقط"), city("Nizwa", "نزوى"), city("Salalah", "صلالة")],
  },
  {
    code: "QA",
    value: "Qatar",
    flag: "🇶🇦",
    labels: labels("Qatar", "قطر", "قەتەر", "قطر", "Katar", "क़तर", "Катар", "Qatar"),
    cities: [city("Al Wakrah", "الوكرة"), city("Doha", "الدوحة"), city("Lusail", "لوسيل")],
  },
  {
    code: "RU",
    value: "Russia",
    flag: "🇷🇺",
    labels: labels("Russia", "روسيا", "ڕووسیا", "روسیه", "Rusya", "रूस", "Россия", "Russie"),
    cities: [city("Moscow", "موسكو"), city("Saint Petersburg", "سانت بطرسبرغ")],
  },
  {
    code: "SA",
    value: "Saudi Arabia",
    flag: "🇸🇦",
    labels: labels("Saudi Arabia", "السعودية", "سعودیە", "عربستان سعودی", "Suudi Arabistan", "सऊदी अरब", "Саудовская Аравия", "Arabie saoudite"),
    cities: [city("Jeddah", "جدة"), city("Mecca", "مكة"), city("Medina", "المدينة المنورة"), city("Riyadh", "الرياض")],
  },
  {
    code: "TR",
    value: "Turkey",
    flag: "🇹🇷",
    labels: labels("Turkey", "تركيا", "تورکیا", "ترکیه", "Türkiye", "तुर्की", "Турция", "Turquie"),
    cities: [city("Ankara", "أنقرة"), city("Antalya", "أنطاليا"), city("Bursa", "بورصة"), city("Istanbul", "إسطنبول"), city("Izmir", "إزمير")],
  },
  {
    code: "AE",
    value: "United Arab Emirates",
    flag: "🇦🇪",
    labels: labels("United Arab Emirates", "الإمارات العربية المتحدة", "ئیمارات", "امارات متحده عربی", "Birleşik Arap Emirlikleri", "संयुक्त अरब अमीरात", "ОАЭ", "Émirats arabes unis"),
    cities: [city("Abu Dhabi", "أبو ظبي"), city("Dubai", "دبي"), city("Sharjah", "الشارقة")],
  },
  {
    code: "GB",
    value: "United Kingdom",
    flag: "🇬🇧",
    labels: labels("United Kingdom", "المملكة المتحدة", "بەریتانیا", "بریتانیا", "Birleşik Krallık", "यूनाइटेड किंगडम", "Великобритания", "Royaume-Uni"),
    cities: [city("Birmingham", "برمنغهام"), city("London", "لندن"), city("Manchester", "مانشستر")],
  },
  {
    code: "US",
    value: "United States",
    flag: "🇺🇸",
    labels: labels("United States", "الولايات المتحدة", "ویلایەتە یەکگرتووەکان", "ایالات متحده", "Amerika Birleşik Devletleri", "संयुक्त राज्य", "США", "États-Unis"),
    cities: [city("Chicago", "شيكاغو"), city("Los Angeles", "لوس أنجلوس"), city("Miami", "ميامي"), city("New York", "نيويورك"), city("Washington", "واشنطن")],
  },
  {
    code: "OTHER",
    value: "Other",
    flag: "🌍",
    labels: labels("Other", "أخرى", "هیتر", "سایر", "Diğer", "अन्य", "Другое", "Autre"),
    cities: [],
  },
];

export function getMarketplaceLocation(value: string | null | undefined) {
  return marketplaceLocations.find((location) => location.value === value) ?? null;
}

export function getMarketplaceCountryLabelWithFlag(
  value: string | null | undefined,
  locale: Locale,
) {
  const location = getMarketplaceLocation(value);
  return location ? `${location.flag} ${location.labels[locale]}` : value || "";
}

export function getMarketplaceCityLabel(
  country: string | null | undefined,
  cityValue: string | null | undefined,
  locale: Locale,
) {
  if (!cityValue) return "";
  const cityOption = getMarketplaceLocation(country)?.cities.find(
    (city) => city.value === cityValue,
  );
  return cityOption?.labels[locale] ?? cityValue;
}

export function marketplaceCityMatches(
  country: string | null | undefined,
  selectedCity: string,
  itemCity: string | null | undefined,
) {
  if (selectedCity === "all") return true;
  if (!itemCity) return false;
  if (itemCity === selectedCity) return true;

  const cityOption = getMarketplaceLocation(country)?.cities.find(
    (city) => city.value === selectedCity,
  );

  return cityOption ? Object.values(cityOption.labels).includes(itemCity) : false;
}
