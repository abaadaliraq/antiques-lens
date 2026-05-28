export type AntiqueKnowledgeItem = {
  id: string;
  terms: string[];
  category: string;
  description: string;
  visualClues: string[];
  likelyMaterials: string[];
  possibleOrigins: string[];
  searchKeywords: string[];
  valuationNotes: string[];
  neededPhotos: string[];
};

export const antiqueKnowledge: AntiqueKnowledgeItem[] = [
  {
    id: "hammam-rukiya",
    terms: [
      "ركية",
      "رگية",
      "علبة حمام",
      "علبة حمام السوق",
      "صندوق حمام",
      "علبة صابون ومشط",
      "أدوات حمام السوق",
      "وعاء حمام شعبي",
    ],
    category: "أداة حمام تقليدية / علبة أدوات حمام",
    description:
      "الركية هي علبة أو وعاء تقليدي كان يستخدم عند الذهاب إلى حمام السوق أو الحمام الشعبي، لحمل الصابون والمشط وأدوات الاستحمام الصغيرة. قد تكون معدنية، منقوشة، ذات غطاء أو مفصلات، وتظهر عليها آثار استعمال ورطوبة وأكسدة.",
    visualClues: [
      "شكل دائري أو بيضوي أو صندوقي صغير",
      "غطاء قابل للفتح أو مفصلات أو قفل صغير",
      "نقوش يدوية أو زخارف هندسية أو نباتية",
      "آثار أكسدة أو تغير لون بسبب الرطوبة والاستعمال",
      "حجم مناسب لحمل أدوات صغيرة مثل الصابون والمشط",
    ],
    likelyMaterials: ["نحاس", "حديد", "معدن مطروق", "فضة منخفضة العيار", "سبيكة معدنية"],
    possibleOrigins: [
      "العراق",
      "بلاد الشام",
      "العثماني",
      "الفارسي / القاجاري",
      "مناطق شرق أوسطية تقليدية",
    ],
    searchKeywords: [
      "traditional hammam toiletry box",
      "Ottoman bath soap container",
      "Middle Eastern hammam box",
      "antique hammam toiletry container",
      "Islamic metal bath box",
    ],
    valuationNotes: [
      "لا تُقيّم كعلبة معدنية عادية إذا كانت مرتبطة باستخدام حمام السوق التقليدي.",
      "القيمة ترتفع إذا كانت منقوشة يدوياً أو محفوظة بحالة جيدة أو لها مفصلات أصلية أو قفل أصلي.",
      "القيمة ترتفع إذا ظهرت علامات صانع أو فضة أو زخارف محلية واضحة.",
      "لا يمكن الجزم بالعمر أو الأصل من صورة واحدة فقط.",
    ],
    neededPhotos: [
      "صورة من الأعلى والغطاء مغلق",
      "صورة من الداخل بعد فتحها",
      "صورة للقفل أو المفصلات",
      "صورة للقاعدة من الأسفل",
      "صورة قريبة للنقوش والأكسدة",
      "صورة بجانب شيء معروف الحجم لمعرفة القياس",
    ],
  },
  {
    id: "samovar",
    terms: ["سماور", "سماور روسي", "سماور نحاس", "samovar"],
    category: "سماور / وعاء تسخين شاي تقليدي",
    description:
      "السماور أداة تقليدية لتسخين الماء وتحضير الشاي، شائعة في روسيا وإيران والعراق وتركيا ومناطق القوقاز. تختلف قيمته حسب العمر، المادة، الختم، المنشأ، والحالة.",
    visualClues: [
      "جسم معدني كبير مع حنفية",
      "قاعدة أو أرجل",
      "مدخنة أو فتحة داخلية للفحم في الأنواع القديمة",
      "نقوش أو أختام مصنع",
    ],
    likelyMaterials: ["نحاس", "نحاس مطلي", "فضة", "برونز", "ستانلس في النسخ الحديثة"],
    possibleOrigins: ["روسي", "إيراني", "عثماني", "عراقي", "قوقازي"],
    searchKeywords: [
      "antique brass samovar",
      "Russian samovar antique",
      "Persian samovar",
      "Ottoman samovar",
    ],
    valuationNotes: [
      "الختم واسم المصنع يغيران القيمة بشكل كبير.",
      "السماورات الروسية القديمة المختومة قد تكون أعلى قيمة من النسخ الحديثة.",
      "الحالة والاكتمال مهمان جداً، خصوصاً الحنفية والغطاء والمدخنة.",
    ],
    neededPhotos: [
      "صورة كاملة من الأمام",
      "صورة الختم أو الكتابة",
      "صورة الحنفية",
      "صورة الغطاء والداخل",
      "صورة القاعدة",
    ],
  },
  {
    id: "hookah-shisha",
    terms: ["شيشة", "نركيلة", "أركيلة", "غليون ماء", "hookah", "shisha"],
    category: "شيشة / نركيلة تقليدية",
    description:
      "الشيشة أو النركيلة التقليدية قد تكون من النحاس أو الفضة أو الزجاج أو الخشب، وتختلف قيمتها حسب العمر، النقوش، الأصل، اكتمال القطع، والحالة.",
    visualClues: [
      "قاعدة ماء",
      "رقبة معدنية طويلة",
      "نقوش شرقية أو عثمانية أو فارسية",
      "أجزاء قابلة للفصل",
      "خرطوم أو مكان خرطوم",
    ],
    likelyMaterials: ["نحاس", "فضة", "زجاج", "خشب", "برونز"],
    possibleOrigins: ["عثماني", "فارسي", "هندي", "شامي", "عراقي"],
    searchKeywords: [
      "antique brass hookah",
      "Ottoman shisha",
      "Persian hookah antique",
      "Middle Eastern water pipe antique",
    ],
    valuationNotes: [
      "الاكتمال مهم جداً؛ القطعة الناقصة تنخفض قيمتها.",
      "النقوش اليدوية والفضة والختم ترفع القيمة.",
      "يجب عدم تقييم الشيشة القديمة كسعر شيشة ديكور حديثة.",
    ],
    neededPhotos: [
      "صورة كاملة للقطعة",
      "صورة القاعدة",
      "صورة الرقبة والنقوش",
      "صورة أي ختم أو كتابة",
      "صورة الأجزاء المفصولة إن وجدت",
    ],
  },
  {
    id: "rosewater-sprinkler",
    terms: ["مرش ماء ورد", "مرش", "قمقم", "rosewater sprinkler"],
    category: "مرش ماء ورد / قمقم تقليدي",
    description:
      "مرش ماء الورد أو القمقم يستخدم لرش ماء الورد في المناسبات والضيافة والطقوس الاجتماعية. يظهر كثيراً في التحف الإسلامية والعثمانية والهندية والفارسية.",
    visualClues: [
      "رقبة طويلة رفيعة",
      "فوهة صغيرة للرش",
      "جسم منتفخ أو مزخرف",
      "زخارف نباتية أو هندسية",
    ],
    likelyMaterials: ["فضة", "نحاس", "برونز", "زجاج", "معدن مطلي"],
    possibleOrigins: ["عثماني", "هندي", "فارسي", "شامي", "عراقي"],
    searchKeywords: [
      "antique rosewater sprinkler",
      "Islamic rosewater sprinkler",
      "Ottoman rosewater bottle",
      "Persian rosewater sprinkler",
    ],
    valuationNotes: [
      "الفضة والختم والحالة ترفع السعر.",
      "الرقبة المكسورة أو الفوهة الناقصة تقلل القيمة جداً.",
    ],
    neededPhotos: [
      "صورة كاملة من الأمام",
      "صورة الفوهة",
      "صورة القاعدة",
      "صورة الختم أو النقوش",
    ],
  },
  {
    id: "copper-tray",
    terms: ["صينية نحاس", "صينية منقوشة", "تبسي نحاس", "copper tray"],
    category: "صينية نحاس منقوشة",
    description:
      "الصواني النحاسية المنقوشة شائعة في العراق وبلاد الشام ومصر وتركيا وإيران. قيمتها تعتمد على حجمها، جودة النقش، العمر، الحالة، ووجود توقيع أو ختم.",
    visualClues: [
      "سطح دائري أو بيضوي واسع",
      "نقوش يدوية أو زخارف إسلامية",
      "حافة مرتفعة أو مطوية",
      "آثار استعمال أو تلميع",
    ],
    likelyMaterials: ["نحاس", "نحاس مطلي", "برونز"],
    possibleOrigins: ["عراقي", "شامي", "مصري", "عثماني", "فارسي"],
    searchKeywords: [
      "antique engraved copper tray",
      "Middle Eastern copper tray",
      "Islamic engraved brass tray",
      "Ottoman copper tray",
    ],
    valuationNotes: [
      "ليست كل صينية نحاس قديمة ذات قيمة عالية؛ الجودة والحجم والنقش عوامل مهمة.",
      "النقش اليدوي العميق أفضل من النقش التجاري الحديث.",
    ],
    neededPhotos: [
      "صورة كاملة من الأعلى",
      "صورة قريبة للنقوش",
      "صورة الحافة",
      "صورة الخلف/القاعدة",
      "صورة أي توقيع أو ختم",
    ],
  },
  {
    id: "signed-painting",
    terms: ["لوحة", "لوحة زيتية", "لوحة موقعة", "توقيع فنان", "painting", "oil painting"],
    category: "لوحة فنية / عمل تشكيلي",
    description:
      "اللوحات تحتاج حذراً عالياً في التحليل. لا يكفي شكل اللوحة لتأكيد العمر أو الفنان. التوقيع، ظهر اللوحة، نوع القماش، الإطار، الملصقات، مصدر الاقتناء، وحالة السطح كلها ضرورية.",
    visualClues: [
      "نوع السطح: قماش أو خشب أو ورق",
      "التوقيع",
      "أسلوب الرسم",
      "حالة الطبقة اللونية والتشققات",
      "الإطار وظهر اللوحة",
    ],
    likelyMaterials: ["زيت على قماش", "أكريليك", "ألوان مائية", "طباعة", "ورق", "خشب"],
    possibleOrigins: ["غير واضح من الصورة وحدها"],
    searchKeywords: [
      "signed oil painting antique",
      "old master style painting",
      "Middle Eastern signed painting",
      "vintage oil painting signed",
    ],
    valuationNotes: [
      "ممنوع اعتبار اللوحة من القرن السابع عشر أو الثامن عشر من الصورة فقط.",
      "إذا بدت قديمة لكن بلا توثيق، يجب وصفها بأنها على طراز قديم أو غير مؤكدة.",
      "إذا كانت منسوبة لفنان معروف أو فترة قديمة جداً، لا يجوز إعطاء سعر منخفض بلا تفسير واضح.",
      "ظهر اللوحة والتوقيع والتوثيق ضرورية لأي سعر جدي.",
    ],
    neededPhotos: [
      "صورة أمامية كاملة",
      "صورة التوقيع عن قرب",
      "صورة ظهر اللوحة",
      "صورة الإطار من الخلف",
      "صورة حافة القماش أو الخشب",
      "صورة أي ملصق أو ختم أو كتابة",
    ],
  },
];

export function buildKnowledgeContext(notes: string = "") {
  const normalizedNotes = notes.toLowerCase().trim();

  const matchedItems = antiqueKnowledge.filter((item) =>
    item.terms.some((term) => normalizedNotes.includes(term.toLowerCase())),
  );

  const itemsToUse = matchedItems.length > 0 ? matchedItems : antiqueKnowledge.slice(0, 6);

  return itemsToUse
    .map((item) => {
      return `
Knowledge item: ${item.category}
Terms: ${item.terms.join(", ")}
Description: ${item.description}
Visual clues: ${item.visualClues.join(" | ")}
Likely materials: ${item.likelyMaterials.join(", ")}
Possible origins: ${item.possibleOrigins.join(", ")}
Search keywords: ${item.searchKeywords.join(", ")}
Valuation notes: ${item.valuationNotes.join(" | ")}
Needed photos: ${item.neededPhotos.join(" | ")}
`;
    })
    .join("\n---\n");
}