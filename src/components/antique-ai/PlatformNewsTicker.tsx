"use client";

import type { Locale } from "./types";

const NEWS_ITEMS: Record<Locale, string[]> = {
 ar: [ "سوق KISHIB قريباً: ارفع قطعك واعرضها للبيع.", "قريباً: تقارير خاصة للمزادات.", "قريباً: تقارير خاصة لبيع القطع.", "KISHIB يعتمد على بورصة الذهب والفضة عند وجود ختم حقيقي على القطعة.", "قريباً: تواصل مباشر مع خبير تقييم للقطع الثمينة.", "قريباً: KISHIB يقرأ الرقم التسلسلي للفاتورة لتقييم أقوى.", ], en: [ "KISHIB Market is coming soon: upload your items and list them for sale.", "Coming soon: dedicated auction reports.", "Coming soon: dedicated selling reports for your items.", "KISHIB can rely on gold and silver market rates when a genuine hallmark is present.", "Coming soon: direct contact with a valuation expert for valuable items.", "Coming soon: KISHIB can read invoice serial numbers for stronger evaluations.", ], ku: [ "بازاڕی KISHIB بەم نزیکانە: پارچەکانت باربکە و بۆ فرۆشتن پیشانیان بدە.", "بەم نزیکانە: ڕاپۆرتی تایبەت بۆ مزایدە.", "بەم نزیکانە: ڕاپۆرتی تایبەت بۆ فرۆشتنی پارچەکان.", "KISHIB دەتوانێت پشت بە نرخی بازاڕی زێڕ و زیو ببەستێت کاتێک مۆری ڕاستەقینە لەسەر پارچەکە هەبێت.", "بەم نزیکانە: پەیوەندی ڕاستەوخۆ لەگەڵ پسپۆڕی نرخاندن بۆ پارچە گرانبەهاکان.", "بەم نزیکانە: KISHIB ژمارەی زنجیرەیی فاکتورە دەخوێنێتەوە بۆ نرخاندنێکی بەهێزتر.", ], fr: [ "KISHIB Market arrive bientôt : téléversez vos pièces et proposez-les à la vente.", "Bientôt : rapports dédiés aux enchères.", "Bientôt : rapports dédiés à la vente de vos pièces.", "KISHIB peut s’appuyer sur les cours de l’or et de l’argent lorsqu’un poinçon authentique est présent.", "Bientôt : contact direct avec un expert en évaluation pour les pièces précieuses.", "Bientôt : KISHIB pourra lire les numéros de série des factures pour des évaluations plus solides.", ], hi: [ "KISHIB Market जल्द आ रहा है: अपनी वस्तुएँ अपलोड करें और बिक्री के लिए सूचीबद्ध करें.", "जल्द आ रहा है: नीलामी के लिए विशेष रिपोर्ट.", "जल्द आ रहा है: वस्तुओं की बिक्री के लिए विशेष रिपोर्ट.", "यदि वस्तु पर असली हॉलमार्क मौजूद हो, तो KISHIB सोने और चांदी के बाजार भाव पर आधारित मूल्यांकन कर सकता है.", "जल्द आ रहा है: मूल्यवान वस्तुओं के लिए मूल्यांकन विशेषज्ञ से सीधा संपर्क.", "जल्द आ रहा है: KISHIB बेहतर मूल्यांकन के लिए इनवॉइस सीरियल नंबर पढ़ सकेगा.", ], fa: [ "بازار KISHIB به‌زودی: اشیای خود را بارگذاری کنید و برای فروش قرار دهید.", "به‌زودی: گزارش‌های اختصاصی برای مزایده‌ها.", "به‌زودی: گزارش‌های اختصاصی برای فروش اشیا.", "KISHIB در صورت وجود نشان اصالت واقعی می‌تواند بر اساس نرخ بازار طلا و نقره ارزیابی کند.", "به‌زودی: ارتباط مستقیم با کارشناس ارزیابی برای اشیای ارزشمند.", "به‌زودی: KISHIB شماره سریال فاکتور را برای ارزیابی دقیق‌تر می‌خواند.", ], ru: [ "KISHIB Market скоро: загружайте свои предметы и размещайте их на продажу.", "Скоро: специальные отчеты для аукционов.", "Скоро: специальные отчеты для продажи предметов.", "KISHIB может учитывать рыночные цены золота и серебра при наличии подлинного клейма.", "Скоро: прямой контакт с экспертом по оценке ценных предметов.", "Скоро: KISHIB сможет считывать серийный номер счета для более точной оценки.", ], tr: [ "KISHIB Market yakında: ürünlerinizi yükleyin ve satışa sunun.", "Yakında: açık artırmalar için özel raporlar.", "Yakında: ürün satışı için özel raporlar.", "KISHIB, gerçek bir damga bulunduğunda altın ve gümüş piyasa fiyatlarına dayanabilir.", "Yakında: değerli parçalar için değerlendirme uzmanıyla doğrudan iletişim.", "Yakında: KISHIB daha güçlü değerlendirme için fatura seri numarasını okuyabilecek.", ],
};

const RTL_LOCALES: Locale[] = ["ar", "ku", "fa"];

const TICKER_LABEL: Record<Locale, string> = {
  ar: "تحديثات KISHIB",
  en: "Platform Updates",
  ku: "نوێکارییەکانی KISHIB",
  fr: "Actualités KISHIB",
  hi: "KISHIB अपडेट",
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
                  <span className="kishib-news-dot">✦</span>
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
