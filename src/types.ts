export interface Product {
  id: string;
  sellerId?: string;
  sku: string;
  name: string;
  category: string;
  categoryId?: string;
  slug?: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discountPrice?: number;
  flashSalePrice?: number;
  discountPercent?: number;
  compareAtPrice?: number;
  cost: number;
  inventory: number;
  stock?: number;
  warehouseStock: { [warehouseId: string]: number };
  rating: number;
  sales: number;
  sold?: number;
  reviewCount?: number;
  status: 'active' | 'draft' | 'archived';
  createdAt?: string;
  updatedAt: string;
  description: string;
  attributes?: { name: string; values: string[] }[];
  specification?: Record<string, string>;
  tags: string[];
  images?: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  translations?: { [lang: string]: { name: string; description: string } };
  versionHistory?: { version: number; date: string; author: string; changes: string }[];
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  image?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type BannerStatus = 'active' | 'inactive' | 'scheduled';

export interface Banner {
  id: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  tag: string;
  title: string;
  description: string;
  note?: string;
  cta: string;
  targetPath: string;
  targetParams: Record<string, unknown>;
  bgClassName: string;
  chipClassName: string;
  chipTextClassName: string;
  buttonClassName: string;
  buttonTextColor: string;
  iconName: string;
  detailIconName: string;
  detailLabel: string;
  status: BannerStatus;
  sortOrder: number;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryHistory {
  productId: string;
  date: string;
  change: number;
  type: 'restock' | 'sale' | 'transfer' | 'adjustment';
  warehouse: string;
  notes: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderTimelineEvent {
  date: string;
  status: string;
  title: string;
  description: string;
}

export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  discountAmount?: number;
  tax: number;
  shipping: number;
  shippingFee?: number;
  total: number;
  totalAmount?: number;
  status: 'pending' | 'processing' | 'shipping' | 'delivered' | 'refunded' | 'cancelled';
  orderStatus?: 'pending' | 'processing' | 'shipping' | 'completed' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  shippingUnit?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  timeline: OrderTimelineEvent[];
  internalNotes: string;
  voucherCode?: string;
  voucherCodeUsed?: string;
  note?: string;
  fraudRisk: 'low' | 'medium' | 'high';
  fraudRiskScore: number; // 0 to 100
  delayPrediction: 'none' | 'low' | 'high';
  refundRecommendation?: string;
}

export type UserRole = 'member' | 'seller' | 'admin';

export interface Customer {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  cart: string[];
  favorites?: string[];
  role: UserRole;
  status?: 'active' | 'blocked' | 'deleted';
  image?: string;
  joinedDate: string;
  createdAt?: string;
  updatedAt?: string;
  tier: 'VIP' | 'Regular' | 'New' | 'Loyal';
  ordersCount: number;
  churnRisk: 'low' | 'medium' | 'high';
  repurchaseProbability: number; // 0 to 1
  upsellOpportunities: string[];
  preferredCategories: string[];
  journey: {
    date: string;
    event: string;
    channel: string;
    details: string;
  }[];
}

export interface SupportMessage {
  id: string;
  sender: 'customer' | 'ai' | 'agent';
  text: string;
  timestamp: string;
  metadata?: {
    actions?: Array<{ id: string; label: string; type: string; productId?: string }>;
    suggestions?: Array<{
      id: string;
      title: string;
      subtitle?: string;
      product?: Partial<Product> & { image?: string; soldCount?: number };
    }>;
  };
}

export interface SupportTicket {
  id: string;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  updatedAt: string;
  status: 'open' | 'pending' | 'solved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1 to +1
  intent: string;
  confidenceScore: number; // 0 to 100
  messages: SupportMessage[];
  assignedToAI: boolean;
  notes?: string;
  slaMinutesRemaining: number;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  type: 'coupon' | 'flash_sale' | 'email' | 'push_notification' | 'affiliate';
  status: 'active' | 'scheduled' | 'ended';
  startDate: string;
  endDate: string;
  clicks: number;
  conversions: number;
  revenue: number;
  budget: number;
  roiPredicted: number; // multiplier e.g. 4.5x
  aiSuggestions: string[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  status: 'active' | 'scheduled' | 'ended';
}

export interface AppNotification {
  id: string;
  userId?: string;
  userNotificationId?: string;
  title: string;
  message: string;
  audience?: 'all' | 'user';
  type?: string;
  targetPath?: string;
  targetParams?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  deliveredAt?: string;
  recipientCount?: number;
  unreadCount?: number;
  status?: 'active' | 'archived';
  createdAt: string;
  updatedAt?: string;
}

export interface KPICards {
  revenueToday: number;
  monthlyRevenue: number;
  totalOrders: number;
  newCustomers: number;
  conversionRate: number;
  returnRate: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId?: string;
  orderId?: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  status: 'approved' | 'pending' | 'spam';
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  response?: string;
}
