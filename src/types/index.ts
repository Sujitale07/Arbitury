export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  variant?: string | null;
  quantity: number;
  costPrice: number;
  salePrice: number;
  expiryDate?: string | Date | null;
  supplier: string;
  lotNumber?: string | null;
  harvestDate?: string | Date | null;
  imageUrl?: string | null;
  lowStockThreshold: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ============ ORDER TYPES ============
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type SaleChannel = 'online' | 'market' | 'wholesale';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  channel: SaleChannel;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ CUSTOMER TYPES ============
export type CustomerSegment = 'new' | 'repeat' | 'vip' | 'churned';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  segment: CustomerSegment;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  createdAt: string;
}

// ============ INVENTORY LOG TYPES ============
export type InventoryAction = 'restock' | 'sale' | 'adjustment' | 'expired';

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  action: InventoryAction;
  quantityChange: number;
  previousQty: number;
  newQty: number;
  createdBy: string;
  createdAt: string;
}

// ============ ANALYTICS TYPES ============
export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
  units: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  variant?: string | null;
  totalSold: number;
  revenue: number;
  percentage: number;
}

export interface DashboardMetrics {
  todayRevenue: number;
  todayOrders: number;
  totalInventoryValue: number;
  lowStockCount: number;
  weeklyRevenue: DailySales[];
  topProducts: ProductPerformance[];
  revenueGrowth: number;
  ordersGrowth: number;
}

// ============ CART TYPES ============
export interface CartItem {
  productId: string;
  productName: string;
  variant?: string | null;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

// ============ CAMPAIGN TYPES ============
export type CampaignStatus = 'draft' | 'scheduled' | 'sent' | 'active';

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  targetSegment: CustomerSegment | 'all';
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
}

// ============ AI INSIGHT TYPES ============
export interface AIInsight {
  id: string;
  type: 'restock' | 'pricing' | 'trend' | 'upsell' | 'churn';
  title: string;
  description: string;
  action?: string;
  urgency: 'low' | 'medium' | 'high';
  createdAt: string;
}

// ============ SETTINGS TYPES ============
export interface BusinessInfo {
  id: string;
  name: string;
  industry: string;
  description?: string | null;
  website?: string | null;
  currency: string;
  updatedAt: string | Date;
}
