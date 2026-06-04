"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Gem, LayoutDashboard, Plus, ScrollText, ShoppingBag, Archive } from "lucide-react";
import { collectionCopy } from "@/lib/collectionI18n";
import {
  getMarketplaceDirection,
  getMarketplaceNavLabel,
  getMarketplaceSellItemLabel,
  marketplaceCopy,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";

export default function MarketShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const locale = useMarketplaceLocale();
  const t = marketplaceCopy(locale);
  const collectionT = collectionCopy(locale);
  const links = [
    { href: "/marketplace", label: getMarketplaceNavLabel(locale), icon: ShoppingBag },
    { href: "/collection", label: collectionT.myCollection, icon: Archive },
    { href: "/marketplace/new", label: getMarketplaceSellItemLabel(locale), icon: Plus },
    { href: "/marketplace/seller", label: t.sellerNav, icon: LayoutDashboard },
    { href: "/marketplace/orders", label: t.ordersNav, icon: ScrollText },
  ];

  return (
    <main dir={getMarketplaceDirection(locale)} className="min-h-dvh bg-[#130d0a] text-[#fff4e2]">
      <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(35,91,74,0.22),transparent_34%),linear-gradient(145deg,rgba(88,29,22,0.42),rgba(19,13,10,0.96)_46%,rgba(8,8,11,1))]">
        <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-6 pt-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d2b98f]/28 bg-[#fff4e2]/8 px-3 py-2 text-sm text-[#f8ead6] transition hover:border-[#d2b98f]/55 hover:bg-[#fff4e2]/12"
            >
              <Gem className="h-4 w-4 text-[#d7ae61]" />
              KISHIB
            </Link>

            <nav className="flex gap-2 overflow-x-auto rounded-full border border-[#d2b98f]/16 bg-black/18 p-1">
              {links.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-[#f8ead6]/82 transition hover:bg-[#fff4e2]/10 hover:text-[#fff4e2] sm:text-sm"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <section className="flex flex-col gap-4 border-y border-[#d2b98f]/16 py-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.26em] text-[#d7ae61]">
                {t.marketEyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#dcc18a]">
                {subtitle}
              </p>
            </div>
            {action}
          </section>
        </header>

        <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </main>
  );
}
