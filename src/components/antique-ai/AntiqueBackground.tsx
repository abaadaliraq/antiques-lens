"use client";

import Image from "next/image";

type AntiqueBackgroundProps = {
  imageSrc?: string;
};

export default function AntiqueBackground({
  imageSrc = "/bg.png",
}: AntiqueBackgroundProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-black">
      <Image
        src={imageSrc}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-bottom opacity-80"
      />

      {/* تغميق من الأعلى حتى تندمج الصورة مع الأسود */}
      <div className="absolute inset-x-0 top-0 h-[62%] bg-gradient-to-b from-black via-black/90 to-transparent" />

      {/* طبقة سوداء خفيفة بدون ألوان */}
      <div className="absolute inset-0 bg-black/20" />

      {/* تلاشي سفلي خفيف */}
      <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-black via-black/45 to-transparent" />
    </div>
  );
}