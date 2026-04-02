import { sleep } from '@/lib/utils';
import {
  MOCK_PRODUCTS,
  MOCK_ORDERS,
  MOCK_CUSTOMERS,
  MOCK_INVENTORY_LOGS,
  MOCK_METRICS,
  MOCK_CAMPAIGNS,
  MOCK_AI_INSIGHTS,
} from '@/lib/mock-data';
import type { Product, Order, Customer, Campaign, InventoryLog, DashboardMetrics } from '@/types';
import type { ProductFormData, InventoryAdjustFormData } from '@/lib/schemas';

// Simulated in-memory store
let products = [...MOCK_PRODUCTS];
let orders = [...MOCK_ORDERS];
let customers = [...MOCK_CUSTOMERS];
let inventoryLogs = [...MOCK_INVENTORY_LOGS];
let campaigns = [...MOCK_CAMPAIGNS];

// ============ DASHBOARD ============
export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  await sleep(300);
  return MOCK_METRICS;
}

// ============ PRODUCTS ============
export async function fetchProducts(): Promise<Product[]> {
  await sleep(200);
  return [...products];
}

export async function fetchProduct(id: string): Promise<Product | null> {
  await sleep(100);
  return products.find((p) => p.id === id) ?? null;
}

export async function createProduct(data: ProductFormData): Promise<Product> {
  await sleep(400);
  const product: Product = {
    id: `prod-${Date.now()}`,
    ...data,
    variant: data.variant || null,
    imageUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  products.push(product);
  return product;
}

export async function updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product> {
  await sleep(400);
  products = products.map((p) =>
    p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } as Product : p
  );
  return products.find((p) => p.id === id)!;
}

export async function deleteProduct(id: string): Promise<void> {
  await sleep(300);
  products = products.filter((p) => p.id !== id);
}

// ============ INVENTORY ============
export async function adjustInventory(data: InventoryAdjustFormData): Promise<InventoryLog> {
  await sleep(300);
  const product = products.find((p) => p.id === data.productId);
  if (!product) throw new Error('Product not found');
  const change = data.action === 'restock' ? data.quantityChange : -Math.abs(data.quantityChange);
  const newQty = Math.max(0, product.quantity + change);
  products = products.map((p) =>
    p.id === data.productId ? { ...p, quantity: newQty, updatedAt: new Date().toISOString() } : p
  );
  const log: InventoryLog = {
    id: `log-${Date.now()}`,
    productId: data.productId,
    productName: product.name,
    action: data.action,
    quantityChange: change,
    previousQty: product.quantity,
    newQty,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
  };
  inventoryLogs = [log, ...inventoryLogs];
  return log;
}

export async function fetchInventoryLogs(): Promise<InventoryLog[]> {
  await sleep(200);
  return [...inventoryLogs];
}

// ============ ORDERS ============
export async function fetchOrders(): Promise<Order[]> {
  await sleep(200);
  return [...orders];
}

export async function fetchOrder(id: string): Promise<Order | null> {
  await sleep(100);
  return orders.find((o) => o.id === id) ?? null;
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
  await sleep(300);
  orders = orders.map((o) =>
    o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
  );
  return orders.find((o) => o.id === id)!;
}

// ============ CUSTOMERS ============
export async function fetchCustomers(): Promise<Customer[]> {
  await sleep(200);
  return [...customers];
}

export async function fetchCustomer(id: string): Promise<Customer | null> {
  await sleep(100);
  return customers.find((c) => c.id === id) ?? null;
}

// ============ CAMPAIGNS ============
export async function fetchCampaigns(): Promise<Campaign[]> {
  await sleep(200);
  return [...campaigns];
}

export async function createCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'status'>): Promise<Campaign> {
  await sleep(400);
  const campaign: Campaign = {
    id: `camp-${Date.now()}`,
    ...data,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };
  campaigns = [campaign, ...campaigns];
  return campaign;
}

// ============ AI ============
export async function fetchAIInsights() {
  await sleep(500);
  return MOCK_AI_INSIGHTS;
}

export async function generateAIContent(prompt: string): Promise<string> {
  await sleep(1500);
  const responses: Record<string, string> = {
    default: `Based on your chia seed sales data:\n\n**Trend Summary:**\nOrganic white chia is leading with 38% of total sales. Keto-related search demand has increased 25% month-over-month.\n\n**Recommendations:**\n1. Restock organic blend immediately — under 5 units, 3-day runway\n2. Launch a "Smoothie Starter" bundle targeting the TikTok trend wave\n3. Send a win-back email to 4 churned customers with 15% off\n\n**Forecast:** Next 7 days projected revenue: $1,840 at current velocity.`,
  };
  return responses.default;
}

export async function forecastDepletion(productId: string): Promise<string> {
  await sleep(1000);
  const product = products.find((p) => p.id === productId);
  if (!product) return 'Product not found.';
  const avgDailySales = 2.5;
  const daysLeft = Math.round(product.quantity / avgDailySales);
  return `**${product.name}** will deplete in approximately **${daysLeft} days** at current sales velocity (avg ${avgDailySales} units/day).\n\nRecommended reorder: **${Math.ceil(avgDailySales * 30)} units** to cover the next 30 days.`;
}
