import { z } from 'zod';

// ============ PRODUCT SCHEMA ============
export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  sku: z.string().min(3, 'SKU required').max(50),
  category: z.string().min(1, 'Category required'),
  variant: z.string().optional().nullable(),
  quantity: z.number().int().min(0, 'Quantity must be at least 0'),
  costPrice: z.number().min(0.01, 'Cost price must be positive'),
  salePrice: z.number().min(0.01, 'Sale price must be positive'),
  expiryDate: z.string().min(1, 'Expiry date required'),
  supplier: z.string().min(1, 'Supplier required'),
  lotNumber: z.string().min(1, 'Lot number required'),
  harvestDate: z.string().min(1, 'Harvest date required'),
  lowStockThreshold: z.number().int().min(1, 'Threshold must be at least 1'),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ============ ORDER SCHEMA ============
export const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0.01),
  total: z.number(),
});

export const checkoutSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  address: z.string().min(5, 'Address required'),
  city: z.string().min(1, 'City required'),
  state: z.string().min(1, 'State required'),
  zip: z.string().min(4, 'ZIP code required'),
  country: z.string().min(2, 'Country required').default('US'),
  notes: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ============ CAMPAIGN SCHEMA ============
export const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name required').max(100),
  subject: z.string().min(1, 'Email subject required').max(150),
  content: z.string().min(10, 'Content too short'),
  targetSegment: z.enum(['all', 'new', 'repeat', 'vip', 'churned']),
  scheduledAt: z.string().optional(),
  sendNow: z.boolean().optional(),
});

export type CampaignFormData = z.infer<typeof campaignSchema>;

// ============ INVENTORY ADJUSTMENT SCHEMA ============
export const inventoryAdjustSchema = z.object({
  productId: z.string().min(1),
  action: z.enum(['restock', 'adjustment', 'expired']),
  quantityChange: z.number().int().min(1, 'Must be at least 1'),
  notes: z.string().optional(),
});

export type InventoryAdjustFormData = z.infer<typeof inventoryAdjustSchema>;

// ============ AI PROMPT SCHEMA ============
export const aiPromptSchema = z.object({
  prompt: z.string().min(5, 'Prompt too short').max(1000),
  type: z.enum(['insight', 'marketing', 'pricing', 'forecast']),
});

export type AIPromptFormData = z.infer<typeof aiPromptSchema>;

// ============ SETTINGS SCHEMA ============
export const settingsSchema = z.object({
  businessName: z.string().min(1, 'Business name required'),
  email: z.string().email(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'AUD']).default('USD'),
  lowStockAlertEmail: z.boolean().default(true),
  lowStockAlertSms: z.boolean().default(false),
  weeklyReportEmail: z.boolean().default(true),
  aiInsightsEnabled: z.boolean().default(true),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

// ============ MANUAL SALE SCHEMA ============
export const manualSaleSchema = z.object({
  customerName: z.string().min(1, 'Customer name required'),
  email: z.string().email().optional().or(z.literal('')),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1),
  })).min(1, 'Select at least one product'),
  channel: z.enum(['market', 'wholesale']),
  total: z.number().min(0.01),
});

export type ManualSaleFormData = z.infer<typeof manualSaleSchema>;

// ============ CUSTOMER SCHEMA ============
export const customerSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional().nullable(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;


export const businessInfoSchema = z.object({
  name: z.string().min(1, 'Store Name is required'),
  industry: z.string().min(1, 'Industry is required'),
  description: z.string().optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  currency: z.string().min(1).max(10),
});

export type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;
