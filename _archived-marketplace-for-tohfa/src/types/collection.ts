import type {
  MarketplaceCategory,
  MarketplaceCondition,
  MarketplaceItemImage,
} from "@/types/marketplace";

export type CollectionReviewStatus =
  | "pending_review"
  | "verified"
  | "needs_changes"
  | "rejected";

export type CollectionVisibility =
  | "private"
  | "ready_for_sale"
  | "listed"
  | "archived";

export type CollectionItemImage = {
  id: string;
  collectionItemId: string;
  imageUrl: string;
  storagePath: string | null;
  sortOrder: number;
  createdAt: string;
};

export type CollectionItem = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: MarketplaceCategory;
  material: string;
  origin: string;
  estimatedAge: string;
  condition: MarketplaceCondition;
  estimatedValue: number | null;
  currency: "IQD" | "USD";
  country: string;
  city?: string;
  dimensions: string;
  weight: string;
  hasMark: boolean;
  notes: string;
  visibility: CollectionVisibility;
  reviewStatus: CollectionReviewStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  marketplaceItemId: string | null;
  images: CollectionItemImage[];
  createdAt: string;
  updatedAt: string;
};

export type CreateCollectionItemInput = {
  title: string;
  description: string;
  category: MarketplaceCategory;
  material: string;
  origin: string;
  estimatedAge: string;
  condition: MarketplaceCondition;
  estimatedValue?: number | null;
  currency: "IQD" | "USD";
  country: string;
  city?: string;
  dimensions?: string;
  weight?: string;
  hasMark: boolean;
  notes?: string;
  images: File[];
};

export type UpdateCollectionItemInput = Omit<
  CreateCollectionItemInput,
  "images"
> & {
  images?: File[];
};

export type CollectionMarketplaceImage = Pick<
  MarketplaceItemImage,
  "imageUrl" | "storagePath" | "sortOrder"
>;
