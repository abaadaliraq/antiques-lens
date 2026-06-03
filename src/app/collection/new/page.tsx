"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Send } from "lucide-react";
import MarketShell from "@/components/marketplace/MarketShell";
import { createCollectionItem } from "@/lib/collectionSupabase";
import { collectionCopy } from "@/lib/collectionI18n";
import {
  getMarketplaceCategoryLabel,
  getMarketplaceConditionLabel,
  getMarketplaceCountryLabel,
  marketplaceCategoryValues,
  marketplaceConditionValues,
  marketplaceCountries,
  marketplaceCopy,
  useMarketplaceLocale,
} from "@/lib/marketplaceI18n";
import type {
  MarketplaceCategory,
  MarketplaceCondition,
} from "@/types/marketplace";
import type { CreateCollectionItemInput } from "@/types/collection";

const initialForm = {
  title: "",
  description: "",
  category: marketplaceCategoryValues[0],
  material: "",
  origin: "",
  estimatedAge: "",
  condition: marketplaceConditionValues[2],
  estimatedValue: "",
  currency: "USD" as "IQD" | "USD",
  country: "Iraq",
  city: "",
  dimensions: "",
  weight: "",
  hasMark: "no",
  notes: "",
};

export default function NewCollectionItemPage() {
  const locale = useMarketplaceLocale();
  const t = collectionCopy(locale);
  const marketT = marketplaceCopy(locale);
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

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

    const input: CreateCollectionItemInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      material: form.material.trim(),
      origin: form.origin.trim(),
      estimatedAge: form.estimatedAge.trim(),
      condition: form.condition,
      estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : null,
      currency: form.currency,
      country: form.country,
      city: form.city.trim() || undefined,
      dimensions: form.dimensions.trim() || undefined,
      weight: form.weight.trim() || undefined,
      hasMark: form.hasMark === "yes",
      notes: form.notes.trim() || undefined,
      images: files,
    };

    try {
      if (!input.title || !input.description || !input.category || !input.country) {
        throw new Error(t.requiredFields);
      }

      if (input.images.length === 0) {
        throw new Error(t.imageRequired);
      }

      await createCollectionItem(input);
      setSubmitted(true);
      setForm(initialForm);
      setFiles([]);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unable to save collection item.";

      if (message.includes("Login") || message.includes("تسجيل الدخول")) {
        router.push("/");
        return;
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MarketShell title={t.addItemTitle} subtitle={t.addItemSubtitle}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Section title={marketT.uploadImages}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Front image", "Back image", "Detail image", "Optional image"].map(
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
        </Section>

        <Section title={marketT.itemInfo}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={marketT.itemName} value={form.title} onChange={(value) => updateField("title", value)} />
            <Select
              label={marketT.category}
              value={form.category}
              options={marketplaceCategoryValues}
              getLabel={(value) => getMarketplaceCategoryLabel(value, locale)}
              onChange={(value) => updateField("category", value as MarketplaceCategory)}
            />
            <Field label={marketT.description} value={form.description} onChange={(value) => updateField("description", value)} multiline />
            <Field label={marketT.material} value={form.material} onChange={(value) => updateField("material", value)} />
            <Field label={marketT.originIfKnown} value={form.origin} onChange={(value) => updateField("origin", value)} />
            <Field label={marketT.approximateAge} value={form.estimatedAge} onChange={(value) => updateField("estimatedAge", value)} />
            <Select
              label={marketT.condition}
              value={form.condition}
              options={marketplaceConditionValues}
              getLabel={(value) => getMarketplaceConditionLabel(value, locale)}
              onChange={(value) => updateField("condition", value as MarketplaceCondition)}
            />
            <Field label={t.estimatedValue} value={form.estimatedValue} inputMode="numeric" onChange={(value) => updateField("estimatedValue", value)} />
            <Select label="Currency" value={form.currency} options={["USD", "IQD"]} onChange={(value) => updateField("currency", value as "USD" | "IQD")} />
            <Select
              label={marketT.country}
              value={form.country}
              options={marketplaceCountries}
              getLabel={(value) => getMarketplaceCountryLabel(value, locale)}
              onChange={(value) => updateField("country", value)}
            />
            <Field label={marketT.city} value={form.city} onChange={(value) => updateField("city", value)} />
            <Field label={t.dimensions} value={form.dimensions} onChange={(value) => updateField("dimensions", value)} />
            <Field label={t.weight} value={form.weight} onChange={(value) => updateField("weight", value)} />
            <Select
              label={marketT.hasMark}
              value={form.hasMark}
              options={["no", "yes"]}
              getLabel={(value) => (value === "yes" ? marketT.yes : marketT.no)}
              onChange={(value) => updateField("hasMark", value)}
            />
            <Field label={t.notes} value={form.notes} onChange={(value) => updateField("notes", value)} multiline />
          </div>
        </Section>

        <p className="rounded-[8px] border border-[#d7ae61]/34 bg-black/16 p-3 text-sm leading-6 text-[#dcc18a]">
          {t.privateOnly} {t.canSellAfterVerify}
        </p>

        <button
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[#b88a3d] text-sm font-semibold text-[#fff4e2] transition hover:bg-[#986f2e] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? marketT.submitting : t.saveForReview}
        </button>

        {submitted ? (
          <p className="inline-flex items-center gap-2 rounded-[8px] border border-[#4f8f72]/40 bg-[#113f35]/54 px-4 py-3 text-sm text-[#d7f0cf]">
            <CheckCircle2 className="h-5 w-5" />
            {t.savedForReview}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-[8px] border border-[#8e3c32]/50 bg-[#7a2f25]/38 px-4 py-3 text-sm text-[#ffd7cf]">
            {error}
          </p>
        ) : null}
      </form>
    </MarketShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
  multiline,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className={["space-y-1", multiline ? "sm:col-span-2" : ""].join(" ")}>
      <span className="text-sm text-[#dcc18a]">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-28 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 p-3 text-sm text-[#fff4e2] outline-none focus:border-[#b88a3d]"
        />
      ) : (
        <input
          value={value}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-[8px] border border-[#d2b98f]/26 bg-[#0d0907]/72 px-3 text-sm text-[#fff4e2] outline-none focus:border-[#b88a3d]"
        />
      )}
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  getLabel = (option) => option,
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
