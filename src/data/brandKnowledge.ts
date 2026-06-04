export type BrandCategory =
  | "jewelry"
  | "watches"
  | "handbags"
  | "shoes"
  | "clothing"
  | "accessories"
  | "vintage_fashion";

export type BrandKnowledge = {
  id: string;
  name: string;
  aliases: string[];
  category: BrandCategory;
  knownMarks: string[];
  authenticitySignals: string[];
  commonReplicaRisks: string[];
  requiredPhotos: string[];
  valueDrivers: string[];
  valueReducers: string[];
};

const jewelryPhotos = [
  "صورة الختم/العيار",
  "صورة المشبك",
  "صورة الرقم التسلسلي إن وجد",
  "الوزن",
  "العيار",
  "صورة العلبة أو الفاتورة",
];

const watchPhotos = [
  "صورة الواجهة",
  "صورة الخلف",
  "صورة الرقم التسلسلي",
  "صورة الحركة إن أمكن",
  "صورة السوار والمشبك",
  "العلبة والأوراق",
];

const handbagPhotos = [
  "صورة أمامية وخلفية",
  "صورة الداخل",
  "صورة السحاب",
  "صورة الختم الداخلي",
  "صورة serial/date code إن وجد",
  "صورة hardware",
  "صورة الخياطة والزوايا",
];

const shoesPhotos = [
  "صورة النعل",
  "صورة الداخل",
  "صورة المقاس",
  "صورة الخياطة",
  "صورة اللوغو",
  "صورة العلبة إن وجدت",
];

const clothingPhotos = [
  "صورة الlabel",
  "صورة tag",
  "صورة الخياطة",
  "صورة القماش",
  "صورة كاملة للقطعة",
  "المقاس والحالة",
];

export const brandKnowledge: BrandKnowledge[] = [
  {
    id: "cartier",
    name: "Cartier",
    aliases: ["Cartier", "كارتييه", "كارتير"],
    category: "jewelry",
    knownMarks: ["Cartier", "serial number", "750", "18K", "maker mark"],
    authenticitySignals: ["نقش واضح ونظيف", "رقم تسلسلي", "جودة التشطيب", "وزن مناسب", "علامات عيار للمجوهرات"],
    commonReplicaRisks: ["نقش ضعيف", "لون معدن غير ثابت", "عدم وجود رقم", "اختلاف الخط", "hardware رديء"],
    requiredPhotos: jewelryPhotos,
    valueDrivers: ["أصلية موثقة", "علبة وفاتورة", "حالة ممتازة", "موديل مطلوب", "ذهب أو أحجار مثبتة"],
    valueReducers: ["نقص التوثيق", "خدوش عميقة", "تعديل أو إصلاح", "نقش غير مطابق", "احتمال التقليد"],
  },
  {
    id: "van-cleef-arpels",
    name: "Van Cleef & Arpels",
    aliases: ["Van Cleef", "Van Cleef & Arpels", "VCA", "فان كليف"],
    category: "jewelry",
    knownMarks: ["VCA", "Van Cleef & Arpels", "serial number", "750"],
    authenticitySignals: ["تشطيب ناعم", "تناظر عالي", "ختم واضح", "رقم تسلسلي", "علبة أو شهادة"],
    commonReplicaRisks: ["حواف خشنة", "شعار غير دقيق", "مقاسات غير متناسقة", "غياب رقم تسلسلي"],
    requiredPhotos: jewelryPhotos,
    valueDrivers: ["مجموعة Alhambra", "توثيق", "حالة ممتازة", "أحجار أصلية"],
    valueReducers: ["تلف الحجر", "نقص الشهادة", "تعديل غير موثق", "تقليد محتمل"],
  },
  {
    id: "bvlgari",
    name: "Bvlgari",
    aliases: ["Bvlgari", "Bulgari", "بلغاري"],
    category: "jewelry",
    knownMarks: ["BVLGARI", "Bvlgari", "750", "serial number"],
    authenticitySignals: ["نقش BVLGARI متوازن", "وزن جيد", "ختم عيار", "تشطيب فاخر"],
    commonReplicaRisks: ["حروف غير متساوية", "طلاء ضعيف", "غياب الختم", "وزن خفيف"],
    requiredPhotos: jewelryPhotos,
    valueDrivers: ["تصميم Serpenti أو B.zero1", "توثيق", "ذهب/ألماس مثبت"],
    valueReducers: ["خدوش", "حجم غير مرغوب", "عدم وجود أوراق", "اشتباه تقليد"],
  },
  {
    id: "tiffany",
    name: "Tiffany & Co.",
    aliases: ["Tiffany", "Tiffany & Co.", "تيفاني"],
    category: "jewelry",
    knownMarks: ["Tiffany & Co.", "925", "750", "PT950"],
    authenticitySignals: ["ختم واضح", "فضة 925 أو ذهب 750", "تشطيب نظيف", "علبة زرقاء أصلية"],
    commonReplicaRisks: ["ختم ضبابي", "لون فضة غير ثابت", "وصلات ضعيفة", "علبة غير مطابقة"],
    requiredPhotos: jewelryPhotos,
    valueDrivers: ["تصميم معروف", "علبة وفاتورة", "حالة ممتازة", "مقاس مطلوب"],
    valueReducers: ["تأكسد شديد", "نقص التوثيق", "إصلاح", "تقليد محتمل"],
  },
  {
    id: "rolex",
    name: "Rolex",
    aliases: ["Rolex", "رولكس"],
    category: "watches",
    knownMarks: ["Rolex", "serial number", "model number", "crown logo"],
    authenticitySignals: ["رقم موديل", "رقم تسلسلي", "حركة متقنة", "تاج وشعار دقيق", "علبة وأوراق"],
    commonReplicaRisks: ["عدسة تاريخ ضعيفة", "وزن غير مناسب", "شعار غير دقيق", "حركة غير أصلية"],
    requiredPhotos: watchPhotos,
    valueDrivers: ["علبة وأوراق", "موديل مطلوب", "حالة أصلية", "سوار أصلي", "صيانة موثقة"],
    valueReducers: ["قطع aftermarket", "تلميع زائد", "غياب الرقم", "تلف الميناء", "تقليد محتمل"],
  },
  {
    id: "omega",
    name: "Omega",
    aliases: ["Omega", "أوميغا", "اوميغا"],
    category: "watches",
    knownMarks: ["Omega", "serial number", "Speedmaster", "Seamaster"],
    authenticitySignals: ["حركة موقعة", "رقم تسلسلي", "مينا متناسق", "سوار ومشبك أصلي"],
    commonReplicaRisks: ["مينا معاد طباعته", "حركة غير مطابقة", "قطع بديلة", "غياب الرقم"],
    requiredPhotos: watchPhotos,
    valueDrivers: ["Speedmaster/Seamaster", "علبة وأوراق", "حالة أصلية", "Vintage مرغوب"],
    valueReducers: ["تعديل", "تلف المينا", "تلميع زائد", "نقص التوثيق"],
  },
  {
    id: "patek-philippe",
    name: "Patek Philippe",
    aliases: ["Patek Philippe", "Patek", "باتيك فيليب"],
    category: "watches",
    knownMarks: ["Patek Philippe", "serial number", "movement number"],
    authenticitySignals: ["حركة عالية التشطيب", "أرقام موثقة", "ختم العلبة", "أوراق أصلية"],
    commonReplicaRisks: ["حركة غير موقعة", "خط غير مطابق", "علبة غير دقيقة", "غياب أوراق"],
    requiredPhotos: watchPhotos,
    valueDrivers: ["أوراق أصلية", "موديل نادر", "حالة ممتازة", "أصلية كاملة"],
    valueReducers: ["غياب التوثيق", "قطع بديلة", "تلف", "تقليد محتمل"],
  },
  {
    id: "audemars-piguet",
    name: "Audemars Piguet",
    aliases: ["Audemars Piguet", "AP", "أوديمار بيغه"],
    category: "watches",
    knownMarks: ["AP", "Audemars Piguet", "serial number", "Royal Oak"],
    authenticitySignals: ["براغي ومحاذاة دقيقة", "حركة موقعة", "رقم تسلسلي", "تشطيب السوار"],
    commonReplicaRisks: ["براغي غير متناسقة", "حواف خشنة", "حركة غير أصلية", "غياب رقم"],
    requiredPhotos: watchPhotos,
    valueDrivers: ["Royal Oak", "علبة وأوراق", "حالة ممتازة", "ندرة"],
    valueReducers: ["تلميع مفرط", "قطع بديلة", "نقص أوراق", "تقليد محتمل"],
  },
  {
    id: "chanel",
    name: "Chanel",
    aliases: ["Chanel", "شانيل"],
    category: "handbags",
    knownMarks: ["Chanel", "CC logo", "serial sticker", "authenticity card"],
    authenticitySignals: ["خياطة منتظمة", "جلد فاخر", "hardware ثقيل", "ختم داخلي", "رقم/بطاقة"],
    commonReplicaRisks: ["خياطة غير متساوية", "شعار غير متوازن", "سلسلة خفيفة", "رقم غير مطابق"],
    requiredPhotos: handbagPhotos,
    valueDrivers: ["Classic Flap", "حالة ممتازة", "بطاقة/فاتورة", "جلد مرغوب", "Vintage أصلي"],
    valueReducers: ["تلف الزوايا", "رائحة أو بقع", "غياب الرقم", "تقليد محتمل"],
  },
  {
    id: "hermes",
    name: "Hermès",
    aliases: ["Hermes", "Hermès", "هرمز", "إرمس", "ايرمس"],
    category: "handbags",
    knownMarks: ["Hermes Paris", "date stamp", "blind stamp", "craftsman stamp"],
    authenticitySignals: ["خياطة saddle دقيقة", "ختم داخلي", "hardware عالي", "جلد فاخر", "date stamp"],
    commonReplicaRisks: ["ختم ضعيف", "خياطة آلية رديئة", "جلد غير مناسب", "hardware خفيف"],
    requiredPhotos: handbagPhotos,
    valueDrivers: ["Birkin/Kelly", "جلد نادر", "حالة ممتازة", "علبة وفاتورة", "لون مطلوب"],
    valueReducers: ["تلف الزوايا", "إصلاح غير موثق", "نقص الملحقات", "تقليد محتمل"],
  },
  {
    id: "louis-vuitton",
    name: "Louis Vuitton",
    aliases: ["Louis Vuitton", "LV", "لويس فيتون"],
    category: "handbags",
    knownMarks: ["Louis Vuitton Paris", "date code", "made in", "LV monogram"],
    authenticitySignals: ["محاذاة المونوغرام", "ختم داخلي", "date code أو microchip", "hardware جيد"],
    commonReplicaRisks: ["نقشة غير متناسقة", "خياطة ضعيفة", "date code غير منطقي", "جلد رديء"],
    requiredPhotos: handbagPhotos,
    valueDrivers: ["موديل مطلوب", "حالة ممتازة", "ملحقات", "Vintage مرغوب"],
    valueReducers: ["تلف canvas", "تشقق", "بقع", "غياب توثيق", "تقليد محتمل"],
  },
  {
    id: "gucci",
    name: "Gucci",
    aliases: ["Gucci", "غوتشي", "جوتشي"],
    category: "handbags",
    knownMarks: ["Gucci", "serial number", "GG logo", "Made in Italy"],
    authenticitySignals: ["رقم داخلي", "خياطة جيدة", "hardware متقن", "بطانة مناسبة"],
    commonReplicaRisks: ["رقم عشوائي", "شعار غير دقيق", "خياطة ضعيفة", "مواد رديئة"],
    requiredPhotos: handbagPhotos,
    valueDrivers: ["موديل مطلوب", "حالة ممتازة", "Vintage Tom Ford", "علبة/فاتورة"],
    valueReducers: ["تآكل", "بقع", "نقص التوثيق", "تقليد محتمل"],
  },
  {
    id: "prada",
    name: "Prada",
    aliases: ["Prada", "برادا"],
    category: "handbags",
    knownMarks: ["Prada Milano", "Made in Italy", "triangle logo"],
    authenticitySignals: ["لوحة شعار دقيقة", "بطانة موقعة", "hardware جيد", "بطاقة داخلية"],
    commonReplicaRisks: ["مثلث غير دقيق", "بطانة خاطئة", "خياطة رديئة", "hardware خفيف"],
    requiredPhotos: handbagPhotos,
    valueDrivers: ["Nylon vintage", "حالة ممتازة", "ملحقات", "موديل مطلوب"],
    valueReducers: ["تلف النايلون", "بقع", "نقص البطاقة", "تقليد محتمل"],
  },
  {
    id: "dior",
    name: "Dior",
    aliases: ["Dior", "ديور", "Christian Dior"],
    category: "clothing",
    knownMarks: ["Dior", "Christian Dior", "Made in France/Italy"],
    authenticitySignals: ["label صحيح", "خياطة دقيقة", "قماش فاخر", "tag متناسق"],
    commonReplicaRisks: ["label خاطئ", "خط غير مطابق", "قماش ضعيف", "خياطة غير نظيفة"],
    requiredPhotos: clothingPhotos,
    valueDrivers: ["قطعة runway", "Vintage موثق", "حالة ممتازة", "مقاس مرغوب"],
    valueReducers: ["تلف القماش", "تعديلات", "بقع", "نقص label"],
  },
  {
    id: "fendi",
    name: "Fendi",
    aliases: ["Fendi", "فندي"],
    category: "accessories",
    knownMarks: ["Fendi", "FF logo", "serial number", "Made in Italy"],
    authenticitySignals: ["شعار دقيق", "ختم داخلي", "hardware جيد", "خياطة منتظمة"],
    commonReplicaRisks: ["FF غير متناسق", "مواد ضعيفة", "رقم غير منطقي", "خياطة سيئة"],
    requiredPhotos: handbagPhotos,
    valueDrivers: ["Baguette", "Vintage", "حالة ممتازة", "توثيق"],
    valueReducers: ["تلف الزوايا", "بقع", "نقص التوثيق", "تقليد محتمل"],
  },
  {
    id: "schiaparelli",
    name: "Schiaparelli",
    aliases: ["Schiaparelli", "سكياباريلي"],
    category: "vintage_fashion",
    knownMarks: ["Schiaparelli", "Paris", "label"],
    authenticitySignals: ["label صحيح", "تصميم فني مميز", "خياطة عالية", "توثيق أو provenance"],
    commonReplicaRisks: ["label مضاف", "قماش حديث", "خياطة غير مطابقة", "نقص provenance"],
    requiredPhotos: clothingPhotos,
    valueDrivers: ["قطعة نادرة", "تصميم أرشيفي", "حالة ممتازة", "توثيق"],
    valueReducers: ["تعديلات كبيرة", "بقع", "تلف", "نقص label"],
  },
  {
    id: "vintage-nike",
    name: "Vintage Nike",
    aliases: ["Nike", "Vintage Nike", "نايك"],
    category: "shoes",
    knownMarks: ["Nike", "Swoosh", "size tag", "production code"],
    authenticitySignals: ["tag صحيح", "شكل النعل", "خياطة جيدة", "علبة أو كود إنتاج"],
    commonReplicaRisks: ["tag مزيف", "نعل غير مطابق", "شعار غير دقيق", "مواد رديئة"],
    requiredPhotos: shoesPhotos,
    valueDrivers: ["موديل نادر", "حالة deadstock", "علبة أصلية", "مقاس مطلوب"],
    valueReducers: ["تفتت النعل", "تآكل", "غياب العلبة", "تقليد محتمل"],
  },
  {
    id: "vintage-adidas",
    name: "Vintage Adidas",
    aliases: ["Adidas", "Vintage Adidas", "أديداس", "اديداس"],
    category: "shoes",
    knownMarks: ["Adidas", "Trefoil", "size tag", "production code"],
    authenticitySignals: ["tag صحيح", "شعار Trefoil دقيق", "خياطة جيدة", "نعل مطابق"],
    commonReplicaRisks: ["tag غير صحيح", "شعار ضعيف", "نعل مختلف", "مواد رديئة"],
    requiredPhotos: shoesPhotos,
    valueDrivers: ["موديل vintage", "حالة ممتازة", "علبة أصلية", "مقاس مرغوب"],
    valueReducers: ["تلف النعل", "بقع", "نقص label", "تقليد محتمل"],
  },
];
