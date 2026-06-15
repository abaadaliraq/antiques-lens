"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/components/antique-ai/types";
import type {
  MarketplaceCategory,
  MarketplaceCondition,
  MarketplaceItemStatus,
  MarketplaceOrderStatus,
} from "@/types/marketplace";
import {
  getMarketplaceCountryLabelWithFlag,
  marketplaceLocations,
} from "@/lib/marketplaceLocations";

export type MarketplaceCountry =
  | "Iraq"
  | "United Arab Emirates"
  | "Saudi Arabia"
  | "Kuwait"
  | "Qatar"
  | "Bahrain"
  | "Oman"
  | "Turkey"
  | "Iran"
  | "India"
  | "France"
  | "United Kingdom"
  | "United States"
  | "Canada"
  | "Italy"
  | "Spain"
  | "Australia"
  | "China"
  | "Japan"
  | "Germany"
  | "Russia"
  | "Other";

export const marketplaceLocales: Locale[] = [
  "ar",
  "en",
  "ku",
  "fa",
  "tr",
  "hi",
  "ru",
  "fr",
];

export const marketplaceRtlLocales: Locale[] = ["ar", "ku", "fa"];

export const marketplaceCountries: MarketplaceCountry[] = [
  "Bahrain",
  "France",
  "Germany",
  "India",
  "Iran",
  "Iraq",
  "Kuwait",
  "Oman",
  "Qatar",
  "Russia",
  "Saudi Arabia",
  "Turkey",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Canada",
  "Italy",
  "Spain",
  "Australia",
  "China",
  "Japan",
  "Other",
];

export const marketplaceCategoryValues = [
  "metals",
  "wood",
  "furniture",
  "paintings",
  "artworks",
  "crystal",
  "glass",
  "accessories",
  "boxes",
  "silver",
  "gold",
  "copper",
  "bronze",
  "ceramic",
  "porcelain",
  "textiles",
  "rugs",
  "leather",
  "paper_manuscripts",
  "coins",
  "watches",
  "jewelry",
  "religious_antiques",
  "vintage_household",
  "other",
] as unknown as MarketplaceCategory[];

export const marketplaceConditionValues = [
  "ممتازة",
  "جيدة جدا",
  "جيدة",
  "تحتاج ترميم",
  "آثار عمر واضحة",
] as unknown as MarketplaceCondition[];

const STORAGE_KEYS = ["antiques-lens:locale", "kishib:pending-oauth-locale"];

const text = {
  ar: {
    marketNav: "السوق",
    sellNav: "اعرض قطعة",
    sellerNav: "لوحة البائع",
    ordersNav: "طلباتي",
    marketEyebrow: "سوق كيشيب",
    marketTitle: "سوق كيشيب",
    marketSubtitle:
      "منصة منظمة لعرض وشراء القطع التراثية والتحف المختارة بعد مراجعة أولية.",
    sellItem: "اعرض قطعة للبيع",
    search: "البحث باسم القطعة",
    allCategories: "كل التصنيفات",
    allCountries: "كل البلدان",
    allCities: "كل المدن",
    allConditions: "كل الحالات",
    maxPrice: "السعر الأعلى",
    minPrice: "السعر الأدنى",
    priceRange: "نطاق السعر",
    sort: "الترتيب",
    newest: "الأحدث",
    priceLowHigh: "السعر: من الأقل للأعلى",
    priceHighLow: "السعر: من الأعلى للأقل",
    mostViewed: "الأكثر مشاهدة",
    resetFilters: "مسح الفلاتر",
    applyFilters: "تطبيق الفلاتر",
    chooseCountryFirst: "اختر الدولة أولا",
    otherCity: "مدينة أخرى",
    cityName: "اسم المدينة",
    loadingMarket: "جار تحميل سوق كيشب...",
    noItems: "لا توجد قطع منشورة مطابقة حاليا.",
    details: "عرض التفاصيل",
    sample: "نموذج عرض",
    kishibCheck: "فحص KISHIB أولي",
    unknown: "غير محدد",
    country: "البلد",
    city: "المدينة",
    condition: "الحالة",
    material: "المادة",
    age: "العمر",
    origin: "المنشأ",
    delivery: "التسليم",
    sellerInfo: "معلومات البائع",
    sellerPrivacy: "بائع داخل منصة KISHIB. لا يتم عرض معلومات التواصل الحساسة في السوق العام.",
    evaluation: "تقييم KISHIB الأولي",
    noEvaluation: "لم تتم إضافة تقييم KISHIB أولي بعد.",
    evaluationNotice: "هذا تقييم أولي وليس شهادة أصالة.",
    buyNow: "شراء الآن",
    favorite: "إضافة للمفضلة",
    sampleOnly: "هذه قطعة نموذجية للعرض فقط.",
    itemDetails: "تفاصيل القطعة",
    itemLoadSubtitle: "جار تحميل بيانات القطعة.",
    itemUnavailable: "القطعة غير موجودة أو غير متاحة.",
    submitReview: "إرسال للمراجعة",
    submitting: "جار الإرسال...",
    submitSuccess: "تم إرسال القطعة للمراجعة. ستظهر في سوق كيشب بعد الموافقة.",
    validationRequired: "يرجى تعبئة الاسم والوصف والسعر والبلد.",
    validationImage: "يرجى رفع صورة واحدة على الأقل للقطعة.",
    newTitle: "عرض قطعة للبيع",
    newSubtitle:
      "يرسل النموذج القطعة إلى Supabase بحالة pending_review. لن تظهر في السوق قبل موافقة الإدارة.",
    uploadImages: "رفع الصور",
    itemInfo: "معلومات القطعة",
    preview: "معاينة قبل النشر",
    itemName: "اسم القطعة",
    category: "التصنيف",
    requestedPrice: "السعر المطلوب",
    description: "الوصف",
    approximateAge: "العمر التقريبي",
    originIfKnown: "بلد المنشأ إن وجد",
    deliveryMethod: "طريقة التسليم",
    hasMark: "هل يوجد ختم أو توقيع؟",
    yes: "نعم",
    no: "لا",
    unclear: "غير واضح",
    itemPrice: "سعر القطعة",
    commission: "رسوم منصة KISHIB",
    sellerNet: "صافي مبلغ البائع",
    total: "المبلغ الكلي",
    sellerTitle: "لوحة البائع",
    sellerSubtitle: "متابعة قطعك وحالاتها وطلبات الشراء المرتبطة بها من Supabase.",
    notifications: "الإشعارات",
    orderCount: "عدد الطلبات",
    totalSales: "إجمالي المبيعات",
    netProfit: "صافي الأرباح",
    item: "القطعة",
    status: "الحالة",
    price: "السعر",
    date: "التاريخ",
    reviewNote: "ملاحظة المراجعة",
    resubmit: "تعديل وإعادة الإرسال",
    noSellerItems: "لم تعرض أي قطع للبيع بعد.",
    ordersTitle: "طلباتي كمشتري",
    ordersSubtitle: "متابعة طلبات الشراء الداخلية وحالاتها حتى تكتمل بوابة الدفع لاحقا.",
    noOrders: "لا توجد طلبات شراء حتى الآن.",
    checkoutTitle: "طلب شراء",
    checkoutSubtitle: "هذه الصفحة تنشئ طلب شراء داخلي فقط، ولا تنفذ دفعا حقيقيا في هذه المرحلة.",
    confirmPurchase: "تأكيد طلب الشراء",
    sendingOrder: "جار إرسال الطلب...",
    orderSuccess: "تم إرسال طلب الشراء. بانتظار تأكيد البائع.",
    paymentNotice: "سيتم التنسيق والدفع بعد تأكيد الطلب.",
    notificationTitle: "إشعارات السوق",
    notificationSubtitle: "آخر إشعارات مراجعة القطع وطلبات الشراء داخل سوق كيشب.",
    noNotifications: "لا توجد إشعارات حاليا.",
    markRead: "تحديد كمقروء",
    read: "مقروء",
    unread: "غير مقروء",
    adminTitle: "لوحة إدارة سوق كيشب",
    adminSubtitle: "مراجعة القطع، نشرها، رفضها، ومتابعة طلبات الشراء.",
    refresh: "تحديث",
    reviewItems: "مراجعة القطع",
    allItems: "كل القطع",
    purchaseOrders: "طلبات الشراء",
    publishItem: "نشر القطعة",
    rejectItem: "رفض القطعة",
    requestChanges: "طلب تعديل",
    reasonPlaceholder: "سبب الرفض أو طلب التعديل",
    unauthorized: "هذه الصفحة متاحة فقط لأدمن سوق كيشب.",
    noTabItems: "لا توجد قطع في هذا التبويب حاليا.",
  },
  en: {
    marketNav: "Market",
    sellNav: "List item",
    sellerNav: "Seller dashboard",
    ordersNav: "My orders",
    marketEyebrow: "KISHIB MARKET",
    marketTitle: "KISHIB Market",
    marketSubtitle:
      "A curated marketplace for reviewed heritage pieces and antiques.",
    sellItem: "List an item",
    search: "Search by item name",
    allCategories: "All categories",
    allCountries: "All countries",
    allCities: "All cities",
    allConditions: "All conditions",
    maxPrice: "Max price",
    minPrice: "Min price",
    priceRange: "Price range",
    sort: "Sort",
    newest: "Newest",
    priceLowHigh: "Price: Low to High",
    priceHighLow: "Price: High to Low",
    mostViewed: "Most viewed",
    resetFilters: "Clear filters",
    applyFilters: "Apply filters",
    chooseCountryFirst: "Choose country first",
    otherCity: "Other city",
    cityName: "City name",
    loadingMarket: "Loading KISHIB Market...",
    noItems: "No matching published items right now.",
    details: "View details",
    sample: "Sample listing",
    kishibCheck: "Initial KISHIB check",
    unknown: "Not specified",
    country: "Country",
    city: "City",
    condition: "Condition",
    material: "Material",
    age: "Age",
    origin: "Origin",
    delivery: "Delivery",
    sellerInfo: "Seller information",
    sellerPrivacy: "Seller on KISHIB. Sensitive contact details are not shown publicly.",
    evaluation: "Initial KISHIB evaluation",
    noEvaluation: "No initial KISHIB evaluation has been added yet.",
    evaluationNotice: "This is an initial evaluation, not an authenticity certificate.",
    buyNow: "Buy now",
    favorite: "Add to favorites",
    sampleOnly: "This is a sample item for display only.",
    itemDetails: "Item details",
    itemLoadSubtitle: "Loading item data.",
    itemUnavailable: "The item is missing or unavailable.",
    submitReview: "Send for review",
    submitting: "Submitting...",
    submitSuccess: "The item was sent for review. It will appear after approval.",
    validationRequired: "Please fill name, description, price, and country.",
    validationImage: "Please upload at least one item image.",
    newTitle: "List an item",
    newSubtitle:
      "The form sends the item to Supabase as pending_review. It will not appear before admin approval.",
    uploadImages: "Upload images",
    itemInfo: "Item information",
    preview: "Preview before publishing",
    itemName: "Item name",
    category: "Category",
    requestedPrice: "Requested price",
    description: "Description",
    approximateAge: "Estimated age",
    originIfKnown: "Origin country if known",
    deliveryMethod: "Delivery method",
    hasMark: "Has stamp or signature?",
    yes: "Yes",
    no: "No",
    unclear: "Unclear",
    itemPrice: "Item price",
    commission: "KISHIB platform fee",
    sellerNet: "Seller net amount",
    total: "Total amount",
    sellerTitle: "Seller dashboard",
    sellerSubtitle: "Track your items, statuses, and linked purchase orders from Supabase.",
    notifications: "Notifications",
    orderCount: "Orders",
    totalSales: "Total sales",
    netProfit: "Net profit",
    item: "Item",
    status: "Status",
    price: "Price",
    date: "Date",
    reviewNote: "Review note",
    resubmit: "Edit and resubmit",
    noSellerItems: "You have not listed any items yet.",
    ordersTitle: "My buyer orders",
    ordersSubtitle: "Track internal purchase requests until payment is added later.",
    noOrders: "No purchase orders yet.",
    checkoutTitle: "Purchase request",
    checkoutSubtitle: "This page creates an internal purchase request only. It does not process real payment yet.",
    confirmPurchase: "Confirm purchase request",
    sendingOrder: "Sending request...",
    orderSuccess: "Purchase request sent. Waiting for seller confirmation.",
    paymentNotice: "Coordination and payment happen after the request is confirmed.",
    notificationTitle: "Market notifications",
    notificationSubtitle: "Latest item review and purchase request notifications.",
    noNotifications: "No notifications right now.",
    markRead: "Mark as read",
    read: "Read",
    unread: "Unread",
    adminTitle: "KISHIB Market Admin",
    adminSubtitle: "Review, publish, reject items, and follow purchase orders.",
    refresh: "Refresh",
    reviewItems: "Review items",
    allItems: "All items",
    purchaseOrders: "Purchase orders",
    publishItem: "Publish item",
    rejectItem: "Reject item",
    requestChanges: "Request changes",
    reasonPlaceholder: "Reason for rejection or requested changes",
    unauthorized: "This page is only available to KISHIB Market admins.",
    noTabItems: "No items in this tab right now.",
  },
};

const aliases: Partial<Record<Locale, keyof typeof text>> = {
  ku: "ar",
  fa: "ar",
  tr: "en",
  hi: "en",
  ru: "en",
  fr: "en",
};

const categoryLabels: Record<keyof typeof text, Record<string, string>> = {
  ar: {
    metals: "معادن",
    wood: "خشب",
    furniture: "أثاث",
    paintings: "لوحات",
    artworks: "أعمال فنية",
    crystal: "كرستال",
    glass: "زجاج",
    accessories: "اكسسوارات",
    boxes: "صناديق",
    silver: "فضة",
    gold: "ذهب",
    copper: "نحاس",
    bronze: "برونز",
    ceramic: "سيراميك",
    porcelain: "بورسلان",
    textiles: "نسيج",
    rugs: "سجاد",
    leather: "جلد",
    paper_manuscripts: "ورق / مخطوطات",
    coins: "عملات",
    watches: "ساعات",
    jewelry: "مجوهرات",
    religious_antiques: "تحف دينية",
    vintage_household: "قطع منزلية قديمة",
    other: "أخرى",
  },
  en: {
    metals: "Metals",
    wood: "Wood",
    furniture: "Furniture",
    paintings: "Paintings",
    artworks: "Artworks",
    crystal: "Crystal",
    glass: "Glass",
    accessories: "Accessories",
    boxes: "Boxes",
    silver: "Silver",
    gold: "Gold",
    copper: "Copper",
    bronze: "Bronze",
    ceramic: "Ceramic",
    porcelain: "Porcelain",
    textiles: "Textiles",
    rugs: "Rugs",
    leather: "Leather",
    paper_manuscripts: "Paper / Manuscripts",
    coins: "Coins",
    watches: "Watches",
    jewelry: "Jewelry",
    religious_antiques: "Religious antiques",
    vintage_household: "Vintage household pieces",
    other: "Other",
  },
};

const conditionLabels: Record<keyof typeof text, Record<string, string>> = {
  ar: {
    [marketplaceConditionValues[0]]: "ممتازة",
    [marketplaceConditionValues[1]]: "جيدة جدا",
    [marketplaceConditionValues[2]]: "جيدة",
    [marketplaceConditionValues[3]]: "تحتاج ترميم",
    [marketplaceConditionValues[4]]: "آثار عمر واضحة",
  },
  en: {
    [marketplaceConditionValues[0]]: "Excellent",
    [marketplaceConditionValues[1]]: "Very good",
    [marketplaceConditionValues[2]]: "Good",
    [marketplaceConditionValues[3]]: "Needs restoration",
    [marketplaceConditionValues[4]]: "Clear age marks",
  },
};

const countryLabels: Record<keyof typeof text, Record<MarketplaceCountry, string>> = {
  ar: {
    Iraq: "العراق",
    "United Arab Emirates": "الإمارات العربية المتحدة",
    "Saudi Arabia": "السعودية",
    Kuwait: "الكويت",
    Qatar: "قطر",
    Bahrain: "البحرين",
    Oman: "عمان",
    Turkey: "تركيا",
    Iran: "إيران",
    India: "الهند",
    France: "فرنسا",
    "United Kingdom": "المملكة المتحدة",
    "United States": "الولايات المتحدة",
    Canada: "كندا",
    Italy: "إيطاليا",
    Spain: "إسبانيا",
    Australia: "أستراليا",
    China: "الصين",
    Japan: "اليابان",
    Germany: "ألمانيا",
    Russia: "روسيا",
    Other: "أخرى",
  },
  en: Object.fromEntries(marketplaceCountries.map((country) => [country, country])) as Record<
    MarketplaceCountry,
    string
  >,
};

const statusLabels: Record<keyof typeof text, Record<string, string>> = {
  ar: {
    pending_review: "بانتظار المراجعة",
    published: "منشورة",
    needs_changes: "تحتاج تعديل",
    rejected: "مرفوضة",
    reserved: "محجوزة",
    sold: "مباعة",
    purchase_requested: "طلب شراء مرسل",
    seller_confirmed: "أكدها البائع",
    awaiting_payment: "بانتظار الدفع",
    paid: "مدفوعة",
    delivered: "تم التسليم",
    completed: "مكتملة",
    cancelled: "ملغاة",
    dispute: "نزاع",
  },
  en: {
    pending_review: "Pending review",
    published: "Published",
    needs_changes: "Needs changes",
    rejected: "Rejected",
    reserved: "Reserved",
    sold: "Sold",
    purchase_requested: "Purchase requested",
    seller_confirmed: "Seller confirmed",
    awaiting_payment: "Awaiting payment",
    paid: "Paid",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    dispute: "Dispute",
  },
};

export function normalizeMarketplaceLocale(value: unknown): Locale {
  return typeof value === "string" && marketplaceLocales.includes(value as Locale)
    ? (value as Locale)
    : "ar";
}

export function getMarketplaceDirection(locale: Locale) {
  return marketplaceRtlLocales.includes(locale) ? "rtl" : "ltr";
}

export function getStoredMarketplaceLocale(): Locale {
  if (typeof window === "undefined") return "ar";

  for (const key of STORAGE_KEYS) {
    const stored = window.localStorage.getItem(key);
    if (stored && marketplaceLocales.includes(stored as Locale)) {
      return stored as Locale;
    }
  }

  return normalizeMarketplaceLocale(document.documentElement.lang);
}

export function useMarketplaceLocale() {
  const [locale, setLocale] = useState<Locale>(() => getStoredMarketplaceLocale());

  useEffect(() => {
    const syncLocale = () => setLocale(getStoredMarketplaceLocale());
    syncLocale();
    window.addEventListener("storage", syncLocale);
    window.addEventListener("focus", syncLocale);

    return () => {
      window.removeEventListener("storage", syncLocale);
      window.removeEventListener("focus", syncLocale);
    };
  }, []);

  return locale;
}

export function marketplaceCopy(locale: Locale) {
  const group = labelGroup(locale);
  const selected = text[group] ?? text.ar;
  return Object.fromEntries(
    Object.entries(selected).map(([key, value]) => [
      key,
      typeof value === "string" ? cleanMarketplaceText(value) : value,
    ]),
  ) as typeof selected;
}

function labelGroup(locale: Locale): keyof typeof text {
  const group = aliases[locale] ?? locale;
  return group in text ? (group as keyof typeof text) : "ar";
}

const cp1252Reverse: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

function mojibakeScore(value: string) {
  return (value.match(/[ÃÂØÙÐÑðŸà¤�]/g) ?? []).length;
}

function decodeMojibakeOnce(value: string) {
  const bytes = Uint8Array.from(
    Array.from(value, (character) => {
      const code = character.charCodeAt(0);
      return cp1252Reverse[code] ?? (code <= 0xff ? code : 0x3f);
    }),
  );

  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function cleanMarketplaceText(value: string | null | undefined) {
  if (!value) return "";

  let best = value;
  let bestScore = mojibakeScore(best);

  for (let index = 0; index < 3 && bestScore > 0; index += 1) {
    const decoded = decodeMojibakeOnce(best);
    const decodedScore = mojibakeScore(decoded);

    if (decodedScore < bestScore || (decodedScore === bestScore && decoded !== best)) {
      best = decoded;
      bestScore = decodedScore;
    } else {
      break;
    }
  }

  return best.replace(/\s+/g, " ").trim();
}

export function getMarketplaceCategoryLabel(value: string, locale: Locale) {
  const group = labelGroup(locale);
  return cleanMarketplaceText(categoryLabels[group][value] ?? value);
}

export function getMarketplaceConditionLabel(value: string, locale: Locale) {
  const group = labelGroup(locale);
  return cleanMarketplaceText(conditionLabels[group][value] ?? value);
}

export function getMarketplaceCountryLabel(value: string | null | undefined, locale: Locale) {
  return value
    ? cleanMarketplaceText(getMarketplaceCountryLabelWithFlag(value, locale) || value)
    : marketplaceCopy(locale).unknown;
}

export function getMarketplaceStatusLabel(
  status: MarketplaceItemStatus | MarketplaceOrderStatus,
  locale: Locale,
) {
  const group = labelGroup(locale);
  return cleanMarketplaceText(statusLabels[group][status] ?? status);
}

export function getMarketplaceNavLabel(locale: Locale) {
  const labels: Record<Locale, string> = {
    ar: "السوق",
    en: "Market",
    ku: "بازاڕ",
    fa: "بازار",
    tr: "Pazar",
    hi: "बाज़ार",
    ru: "Маркет",
    fr: "Marché",
  };

  return cleanMarketplaceText(labels[locale] ?? labels.en);
}

export function getMarketplaceSellItemLabel(locale: Locale) {
  const labels: Record<Locale, string> = {
    ar: "اعرض قطعة للبيع",
    en: "Sell an Item",
    ku: "شتێک بۆ فرۆشتن دابنێ",
    fa: "فروش یک قطعه",
    tr: "Bir Parça Sat",
    hi: "वस्तु बेचें",
    ru: "Продать предмет",
    fr: "Vendre un objet",
  };

  return cleanMarketplaceText(labels[locale] ?? labels.en);
}

export function getMarketplaceLocationCountries() {
  return marketplaceLocations;
}
