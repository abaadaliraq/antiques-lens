"use client";

import type { ReactNode } from "react";

type MobileAntiqueLensUIProps = {
  dir?: "rtl" | "ltr";

  topBar: ReactNode;
  historyButton?: ReactNode;

  logoIcon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;

  composer: ReactNode;
  evaluationType: ReactNode;

  thinking?: ReactNode;
  result?: ReactNode;
  historySidebar?: ReactNode;
  background?: ReactNode;
  cookieBar?: ReactNode;
};

export default function MobileAntiqueLensUI({
  dir = "rtl",
  topBar,
  historyButton,
  logoIcon,
  title,
  subtitle,
  composer,
  evaluationType,
  thinking,
  result,
  historySidebar,
  background,
  cookieBar,
}: MobileAntiqueLensUIProps) {
  return (
    <main
      dir={dir}
      className="relative min-h-dvh overflow-hidden bg-[#090604] text-white md:hidden"
    >
      {background}

      {historySidebar}

      {/* Top Bar */}
      <header className="fixed left-0 right-0 top-0 z-40 px-4 pt-4">
        <div className="mx-auto flex h-10 max-w-md items-center justify-between rounded-full border border-white/10 bg-black/25 px-3 backdrop-blur-2xl">
          <div className="flex items-center">{historyButton}</div>
          <div className="flex items-center gap-2">{topBar}</div>
        </div>
      </header>

      {/* Content */}
      <section className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-5 pt-20">
        <div className="flex flex-1 flex-col justify-center">
          {logoIcon ? (
            <div className="mb-4 flex justify-center">{logoIcon}</div>
          ) : null}

          <div className="mb-4 text-center">
            <div className="mx-auto max-w-[330px] text-[30px] font-black leading-[1.05] tracking-[-0.04em] text-white">
              {title}
            </div>

            {subtitle ? (
              <div className="mx-auto mt-3 max-w-[310px] text-[11.5px] font-medium leading-6 text-white/45">
                {subtitle}
              </div>
            ) : null}
          </div>

          {/* Search Bar */}
          <div className="relative z-20">{composer}</div>

          {/* Evaluation Type UNDER Search */}
          <div className="relative z-10 mt-2">{evaluationType}</div>

          {thinking ? <div className="mt-4">{thinking}</div> : null}

          {result ? <div className="mt-4">{result}</div> : null}
        </div>
      </section>

      {cookieBar}
    </main>
  );
}