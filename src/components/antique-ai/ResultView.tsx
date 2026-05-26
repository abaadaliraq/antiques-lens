"use client";

import { Search, Share2 } from "lucide-react";

export type AnalysisResult = {
  title: string;
  lookup: string;
  timePeriod: string;
  origin: string;
  material: string;
  style: string;
  condition: string;
  authenticity: string;
  estimatedValue: string;
  priceReasoning: string;
  history: string;
  valueDrivers: string[];
  valueReducers: string[];
  visualSearchKeywords: string[];
  neededPhotos: string[];
  followUpQuestion: string;
  confidence: number;
  confidenceNote: string;
  disclaimer: string;
};

type ResultLabels = {
  result: string;
  age: string;
  value: string;
  material: string;
  origin: string;
  description: string;
  condition: string;
  authenticity: string;
  priceReason: string;
  valueDrivers: string;
  valueReducers: string;
  similar: string;
  similarHint: string;
  soon: string;
  neededPhotos: string;
  followUp: string;
  confidence: string;
  notice: string;
};

type Props = {
  result: AnalysisResult;
  imagePreview: string | null;
  labels: ResultLabels;
  onShare: () => void;
};

export default function ResultView({
  result,
  imagePreview,
  labels,
  onShare,
}: Props) {
  const similarKeywords = result.visualSearchKeywords?.length
    ? result.visualSearchKeywords
    : [result.title, result.material, result.timePeriod, result.style].filter(
        Boolean
      );

  return (
    <article className="pb-8 text-white">
      {imagePreview && (
        <div className="relative -mx-4 -mt-20 mb-8 h-[420px] overflow-hidden bg-black">
          <img
            src={imagePreview}
            alt={result.title}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/25 to-black/15" />

          <button
            type="button"
            onClick={onShare}
            className="absolute end-4 top-24 grid h-11 w-11 place-items-center rounded-full bg-black/35 text-white/75 backdrop-blur-2xl transition hover:bg-black/55 hover:text-white"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="px-1">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.34em] text-[#d6a25f]/75">
          {labels.result}
        </p>

        <h1 className="max-w-[360px] text-[34px] font-semibold leading-[1.12] tracking-[-0.055em] text-white">
          {result.title}
        </h1>

        {result.lookup && (
          <p className="mt-5 text-[16px] font-light leading-8 tracking-[-0.01em] text-white/68">
            {result.lookup}
          </p>
        )}

        <div className="my-8 h-px bg-white/10" />

        <div className="grid grid-cols-2 gap-x-7 gap-y-7">
          <CleanInfo label={labels.age} value={result.timePeriod} />
          <CleanInfo label={labels.value} value={result.estimatedValue} gold />
          <CleanInfo label={labels.material} value={result.material} />
          <CleanInfo label={labels.origin} value={result.origin} />
        </div>

        <FreeText title={labels.description} body={result.history} />
        <FreeText title={labels.condition} body={result.condition} />
        <FreeText title={labels.priceReason} body={result.priceReasoning} />
        <FreeText title={labels.authenticity} body={result.authenticity} />

        <FreeList title={labels.valueDrivers} items={result.valueDrivers} />
        <FreeList title={labels.valueReducers} items={result.valueReducers} />

        <section className="mt-11 border-t border-white/10 pt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[19px] font-semibold tracking-[-0.03em] text-white">
              {labels.similar}
            </h2>

            <span className="rounded-full bg-[#d6a25f]/10 px-3 py-1 text-[11px] font-medium text-[#d6a25f]/90">
              {labels.soon}
            </span>
          </div>

          <p className="mb-5 text-[14px] font-light leading-7 text-white/48">
            {labels.similarHint}
          </p>

          <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {similarKeywords.slice(0, 8).map((keyword, index) => (
              <div
                key={`${keyword}-${index}`}
                className="min-w-[148px] rounded-[24px] bg-white/[0.045] p-4"
              >
                <Search className="mb-6 h-6 w-6 text-[#d6a25f]/90" />

                <p className="line-clamp-3 text-[14px] font-light leading-6 tracking-[-0.01em] text-white/76">
                  {keyword}
                </p>

                <p className="mt-4 text-[11px] font-light text-white/30">
                  market keyword
                </p>
              </div>
            ))}
          </div>
        </section>

        <FreeList title={labels.neededPhotos} items={result.neededPhotos} />

        {result.followUpQuestion && (
          <section className="mt-11 border-t border-white/10 pt-8">
            <h2 className="mb-3 text-[19px] font-semibold tracking-[-0.03em] text-white">
              {labels.followUp}
            </h2>

            <p className="text-[16px] font-light leading-8 tracking-[-0.01em] text-white/66">
              {result.followUpQuestion}
            </p>
          </section>
        )}

        <section className="mt-11 border-t border-white/10 pt-7">
          <p className="text-[12px] font-light leading-6 text-white/36">
            {result.disclaimer || labels.notice}
          </p>

          <p className="mt-3 text-[12px] font-light leading-6 text-white/30">
            {labels.confidence}: {result.confidence}/10
            {result.confidenceNote ? ` — ${result.confidenceNote}` : ""}
          </p>
        </section>
      </div>
    </article>
  );
}

function CleanInfo({
  label,
  value,
  gold = false,
}: {
  label: string;
  value?: string;
  gold?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-[11px] font-medium tracking-[0.02em] text-white/34">
        {label}
      </p>

      <p
        className={[
          "text-[15px] leading-7 tracking-[-0.015em]",
          gold
            ? "font-medium text-[#d6a25f]"
            : "font-light text-white/76",
        ].join(" ")}
      >
        {value && value.trim() ? value : "غير واضح"}
      </p>
    </div>
  );
}

function FreeText({ title, body }: { title: string; body?: string }) {
  if (!body || !body.trim()) return null;

  return (
    <section className="mt-11 border-t border-white/10 pt-8">
      <h2 className="mb-3 text-[19px] font-semibold leading-7 tracking-[-0.035em] text-white">
        {title}
      </h2>

      <p className="text-[16px] font-light leading-8 tracking-[-0.015em] text-white/66">
        {body}
      </p>
    </section>
  );
}

function FreeList({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mt-11 border-t border-white/10 pt-8">
      <h2 className="mb-4 text-[19px] font-semibold leading-7 tracking-[-0.035em] text-white">
        {title}
      </h2>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex gap-3 text-[16px] font-light leading-8 tracking-[-0.015em] text-white/64"
          >
            <span className="mt-[13px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d6a25f]/85" />
            <p>{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}