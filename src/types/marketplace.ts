export type MarketplaceItemStatus =
  | "pending_review"
  | "published"
  | "needs_changes"
  | "rejected"
  | "reserved"
  | "sold";

export type MarketplaceOrderStatus =
  | "purchase_requested"
  | "seller_confirmed"
  | "awaiting_payment"
  | "paid"
  | "delivered"
  | "completed"
  | "cancelled"
  | "dispute";

export type MarketplaceCategory =
  | "قطع سومرية"
  | "مخطوطات"
  | "فضيات"
  | "سجاد"
  | "خزف"
  | "حلي"
  | "أخشاب";

export type MarketplaceCondition =
  | "ممتازة"
  | "جيدة جدا"
  | "جيدة"
  | "تحتاج ترميم"
  | "آثار عمر واضحة";

export type MarketplaceItemImage = {
  id: string;
  itemId: string;
  imageUrl: string;
  storagePath: string | null;
  sortOrder: number;
  createdAt: string;
};

export type MarketplaceItem = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: MarketplaceCategory;
  material: string;
  origin: string;
  estimatedAge: string;
  condition: MarketplaceCondition;
  price: number;
  currency: "IQD" | "USD";
  country: string;
  city?: string;
  deliveryMethod: string;
  images: MarketplaceItemImage[];
  hasKishibEvaluation: boolean;
  kishibEvaluationSummary: string;
  status: MarketplaceItemStatus;
  rejectionReason: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  isMock?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceOrder = {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  itemPrice: number;
  commissionPercent: number;
  commissionAmount: number;
  sellerNetAmount: number;
  paymentGatewayFee: number;
  totalPaidByBuyer: number;
  status: MarketplaceOrderStatus;
  createdAt: string;
  updatedAt: string;
  item?: Pick<MarketplaceItem, "id" | "title" | "price" | "currency" | "images">;
};

export type MarketplaceNotificationType =
  | "item_published"
  | "item_rejected"
  | "item_needs_changes"
  | "purchase_requested"
  | "order_updated"
  | "collection_verified"
  | "collection_needs_changes"
  | "collection_rejected"
  | "collection_ready_for_sale";

export type MarketplaceNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: MarketplaceNotificationType;
  relatedItemId: string | null;
  relatedOrderId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type CreateMarketplaceItemInput = {
  title: string;
  description: string;
  category: MarketplaceCategory;
  material: string;
  origin: string;
  estimatedAge: string;
  condition: MarketplaceCondition;
  price: number;
  currency: "IQD" | "USD";
  country: string;
  city?: string;
  deliveryMethod: string;
  images: File[];
};

export type ItemStatus = MarketplaceItemStatus;
export type OrderStatus = MarketplaceOrderStatus;
export type ItemCondition = MarketplaceCondition;
export type MarketplaceImage = MarketplaceItemImage;

export type SellerProfile = {
  id: string;
  displayName: string;
  city: string;
  rating: number;
  completedSales: number;
  joinedAt: string;
};
