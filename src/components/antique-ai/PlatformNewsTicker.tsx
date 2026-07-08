"use client";

import { isRtlLocale } from "@/i18n/common";
import type { Locale } from "./types";

const NEWS_ITEMS: Record<Locale, string[]> = {
  ar: ["بورصة المعادن متوفرة الآن داخل KISHIB لمتابعة أسعار الذهب والفضة والنحاس والبلاتين.", "قريباً: تقارير خاصة للمزاد وتقارير مخصصة للبيع لعرض القطع بطريقة أكثر احترافية.", "بعد التقييم، يمكنك إضافة معلومات أكثر عن القطعة من خلال محادثة ذكية لتحسين دقة التقرير.", "KISHIB يستعرض صوراً مشابهة لقطعتك من متاجر ومصادر حول العالم لتطلع على نماذج قريبة منها."],
  en: ["Metal market rates are now available in KISHIB for gold, silver, copper, and platinum.", "Coming soon: dedicated auction reports and selling reports to present items more professionally.", "After the evaluation, you can add more details about your item through a smart chat to improve the report accuracy.", "KISHIB displays similar images of your item from stores and sources around the world so you can explore close matches."],
  ku: ["نرخی بازاڕی کانزاکان ئێستا لە KISHIB بەردەستە بۆ زێڕ، زیو، مس و پلاتین.", "بەم نزیکانە: ڕاپۆرتی تایبەت بە مزاد و فرۆشتن بۆ پیشاندانی پارچەکان بە شێوەی پیشەیی‌تر.", "دوای نرخاندن، دەتوانیت زانیاری زیاتر لەبارەی پارچەکە زیاد بکەیت لە ڕێگەی چاتی زیرەک.", "KISHIB وێنەی هاوشێوەی پارچەکەت لە فرۆشگا و سەرچاوەکانی جیهان پیشان دەدات."],
  fr: ["Les cours des métaux sont désormais disponibles dans KISHIB pour l’or, l’argent, le cuivre et le platine.", "Bientôt : des rapports dédiés aux enchères et à la vente pour présenter les pièces de manière plus professionnelle.", "Après l’évaluation, vous pouvez ajouter plus d’informations grâce à une discussion intelligente afin d’améliorer la précision du rapport.", "KISHIB affiche des images similaires provenant de boutiques et de sources du monde entier."],
  hi: ["KISHIB में अब सोना, चांदी, तांबा और प्लेटिनम के बाज़ार भाव उपलब्ध हैं.", "जल्द आ रहा है: नीलामी और बिक्री के लिए विशेष रिपोर्ट.", "मूल्यांकन के बाद, आप स्मार्ट चैट से अधिक जानकारी जोड़ सकते हैं ताकि रिपोर्ट बेहतर हो.", "KISHIB दुनिया भर के स्रोतों से मिलती-जुलती तस्वीरें दिखाता है."],
  fa: ["نرخ بازار فلزات اکنون در KISHIB برای طلا، نقره، مس و پلاتین در دسترس است.", "به‌زودی: گزارش‌های اختصاصی مزایده و فروش برای ارائه حرفه‌ای‌تر اشیا.", "پس از ارزیابی، می‌توانید از طریق گفت‌وگوی هوشمند اطلاعات بیشتری اضافه کنید.", "KISHIB تصاویر مشابه شیء شما را از منابع سراسر جهان نمایش می‌دهد."],
  ru: ["В KISHIB теперь доступны рыночные цены на золото, серебро, медь и платину.", "Скоро: специальные отчёты для аукционов и продажи.", "После оценки можно добавить больше информации через умный чат, чтобы повысить точность отчёта.", "KISHIB показывает похожие изображения из магазинов и источников по всему миру."],
  tr: ["KISHIB’de altın, gümüş, bakır ve platin için metal piyasa fiyatları artık mevcut.", "Yakında: parçaları daha profesyonel sunmak için açık artırma ve satış raporları.", "Değerlendirmeden sonra akıllı sohbetle daha fazla bilgi ekleyebilirsiniz.", "KISHIB, parçanıza benzer görselleri dünyanın farklı kaynaklarından gösterir."],
  es: ["Las cotizaciones de metales ya están disponibles en KISHIB para oro, plata, cobre y platino.", "Pronto: informes para subastas y venta para presentar las piezas de forma más profesional.", "Después de la evaluación, puedes añadir más detalles mediante un chat inteligente para mejorar el informe.", "KISHIB muestra imágenes similares de tiendas y fuentes de todo el mundo para explorar coincidencias cercanas."],
};

const TICKER_LABEL: Record<Locale, string> = {
  ar: "تحديثات KISHIB",
  en: "Platform Updates",
  ku: "نوێکارییەکانی KISHIB",
  fr: "Actualités KISHIB",
  hi: "KISHIB अपडेट्स",
  fa: "به‌روزرسانی‌های KISHIB",
  ru: "Обновления KISHIB",
  tr: "KISHIB güncellemeleri",
  es: "Novedades de KISHIB",
};

export default function PlatformNewsTicker({ locale }: { locale: Locale }) {
  const items = NEWS_ITEMS[locale] || NEWS_ITEMS.en;
  const isRtl = isRtlLocale(locale);
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

