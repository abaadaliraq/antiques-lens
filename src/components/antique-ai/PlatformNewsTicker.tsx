"use client";

import type { Locale } from "./types";

const NEWS_ITEMS: Record<Locale, string[]> = {
  ar: [
    "بورصة المعادن متوفرة الآن داخل KISHIB لمتابعة أسعار الذهب والفضة والنحاس والبلاتين.",
    "قريباً: تقارير خاصة للمزاد وتقارير مخصصة للبيع لعرض القطع بطريقة أكثر احترافية.",
    "بعد التقييم، يمكنك إضافة معلومات أكثر عن القطعة من خلال محادثة ذكية لتحسين دقة التقرير.",
    "KISHIB يستعرض صوراً مشابهة لقطعتك من متاجر ومصادر حول العالم لتطلع على نماذج قريبة منها.",
  ],

  en: [
    "Metal market rates are now available in KISHIB for gold, silver, copper, and platinum.",
    "Coming soon: dedicated auction reports and selling reports to present items more professionally.",
    "After the evaluation, you can add more details about your item through a smart chat to improve the report accuracy.",
    "KISHIB displays similar images of your item from stores and sources around the world so you can explore close matches.",
  ],

  ku: [
    "نرخی بازاڕی کانزاکان ئێستا لە KISHIB بەردەستە بۆ زێڕ، زیو، مس و پلاتین.",
    "بەم نزیکانە: ڕاپۆرتی تایبەت بە مزاد و ڕاپۆرتی تایبەت بە فرۆشتن بۆ پیشاندانی پارچەکان بە شێوەیەکی پیشەیی‌تر.",
    "دوای نرخاندن، دەتوانیت زانیاری زیاتر دەربارەی پارچەکە زیاد بکەیت لە ڕێگەی چاتی زیرەک بۆ باشترکردنی وردیی ڕاپۆرتەکە.",
    "KISHIB وێنەی هاوشێوەی پارچەکەت لە فرۆشگا و سەرچاوەکانی جیهان پیشان دەدات بۆ ئەوەی نموونە نزیکەکان ببینیت.",
  ],

  fr: [
    "Les cours des métaux sont désormais disponibles dans KISHIB pour l’or, l’argent, le cuivre et le platine.",
    "Bientôt : des rapports dédiés aux ventes aux enchères et à la vente pour présenter les pièces de manière plus professionnelle.",
    "Après l’évaluation, vous pouvez ajouter plus d’informations sur votre pièce grâce à une discussion intelligente afin d’améliorer la précision du rapport.",
    "KISHIB affiche des images similaires à votre pièce provenant de boutiques et de sources du monde entier pour consulter des modèles proches.",
  ],

  hi: [
    "KISHIB में अब सोना, चांदी, तांबा और प्लेटिनम के मेटल मार्केट रेट उपलब्ध हैं.",
    "जल्द आ रहा है: नीलामी रिपोर्ट और बिक्री रिपोर्ट, ताकि वस्तुओं को अधिक पेशेवर तरीके से प्रस्तुत किया जा सके.",
    "मूल्यांकन के बाद, आप स्मार्ट चैट के माध्यम से अपनी वस्तु के बारे में अधिक जानकारी जोड़ सकते हैं ताकि रिपोर्ट की सटीकता बेहतर हो.",
    "KISHIB आपकी वस्तु से मिलती-जुलती तस्वीरें दुनिया भर के स्टोर्स और स्रोतों से दिखाता है ताकि आप समान उदाहरण देख सकें.",
  ],

  fa: [
    "نرخ بازار فلزات اکنون در KISHIB برای طلا، نقره، مس و پلاتین در دسترس است.",
    "به‌زودی: گزارش‌های اختصاصی مزایده و گزارش‌های فروش برای ارائه حرفه‌ای‌تر اشیا.",
    "پس از ارزیابی، می‌توانید از طریق گفت‌وگوی هوشمند اطلاعات بیشتری درباره شیء اضافه کنید تا دقت گزارش بهتر شود.",
    "KISHIB تصاویر مشابه شیء شما را از فروشگاه‌ها و منابع سراسر جهان نمایش می‌دهد تا نمونه‌های نزدیک را بررسی کنید.",
  ],

  ru: [
    "В KISHIB теперь доступны рыночные котировки металлов: золота, серебра, меди и платины.",
    "Скоро: специальные отчёты для аукционов и продажи, чтобы представлять предметы более профессионально.",
    "После оценки вы можете добавить больше информации о предмете через умный чат, чтобы повысить точность отчёта.",
    "KISHIB показывает похожие изображения вашего предмета из магазинов и источников по всему миру, чтобы вы могли изучить близкие варианты.",
  ],

  tr: [
    "KISHIB’de altın, gümüş, bakır ve platin için metal piyasa fiyatları artık mevcut.",
    "Yakında: parçaları daha profesyonel sunmak için özel açık artırma raporları ve satış raporları.",
    "Değerlendirmeden sonra, rapor doğruluğunu artırmak için akıllı sohbet üzerinden parça hakkında daha fazla bilgi ekleyebilirsiniz.",
    "KISHIB, parçanıza benzer görselleri dünyanın farklı mağaza ve kaynaklarından göstererek yakın örnekleri incelemenizi sağlar.",
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
