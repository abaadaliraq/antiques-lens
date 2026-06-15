"use client";

import type { Locale } from "./types";

const NEWS_ITEMS: Record<Locale, string[]> = {
  ar: [
    "KISHIB يعتمد على بورصة الذهب والفضة عند وجود ختم حقيقي على القطعة.",
    "قريباً: تواصل مباشر مع خبير تقييم للقطع الثمينة.",
    "قريباً: KISHIB يقرأ الرقم التسلسلي للفاتورة لتقييم أقوى.",
  ],
  en: [
    "KISHIB can rely on gold and silver market rates when a genuine hallmark is present.",
    "Coming soon: direct contact with a valuation expert for valuable items.",
    "Coming soon: KISHIB can read invoice serial numbers for stronger evaluations.",
  ],
  ku: [
    "KISHIB دەتوانێت پشت بە نرخی بازاڕی زێڕ و زیو ببەستێت کاتێک مۆری ڕاستەقینە لەسەر پارچەکە هەبێت.",
    "بەم نزیکانە: پەیوەندی ڕاستەوخۆ لەگەڵ پسپۆڕی نرخاندن بۆ پارچە گرانبەهاکان.",
    "بەم نزیکانە: KISHIB ژمارەی زنجیرەیی فاکتورە دەخوێنێتەوە بۆ نرخاندنێکی بەهێزتر.",
  ],
  fr: [
    "KISHIB peut s'appuyer sur les cours de l'or et de l'argent lorsqu'un poinçon authentique est présent.",
    "Bientôt : contact direct avec un expert en évaluation pour les pièces précieuses.",
    "Bientôt : KISHIB pourra lire les numéros de série des factures pour des évaluations plus solides.",
  ],
  hi: [
    "KISHIB can use gold and silver rates when a genuine hallmark is present.",
    "Coming soon: direct contact with a valuation expert for valuable items.",
    "Coming soon: KISHIB can read invoice serial numbers for stronger evaluations.",
  ],
  fa: [
    "KISHIB در صورت وجود نشان اصالت واقعی می‌تواند بر اساس نرخ بازار طلا و نقره ارزیابی کند.",
    "به‌زودی: ارتباط مستقیم با کارشناس ارزیابی برای اشیای ارزشمند.",
    "به‌زودی: KISHIB شماره سریال فاکتور را برای ارزیابی دقیق‌تر می‌خواند.",
  ],
  ru: [
    "KISHIB может учитывать рыночные цены золота и серебра при наличии подлинного клейма.",
    "Скоро: прямой контакт с экспертом по оценке ценных предметов.",
    "Скоро: KISHIB сможет считывать серийный номер счета для более точной оценки.",
  ],
  tr: [
    "KISHIB, gerçek bir damga bulunduğunda altın ve gümüş piyasa fiyatlarına dayanabilir.",
    "Yakında: değerli parçalar için değerlendirme uzmanıyla doğrudan iletişim.",
    "Yakında: KISHIB daha güçlü değerlendirme için fatura seri numarasını okuyabilecek.",
  ],
};

const RTL_LOCALES: Locale[] = ["ar", "ku", "fa"];

const TICKER_LABEL: Record<Locale, string> = {
  ar: "تحديثات KISHIB",
  en: "Platform Updates",
  ku: "نوێکارییەکانی KISHIB",
  fr: "Actualités KISHIB",
  hi: "KISHIB Updates",
  fa: "به‌روزرسانی‌های KISHIB",
  ru: "Обновления KISHIB",
  tr: "KISHIB Güncellemeleri",
};

export default function PlatformNewsTicker({ locale }: { locale: Locale }) {
  const items = NEWS_ITEMS[locale] || NEWS_ITEMS.en;
  const isRtl = RTL_LOCALES.includes(locale);
  const groups = [0, 1, 2, 3];

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      aria-label="Platform updates"
      className="kishib-news-ticker"
    >
      <span className="kishib-news-label">
        {TICKER_LABEL[locale] || TICKER_LABEL.en}
      </span>
      <div className="kishib-news-viewport">
        <div
          className="kishib-news-track"
          data-locale-direction={isRtl ? "rtl" : "ltr"}
        >
          {groups.map((groupIndex) => (
            <span
              aria-hidden={groupIndex > 0}
              className="kishib-news-group"
              key={groupIndex}
            >
              {items.map((item, index) => (
                <span
                  className="kishib-news-item"
                  dir={isRtl ? "rtl" : "ltr"}
                  key={`${groupIndex}-${index}`}
                >
                  <span className="kishib-news-dot">*</span>
                  <span>{item}</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
