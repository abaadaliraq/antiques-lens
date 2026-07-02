import type { AnalysisResult } from "./types";

export const content = {
  ar: {
    dir: "rtl",
    new: "تقييم جديد",
    archive: "أرشيف القطع",
    emptyArchive: "لا توجد تقييمات بعد.",
    clearArchive: "مسح",
    openArchive: "الأرشيف",
    badge: "KISHIB",
    sub: "منصة تقييم التحف والقطع التراثية",
    title: "قيّم أي قطعة تحفية أو تراثية",
    hint: "ارفع صورة واضحة أو التقط صورة للقطعة، وسنحاول تحديد العمر، المادة، الحالة، السعر، والقطع المشابهة.",
    placeholder: "اكتب أي معلومة تعرفها عن القطعة...",
    upload: "رفع صورة",
    camera: "الكاميرا",
    send: "تحليل",
    analyzing: "جاري التحليل...",
    emptyError: "أضف وصفاً أو ارفع صورة للقطعة أولاً.",
    imageReady: "الصورة مرفقة",
    footer: "لنتيجة أدق: صورة كاملة + صورة للختم أو التوقيع إن وجد.",
    result: "نتيجة أولية",
    age: "العمر / الحقبة",
    value: "السعر التقريبي",
    material: "المادة",
    origin: "المنشأ",
    lookup: "التعريف",
    historicalReading: "القراءة التاريخية المحتملة",
    description: "الوصف والتحليل",
    condition: "الحالة الظاهرة",
    authenticity: "مؤشرات الأصالة",
    safeInitialChecks: "فحوصات أولية آمنة",
    safeInitialChecksNote: "هذه الفحوصات لا تثبت الأصالة نهائيًا، لكنها تساعدك على جمع معلومات أوضح قبل الفحص المختص.",
    carePreservation: "العناية والحفظ",
    carePreservationNote: "هذه النصائح تساعد على تقليل الضرر، لكنها لا تغني عن مختص عند التعامل مع القطع الحساسة أو عالية القيمة.",
    priceReason: "سبب السعر",
    valueDrivers: "ما الذي يرفع القيمة؟",
    valueReducers: "ما الذي يخفض القيمة؟",
    similar: "قطع مشابهة",
    similarHint: "ستظهر هنا صور وأسعار وروابط حقيقية عند توفر مصادر مشابهة.",
    soon: "قريباً",
    neededPhotos: "صور مطلوبة لتقييم أدق",
    followUp: "السؤال التالي",
    confidence: "درجة الثقة",
    share: "مشاركة",
    addInfo: "جلسة تقييم ذكية",
    notice: "التقييم استرشادي ولا يعتبر شهادة أصالة أو تسعيراً نهائياً.",
  },

  en: {
    dir: "ltr",
    new: "New evaluation",
    archive: "Pieces archive",
    emptyArchive: "No evaluations yet.",
    clearArchive: "Clear",
    openArchive: "Archive",
    badge: "KISHIB",
    sub: "Antiques and heritage objects evaluator",
    title: "Evaluate any antique or heritage object",
    hint: "Upload or capture a clear image, and we will estimate age, material, condition, value, and similar references.",
    placeholder: "Add anything you know about the item...",
    upload: "Upload image",
    camera: "Camera",
    send: "Analyze",
    analyzing: "Analyzing...",
    emptyError: "Add a description or upload an image first.",
    imageReady: "Image attached",
    footer: "For better accuracy: full image + mark or signature if available.",
    result: "Initial result",
    age: "Age / Period",
    value: "Estimated value",
    material: "Material",
    origin: "Origin",
    lookup: "Identification",
    historicalReading: "Possible historical reading",
    description: "Description and analysis",
    condition: "Visible condition",
    authenticity: "Authenticity indicators",
    safeInitialChecks: "Safe Initial Checks",
    safeInitialChecksNote: "These checks do not prove authenticity, but they can help you collect clearer information before expert inspection.",
    carePreservation: "Care & Preservation",
    carePreservationNote: "These tips help reduce damage, but they do not replace expert care for sensitive or high-value items.",
    priceReason: "Price reasoning",
    valueDrivers: "What increases value?",
    valueReducers: "What reduces value?",
    similar: "Similar pieces",
    similarHint: "Real images, prices, and links will appear here when similar sources are available.",
    soon: "Soon",
    neededPhotos: "Photos needed for better evaluation",
    followUp: "Next question",
    confidence: "Confidence",
    share: "Share",
    addInfo: "Smart evaluation session",
    notice: "This is an indicative evaluation, not an authenticity certificate or final appraisal.",
  },

  fr: {
    dir: "ltr",
    new: "Nouvelle évaluation",
    archive: "Archive des pièces",
    emptyArchive: "Aucune évaluation pour le moment.",
    clearArchive: "Effacer",
    openArchive: "Archive",
    badge: "KISHIB",
    sub: "Évaluateur d’antiquités et d’objets patrimoniaux",
    title: "Évaluez n’importe quelle antiquité ou pièce patrimoniale",
    hint: "Ajoutez ou prenez une image claire, et nous estimerons l’âge, la matière, l’état, la valeur et les références similaires.",
    placeholder: "Ajoutez ce que vous savez sur la pièce...",
    upload: "Ajouter une image",
    camera: "Caméra",
    send: "Analyser",
    analyzing: "Analyse en cours...",
    emptyError: "Ajoutez d’abord une description ou une image.",
    imageReady: "Image jointe",
    footer: "Pour plus de précision : image complète + marque ou signature si disponible.",
    result: "Résultat initial",
    age: "Âge / Période",
    value: "Valeur estimée",
    material: "Matière",
    origin: "Origine",
    lookup: "Identification",
    historicalReading: "Lecture historique possible",
    description: "Description et analyse",
    condition: "État visible",
    authenticity: "Indices d’authenticité",
    safeInitialChecks: "Vérifications initiales sûres",
    safeInitialChecksNote: "Ces vérifications ne prouvent pas l’authenticité, mais elles peuvent aider à collecter des informations plus claires avant l’examen d’un spécialiste.",
    carePreservation: "Soin et conservation",
    carePreservationNote: "Ces conseils aident à réduire les risques de dommage, mais ils ne remplacent pas l’avis d’un spécialiste pour les pièces sensibles ou de grande valeur.",
    priceReason: "Justification du prix",
    valueDrivers: "Ce qui augmente la valeur",
    valueReducers: "Ce qui réduit la valeur",
    similar: "Pièces similaires",
    similarHint: "Les images, prix et liens réels apparaîtront ici lorsque des sources similaires seront disponibles.",
    soon: "Bientôt",
    neededPhotos: "Photos nécessaires pour une meilleure évaluation",
    followUp: "Question suivante",
    confidence: "Confiance",
    share: "Partager",
    addInfo: "Ajouter info",
    notice: "Cette évaluation est indicative et ne constitue pas un certificat d’authenticité ni une estimation finale.",
  },

  hi: {
    dir: "ltr",
    new: "नया मूल्यांकन",
    archive: "वस्तुओं का संग्रह",
    emptyArchive: "अभी कोई मूल्यांकन नहीं है.",
    clearArchive: "साफ़ करें",
    openArchive: "संग्रह",
    badge: "KISHIB",
    sub: "प्राचीन और विरासत वस्तुओं का मूल्यांकन",
    title: "किसी भी प्राचीन या विरासत वस्तु का मूल्यांकन करें",
    hint: "एक साफ़ तस्वीर अपलोड करें या लें, और हम उम्र, सामग्री, स्थिति, मूल्य और मिलती-जुलती वस्तुओं का अनुमान लगाएंगे.",
    placeholder: "वस्तु के बारे में जो भी जानकारी हो लिखें...",
    upload: "तस्वीर अपलोड करें",
    camera: "कैमरा",
    send: "विश्लेषण करें",
    analyzing: "विश्लेषण हो रहा है...",
    emptyError: "पहले विवरण जोड़ें या वस्तु की तस्वीर अपलोड करें.",
    imageReady: "तस्वीर संलग्न है",
    footer: "अधिक सटीक परिणाम के लिए: पूरी तस्वीर + मुहर या हस्ताक्षर की तस्वीर यदि उपलब्ध हो.",
    result: "प्रारंभिक परिणाम",
    age: "उम्र / काल",
    value: "अनुमानित मूल्य",
    material: "सामग्री",
    origin: "उत्पत्ति",
    lookup: "पहचान",
    historicalReading: "संभावित ऐतिहासिक पढ़त",
    description: "विवरण और विश्लेषण",
    condition: "दिखाई देने वाली स्थिति",
    authenticity: "प्रामाणिकता संकेत",
    safeInitialChecks: "सुरक्षित प्रारंभिक जाँच",
    safeInitialChecksNote: "ये जाँचें प्रामाणिकता को अंतिम रूप से सिद्ध नहीं करतीं, लेकिन विशेषज्ञ जाँच से पहले स्पष्ट जानकारी जुटाने में मदद कर सकती हैं.",
    carePreservation: "देखभाल और संरक्षण",
    carePreservationNote: "ये सुझाव नुकसान कम करने में मदद करते हैं, लेकिन संवेदनशील या अधिक मूल्य वाली वस्तुओं के लिए विशेषज्ञ देखभाल का विकल्प नहीं हैं.",
    priceReason: "मूल्य का कारण",
    valueDrivers: "मूल्य क्या बढ़ाता है?",
    valueReducers: "मूल्य क्या घटाता है?",
    similar: "मिलती-जुलती वस्तुएं",
    similarHint: "जब समान स्रोत उपलब्ध होंगे, वास्तविक तस्वीरें, कीमतें और लिंक यहाँ दिखाई देंगे.",
    soon: "जल्द",
    neededPhotos: "अधिक सटीक मूल्यांकन के लिए आवश्यक तस्वीरें",
    followUp: "अगला प्रश्न",
    confidence: "विश्वास स्तर",
    share: "साझा करें",
    addInfo: "जानकारी जोड़ें",
    notice: "यह केवल एक मार्गदर्शक मूल्यांकन है, प्रामाणिकता प्रमाणपत्र या अंतिम मूल्यांकन नहीं.",
  },

  fa: {
    dir: "rtl",
    new: "ارزیابی جدید",
    archive: "آرشیو قطعات",
    emptyArchive: "هنوز هیچ ارزیابی وجود ندارد.",
    clearArchive: "پاک کردن",
    openArchive: "آرشیو",
    badge: "KISHIB",
    sub: "ارزیاب اشیای عتیقه و میراثی",
    title: "هر قطعه عتیقه یا میراثی را ارزیابی کنید",
    hint: "یک تصویر واضح بارگذاری کنید یا عکس بگیرید تا سن، جنس، وضعیت، ارزش و نمونه‌های مشابه تخمین زده شود.",
    placeholder: "هر اطلاعاتی درباره قطعه می‌دانید بنویسید...",
    upload: "بارگذاری تصویر",
    camera: "دوربین",
    send: "تحلیل",
    analyzing: "در حال تحلیل...",
    emptyError: "ابتدا توضیح اضافه کنید یا تصویر قطعه را بارگذاری کنید.",
    imageReady: "تصویر پیوست شد",
    footer: "برای دقت بیشتر: تصویر کامل + تصویر مهر یا امضا در صورت وجود.",
    result: "نتیجه اولیه",
    age: "سن / دوره",
    value: "ارزش تقریبی",
    material: "جنس",
    origin: "منشأ",
    lookup: "شناسایی",
    historicalReading: "خوانش تاریخی احتمالی",
    description: "توضیح و تحلیل",
    condition: "وضعیت ظاهری",
    authenticity: "نشانه‌های اصالت",
    safeInitialChecks: "بررسی‌های اولیه ایمن",
    safeInitialChecksNote: "این بررسی‌ها اصالت را به‌طور قطعی ثابت نمی‌کنند، اما می‌توانند پیش از بررسی تخصصی به گردآوری اطلاعات روشن‌تر کمک کنند.",
    carePreservation: "مراقبت و نگهداری",
    carePreservationNote: "این نکات به کاهش آسیب کمک می‌کنند، اما برای قطعات حساس یا ارزشمند جایگزین مراقبت متخصص نیستند.",
    priceReason: "دلیل قیمت",
    valueDrivers: "چه چیزی ارزش را افزایش می‌دهد؟",
    valueReducers: "چه چیزی ارزش را کاهش می‌دهد؟",
    similar: "قطعات مشابه",
    similarHint: "در صورت وجود منابع مشابه، تصاویر، قیمت‌ها و لینک‌های واقعی اینجا نمایش داده می‌شوند.",
    soon: "به‌زودی",
    neededPhotos: "تصاویر مورد نیاز برای ارزیابی دقیق‌تر",
    followUp: "پرسش بعدی",
    confidence: "سطح اطمینان",
    share: "اشتراک‌گذاری",
    addInfo: "افزودن اطلاعات",
    notice: "این ارزیابی فقط راهنماست و گواهی اصالت یا قیمت‌گذاری نهایی محسوب نمی‌شود.",
  },

  tr: {
    dir: "ltr",
    new: "Yeni değerlendirme",
    archive: "Parça arşivi",
    emptyArchive: "Henüz değerlendirme yok.",
    clearArchive: "Temizle",
    openArchive: "Arşiv",
    badge: "KISHIB",
    sub: "Antika ve kültürel miras objeleri değerlendiricisi",
    title: "Herhangi bir antika ya da miras parçasını değerlendir",
    hint: "Net bir görsel yükleyin veya fotoğraf çekin; yaş, malzeme, durum, değer ve benzer referansları tahmin edelim.",
    placeholder: "Parça hakkında bildiğiniz herhangi bir bilgiyi yazın...",
    upload: "Görsel yükle",
    camera: "Kamera",
    send: "Analiz et",
    analyzing: "Analiz ediliyor...",
    emptyError: "Önce bir açıklama ekleyin veya parçanın görselini yükleyin.",
    imageReady: "Görsel eklendi",
    footer: "Daha doğru sonuç için: tam görsel + varsa damga veya imza görseli.",
    result: "İlk sonuç",
    age: "Yaş / Dönem",
    value: "Tahmini değer",
    material: "Malzeme",
    origin: "Köken",
    lookup: "Tanımlama",
    historicalReading: "Olası tarihsel okuma",
    description: "Açıklama ve analiz",
    condition: "Görünen durum",
    authenticity: "Özgünlük göstergeleri",
    safeInitialChecks: "Güvenli ilk kontroller",
    safeInitialChecksNote: "Bu kontroller özgünlüğü kesin olarak kanıtlamaz, ancak uzman incelemesinden önce daha net bilgi toplamanıza yardımcı olabilir.",
    carePreservation: "Bakım ve koruma",
    carePreservationNote: "Bu öneriler hasarı azaltmaya yardımcı olur, ancak hassas veya yüksek değerli parçalar için uzman bakımının yerini tutmaz.",
    priceReason: "Fiyat gerekçesi",
    valueDrivers: "Değeri ne artırır?",
    valueReducers: "Değeri ne düşürür?",
    similar: "Benzer parçalar",
    similarHint: "Benzer kaynaklar bulunduğunda gerçek görseller, fiyatlar ve bağlantılar burada görünür.",
    soon: "Yakında",
    neededPhotos: "Daha doğru değerlendirme için gerekli fotoğraflar",
    followUp: "Sonraki soru",
    confidence: "Güven seviyesi",
    share: "Paylaş",
    addInfo: "Bilgi ekle",
    notice: "Bu yalnızca yönlendirici bir değerlendirmedir; özgünlük sertifikası veya kesin fiyatlandırma değildir.",
  },

  ru: {
    dir: "ltr",
    new: "Новая оценка",
    archive: "Архив предметов",
    emptyArchive: "Оценок пока нет.",
    clearArchive: "Очистить",
    openArchive: "Архив",
    badge: "KISHIB",
    sub: "Оценка антиквариата и предметов наследия",
    title: "Оцените любой антикварный или культурный предмет",
    hint: "Загрузите или сделайте чёткое фото, и мы оценим возраст, материал, состояние, стоимость и похожие примеры.",
    placeholder: "Добавьте любую известную информацию о предмете...",
    upload: "Загрузить фото",
    camera: "Камера",
    send: "Анализировать",
    analyzing: "Анализ...",
    emptyError: "Сначала добавьте описание или загрузите фото предмета.",
    imageReady: "Изображение добавлено",
    footer: "Для большей точности: полное фото + фото клейма или подписи, если есть.",
    result: "Первичный результат",
    age: "Возраст / Период",
    value: "Ориентировочная стоимость",
    material: "Материал",
    origin: "Происхождение",
    lookup: "Идентификация",
    historicalReading: "Возможное историческое прочтение",
    description: "Описание и анализ",
    condition: "Видимое состояние",
    authenticity: "Признаки подлинности",
    safeInitialChecks: "Безопасные первичные проверки",
    safeInitialChecksNote: "Эти проверки не доказывают подлинность окончательно, но помогают собрать более ясную информацию перед экспертным осмотром.",
    carePreservation: "Уход и сохранность",
    carePreservationNote: "Эти советы помогают снизить риск повреждений, но не заменяют работу специалиста с хрупкими или ценными предметами.",
    priceReason: "Обоснование цены",
    valueDrivers: "Что повышает стоимость?",
    valueReducers: "Что снижает стоимость?",
    similar: "Похожие предметы",
    similarHint: "Когда будут доступны похожие источники, здесь появятся реальные изображения, цены и ссылки.",
    soon: "Скоро",
    neededPhotos: "Фото, нужные для точной оценки",
    followUp: "Следующий вопрос",
    confidence: "Уровень уверенности",
    share: "Поделиться",
    addInfo: "Добавить информацию",
    notice: "Это ориентировочная оценка, а не сертификат подлинности и не окончательная стоимость.",
  },

  ku: {
    dir: "rtl",
    new: "هەڵسەنگاندنی نوێ",
    archive: "ئەرشیفی پارچەکان",
    emptyArchive: "هێشتا هیچ هەڵسەنگاندنێک نییە.",
    clearArchive: "سڕینەوە",
    openArchive: "ئەرشیف",
    badge: "KISHIB",
    sub: "هەڵسەنگێنەری پارچە کۆن و کەلەپوورییەکان",
    title: "هەر پارچەیەکی کۆن یان کەلەپووری هەڵبسەنگێنە",
    hint: "وێنەیەکی ڕوون باربکە یان وێنە بگرە، هەوڵ دەدەین تەمەن، مادە، دۆخ، نرخ و نموونە هاوشێوەکان دیاری بکەین.",
    placeholder: "هەر زانیارییەک لەسەر پارچەکە دەزانیت بنووسە...",
    upload: "بارکردنی وێنە",
    camera: "کامێرا",
    send: "شیکردنەوە",
    analyzing: "شیکردنەوە...",
    emptyError: "سەرەتا وەسفێک زیاد بکە یان وێنەیەک باربکە.",
    imageReady: "وێنە هاوپێچ کرا",
    footer: "بۆ ئەنجامی وردتر: وێنەی تەواو + وێنەی مۆر یان واژۆ ئەگەر هەبوو.",
    result: "ئەنجامی سەرەتایی",
    age: "تەمەن / سەردەم",
    value: "نرخی نزیک",
    material: "مادە",
    origin: "سەرچاوە",
    lookup: "ناسینەوە",
    historicalReading: "خوێندنەوەی مێژووییی ئەگەری",
    description: "وەسف و شیکردنەوە",
    condition: "دۆخی دیار",
    authenticity: "نیشانەکانی ڕەسەنایەتی",
    safeInitialChecks: "پشکنینی سەرەتاییی ئارام",
    safeInitialChecksNote: "ئەم پشکنینانە ڕەسەنایەتی بە شێوەی کۆتایی ناسەلمێنن، بەڵام دەتوانن پێش پشکنینی پسپۆڕ زانیاریی ڕوونتر کۆبکەنەوە.",
    carePreservation: "چاودێری و پاراستن",
    carePreservationNote: "ئەم ڕێنماییانە یارمەتیدەرن بۆ کەمکردنەوەی زیان، بەڵام جێگری چاودێری پسپۆڕ نین بۆ پارچەی هەستیار یان بەهای بەرز.",
    priceReason: "هۆکاری نرخ",
    valueDrivers: "چی نرخ زیاد دەکات؟",
    valueReducers: "چی نرخ کەم دەکات؟",
    similar: "پارچەی هاوشێوە",
    similarHint: "کاتێک سەرچاوەی هاوشێوە بەردەست بێت، وێنە و نرخ و لینکە ڕاستەقینەکان لێرە دەردەکەون.",
    soon: "بە زوویی",
    neededPhotos: "وێنەی پێویست بۆ هەڵسەنگاندنی وردتر",
    followUp: "پرسیاری دواتر",
    confidence: "ئاستی دڵنیایی",
    share: "هاوبەشکردن",
    addInfo: "زانیاری زیاد بکە",
    notice: "ئەمە هەڵسەنگاندنێکی ڕێنماییە، نە بڕوانامەی ڕەسەنایەتی یان نرخاندنی کۆتایی.",
  },
} as const;

export type ContentItem = (typeof content)[keyof typeof content];

function looksMojibake(value: string) {
  return /(?:\u00d8|\u00d9|\u00da|\u00db|\u00c3|\u00c2|Ø|Ù|Û|Ã|Â|Ð|Ñ|�)/.test(value);
}

function mojibakeScore(value: string) {
  return (
    value.match(
      /(?:\u00d8|\u00d9|\u00da|\u00db|\u00c3|\u00c2|Ø|Ù|Û|Ã|Â|Ð|Ñ|�)/g,
    )?.length || 0
  );
}

function repairMojibakeText(value: string): string {
  if (!looksMojibake(value)) return value;

  try {
    let best = value;
    let bestScore = mojibakeScore(value);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const bytes = Uint8Array.from(best, (char) => char.charCodeAt(0) & 0xff);
      const repaired = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      const score = mojibakeScore(repaired);

      if (score >= bestScore) break;

      best = repaired;
      bestScore = score;

      if (score === 0) break;
    }

    return bestScore === 0 ? best : "";
  } catch {
    return "";
  }
}

function repairText(value: unknown): unknown {
  if (typeof value === "string") return repairMojibakeText(value);
  if (Array.isArray(value)) return value.map(repairText);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      repairText(entry),
    ]),
  );
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim()
    ? rewriteRespectfulUserWording(repairMojibakeText(value))
    : fallback;
}

function textArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => repairMojibakeText(item))
        .map((item) => rewriteRespectfulUserWording(item))
    : [];
}

function rewriteRespectfulUserWording(value: string) {
  if (!value) return value;

  return value
    .replace(/\bthe user claims that\b/gi, "Based on the information you added")
    .replace(/\bthe user claims\b/gi, "Based on the information you added")
    .replace(/\buser claims that\b/gi, "Based on the information you added")
    .replace(/\buser claims\b/gi, "Based on the information you added")
    .replace(/\baccording to the user's claim\b/gi, "Based on the information you added")
    .replace(/\ballegedly\b/gi, "if confirmed")
    .replace(/المستخدم\s+يدعي\s+أن/gi, "ذكرت أن")
    .replace(/يدعي\s+المستخدم\s+أن/gi, "ذكرت أن")
    .replace(/المستخدم\s+يدعي/gi, "حسب المعلومة التي أضفتها")
    .replace(/ادعى\s+المستخدم/gi, "ذكرت")
    .replace(/يدّعي\s+المستخدم/gi, "ذكرت")
    .replace(/(?:فنان\s+غير\s+معروف|لا\s+يعرف\s+الفنان|التوقيع\s+غير\s+معروف)/gi, "لم يتم التعرف على الفنان من الصورة وحدها. ننصح بإرفاق صورة قريبة للتوقيع، خلفية اللوحة، شهادة الاقتناء إن وجدت، أو اسم المعرض/الفنان.")
    .replace(/(?:unknown artist|artist unknown)/gi, "The artist could not be identified from the image alone. The work may belong to a local or contemporary artist whose information is not widely available in public databases.");
}

function cleanBrandAssessment(value: AnalysisResult["brandAssessment"]) {
  if (!value) return value;

  return {
    ...value,
    possibleBrand: rewriteRespectfulUserWording(value.possibleBrand || ""),
    category: rewriteRespectfulUserWording(value.category || ""),
    authenticityStatus: rewriteRespectfulUserWording(value.authenticityStatus || ""),
    priceScenario: rewriteRespectfulUserWording(value.priceScenario || ""),
    missingEvidence: Array.isArray(value.missingEvidence)
      ? value.missingEvidence.map((item) => rewriteRespectfulUserWording(item))
      : value.missingEvidence,
    requiredPhotos: Array.isArray(value.requiredPhotos)
      ? value.requiredPhotos.map((item) => rewriteRespectfulUserWording(item))
      : value.requiredPhotos,
  };
}

export function normalizeResult(data: Partial<AnalysisResult>): AnalysisResult {
  const repairedData = repairText(data) as Partial<AnalysisResult>;

  return {
    title: text(repairedData.title || repairedData.itemType, "Antique item"),
    lookup: text(repairedData.lookup || repairedData.description),
    timePeriod: text(repairedData.timePeriod || repairedData.period, "غير واضح"),
    origin: text(repairedData.origin, "غير واضح"),
    material: text(repairedData.material, "غير واضح"),
    style: text(repairedData.style, "غير واضح"),
    condition: text(repairedData.condition, "غير واضح"),
    authenticity: text(
      repairedData.authenticity,
      "لا يمكن الجزم من الصورة فقط.",
    ),
    estimatedValue: text(
      repairedData.estimatedValue || repairedData.priceRange,
      "غير واضح",
    ),
    priceReasoning: text(repairedData.priceReasoning),
    history: text(repairedData.history || repairedData.description),
    historicalReading: text(repairedData.historicalReading),
    safeInitialChecks: textArray(repairedData.safeInitialChecks).slice(0, 7),
    carePreservationTips: textArray(repairedData.carePreservationTips).slice(0, 6),
    valueDrivers: textArray(repairedData.valueDrivers),
    valueReducers: textArray(repairedData.valueReducers),
    visualSearchKeywords: Array.isArray(repairedData.visualSearchKeywords)
      ? textArray(repairedData.visualSearchKeywords)
      : Array.isArray(repairedData.keywords)
        ? textArray(repairedData.keywords)
        : [],
    neededPhotos: textArray(repairedData.neededPhotos),
    followUpQuestion: text(repairedData.followUpQuestion),
    confidence:
      typeof repairedData.confidence === "number"
        ? Math.min(10, Math.max(1, repairedData.confidence))
        : 3,
    confidenceNote: text(repairedData.confidenceNote),
    disclaimer: text(repairedData.disclaimer),
    itemType: text(repairedData.itemType),
    description: text(repairedData.description),
    uploadedImageUrl: text(repairedData.uploadedImageUrl),
    sourceImageUrl: text(repairedData.sourceImageUrl),
    imageUrl: text(repairedData.imageUrl),
    imagePreview: text(repairedData.imagePreview),
    imagePreviews: Array.isArray(repairedData.imagePreviews)
      ? repairedData.imagePreviews.filter(
          (item): item is string => typeof item === "string",
        )
      : undefined,
    originalImage: text(repairedData.originalImage),
    originalImages: Array.isArray(repairedData.originalImages)
      ? repairedData.originalImages.filter(
          (item): item is string => typeof item === "string",
        )
      : undefined,
    priceRange: text(repairedData.priceRange),
    period: text(repairedData.period),
    keywords: textArray(repairedData.keywords),
    similar: repairedData.similar,
    similarItems: repairedData.similarItems,
    similarPhotos: repairedData.similarPhotos,
    similarImages: repairedData.similarImages,
    similarPieces: repairedData.similarPieces,
    imageMatches: repairedData.imageMatches,
    visualMatches: repairedData.visualMatches,
    storeMatches: repairedData.storeMatches,
    matches: repairedData.matches,
    houseOfAntiques: repairedData.houseOfAntiques,
    brandAssessment: cleanBrandAssessment(repairedData.brandAssessment),
    artistAttribution:
      repairedData.artistAttribution && typeof repairedData.artistAttribution === "object"
        ? repairedData.artistAttribution
        : null,
    valuation_scenarios: Array.isArray(repairedData.valuation_scenarios)
      ? repairedData.valuation_scenarios
      : undefined,
    valuationScenarios: Array.isArray(repairedData.valuationScenarios)
      ? repairedData.valuationScenarios
      : undefined,
    evidenceUsed:
      repairedData.evidenceUsed && typeof repairedData.evidenceUsed === "object"
        ? repairedData.evidenceUsed
        : null,
    hallmarkAnalysis:
      repairedData.hallmarkAnalysis && typeof repairedData.hallmarkAnalysis === "object"
        ? repairedData.hallmarkAnalysis
        : null,
    markAnalysis:
      repairedData.markAnalysis && typeof repairedData.markAnalysis === "object"
        ? repairedData.markAnalysis
        : null,
    metalValue: repairedData.metalValue,
  };
}
