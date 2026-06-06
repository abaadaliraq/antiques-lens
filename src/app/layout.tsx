import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import TempAccessGate from "@/components/antique-ai/TempAccessGate";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Antique Lens | تقييم التحف والأنتيكات",
  description: "منصة تقييم أولي للتحف والأنتيكات باستخدام تحليل الصور والبيانات المساعدة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<main className="min-h-dvh bg-[#efe3cf]" />}>
          <TempAccessGate>{children}</TempAccessGate>
        </Suspense>
      </body>
    </html>
  );
}
