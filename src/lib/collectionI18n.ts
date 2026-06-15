"use client";

import type { Locale } from "@/components/antique-ai/types";
import type { CollectionReviewStatus } from "@/types/collection";
import { marketplaceCopy } from "@/lib/marketplaceI18n";

const copy = {
  ar: {
    myCollection: "مقتنيات",
    myCollectionSubtitle:
      "معرض عام للمقتنيات الموثقة؛ يمكن للزوار الإعجاب أو تقديم عرض سعر بسيط، ويبقى قرار البيع لصاحب المقتنى.",
    addItem: "أضف مقتنى",
    addItemTitle: "إضافة مقتنى",
    addItemSubtitle: "احفظ مقتناك الخاص وأرسله لمراجعة KISHIB.",
    privateOnly: "هذا المقتنى خاص بك فقط.",
    canSellAfterVerify: "يمكن عرضه للبيع بعد التوثيق.",
    verifiedBadge: "KISHIB Verified",
    listForSale: "اعرض للبيع",
    saveForReview: "حفظ وإرسال للمراجعة",
    savedForReview: "تم حفظ المقتنى وإرساله لمراجعة KISHIB.",
    reviewReason: "سبب المراجعة",
    verifyItem: "توثيق المقتنى",
    requestChanges: "طلب تعديل",
    rejectVerification: "رفض التوثيق",
    details: "عرض التفاصيل",
    collectionReview: "مراجعة المقتنيات",
    noItems: "لا توجد مقتنيات بعد.",
    noReviewItems: "لا توجد مقتنيات بانتظار المراجعة.",
    estimatedValue: "السعر التقديري",
    dimensions: "الأبعاد",
    weight: "الوزن",
    notes: "ملاحظات إضافية",
    reviewStatus: "حالة المراجعة",
    deleteItem: "حذف",
    editItem: "تعديل",
    imageRequired: "يرجى رفع صورة واحدة على الأقل.",
    requiredFields: "يرجى تعبئة الاسم والوصف والتصنيف والبلد.",
    listedRequestSent: "تم إنشاء طلب عرض في السوق وبانتظار مراجعة الإدارة.",
    cannotList: "يمكن عرض المقتنى للبيع بعد توثيقه فقط.",
  },
  en: {
    myCollection: "Collections",
    myCollectionSubtitle:
      "A public gallery for verified collectibles. Visitors can like an item or place a simple offer, while the collector decides whether to sell later.",
    addItem: "Add item",
    addItemTitle: "Add collection item",
    addItemSubtitle: "Save your private item and send it to KISHIB review.",
    privateOnly: "This collection item is private to you.",
    canSellAfterVerify: "It can be listed for sale after verification.",
    verifiedBadge: "KISHIB Verified",
    listForSale: "List for sale",
    saveForReview: "Save and send for review",
    savedForReview: "The collection item was saved and sent to KISHIB review.",
    reviewReason: "Review reason",
    verifyItem: "Verify item",
    requestChanges: "Request changes",
    rejectVerification: "Reject verification",
    details: "View details",
    collectionReview: "Collection Review",
    noItems: "No collection items yet.",
    noReviewItems: "No collection items are pending review.",
    estimatedValue: "Estimated value",
    dimensions: "Dimensions",
    weight: "Weight",
    notes: "Additional notes",
    reviewStatus: "Review status",
    deleteItem: "Delete",
    editItem: "Edit",
    imageRequired: "Please upload at least one image.",
    requiredFields: "Please fill name, description, category, and country.",
    listedRequestSent: "Marketplace listing request was created and is waiting for admin review.",
    cannotList: "This item can be listed for sale only after verification.",
  },
};

function group(locale: Locale): keyof typeof copy {
  return locale === "ar" || locale === "ku" || locale === "fa" ? "ar" : "en";
}

export function collectionCopy(locale: Locale) {
  return copy[group(locale)];
}

export function getCollectionStatusLabel(status: CollectionReviewStatus, locale: Locale) {
  const labels: Record<keyof typeof copy, Record<CollectionReviewStatus, string>> = {
    ar: {
      pending_review: "قيد المراجعة",
      verified: "موثق",
      needs_changes: "يحتاج تعديل",
      rejected: "مرفوض",
    },
    en: {
      pending_review: "Pending review",
      verified: "Verified",
      needs_changes: "Needs changes",
      rejected: "Rejected",
    },
  };

  return labels[group(locale)][status] ?? status;
}

export function sharedMarketplaceText(locale: Locale) {
  return marketplaceCopy(locale);
}
