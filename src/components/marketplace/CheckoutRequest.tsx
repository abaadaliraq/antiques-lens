"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import {
  calculateMarketplaceAmounts,
  createMarketplaceOrder,
  formatMarketplaceMoney,
} from "@/lib/marketplaceSupabase";
import { marketplaceCopy, useMarketplaceLocale } from "@/lib/marketplaceI18n";
import type { MarketplaceItem } from "@/types/marketplace";

export default function CheckoutRequest({ item }: { item: MarketplaceItem }) {
  const locale = useMarketplaceLocale();
  const t = marketplaceCopy(locale);
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(item.isMock ? t.sampleOnly : "");
  const amounts = calculateMarketplaceAmounts(item.price);

  async function handleCreateOrder() {
    if (item.isMock) {
      setError(t.sampleOnly);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await createMarketplaceOrder(item.id);
      setConfirmed(true);
    } catch (orderError) {
      const message =
        orderError instanceof Error ? orderError.message : "Unable to send purchase request.";

      if (message.includes("تسجيل الدخول") || message.includes("login")) {
        router.push("/");
        return;
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="relative aspect-square overflow-hidden rounded-[8px] border border-[#d2b98f]/22">
        <Image
          src={item.images[0]?.imageUrl ?? "/kishib-logo.png"}
          alt={item.title}
          fill
          sizes="(min-width: 1024px) 360px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-5">
        <h2 className="text-2xl font-semibold text-[#fff4e2]">{item.title}</h2>
        <div className="mt-5 space-y-3 text-sm text-[#f8ead6]/88">
          <Row label={t.price} value={formatMarketplaceMoney(item.price, item.currency)} />
          <Row label={t.commission} value={formatMarketplaceMoney(amounts.commissionAmount)} />
          <Row label={t.sellerNet} value={formatMarketplaceMoney(amounts.sellerNetAmount)} />
          <Row label={t.total} value={formatMarketplaceMoney(amounts.totalPaidByBuyer)} />
        </div>

        <p className="mt-5 flex gap-2 rounded-[8px] border border-[#d7ae61]/34 bg-black/16 p-4 text-sm leading-7 text-[#dcc18a]">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#d7ae61]" />
          {t.paymentNotice}
        </p>

        <button
          type="button"
          onClick={handleCreateOrder}
          disabled={isSubmitting || confirmed}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-[#b88a3d] text-sm font-semibold text-[#fff4e2] transition hover:bg-[#986f2e] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
        >
          {isSubmitting ? t.sendingOrder : t.confirmPurchase}
        </button>

        {confirmed ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-[8px] border border-[#4f8f72]/40 bg-[#113f35]/54 px-4 py-3 text-sm text-[#d7f0cf]">
            <CheckCircle2 className="h-5 w-5" />
            {t.orderSuccess}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-[8px] border border-[#d7ae61]/34 bg-black/16 px-4 py-3 text-sm text-[#dcc18a]">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#d2b98f]/12 pb-3">
      <span className="text-[#dcc18a]">{label}</span>
      <span className="font-semibold text-[#fff4e2]">{value}</span>
    </div>
  );
}
