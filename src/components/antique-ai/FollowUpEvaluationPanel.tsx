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
      className="rounded-[18px] border border-[#d2b98f] bg-[#fff8ec]/90 p-4 text-[#241912] shadow-[0_16px_44px_rgba(62,39,22,0.08)] backdrop-blur-2xl sm:p-5"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#986f2e]">
            <Sparkles className="h-3.5 w-3.5" />
            {t.title}
          </p>
          <h2 className="text-[20px] font-semibold leading-7 tracking-[-0.03em] text-[#233f32]">
            {t.altTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] font-normal leading-6 text-[#735f4b]">
            {t.hint}
          </p>
        </div>

        <div className="shrink-0 rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/80 px-3 py-2 text-center text-[12px] font-semibold text-[#735f4b]">
          <span dir="ltr" className="block text-[#233f32]">
            {chatUsedTurns} / {chatMaxTurns}
          </span>
          <span className="block text-[10px] font-medium text-[#986f2e]">
            {t.counter}
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {t.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestion(suggestion)}
            disabled={isFollowUpAnalyzing || (limitReached && suggestion !== t.final)}
            className="min-h-9 rounded-[10px] border border-[#d2b98f] bg-[#fff4e2]/74 px-3 text-[12px] font-medium text-[#735f4b] transition hover:border-[#b88a3d] hover:text-[#6d241d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="max-h-[520px] min-h-[280px] space-y-4 overflow-y-auto rounded-[16px] border border-[#e1cfad] bg-[#f7eddb]/72 p-3 sm:p-4">
        {chatMessages.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-[#8a7560]">{t.empty}</p>
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
                    "max-w-[82%] rounded-[18px] px-3.5 py-3 text-[13px] leading-6 shadow-sm sm:max-w-[74%]",
                    isUser
                      ? "rounded-br-[6px] bg-[#233f32] text-[#fff8ec]"
                      : "rounded-bl-[6px] border border-[#d2b98f] bg-[#fff8ec] text-[#4d3c2d]",
                  ].join(" ")}
                >
                  <p className="mb-1 text-[10px] font-semibold opacity-70">
                    {isUser ? t.you : t.expert}
                  </p>
                  {isUser && message.imageUrls?.length ? (
                    <p className="mb-2 text-[12px] font-semibold opacity-85">
                      {t.uploadedImage}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-line">{message.text}</p>
                  {message.imageUrls?.length ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {message.imageUrls.map((src, index) => (
                        <img
                          key={`${message.id}-${index}`}
                          src={src}
                          alt=""
                          className="aspect-square rounded-[10px] object-cover"
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
            <div className="max-w-[78%] rounded-[18px] rounded-bl-[6px] border border-[#d2b98f] bg-[#fff8ec] px-3.5 py-3 text-[13px] leading-6 text-[#4d3c2d] shadow-sm">
              <p className="mb-1 text-[10px] font-semibold opacity-70">
                {t.expert}
              </p>
              <div className="flex items-center gap-2">
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
        <div className="mt-3 grid grid-cols-4 gap-2">
          {followUpPreviews.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="relative aspect-square overflow-hidden rounded-[12px] border border-[#d2b98f] bg-[#ead2c2]"
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
        <p className="mt-3 text-[13px] font-medium leading-6 text-[#7b2f25]">
          {error}
        </p>
      ) : null}

      {limitReached ? (
        <div className="mt-4 rounded-[12px] border border-[#d2b98f] bg-[#fff4e2]/80 p-3">
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
        <div className="sticky bottom-0 mt-4 grid gap-2 rounded-[16px] border border-[#d2b98f] bg-[#fff8ec]/95 p-2 shadow-[0_-10px_30px_rgba(62,39,22,0.08)] backdrop-blur-xl sm:grid-cols-[auto_1fr_auto]">
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#b58a45]/45 bg-[#fff4e2]/80 px-3 text-[12px] font-semibold text-[#735f4b] transition hover:border-[#b58a45] hover:text-[#6d241d]">
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
            className="min-h-11 max-h-32 resize-none rounded-[12px] border border-[#d2b98f] bg-[#fff8ec] px-3 py-2 text-[13px] font-normal leading-6 text-[#241912] outline-none placeholder:text-[#8d7a65] focus:border-[#b58a45]/70 disabled:opacity-60"
          />

          <button
            type="button"
            onClick={handleFollowUpAnalyze}
            disabled={disabled}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[12px] bg-[#233f32] px-4 text-[13px] font-bold text-[#fff8ec] transition hover:bg-[#1f362c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendHorizontal className="h-4 w-4" />
            {isFollowUpAnalyzing ? t.sending : t.send}
          </button>
        </div>
      )}
    </section>
  );
}
