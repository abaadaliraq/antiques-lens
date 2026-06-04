"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Send } from "lucide-react";
import MarketItemCard from "@/components/marketplace/MarketItemCard";
import MarketShell from "@/components/marketplace/MarketShell";
import {
  calculateMarketplaceAmounts,
  createMarketplaceItem,
  formatMarketplaceMoney,
} from "@/lib/marketplaceSupabase";
import {
  getMarketplaceCategoryLabel,
  getMarketplaceConditionLabel,
  marketplaceCategoryValues,
  marketplaceConditionValues,
  marketplaceCopy,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";
import {
  getMarketplaceCityLabel,
  getMarketplaceCountryLabelWithFlag,
  getMarketplaceLocation,
  marketplaceLocations,
  OTHER_CITY_VALUE,
} from "@/lib/marketplaceLocations";
import type {
  CreateMarketplaceItemInput,
  MarketplaceCategory,
  MarketplaceCondition,
  MarketplaceItem,
} from "@/types/marketplace";

const initialForm = {
  title: "",
  category: marketplaceCategoryValues[0],
  estimatedAge: "",
  origin: "",
  material: "",
  condition: marketplaceConditionValues[2],
  hasMark: "",
  description: "",
  price: "250000",
  country: "Iraq",
  city: "",
  customCity: "",
  deliveryMethod: "",
};

function normalizePriceInput(value: string) {
  const normalized = value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[,\u066c\u060c\s]/g, "")
    .trim();
  const price = Number(normalized);

  return Number.isFinite(price) && price > 0 ? price : NaN;
}

export default function NewMarketplaceItemPage() {
  const locale = useMarketplaceLocale();
  const t = marketplaceCopy(locale);
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const normalizedPrice = normalizePriceInput(form.price);
  const price = Number.isFinite(normalizedPrice) ? normalizedPrice : 0;
  const amounts = calculateMarketplaceAmounts(price);
  const cityOptions = getMarketplaceLocation(form.country)?.cities ?? [];
  const resolvedCity =
    form.city === OTHER_CITY_VALUE ? form.customCity.trim() : form.city;
  const previewItem: MarketplaceItem = useMemo(
    () => ({
      id: "preview",
      sellerId: "preview",
      title: form.title || t.itemName,
      description: form.description || t.description,
      category: form.category,
      material: form.material || t.material,
      origin: form.origin || t.origin,
      estimatedAge: form.estimatedAge || t.approximateAge,
      condition: form.condition,
      price,
      currency: "IQD",
      country: form.country,
      city: resolvedCity,
      deliveryMethod: form.deliveryMethod || t.deliveryMethod,
      images: [],
      hasKishibEvaluation: false,
      kishibEvaluationSummary: t.noEvaluation,
      status: "pending_review",
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [form, price, resolvedCity, t],
  );

  function updateField<Field extends keyof typeof form>(
    field: Field,
    value: (typeof form)[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function setFileAt(index: number, fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    setFiles((current) => {
      const next = [...current];
      next[index] = file;
      return next.filter(Boolean);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitted(false);
    setIsSubmitting(true);

    const title = form.title.trim();
    const description = form.description.trim();
    const country = form.country;
    const submitPrice = normalizePriceInput(form.price);
    const city = form.city === OTHER_CITY_VALUE ? form.customCity.trim() : form.city.trim();

    if (process.env.NODE_ENV !== "production") {
      console.log({
        title,
        description,
      price: form.price,
      normalizedPrice: submitPrice,
      country,
      });
    }

    const input: CreateMarketplaceItemInput = {
      title,
      description,
      category: form.category,
      material: form.material.trim(),
      origin: form.origin.trim(),
      estimatedAge: form.estimatedAge.trim(),
      condition: form.condition,
      price: submitPrice,
      currency: "IQD",
      country,
      city: city || undefined,
      deliveryMethod: form.deliveryMethod.trim(),
      images: files,
    };

    try {
      if (!input.title || !input.description || !input.country) {
        throw new Error(t.validationRequired);
      }

      if (!Number.isFinite(input.price) || input.price <= 0) {
        throw new Error("يرجى إدخال سعر صحيح");
      }

      if (input.images.length === 0) {
        throw new Error(t.validationImage);
      }

      await createMarketplaceItem(input);
      setSubmitted(true);
      setForm(initialForm);
      setFiles([]);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to send the item for review.";

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
    <MarketShell title={t.newTitle} subtitle={t.newSubtitle}>
      <form className="grid gap-6 lg:grid-cols-[1fr_360px]" onSubmit={handleSubmit}>
        <div className="space-y-5">
          <Step title={t.uploadImages}>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Front image", "Back image", "Detail or stamp image", "Optional extra image"].map(
                (label, index) => (
                  <label
                    key={label}
                    className="grid min-h-28 cursor-pointer place-items-center rounded-[8px] border border-dashed border-[#d2b98f]/36 bg-[#fff4e2]/7 p-4 text-center text-sm text-[#dcc18a]"
                  >
                    <ImagePlus className="mb-2 h-6 w-6 text-[#d7ae61]" />
                    {files[index]?.name ?? label}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => setFileAt(index, event.target.files)}
                    />
                  </label>
                ),
              )}
            </div>
          </Step>

          <Step title={t.itemInfo}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={t.itemName}
                value={form.title}
                onChange={(value) => updateField("title", value)}
              />
              <Select
                label={t.category}
                value={form.category}
                options={marketplaceCategoryValues}
                getLabel={(value) => getMarketplaceCategoryLabel(value, locale)}
                onChange={(value) =>
                  updateField("category", value as MarketplaceCategory)
                }
              />
              <Field
                label={t.approximateAge}
                value={form.estimatedAge}
                onChange={(value) => updateField("estimatedAge", value)}
              />
              <Field
                label={t.originIfKnown}
                value={form.origin}
                onChange={(value) => updateField("origin", value)}
              />
              <Field
                label={t.material}
                value={form.material}
                onChange={(value) => updateField("material", value)}
              />
              <Select
                label={t.condition}
                value={form.condition}
                options={marketplaceConditionValues}
                getLabel={(value) => getMarketplaceConditionLabel(value, locale)}
                onChange={(value) =>
                  updateField("condition", value as MarketplaceCondition)
                }
              />
              <Select
                label={t.hasMark}
                value={form.hasMark}
                options={["", t.yes, t.no, t.unclear]}
                onChange={(value) => updateField("hasMark", value)}
              />
              <Select
                label={t.country}
                value={form.country}
                options={marketplaceLocations.map((location) => location.value)}
                getLabel={(value) => getMarketplaceCountryLabelWithFlag(value, locale)}
                onChange={(value) => {
                  updateField("country", value);
                  updateField("city", "");
                  updateField("customCity", "");
                }}
              />
              <Select
                label={t.city}
                value={form.city}
                options={["", ...cityOptions.map((city) => city.value), OTHER_CITY_VALUE]}
                getLabel={(value) => {
                  if (!value) return t.allCities;
                  if (value === OTHER_CITY_VALUE) return t.otherCity;
                  return getMarketplaceCityLabel(form.country, value, locale);
                }}
                onChange={(value) => updateField("city", value)}
              />
              {form.city === OTHER_CITY_VALUE ? (
                <Field
                  label={t.cityName}
                  value={form.customCity}
                  onChange={(value) => updateField("customCity", value)}
                />
              ) : null}
              <Field
                label={t.deliveryMethod}
                value={form.deliveryMethod}
                onChange={(value) => updateField("deliveryMethod", value)}
              />
              <label className="space-y-1">
                <span className="text-sm text-[#dcc18a]">{t.requestedPrice}</span>
                <input
                  value={form.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  inputMode="numeric"
                  className="h-11 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2] outline-none focus:border-[#b88a3d]"
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm text-[#dcc18a]">{t.description}</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  className="min-h-28 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 p-3 text-sm text-[#fff4e2] outline-none focus:border-[#b88a3d]"
                />
              </label>
            </div>
          </Step>

          <Step title={t.preview}>
            <div className="grid gap-4 sm:grid-cols-[1fr_260px]">
              <div className="rounded-[8px] border border-[#d2b98f]/22 bg-black/16 p-4 text-sm leading-7 text-[#f8ead6]/84">
                <p>{t.itemPrice}: {formatMarketplaceMoney(previewItem.price)}</p>
                <p>{t.commission}: {formatMarketplaceMoney(amounts.commissionAmount)}</p>
                <p>{t.sellerNet}: {formatMarketplaceMoney(amounts.sellerNetAmount)}</p>
              </div>
              <MarketItemCard item={previewItem} />
            </div>
          </Step>

          <button
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[#b88a3d] text-sm font-semibold text-[#fff4e2] transition hover:bg-[#986f2e] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? t.submitting : t.submitReview}
          </button>

          {submitted ? (
            <p className="inline-flex items-center gap-2 rounded-[8px] border border-[#4f8f72]/40 bg-[#113f35]/54 px-4 py-3 text-sm text-[#d7f0cf]">
              <CheckCircle2 className="h-5 w-5" />
              {t.submitSuccess}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-[8px] border border-[#8e3c32]/50 bg-[#7a2f25]/38 px-4 py-3 text-sm text-[#ffd7cf]">
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </MarketShell>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[8px] border border-[#d2b98f]/20 bg-[#fff4e2]/8 p-4">
      <h2 className="mb-4 text-lg font-semibold text-[#fff4e2]">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-sm text-[#dcc18a]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2] outline-none focus:border-[#b88a3d]"
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  getLabel = (option) => option || "Not specified",
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  getLabel?: (value: string) => string;
}) {
  return (
    <label className="space-y-1">
      <span className="text-sm text-[#dcc18a]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2] outline-none focus:border-[#b88a3d]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {getLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
