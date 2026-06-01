"use client";

import Image from "next/image";

type AntiqueBackgroundProps = {
  imageSrc?: string;
};

export default function AntiqueBackground({
  imageSrc = "/bg-1.jpg",
}: AntiqueBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      suppressHydrationWarning
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
    >
      <Image
        src={imageSrc}
        alt=""
        fill
        priority
        sizes="100vw"
        className="select-none object-cover object-center opacity-55"
      />

      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-black/70 via-black/35 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

      <div className="absolute inset-y-0 left-0 hidden w-[340px] bg-gradient-to-r from-black/85 via-black/45 to-transparent lg:block" />

      <div className="absolute right-[8%] top-[18%] h-[340px] w-[340px] rounded-full bg-[#d6a25f]/[0.045] blur-[90px]" />
    </div>
  );
}