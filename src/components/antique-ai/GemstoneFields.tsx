"use client";

import { BadgeCheck, ChevronDown, Gem, Ruler, Scale, Sparkles } from "lucide-react";
import { useState } from "react";

export type AppLocale = "ar" | "en" | "ku" | "fr" | "hi" | "fa" | "tr" | "ru";

export type EvaluationKind =
  | "antique"
  | "loose_gemstone"
  | "ring"
  | "necklace"
  | "beads";

export type GemstoneFormData = {
  evaluationKind: EvaluationKind;
  knownGemstoneType: string;
  caratWeight: string;
  gramWeight: string;
  dimensionsMm: string;
  color: string;
  transparency: string;
  cutShape: string;
  naturalStatus: string;
  certificateLab: string;
  certificateNumber: string;
  treatment: string;
  metalType: string;
};

type Props = {
  value: GemstoneFormData;
  onChange: (next: GemstoneFormData) => void;
  locale?: AppLocale;
};

export const emptyGemstoneFormData: GemstoneFormData = {
  evaluationKind: "antique",
  knownGemstoneType: "",
  caratWeight: "",
  gramWeight: "",
  dimensionsMm: "",
  color: "",
  transparency: "",
  cutShape: "",
  naturalStatus: "",
  certificateLab: "",
  certificateNumber: "",
  treatment: "",
  metalType: "",
};

const rtlLocales: AppLocale[] = ["ar", "ku", "fa"];

function isRtl(locale: AppLocale) {
  return rtlLocales.includes(locale);
}

const text = {
  ar: {
    typeTitle: "نوع التقييم",
    notice:
      "تقييم الأحجار لا يعتمد على الصورة وحدها. الوزن، الأبعاد، اللون، الشفافية، الشهادة والمعالجة تغيّر السعر بشكل كبير.",
    basicTitle: "بيانات أساسية",
    advancedTitle: "تفاصيل متقدمة للتقييم الأدق",
    showAdvanced: "إظهار التفاصيل المتقدمة",
    hideAdvanced: "إخفاء التفاصيل المتقدمة",
    knownGemstoneType: "نوع الحجر إن كان معروفاً",
    knownGemstoneTypePh: "مثال: عقيق، فيروز، زمرد، ياقوت، ألماس...",
    color: "اللون",
    colorPh: "مثال: أزرق داكن، أخضر زيتوني، أحمر شفاف...",
    certificateLab: "هل توجد شهادة؟",
    caratWeight: "الوزن بالقيراط",
    gramWeight: "الوزن بالغرام",
    dimensionsMm: "الأبعاد بالمليمتر",
    cutShape: "شكل القطع",
    transparency: "الشفافية",
    naturalStatus: "طبيعي أو صناعي؟",
    treatment: "المعالجة",
    metalType: "المعدن إن كان محبس أو قلادة",
    certificateNumber: "رقم الشهادة إن وجد",
    select: "اختاري",
    helpfulPhotos: "صور تساعد على تقييم أدق",
    kinds: {
      antique: ["تحفة / قطعة أثرية", "Antique"],
      loose_gemstone: ["حجر كريم مفرد", "Loose Gem"],
      ring: ["محبس / خاتم", "Ring"],
      necklace: ["قلادة / عقد", "Necklace"],
      beads: ["مسبحة / خرز", "Beads"],
    },
    photos: [
      "صورة أمامية واضحة",
      "صورة خلفية",
      "صورة بضوء أبيض",
      "صورة بجانب مسطرة",
      "صورة للشهادة",
      "صورة للختم أو العيار",
    ],
  },

  en: {
    typeTitle: "Evaluation type",
    notice:
      "Gemstone valuation cannot rely on photos only. Weight, measurements, color, transparency, certificate, and treatment can change the value heavily.",
    basicTitle: "Basic details",
    advancedTitle: "Advanced details for better accuracy",
    showAdvanced: "Show advanced details",
    hideAdvanced: "Hide advanced details",
    knownGemstoneType: "Gemstone type if known",
    knownGemstoneTypePh: "Example: agate, turquoise, emerald, ruby, diamond...",
    color: "Color",
    colorPh: "Example: deep blue, olive green, transparent red...",
    certificateLab: "Certificate",
    caratWeight: "Carat weight",
    gramWeight: "Gram weight",
    dimensionsMm: "Dimensions in mm",
    cutShape: "Cut / shape",
    transparency: "Transparency",
    naturalStatus: "Natural or synthetic?",
    treatment: "Treatment",
    metalType: "Metal if ring or necklace",
    certificateNumber: "Certificate number if available",
    select: "Select",
    helpfulPhotos: "Photos for better evaluation",
    kinds: {
      antique: ["Antique / Artifact", "General"],
      loose_gemstone: ["Loose Gemstone", "Gem"],
      ring: ["Ring", "Jewelry"],
      necklace: ["Necklace", "Jewelry"],
      beads: ["Beads / Rosary", "Beads"],
    },
    photos: [
      "Clear front photo",
      "Back photo",
      "White light photo",
      "Photo beside ruler",
      "Certificate photo",
      "Hallmark / stamp photo",
    ],
  },

  ku: {
    typeTitle: "جۆری هەڵسەنگاندن",
    notice:
      "هەڵسەنگاندنی بەردی گرانبەها تەنها بە وێنە دروست نابێت. کێش، قەبارە، ڕەنگ، ڕوونی، بڕوانامە و چارەسەرکاری نرخ دەگۆڕن.",
    basicTitle: "زانیاری سەرەکی",
    advancedTitle: "وردەکاری زیاتر بۆ هەڵسەنگاندنی باشتر",
    showAdvanced: "پیشاندانی وردەکاری زیاتر",
    hideAdvanced: "شاردنەوەی وردەکاری زیاتر",
    knownGemstoneType: "جۆری بەرد ئەگەر دیارە",
    knownGemstoneTypePh: "نموونە: عەقیق، فیروزە، زمرد، یاقوت...",
    color: "ڕەنگ",
    colorPh: "نموونە: شینی تاریک، سەوز، سووری ڕوون...",
    certificateLab: "بڕوانامە",
    caratWeight: "کێش بە قیرات",
    gramWeight: "کێش بە گرام",
    dimensionsMm: "قەبارە بە ملم",
    cutShape: "شێوەی بڕین",
    transparency: "ڕوونی",
    naturalStatus: "سروشتی یان دروستکراو؟",
    treatment: "چارەسەرکاری",
    metalType: "کانزا ئەگەر ئەنگوستیلە یان ملوانکەیە",
    certificateNumber: "ژمارەی بڕوانامە",
    select: "هەڵبژێرە",
    helpfulPhotos: "وێنەکان بۆ هەڵسەنگاندنی وردتر",
    kinds: {
      antique: ["شتێکی کۆن / ئاسەوار", "Antique"],
      loose_gemstone: ["بەردی گرانبەهای تاک", "Gem"],
      ring: ["ئەنگوستیلە", "Ring"],
      necklace: ["ملوانکە", "Necklace"],
      beads: ["مسبەحە / دانە", "Beads"],
    },
    photos: [
      "وێنەی پێشەوە",
      "وێنەی پشتەوە",
      "وێنە بە ڕووناکی سپی",
      "وێنە لەگەڵ پێوانە",
      "وێنەی بڕوانامە",
      "وێنەی مۆر یان عەیار",
    ],
  },

  fr: {
    typeTitle: "Type d’évaluation",
    notice:
      "L’évaluation des pierres ne peut pas dépendre uniquement des photos. Le poids, les dimensions, la couleur, la transparence, le certificat et les traitements influencent fortement la valeur.",
    basicTitle: "Détails essentiels",
    advancedTitle: "Détails avancés pour plus de précision",
    showAdvanced: "Afficher les détails avancés",
    hideAdvanced: "Masquer les détails avancés",
    knownGemstoneType: "Type de pierre si connu",
    knownGemstoneTypePh: "Exemple : agate, turquoise, émeraude, rubis, diamant...",
    color: "Couleur",
    colorPh: "Exemple : bleu foncé, vert olive, rouge transparent...",
    certificateLab: "Certificat",
    caratWeight: "Poids en carats",
    gramWeight: "Poids en grammes",
    dimensionsMm: "Dimensions en mm",
    cutShape: "Taille / forme",
    transparency: "Transparence",
    naturalStatus: "Naturelle ou synthétique ?",
    treatment: "Traitement",
    metalType: "Métal si bague ou collier",
    certificateNumber: "Numéro du certificat",
    select: "Choisir",
    helpfulPhotos: "Photos utiles pour une meilleure évaluation",
    kinds: {
      antique: ["Antiquité / objet ancien", "Antique"],
      loose_gemstone: ["Pierre seule", "Gem"],
      ring: ["Bague", "Ring"],
      necklace: ["Collier", "Necklace"],
      beads: ["Perles / chapelet", "Beads"],
    },
    photos: [
      "Photo de face",
      "Photo arrière",
      "Photo en lumière blanche",
      "Photo avec règle",
      "Photo du certificat",
      "Photo du poinçon",
    ],
  },

  hi: {
    typeTitle: "मूल्यांकन प्रकार",
    notice:
      "रत्न का मूल्यांकन केवल तस्वीर से सही नहीं होता। वजन, माप, रंग, पारदर्शिता, प्रमाणपत्र और उपचार कीमत बदल सकते हैं।",
    basicTitle: "मुख्य जानकारी",
    advancedTitle: "अधिक सटीकता के लिए उन्नत विवरण",
    showAdvanced: "उन्नत विवरण दिखाएँ",
    hideAdvanced: "उन्नत विवरण छिपाएँ",
    knownGemstoneType: "रत्न का प्रकार यदि ज्ञात हो",
    knownGemstoneTypePh: "उदाहरण: अगेट, फ़िरोज़ा, पन्ना, रूबी, हीरा...",
    color: "रंग",
    colorPh: "उदाहरण: गहरा नीला, जैतूनी हरा, पारदर्शी लाल...",
    certificateLab: "प्रमाणपत्र",
    caratWeight: "कैरेट वजन",
    gramWeight: "ग्राम वजन",
    dimensionsMm: "माप mm में",
    cutShape: "कट / आकार",
    transparency: "पारदर्शिता",
    naturalStatus: "प्राकृतिक या कृत्रिम?",
    treatment: "उपचार",
    metalType: "धातु यदि अंगूठी या हार हो",
    certificateNumber: "प्रमाणपत्र संख्या",
    select: "चुनें",
    helpfulPhotos: "बेहतर मूल्यांकन के लिए तस्वीरें",
    kinds: {
      antique: ["प्राचीन वस्तु", "Antique"],
      loose_gemstone: ["अलग रत्न", "Gem"],
      ring: ["अंगूठी", "Ring"],
      necklace: ["हार", "Necklace"],
      beads: ["माला / मनके", "Beads"],
    },
    photos: [
      "सामने की साफ तस्वीर",
      "पीछे की तस्वीर",
      "सफेद रोशनी में तस्वीर",
      "रूलर के साथ तस्वीर",
      "प्रमाणपत्र की तस्वीर",
      "हॉलमार्क की तस्वीर",
    ],
  },

  fa: {
    typeTitle: "نوع ارزیابی",
    notice:
      "ارزیابی سنگ قیمتی فقط با عکس دقیق نیست. وزن، اندازه، رنگ، شفافیت، گواهی و نوع بهسازی قیمت را تغییر می‌دهد.",
    basicTitle: "اطلاعات اصلی",
    advancedTitle: "جزئیات پیشرفته برای دقت بیشتر",
    showAdvanced: "نمایش جزئیات پیشرفته",
    hideAdvanced: "پنهان کردن جزئیات پیشرفته",
    knownGemstoneType: "نوع سنگ اگر مشخص است",
    knownGemstoneTypePh: "مثال: عقیق، فیروزه، زمرد، یاقوت، الماس...",
    color: "رنگ",
    colorPh: "مثال: آبی تیره، سبز زیتونی، قرمز شفاف...",
    certificateLab: "گواهی",
    caratWeight: "وزن به قیراط",
    gramWeight: "وزن به گرم",
    dimensionsMm: "ابعاد به میلی‌متر",
    cutShape: "تراش / شکل",
    transparency: "شفافیت",
    naturalStatus: "طبیعی یا مصنوعی؟",
    treatment: "بهسازی",
    metalType: "فلز اگر انگشتر یا گردنبند است",
    certificateNumber: "شماره گواهی",
    select: "انتخاب",
    helpfulPhotos: "عکس‌های مفید برای ارزیابی دقیق‌تر",
    kinds: {
      antique: ["عتیقه / شیء قدیمی", "Antique"],
      loose_gemstone: ["سنگ قیمتی تکی", "Gem"],
      ring: ["انگشتر", "Ring"],
      necklace: ["گردنبند", "Necklace"],
      beads: ["تسبیح / مهره", "Beads"],
    },
    photos: [
      "عکس واضح از جلو",
      "عکس پشت",
      "عکس با نور سفید",
      "عکس کنار خط‌کش",
      "عکس گواهی",
      "عکس مهر یا عیار",
    ],
  },

  tr: {
    typeTitle: "Değerlendirme türü",
    notice:
      "Değerli taş değerlendirmesi yalnızca fotoğrafla sağlıklı olmaz. Ağırlık, ölçü, renk, şeffaflık, sertifika ve işlem fiyatı ciddi şekilde değiştirir.",
    basicTitle: "Temel bilgiler",
    advancedTitle: "Daha doğru değerlendirme için gelişmiş bilgiler",
    showAdvanced: "Gelişmiş bilgileri göster",
    hideAdvanced: "Gelişmiş bilgileri gizle",
    knownGemstoneType: "Biliniyorsa taş türü",
    knownGemstoneTypePh: "Örnek: akik, turkuaz, zümrüt, yakut, elmas...",
    color: "Renk",
    colorPh: "Örnek: koyu mavi, zeytin yeşili, şeffaf kırmızı...",
    certificateLab: "Sertifika",
    caratWeight: "Karat ağırlığı",
    gramWeight: "Gram ağırlığı",
    dimensionsMm: "mm ölçüleri",
    cutShape: "Kesim / şekil",
    transparency: "Şeffaflık",
    naturalStatus: "Doğal mı sentetik mi?",
    treatment: "İşlem",
    metalType: "Yüzük/kolye ise metal",
    certificateNumber: "Sertifika numarası",
    select: "Seç",
    helpfulPhotos: "Daha iyi değerlendirme için fotoğraflar",
    kinds: {
      antique: ["Antika / eser", "Antique"],
      loose_gemstone: ["Tek değerli taş", "Gem"],
      ring: ["Yüzük", "Ring"],
      necklace: ["Kolye", "Necklace"],
      beads: ["Tesbih / boncuk", "Beads"],
    },
    photos: [
      "Net ön fotoğraf",
      "Arka fotoğraf",
      "Beyaz ışıkta fotoğraf",
      "Cetvel yanında fotoğraf",
      "Sertifika fotoğrafı",
      "Damga / ayar fotoğrafı",
    ],
  },

  ru: {
    typeTitle: "Тип оценки",
    notice:
      "Оценка камня только по фото неточна. Вес, размеры, цвет, прозрачность, сертификат и обработка сильно влияют на стоимость.",
    basicTitle: "Основные данные",
    advancedTitle: "Расширенные данные для точной оценки",
    showAdvanced: "Показать расширенные данные",
    hideAdvanced: "Скрыть расширенные данные",
    knownGemstoneType: "Тип камня, если известен",
    knownGemstoneTypePh: "Например: агат, бирюза, изумруд, рубин, алмаз...",
    color: "Цвет",
    colorPh: "Например: тёмно-синий, оливково-зелёный, прозрачный красный...",
    certificateLab: "Сертификат",
    caratWeight: "Вес в каратах",
    gramWeight: "Вес в граммах",
    dimensionsMm: "Размеры в мм",
    cutShape: "Огранка / форма",
    transparency: "Прозрачность",
    naturalStatus: "Натуральный или синтетический?",
    treatment: "Обработка",
    metalType: "Металл, если кольцо или ожерелье",
    certificateNumber: "Номер сертификата",
    select: "Выбрать",
    helpfulPhotos: "Фото для более точной оценки",
    kinds: {
      antique: ["Антиквариат / артефакт", "Antique"],
      loose_gemstone: ["Отдельный камень", "Gem"],
      ring: ["Кольцо", "Ring"],
      necklace: ["Ожерелье", "Necklace"],
      beads: ["Бусы / чётки", "Beads"],
    },
    photos: [
      "Чёткое фото спереди",
      "Фото сзади",
      "Фото при белом свете",
      "Фото рядом с линейкой",
      "Фото сертификата",
      "Фото клейма / пробы",
    ],
  },
} as const;

const transparencyOptions = {
  ar: ["شفاف", "شبه شفاف", "معتم", "غير معروف"],
  en: ["Transparent", "Translucent", "Opaque", "Unknown"],
  ku: ["ڕوون", "نیوەڕوون", "تاریک", "نادیار"],
  fr: ["Transparent", "Translucide", "Opaque", "Inconnu"],
  hi: ["पारदर्शी", "अर्ध-पारदर्शी", "अपारदर्शी", "अज्ञात"],
  fa: ["شفاف", "نیمه‌شفاف", "کدر", "نامشخص"],
  tr: ["Şeffaf", "Yarı şeffaf", "Opak", "Bilinmiyor"],
  ru: ["Прозрачный", "Полупрозрачный", "Непрозрачный", "Неизвестно"],
};

const naturalStatusOptions = {
  ar: ["طبيعي", "صناعي / مختبري", "مقلد / زجاجي", "غير معروف"],
  en: ["Natural", "Synthetic / lab-grown", "Imitation / glass", "Unknown"],
  ku: ["سروشتی", "دروستکراوی تاقیگەیی", "لاسایی / شووشە", "نادیار"],
  fr: ["Naturel", "Synthétique / laboratoire", "Imitation / verre", "Inconnu"],
  hi: ["प्राकृतिक", "सिंथेटिक / लैब", "नकली / कांच", "अज्ञात"],
  fa: ["طبیعی", "مصنوعی / آزمایشگاهی", "بدلی / شیشه‌ای", "نامشخص"],
  tr: ["Doğal", "Sentetik / laboratuvar", "Taklit / cam", "Bilinmiyor"],
  ru: ["Натуральный", "Синтетический / лабораторный", "Имитация / стекло", "Неизвестно"],
};

const certificateLabs = ["No certificate", "GIA", "IGI", "GRS", "SSEF", "AGL", "Gübelin", "Other lab"];

const treatmentOptions = ["Unknown", "No treatment known", "Heat", "Oil", "Dye", "Glass-filled", "Diffusion", "Irradiation"];

const metalOptions = {
  ar: ["غير موجود / حجر فقط", "ذهب", "فضة", "بلاتين", "نحاس", "معدن غير معروف"],
  en: ["None / stone only", "Gold", "Silver", "Platinum", "Copper", "Unknown metal"],
  ku: ["نییە / تەنها بەرد", "زێڕ", "زیو", "پلاتین", "مس", "کانزای نادیار"],
  fr: ["Aucun / pierre seule", "Or", "Argent", "Platine", "Cuivre", "Métal inconnu"],
  hi: ["नहीं / केवल रत्न", "सोना", "चांदी", "प्लैटिनम", "तांबा", "अज्ञात धातु"],
  fa: ["ندارد / فقط سنگ", "طلا", "نقره", "پلاتین", "مس", "فلز نامشخص"],
  tr: ["Yok / sadece taş", "Altın", "Gümüş", "Platin", "Bakır", "Bilinmeyen metal"],
  ru: ["Нет / только камень", "Золото", "Серебро", "Платина", "Медь", "Неизвестный металл"],
};

export function buildGemstoneContext(data: GemstoneFormData) {
  if (data.evaluationKind === "antique") return "";

  const lines = [
    "GEMSTONE / JEWELRY MODE:",
    "",
    "USER-PROVIDED DETAILS:",
    `Evaluation kind: ${data.evaluationKind}`,
    data.knownGemstoneType ? `Known gemstone type: ${data.knownGemstoneType}` : "",
    data.caratWeight ? `Carat weight: ${data.caratWeight}` : "",
    data.gramWeight ? `Gram weight: ${data.gramWeight}` : "",
    data.dimensionsMm ? `Dimensions in mm: ${data.dimensionsMm}` : "",
    data.color ? `Color: ${data.color}` : "",
    data.transparency ? `Transparency: ${data.transparency}` : "",
    data.cutShape ? `Cut / shape: ${data.cutShape}` : "",
    data.naturalStatus ? `Natural / synthetic status: ${data.naturalStatus}` : "",
    data.certificateLab ? `Certificate lab: ${data.certificateLab}` : "",
    data.certificateNumber ? `Certificate number: ${data.certificateNumber}` : "",
    data.treatment ? `Treatment: ${data.treatment}` : "",
    data.metalType ? `Metal type: ${data.metalType}` : "",
    "",
    "CRITICAL GEMSTONE / JEWELRY VALUATION RULES:",
    "",
    "Do NOT give one final price as if it is certain.",
    "Always provide a conditional price range with scenarios.",
    "",
    "The price estimate MUST be structured like this:",
    "",
    "1. LOW CASE:",
    "- Use this when metal purity is not verified, hallmark is missing, weight is missing, gemstone identity is uncertain, or the item appears modern/common.",
    "- Explain why this is the conservative value.",
    "",
    "2. STANDARD CASE:",
    "- Use this when the item is likely silver/gold or a known metal, the gemstone is likely identified, and condition appears good.",
    "- Explain what assumptions this price depends on.",
    "",
    "3. HIGH CASE:",
    "- Use this only if there is a clear hallmark, confirmed metal purity, strong craftsmanship, larger stone, certificate, known maker, antique age, or rare regional style.",
    "- Explain clearly that this higher value is NOT confirmed from image alone.",
    "",
    "For rings, necklaces, and gemstone jewelry, split the reasoning into:",
    "- gemstone value",
    "- metal value",
    "- craftsmanship value",
    "- age / regional / cultural style",
    "- certificate or hallmark impact",
    "- deductions caused by missing weight, missing measurements, missing hallmark, unclear treatment, or image uncertainty",
    "",
    "IMPORTANT:",
    "- Do not claim sterling silver, gold, natural gemstone, or antique age as a fact unless there is strong visual evidence or user data.",
    "- If the hallmark, metal purity, gemstone weight, dimensions, or certificate are missing, state that the valuation confidence is limited.",
    "- Never call the estimate a certified appraisal.",
    "- Ask for missing data in a practical list.",
    "",
    "For the price field, write a compact but conditional range like:",
    "Low: $X–$Y if metal/gemstone is unverified.",
    "Standard: $X–$Y if metal purity and gemstone identity are likely.",
    "High: $X–$Y only if hallmark/certificate/weight or maker is confirmed.",
    "",
    "Do not inflate value based on beauty alone.",
    "Do not reduce value too aggressively if the item may be silver, handmade, vintage, or regionally desirable.",
  ].filter(Boolean);

  return lines.join("\n");
}

export default function GemstoneFields({
  value,
  onChange,
  locale = "ar",
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const safeLocale: AppLocale = text[locale] ? locale : "ar";
  const t = text[safeLocale];
  const dir = isRtl(safeLocale) ? "rtl" : "ltr";
  const isGemMode = value.evaluationKind !== "antique";

  function update<K extends keyof GemstoneFormData>(
    key: K,
    fieldValue: GemstoneFormData[K]
  ) {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  }

  return (
    <section dir={dir} className="mt-4">
      <div className="mb-3 flex items-center gap-2 text-[#e6c089]">
        <Gem className="h-4 w-4" />
        <p className="text-[12px] font-medium tracking-[0.18em]">
          {t.typeTitle}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {(Object.keys(t.kinds) as EvaluationKind[]).map((kind) => {
          const active = value.evaluationKind === kind;
          const item = t.kinds[kind];

          return (
            <button
              key={kind}
              type="button"
              onClick={() => update("evaluationKind", kind)}
              className={[
                "min-h-[58px] rounded-2xl border px-3 py-2 text-start transition",
                active
                  ? "border-[#d6a25f]/55 bg-[#d6a25f]/14 text-[#f4d29b]"
                  : "border-white/10 bg-white/[0.035] text-white/58 hover:border-[#d6a25f]/25 hover:text-white/78",
              ].join(" ")}
            >
              <p className="text-[12.5px] font-medium leading-5">{item[0]}</p>
              <p className="mt-1 text-[10px] text-current/45">{item[1]}</p>
            </button>
          );
        })}
      </div>

      {isGemMode && (
        <div className="mt-4 border-y border-[#d6a25f]/12 py-4">
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-[#d6a25f]/12 bg-[#d6a25f]/[0.055] px-4 py-3">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#d6a25f]" />
            <p className="text-[12px] leading-6 text-white/58">{t.notice}</p>
          </div>

          <p className="mb-3 text-[13px] font-medium text-white/78">
            {t.basicTitle}
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              label={t.knownGemstoneType}
              placeholder={t.knownGemstoneTypePh}
              value={value.knownGemstoneType}
              onChange={(next) => update("knownGemstoneType", next)}
            />

            <TextField
              label={t.color}
              placeholder={t.colorPh}
              value={value.color}
              onChange={(next) => update("color", next)}
            />

            <SelectField
              label={t.certificateLab}
              selectLabel={t.select}
              value={value.certificateLab}
              options={certificateLabs}
              onChange={(next) => update("certificateLab", next)}
            />
          </div>

          <button
            type="button"
            onClick={() => setAdvancedOpen((current) => !current)}
            className="mt-4 flex h-10 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-[12px] font-medium text-white/65 transition hover:border-[#d6a25f]/25 hover:text-white/82"
          >
            <span>{advancedOpen ? t.hideAdvanced : t.showAdvanced}</span>
            <ChevronDown
              className={[
                "h-4 w-4 transition",
                advancedOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>

          {advancedOpen && (
            <div className="mt-4">
              <p className="mb-3 text-[13px] font-medium text-white/78">
                {t.advancedTitle}
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <IconTextField
                  icon={<Scale className="h-4 w-4" />}
                  label={t.caratWeight}
                  placeholder="2.35 ct"
                  value={value.caratWeight}
                  onChange={(next) => update("caratWeight", next)}
                />

                <IconTextField
                  icon={<Scale className="h-4 w-4" />}
                  label={t.gramWeight}
                  placeholder="4.8 g"
                  value={value.gramWeight}
                  onChange={(next) => update("gramWeight", next)}
                />

                <IconTextField
                  icon={<Ruler className="h-4 w-4" />}
                  label={t.dimensionsMm}
                  placeholder="12 × 8 × 5 mm"
                  value={value.dimensionsMm}
                  onChange={(next) => update("dimensionsMm", next)}
                />

                <TextField
                  label={t.cutShape}
                  placeholder="Oval, Cabochon, Round, Emerald cut"
                  value={value.cutShape}
                  onChange={(next) => update("cutShape", next)}
                />

                <SelectField
                  label={t.transparency}
                  selectLabel={t.select}
                  value={value.transparency}
                  options={transparencyOptions[safeLocale]}
                  onChange={(next) => update("transparency", next)}
                />

                <SelectField
                  label={t.naturalStatus}
                  selectLabel={t.select}
                  value={value.naturalStatus}
                  options={naturalStatusOptions[safeLocale]}
                  onChange={(next) => update("naturalStatus", next)}
                />

                <SelectField
                  label={t.treatment}
                  selectLabel={t.select}
                  value={value.treatment}
                  options={treatmentOptions}
                  onChange={(next) => update("treatment", next)}
                />

                <SelectField
                  label={t.metalType}
                  selectLabel={t.select}
                  value={value.metalType}
                  options={metalOptions[safeLocale]}
                  onChange={(next) => update("metalType", next)}
                />

                <TextField
                  label={t.certificateNumber}
                  placeholder="GIA / IGI / GRS..."
                  value={value.certificateNumber}
                  onChange={(next) => update("certificateNumber", next)}
                />
              </div>
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-[#e6c089]">
              <Sparkles className="h-4 w-4" />
              <p className="text-[12px] font-medium">{t.helpfulPhotos}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {t.photos.map((item) => (
                <span
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-[11.5px] text-white/55"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-white/48">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-[13px] text-white/76 outline-none transition placeholder:text-white/25 focus:border-[#d6a25f]/35"
      />
    </label>
  );
}

function IconTextField({
  icon,
  label,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-white/48">
        <span className="text-[#d6a25f]/70">{icon}</span>
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-[13px] text-white/76 outline-none transition placeholder:text-white/25 focus:border-[#d6a25f]/35"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  selectLabel,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  selectLabel: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-white/48">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-[13px] text-white/76 outline-none transition focus:border-[#d6a25f]/35"
      >
        <option value="">{selectLabel}</option>
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#120c08]">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}