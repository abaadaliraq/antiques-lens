"use client";

import { Headset } from "lucide-react";
import { useState } from "react";
import type { Locale } from "./types";

const CONTACT_EMAIL = "contact@kishibapp.com";
const RTL_LOCALES: Locale[] = ["ar", "ku", "fa"];

type ExpertCopy = {
  button: string;
  subject: string;
  intro: string;
  itemName: string;
  reportId: string;
  evaluatedAt: string;
  reportLink: string;
  attachPhotos: string;
  emailCopied: string;
  emailFallback: string;
};

const COPY: Record<Locale, ExpertCopy> = {
  ar: {
    button: "تواصل مع مختص",
    subject: "استشارة حول تقييم قطعة في كيشيب",
    intro: "مرحباً، أود استشارة مختص حول هذا التقييم في كيشيب.",
    itemName: "اسم القطعة",
    reportId: "رقم التقرير أو التقييم",
    evaluatedAt: "تاريخ التقييم",
    reportLink: "رابط التقرير أو التقييم",
    attachPhotos: "يرجى إرفاق صور القطعة إذا لم تظهر تلقائياً مع هذه الرسالة.",
    emailCopied: "تم نسخ بريد المختص.",
    emailFallback: "يمكنك مراسلتنا على",
  },
  en: {
    button: "Contact a Specialist",
    subject: "Consultation About a KISHIB Evaluation",
    intro: "Hello, I would like to consult a specialist about this KISHIB evaluation.",
    itemName: "Item name",
    reportId: "Report or evaluation ID",
    evaluatedAt: "Evaluation date",
    reportLink: "Report or evaluation link",
    attachPhotos: "Please attach the item photos if they are not included automatically.",
    emailCopied: "Specialist email copied.",
    emailFallback: "You can email us at",
  },
  ku: {
    button: "پەیوەندی بە پسپۆڕەوە",
    subject: "ڕاوێژ دەربارەی نرخاندنێکی KISHIB",
    intro: "سڵاو، دەمەوێت لەبارەی ئەم نرخاندنەی KISHIB ڕاوێژ بە پسپۆڕ بکەم.",
    itemName: "ناوی پارچە",
    reportId: "ژمارەی ڕاپۆرت یان نرخاندن",
    evaluatedAt: "بەرواری نرخاندن",
    reportLink: "بەستەری ڕاپۆرت یان نرخاندن",
    attachPhotos: "تکایە وێنەکانی پارچەکە هاوپێچ بکە ئەگەر خۆکارانە لەگەڵ نامەکەدا نەچوون.",
    emailCopied: "ئیمەیڵی پسپۆڕ کۆپی کرا.",
    emailFallback: "دەتوانیت نامەمان بۆ بنێریت لە",
  },
  fr: {
    button: "Contacter un spécialiste",
    subject: "Consultation sur une évaluation KISHIB",
    intro: "Bonjour, je souhaite consulter un spécialiste au sujet de cette évaluation KISHIB.",
    itemName: "Nom de l'objet",
    reportId: "ID du rapport ou de l'évaluation",
    evaluatedAt: "Date d'évaluation",
    reportLink: "Lien du rapport ou de l'évaluation",
    attachPhotos: "Veuillez joindre les photos de l'objet si elles ne sont pas incluses automatiquement.",
    emailCopied: "E-mail du spécialiste copié.",
    emailFallback: "Vous pouvez nous écrire à",
  },
  hi: {
    button: "विशेषज्ञ से संपर्क करें",
    subject: "KISHIB मूल्यांकन के बारे में परामर्श",
    intro: "नमस्ते, मैं इस KISHIB मूल्यांकन के बारे में विशेषज्ञ से परामर्श करना चाहता/चाहती हूँ.",
    itemName: "वस्तु का नाम",
    reportId: "रिपोर्ट या मूल्यांकन आईडी",
    evaluatedAt: "मूल्यांकन तिथि",
    reportLink: "रिपोर्ट या मूल्यांकन लिंक",
    attachPhotos: "यदि तस्वीरें अपने-आप शामिल नहीं हुई हैं, तो कृपया वस्तु की तस्वीरें संलग्न करें.",
    emailCopied: "विशेषज्ञ ईमेल कॉपी हो गया.",
    emailFallback: "आप हमें ईमेल कर सकते हैं",
  },
  fa: {
    button: "ارتباط با کارشناس",
    subject: "مشاوره درباره ارزیابی KISHIB",
    intro: "سلام، می‌خواهم درباره این ارزیابی KISHIB با یک کارشناس مشورت کنم.",
    itemName: "نام قطعه",
    reportId: "شماره گزارش یا ارزیابی",
    evaluatedAt: "تاریخ ارزیابی",
    reportLink: "لینک گزارش یا ارزیابی",
    attachPhotos: "اگر تصاویر به‌صورت خودکار پیوست نشدند، لطفاً تصاویر قطعه را پیوست کنید.",
    emailCopied: "ایمیل کارشناس کپی شد.",
    emailFallback: "می‌توانید به این ایمیل پیام بدهید",
  },
  ru: {
    button: "Связаться со специалистом",
    subject: "Консультация по оценке KISHIB",
    intro: "Здравствуйте, я хотел(а) бы проконсультироваться со специалистом по этой оценке KISHIB.",
    itemName: "Название предмета",
    reportId: "ID отчета или оценки",
    evaluatedAt: "Дата оценки",
    reportLink: "Ссылка на отчет или оценку",
    attachPhotos: "Пожалуйста, приложите фотографии предмета, если они не добавились автоматически.",
    emailCopied: "E-mail специалиста скопирован.",
    emailFallback: "Вы можете написать нам на",
  },
  tr: {
    button: "Uzmanla İletişime Geç",
    subject: "KISHIB Değerlendirmesi Hakkında Danışma",
    intro: "Merhaba, bu KISHIB değerlendirmesi hakkında bir uzmana danışmak istiyorum.",
    itemName: "Parça adı",
    reportId: "Rapor veya değerlendirme numarası",
    evaluatedAt: "Değerlendirme tarihi",
    reportLink: "Rapor veya değerlendirme bağlantısı",
    attachPhotos: "Fotoğraflar otomatik eklenmediyse lütfen parçanın fotoğraflarını ekleyin.",
    emailCopied: "Uzman e-postası kopyalandı.",
    emailFallback: "Bize şu adresten yazabilirsiniz",
  },
  es: {
    button: "Contactar a un especialista",
    subject: "Consulta sobre una evaluación de KISHIB",
    intro: "Hola, me gustaría consultar a un especialista sobre esta evaluación de KISHIB.",
    itemName: "Nombre de la pieza",
    reportId: "ID del informe o evaluación",
    evaluatedAt: "Fecha de evaluación",
    reportLink: "Enlace del informe o evaluación",
    attachPhotos: "Adjunta las fotos de la pieza si no se incluyen automáticamente.",
    emailCopied: "Correo del especialista copiado.",
    emailFallback: "Puedes escribirnos a",
  },
};

type ExpertContactButtonProps = {
  locale: Locale;
  itemName?: string;
  reportId?: string;
  evaluatedAt?: string;
  reportUrl?: string;
};

export default function ExpertContactButton({
  locale,
  itemName,
  reportId,
  evaluatedAt,
  reportUrl,
}: ExpertContactButtonProps) {
  const [status, setStatus] = useState("");
  const copy = COPY[locale] || COPY.en;
  const isRtl = RTL_LOCALES.includes(locale);

  async function copyEmailFallback() {
    try {
      await navigator.clipboard?.writeText(CONTACT_EMAIL);
      setStatus(copy.emailCopied);
    } catch {
      setStatus(`${copy.emailFallback} ${CONTACT_EMAIL}`);
    }

    window.setTimeout(() => setStatus(""), 2800);
  }

  function handleClick() {
    const pageUrl =
      reportUrl ||
      (typeof window !== "undefined" ? window.location.href : undefined);
    const date =
      evaluatedAt ||
      new Intl.DateTimeFormat(locale === "ku" ? "ar-IQ" : locale, {
        dateStyle: "medium",
      }).format(new Date());
    const bodyLines = [
      copy.intro,
      "",
      itemName ? `${copy.itemName}: ${itemName}` : "",
      reportId ? `${copy.reportId}: ${reportId}` : "",
      date ? `${copy.evaluatedAt}: ${date}` : "",
      pageUrl ? `${copy.reportLink}: ${pageUrl}` : "",
      "",
      copy.attachPhotos,
    ].filter(Boolean);
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      copy.subject,
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    let openedExternalApp = false;
    const handleVisibilityChange = () => {
      if (document.hidden) openedExternalApp = true;
    };

    try {
      document.addEventListener("visibilitychange", handleVisibilityChange, {
        once: true,
      });
      window.location.href = mailto;
      window.setTimeout(() => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        if (!openedExternalApp) void copyEmailFallback();
      }, 1200);
    } catch {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void copyEmailFallback();
    }
  }

  return (
    <>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className="fixed bottom-[calc(0.9rem+env(safe-area-inset-bottom))] left-3 z-50 flex w-[118px] flex-col items-center gap-1 sm:left-5 lg:left-7"
      >
        <button
          type="button"
          onClick={handleClick}
          title={copy.button}
          aria-label={copy.button}
          className="relative grid h-12 w-12 place-items-center rounded-full border border-[#f3d99b]/70 bg-[#fff4e2] text-[#6d241d] shadow-[0_14px_30px_rgba(36,25,19,0.24)] ring-[3px] ring-[#6d241d]/16 transition hover:-translate-y-0.5 hover:bg-[#fff8eb] hover:text-[#8a4f32] active:scale-[0.97]"
        >
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#fff4e2] bg-[#b88a3d] shadow-[0_4px_12px_rgba(36,25,19,0.18)]" />
          <Headset className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
        </button>
        <span className="max-w-[118px] whitespace-nowrap rounded-full border border-[#dcc18a]/35 bg-[#241913]/34 px-2.5 py-0.5 text-center text-[9px] font-medium leading-none text-[#fff4e2]/90 shadow-[0_6px_16px_rgba(36,25,19,0.14)] backdrop-blur-md">
          {copy.button}
        </span>
      </div>

      {status ? (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="fixed inset-x-4 bottom-[calc(5.2rem+env(safe-area-inset-bottom))] z-[80] mx-auto max-w-sm rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/95 px-4 py-3 text-center text-[12px] font-semibold text-[#735f4b] shadow-[0_14px_34px_rgba(62,39,22,0.16)] backdrop-blur-xl"
        >
          {status}
        </div>
      ) : null}
    </>
  );
}
