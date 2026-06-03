"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, X } from "lucide-react";
import MarketShell from "@/components/marketplace/MarketShell";
import {
  adminApproveMarketplaceItem,
  adminRejectMarketplaceItem,
  getCurrentUserIsMarketplaceAdmin,
  getPendingMarketplaceItemsForAdmin,
} from "@/lib/marketplaceSupabase";
import type { MarketplaceItem } from "@/types/marketplace";

export default function MarketplaceAdminPage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAdminItems() {
    setIsLoading(true);
    setError("");

    try {
      const canReview = await getCurrentUserIsMarketplaceAdmin();
      setIsAdmin(canReview);

      if (!canReview) {
        setItems([]);
        return;
      }

      setItems(await getPendingMarketplaceItemsForAdmin());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "تعذر تحميل مراجعة السوق.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAdminItems();
  }, []);

  async function approveItem(id: string) {
    await adminApproveMarketplaceItem(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function rejectItem(id: string) {
    await adminRejectMarketplaceItem(id, rejectReasons[id]);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <MarketShell
      title="مراجعة السوق"
      subtitle="صفحة إدارية مبسطة لمراجعة القطع pending_review قبل نشرها."
    >
      {isLoading ? (
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
          جار التحقق من صلاحيات المراجعة...
        </div>
      ) : !isAdmin ? (
        <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm leading-7 text-[#dcc18a]">
          TODO: لا يوجد نظام أدمن واضح في الواجهة الحالية. هذه الصفحة لا تعرض
          أزرار القبول والرفض إلا لمن يملك `app_metadata.role = admin` أو
          `app_metadata.marketplace_admin = true` في Supabase Auth.
        </div>
      ) : error ? (
        <div className="rounded-[8px] border border-[#8e3c32]/50 bg-[#7a2f25]/38 p-6 text-sm text-[#ffd7cf]">
          {error}
        </div>
      ) : (
        <section className="grid gap-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-4 md:grid-cols-[180px_1fr]"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-[8px]">
                <Image
                  src={item.images[0]?.imageUrl ?? "/kishib-logo.png"}
                  alt={item.title}
                  fill
                  sizes="(min-width: 768px) 180px, 100vw"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm text-[#dcc18a]">{item.category}</p>
                <h2 className="mt-1 text-xl font-semibold text-[#fff4e2]">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#f8ead6]/82">
                  {item.description}
                </p>
                <textarea
                  value={rejectReasons[item.id] ?? ""}
                  onChange={(event) =>
                    setRejectReasons((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                  placeholder="ملاحظة سبب الرفض"
                  className="mt-4 min-h-20 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 p-3 text-sm text-[#fff4e2] outline-none placeholder:text-[#dcc18a]/70 focus:border-[#b88a3d]"
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => void approveItem(item.id)}
                    className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#1f6b56] px-4 text-sm font-semibold text-[#efffe9]"
                  >
                    <Check className="h-4 w-4" />
                    قبول النشر
                  </button>
                  <button
                    onClick={() => void rejectItem(item.id)}
                    className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#7a2f25] px-4 text-sm font-semibold text-[#fff4e2]"
                  >
                    <X className="h-4 w-4" />
                    رفض
                  </button>
                </div>
              </div>
            </article>
          ))}

          {items.length === 0 ? (
            <div className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-6 text-sm text-[#dcc18a]">
              لا توجد قطع بانتظار المراجعة حاليا.
            </div>
          ) : null}
        </section>
      )}
    </MarketShell>
  );
}
