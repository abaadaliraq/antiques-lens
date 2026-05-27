"use client";

import Image from "next/image";

type AntiqueBackgroundProps = {
  imageSrc?: string;
};

export default function AntiqueBackground({
}: AntiqueBackgroundProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(152,109,255,0.34),transparent_34%),radial-gradient(circle_at_15%_85%,rgba(0,220,255,0.22),transparent_30%),linear-gradient(180deg,rgba(7,8,18,0.18)_0%,rgba(7,8,18,0.65)_55%,rgba(7,8,18,0.94)_100%)]" />

      <div className="absolute inset-0 backdrop-blur-[1.5px]" />
    </div>
  );
}