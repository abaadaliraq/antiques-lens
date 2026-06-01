"use client";

export default function AntiqueBackground() {
  return (
    <div
      aria-hidden="true"
      suppressHydrationWarning
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
    >
      <div className="absolute inset-0 bg-black" />
      <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#22D3EE]/10 blur-3xl" />
      <div className="absolute left-1/2 top-0 h-56 w-[80vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.12),transparent_62%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/95 to-transparent" />
    </div>
  );
}
