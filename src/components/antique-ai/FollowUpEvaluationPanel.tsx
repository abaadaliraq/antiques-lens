"use client";

import { ImagePlus, SendHorizontal, Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { AntiqueChatMessage, Locale } from "./types";

type Props = {
  locale: Locale;
  error?: string;
  followUpText: string;
  followUpPreviews: string[];
  isFollowUpAnalyzing: boolean;
  isReadingFollowUpImage: boolean;
  chatMessages: AntiqueChatMessage[];
  chatUsedTurns: number;
  chatMaxTurns: number;
  setFollowUpText: (value: string) => void;
  handleFollowUpImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeFollowUpImageAt: (index: number) => void;
  handleFollowUpAnalyze: () => void;
  handleFinalSummary: () => void;
  handleSuggestionClick: (value: string) => void;
};

function copy(locale: Locale) {
  if (locale === "en") {
    return {
      title: "Smart evaluation session",
      altTitle: "Ask KISHIB's expert about this item",
      hint:
        "Add information or images such as a signature, stamp, invoice, weight, or damage details, and KISHIB will re-analyze the value step by step.",
      placeholder:
        "Write a detail, question, information to verify, weight, condition note, or provenance...",
      upload: "Upload image",
      send: "Send",
      sending: "Analyzing...",
      typing: "KISHIB is typing now",
      readingImage: "KISHIB is reading the image",
      uploadedImage: "Uploaded an additional image",
      final: "Give me the final summary",
      locked: "You used all 10 messages for this item.",
      counter: "messages used",
      expert: "KISHIB",
      you: "You",
      empty: "The expert session starts here.",
      suggestions: [
        "I have a signature",
        "I want to upload a stamp photo",
        "I know the exact weight",
        "I have a 925 / 750 mark",
        "I want to update the price",
        "I think it is by a known artist",
        "Should I sell it now?",
        "I want an auction report",
        "Give me the final summary",
      ],
    };
  }

  return {
    title: "جلسة تقييم ذكية",
    altTitle: "اسأل خبير كيشيب عن هذه القطعة",
    hint:
      "أضف معلومات أو صورًا إضافية مثل التوقيع، الختم، الفاتورة، الوزن أو تفاصيل الضرر، وسيعيد كيشيب تحليل قيمة القطعة خطوة بخطوة.",
    placeholder:
      "اكتب معلومة، سؤالًا، وزنًا، حالة الضرر، قصة القطعة أو معلومة تحتاج تحقق...",
    upload: "رفع صورة",
    send: "إرسال",
    sending: "جار التحليل...",
    typing: "كيشيب يكتب الآن",
    readingImage: "كيشيب يقرأ الصورة",
    uploadedImage: "رفعت صورة إضافية",
    final: "اعطني الخلاصة النهائية",
    locked: "استخدمت 10 رسائل لهذه القطعة.",
    counter: "رسائل مستخدمة",
    expert: "كيشيب",
    you: "أنت",
    empty: "تبدأ جلسة الخبير من هنا.",
    suggestions: [
      "عندي توقيع",
      "أريد رفع صورة ختم",
      "أعرف الوزن بالغرام",
      "عندي ختم 925 / 750",
      "أريد تحديث السعر",
      "أعتقد أنها من فنان معروف",
      "أريد معرفة هل أبيعها الآن",
      "أريد تقرير مزاد",
      "اعطني الخلاصة النهائية",
    ],
  };
}

function isRtl(locale: Locale) {
  return locale === "ar" || locale === "fa" || locale === "ku";
}

export default function FollowUpEvaluationPanel({
  locale,
  error,
  followUpText,
  followUpPreviews,
  isFollowUpAnalyzing,
  isReadingFollowUpImage,
  chatMessages,
  chatUsedTurns,
  chatMaxTurns,
  setFollowUpText,
  handleFollowUpImageChange,
  removeFollowUpImageAt,
  handleFollowUpAnalyze,
  handleFinalSummary,
  handleSuggestionClick,
}: Props) {
  const t = copy(locale);
  const limitReached = chatUsedTurns >= chatMaxTurns;
  const disabled = isFollowUpAnalyzing || limitReached;
  const direction = isRtl(locale) ? "rtl" : "ltr";
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages.length, followUpPreviews.length, isFollowUpAnalyzing]);

  function onSuggestion(value: string) {
    if (value === t.final) {
      handleFinalSummary();
      return;
    }

    handleSuggestionClick(value);
  }

  return (
    <section
      dir={direction}
      className="text-[#241912]"
    >
      <div className="mb-2 flex items-start justify-between gap-3 px-3 sm:px-4">
        <div className="min-w-0">
          <p className="mb-1 inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#986f2e]">
            <Sparkles className="h-3.5 w-3.5" />
            {t.title}
          </p>
          <h2 className="text-[18px] font-semibold leading-6 tracking-[-0.03em] text-[#233f32]">
            {t.altTitle}
          </h2>
          <p className="mt-1 max-w-3xl text-[12px] font-normal leading-5 text-[#735f4b]">
            {t.hint}
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-[#d2b98f]/70 bg-[#fff4e2]/70 px-2.5 py-1 text-center text-[11px] font-semibold text-[#735f4b]">
          <span dir="ltr" className="block text-[#233f32]">
            {chatUsedTurns} / {chatMaxTurns}
          </span>
          <span className="sr-only">
            {t.counter}
          </span>
        </div>
      </div>

      <div className="mb-2 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden">
        {t.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestion(suggestion)}
            disabled={isFollowUpAnalyzing || (limitReached && suggestion !== t.final)}
            className="h-7 shrink-0 rounded-full border border-[#d2b98f]/70 bg-[#fff8ec]/72 px-2.5 text-[11px] font-medium text-[#735f4b] transition hover:border-[#b88a3d] hover:bg-[#fff4e2] hover:text-[#6d241d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="max-h-[60dvh] min-h-[330px] space-y-2.5 overflow-y-auto border-y border-[#e1cfad]/55 bg-[#f8efdf]/42 px-3 py-3 sm:min-h-[420px] sm:px-4">
        {chatMessages.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-[#8a7560]">{t.empty}</p>
        ) : (
          chatMessages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={["flex", isUser ? "justify-end" : "justify-start"].join(
                  " ",
                )}
              >
                <div
                  className={[
                    "max-w-[86%] rounded-[16px] px-3 py-2.5 text-[12.5px] leading-6 shadow-[0_3px_12px_rgba(62,39,22,0.05)] sm:max-w-[72%]",
                    isUser
                      ? "rounded-br-[5px] bg-[#214333] text-[#fff8ec]"
                      : "rounded-bl-[5px] border border-[#d2b98f]/70 bg-[#fffaf3] text-[#4d3c2d]",
                  ].join(" ")}
                >
                  <p className="mb-0.5 text-[9.5px] font-semibold opacity-65">
                    {isUser ? t.you : t.expert}
                  </p>
                  {isUser && message.imageUrls?.length ? (
                    <p className="mb-2 text-[12px] font-semibold opacity-85">
                      {t.uploadedImage}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-line">{message.text}</p>
                  {message.imageUrls?.length ? (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {message.imageUrls.map((src, index) => (
                        <img
                          key={`${message.id}-${index}`}
                          src={src}
                          alt=""
                          className="aspect-square rounded-[9px] object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}

        {isFollowUpAnalyzing ? (
          <div className="flex justify-start">
            <div className="inline-flex max-w-[82%] items-center gap-2 rounded-full border border-[#d2b98f]/65 bg-[#fffaf3]/92 px-3 py-1.5 text-[12px] leading-5 text-[#5d4938] shadow-[0_3px_12px_rgba(62,39,22,0.05)]">
              <span className="text-[9.5px] font-semibold text-[#986f2e]">
                {t.expert}
              </span>
              <div className="flex items-center gap-1.5">
                <span>
                  {isReadingFollowUpImage ? t.readingImage : t.typing}
                </span>
                <span className="flex items-center gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#986f2e] [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#986f2e] [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#986f2e]" />
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {followUpPreviews.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-1.5 px-3 sm:px-4">
          {followUpPreviews.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="relative aspect-square overflow-hidden rounded-[10px] border border-[#d2b98f] bg-[#ead2c2]"
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeFollowUpImageAt(index)}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-[9px] bg-[#241912]/70 text-[#fff8ec]"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error ? (
        <p className="mt-2 px-3 text-[12px] font-medium leading-5 text-[#7b2f25] sm:px-4">
          {error}
        </p>
      ) : null}

      {limitReached ? (
        <div className="mx-3 mt-3 rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/80 p-3 sm:mx-4">
          <p className="mb-3 text-[13px] font-medium text-[#735f4b]">
            {t.locked}
          </p>
          <button
            type="button"
            onClick={handleFinalSummary}
            disabled={isFollowUpAnalyzing}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[12px] bg-[#b58a45] px-4 text-[13px] font-bold text-[#fff8ec] transition hover:bg-[#9f7639] disabled:opacity-50"
          >
            {isFollowUpAnalyzing ? t.sending : t.final}
          </button>
        </div>
      ) : (
        <div className="sticky bottom-0 mt-2 grid gap-1.5 border-t border-[#d2b98f]/55 bg-[#fff8ec]/92 px-3 py-2 backdrop-blur-xl sm:grid-cols-[auto_1fr_auto] sm:px-4">
          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-dashed border-[#b58a45]/45 bg-[#fff4e2]/72 px-3 text-[11px] font-semibold text-[#735f4b] transition hover:border-[#b58a45] hover:text-[#6d241d]">
            <ImagePlus className="h-4 w-4" />
            <span>{t.upload}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFollowUpImageChange}
              disabled={disabled}
            />
          </label>

          <textarea
            value={followUpText}
            onChange={(event) => setFollowUpText(event.target.value)}
            placeholder={t.placeholder}
            disabled={disabled}
            className="min-h-10 max-h-28 resize-none rounded-[16px] border border-[#d2b98f]/80 bg-[#fffaf3] px-3 py-2 text-[12.5px] font-normal leading-5 text-[#241912] outline-none placeholder:text-[#8d7a65] focus:border-[#b58a45]/70 disabled:opacity-60"
          />

          <button
            type="button"
            onClick={handleFollowUpAnalyze}
            disabled={disabled}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#233f32] px-3.5 text-[12px] font-bold text-[#fff8ec] transition hover:bg-[#1f362c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendHorizontal className="h-4 w-4" />
            {isFollowUpAnalyzing ? t.sending : t.send}
          </button>
        </div>
      )}
    </section>
  );
}
