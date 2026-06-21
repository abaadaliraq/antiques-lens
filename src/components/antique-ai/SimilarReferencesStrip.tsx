"use client";

import type { Locale, SimilarImageResult } from "./types";

type Props = {
  images: SimilarImageResult[];
  locale: Locale;
  title?: string;
};

function isRtl(locale: Locale) {
  return locale === "ar" || locale === "ku" || locale === "fa";
}

function cleanHost(value?: string) {
  if (!value) return "";
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0] || "";
  }
}

export default function SimilarReferencesStrip({ images, locale, title }: Props) {
  if (!images.length) return null;

  const rtl = isRtl(locale);
  const heading =
    title || (locale === "ar" ? "صور مشابهة" : "Similar references");

  return (
    <section dir={rtl ? "rtl" : "ltr"} className="mt-5">
      <p className="mb-2 text-[11px] font-bold text-[#986f2e]">{heading}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] sm:grid sm:grid-cols-3 sm:overflow-visible">
        {images.slice(0, 3).map((item, index) => {
          const source = item.source || cleanHost(item.link || item.imageUrl);
          const content = (
            <>
              <div className="aspect-[4/3] overflow-hidden rounded-[12px] bg-[#d9b59e]">
                <img
                  src={item.imageUrl}
                  alt={item.title || "Similar reference"}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
              {source ? (
                <span className="mt-1 block truncate px-0.5 text-[9.5px] font-semibold text-[#986f2e]/80">
                  {source}
                </span>
              ) : null}
            </>
          );

          if (item.link || item.imageUrl) {
            return (
              <a
                key={`${item.imageUrl || item.link}-${index}`}
                href={item.link || item.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="group w-[31%] min-w-[104px] shrink-0 sm:w-auto sm:min-w-0"
              >
                {content}
              </a>
            );
          }

          return (
            <div
              key={`${item.imageUrl}-${index}`}
              className="w-[31%] min-w-[104px] shrink-0 sm:w-auto sm:min-w-0"
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
